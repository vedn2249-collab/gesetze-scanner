import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDocs, collection, query, limit } from "firebase/firestore";
import fs from "fs";
import path from "path";

// Lade Konfiguration aus firebase-applet-config.json
let db: any = null;

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const app = getApps().length === 0 ? initializeApp(configData) : getApp();
    db = configData.firestoreDatabaseId
      ? getFirestore(app, configData.firestoreDatabaseId)
      : getFirestore(app);
    console.log(`[FIRESTORE SERVER]: Erfolgreich initialisiert für DB: ${configData.firestoreDatabaseId || "(default)"}`);
  } else {
    console.warn("[FIRESTORE SERVER]: firebase-applet-config.json nicht gefunden.");
  }
} catch (err) {
  console.error("[FIRESTORE SERVER]: Initialisierungsfehler:", err);
}

export interface FirestoreWiderruf {
  id: string;
  created_at: string;
  name: string;
  email: string;
  transaction_id: string;
  reason?: string;
  status: string;
  customer_notified: boolean;
  admin_notified: boolean;
  source: string;
}

export interface FirestoreConsent {
  id: string;
  transaction_id: string;
  consented_at: string;
  ip_hash: string;
  email: string;
  consent_early_execution: boolean;
  consent_loss_of_withdrawal: boolean;
}

export interface FirestoreUser {
  id: string; // uid or normalized email
  email: string;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
  isPremiumUnlocked: boolean;
  isTrafficUnlocked: boolean;
  paidUntil?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "none";
  lastTransactionId?: string;
  schriftsatzCredits: {
    berufung: number;
    revision: number;
    wiederaufnahme: number;
    verfassungsbeschwerde: number;
  };
}

// Lokale redundante Persistenzdatei zur Ausfallsicherung
const USERS_FILE_PATH = path.join(process.cwd(), "data", "users.json");

function ensureUsersDir() {
  const dir = path.dirname(USERS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE_PATH)) {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify({}, null, 2), "utf-8");
  }
}

function readLocalUsers(): Record<string, FirestoreUser> {
  ensureUsersDir();
  try {
    const raw = fs.readFileSync(USERS_FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeLocalUsers(users: Record<string, FirestoreUser>) {
  ensureUsersDir();
  try {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.warn("[USERS FILE]: Fehler beim Schreiben der lokalen Benutzerdatei:", err);
  }
}

import crypto from "crypto";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, origHash] = combinedHash.split(":");
    if (!salt || !origHash) return false;
    const computed = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(origHash, "hex"));
  } catch {
    return false;
  }
}

export async function getUserByEmail(email: string): Promise<FirestoreUser | null> {
  const normEmail = email.trim().toLowerCase();
  const localUsers = readLocalUsers();
  if (localUsers[normEmail]) {
    return localUsers[normEmail];
  }

  if (db) {
    try {
      const userDoc = doc(db, "users", normEmail);
      const snap = await getDocs(query(collection(db, "users"), limit(1)));
      // Versuch direkt auszulesen
    } catch {
      // Ignorieren bei Rules-Restriktion
    }
  }
  return null;
}

export async function saveOrUpdateUser(userData: Partial<FirestoreUser> & { email: string }): Promise<FirestoreUser> {
  const normEmail = userData.email.trim().toLowerCase();
  const localUsers = readLocalUsers();
  const existing = localUsers[normEmail] || {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: normEmail,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPremiumUnlocked: false,
    isTrafficUnlocked: false,
    schriftsatzCredits: { berufung: 0, revision: 0, wiederaufnahme: 0, verfassungsbeschwerde: 0 }
  };

  const updated: FirestoreUser = {
    ...existing,
    ...userData,
    email: normEmail,
    updatedAt: new Date().toISOString(),
    schriftsatzCredits: {
      berufung: userData.schriftsatzCredits?.berufung ?? existing.schriftsatzCredits?.berufung ?? 0,
      revision: userData.schriftsatzCredits?.revision ?? existing.schriftsatzCredits?.revision ?? 0,
      wiederaufnahme: userData.schriftsatzCredits?.wiederaufnahme ?? existing.schriftsatzCredits?.wiederaufnahme ?? 0,
      verfassungsbeschwerde: userData.schriftsatzCredits?.verfassungsbeschwerde ?? existing.schriftsatzCredits?.verfassungsbeschwerde ?? 0,
    }
  };

  localUsers[normEmail] = updated;
  writeLocalUsers(localUsers);

  // Firestore Sync Versuch
  if (db) {
    try {
      const userRef = doc(db, "users", updated.id);
      await setDoc(userRef, {
        email: updated.email,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        isPremiumUnlocked: updated.isPremiumUnlocked,
        isTrafficUnlocked: updated.isTrafficUnlocked,
        paidUntil: updated.paidUntil || null,
        subscriptionPlan: updated.subscriptionPlan || null,
        subscriptionStatus: updated.subscriptionStatus || "active",
        lastTransactionId: updated.lastTransactionId || null,
        schriftsatzCredits: updated.schriftsatzCredits
      });
      console.log(`[FIRESTORE USER SYNC]: Nutzer ${updated.email} erfolgreich synchronisiert.`);
    } catch (e: any) {
      console.warn(`[FIRESTORE USER SYNC WARN]: Konnte Nutzer ${updated.email} nicht direkt in Firestore schreiben:`, e?.message);
    }
  }

  return updated;
}

export async function registerUserAccount(
  email: string, 
  password?: string, 
  initialState?: Partial<FirestoreUser>
): Promise<{ success: boolean; user?: FirestoreUser; error?: string }> {
  const normEmail = email.trim().toLowerCase();
  const existing = await getUserByEmail(normEmail);

  if (existing && existing.passwordHash && password) {
    return { success: false, error: "Ein Konto mit dieser E-Mail existiert bereits. Bitte melden Sie sich an." };
  }

  const user = await saveOrUpdateUser({
    ...initialState,
    email: normEmail,
    passwordHash: password ? hashPassword(password) : existing?.passwordHash,
  });

  return { success: true, user };
}

export async function loginUserAccount(
  email: string, 
  password: string
): Promise<{ success: boolean; user?: FirestoreUser; error?: string }> {
  const normEmail = email.trim().toLowerCase();
  const user = await getUserByEmail(normEmail);

  if (!user) {
    return { success: false, error: "Kein Konto mit dieser E-Mail-Adresse gefunden." };
  }

  if (!user.passwordHash) {
    return { success: false, error: "Dieses Konto wurde per Kauf oder Google angelegt. Bitte vergeben Sie ein Passwort oder nutzen Sie Google." };
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return { success: false, error: "Das eingegebene Passwort ist nicht korrekt." };
  }

  return { success: true, user };
}

export async function unlockUserSubscription(
  email: string, 
  plan: string, 
  transactionId?: string,
  extraCredits?: any
): Promise<FirestoreUser> {
  const normEmail = email.trim().toLowerCase();
  const user = (await getUserByEmail(normEmail)) || {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: normEmail,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPremiumUnlocked: false,
    isTrafficUnlocked: false,
    schriftsatzCredits: { berufung: 0, revision: 0, wiederaufnahme: 0, verfassungsbeschwerde: 0 }
  };

  let isPremiumUnlocked = user.isPremiumUnlocked;
  let isTrafficUnlocked = user.isTrafficUnlocked;
  let paidUntil = user.paidUntil;
  let subscriptionPlan = plan;
  const credits = { ...user.schriftsatzCredits };

  if (plan === "allgemein_annual" || plan === "annual") {
    isPremiumUnlocked = true;
    paidUntil = new Date(Date.now() + 365 * 86400000).toISOString();
  } else if (plan === "allgemein_lifetime" || plan === "lifetime") {
    isPremiumUnlocked = true;
    paidUntil = "2099-12-31T23:59:59.000Z";
  } else if (plan === "traffic_annual") {
    isTrafficUnlocked = true;
    paidUntil = new Date(Date.now() + 365 * 86400000).toISOString();
  } else if (plan === "traffic_lifetime") {
    isTrafficUnlocked = true;
    paidUntil = "2099-12-31T23:59:59.000Z";
  } else if (plan.startsWith("schriftsatz_")) {
    if (plan === "schriftsatz_berufung") credits.berufung = (credits.berufung || 0) + 1;
    else if (plan === "schriftsatz_revision") credits.revision = (credits.revision || 0) + 1;
    else if (plan === "schriftsatz_wiederaufnahme") credits.wiederaufnahme = (credits.wiederaufnahme || 0) + 1;
    else if (plan === "schriftsatz_verfassungsbeschwerde") credits.verfassungsbeschwerde = (credits.verfassungsbeschwerde || 0) + 1;
    else if (plan === "schriftsatz_single") credits.berufung = (credits.berufung || 0) + 1;
  }

  if (extraCredits) {
    if (extraCredits.berufung) credits.berufung = (credits.berufung || 0) + extraCredits.berufung;
    if (extraCredits.revision) credits.revision = (credits.revision || 0) + extraCredits.revision;
    if (extraCredits.wiederaufnahme) credits.wiederaufnahme = (credits.wiederaufnahme || 0) + extraCredits.wiederaufnahme;
    if (extraCredits.verfassungsbeschwerde) credits.verfassungsbeschwerde = (credits.verfassungsbeschwerde || 0) + extraCredits.verfassungsbeschwerde;
  }

  const updated = await saveOrUpdateUser({
    ...user,
    email: normEmail,
    isPremiumUnlocked,
    isTrafficUnlocked,
    paidUntil,
    subscriptionPlan,
    subscriptionStatus: "active",
    lastTransactionId: transactionId || user.lastTransactionId,
    schriftsatzCredits: credits
  });

  console.log(`[SUBSCRIPTION UNLOCKED]: Nutzer ${normEmail} hat Plan ${plan} freigeschaltet.`, {
    isPremiumUnlocked,
    isTrafficUnlocked,
    credits
  });

  return updated;
}

/**
 * Speichert den Widerruf direkt und persistent in Firestore (Collection 'widerrufe')
 */
export async function saveWiderrufToFirestore(record: FirestoreWiderruf): Promise<boolean> {
  if (!db) {
    console.error("[FIRESTORE SERVER]: Datenbank ist nicht initialisiert.");
    return false;
  }
  try {
    const docRef = doc(db, "widerrufe", record.id);
    await setDoc(docRef, {
      ...record,
      persisted_at: new Date().toISOString()
    });
    console.log(`[FIRESTORE PERSISTIERT]: Widerruf ${record.id} erfolgreich in Collection 'widerrufe' gespeichert.`);
    return true;
  } catch (error) {
    console.error(`[FIRESTORE FEHLER]: Speichern von Widerruf ${record.id} fehlgeschlagen:`, error);
    return false;
  }
}

/**
 * Speichert die Widerrufs-Zustimmung (§ 356 Abs. 5 BGB) persistent in Firestore (Collection 'widerruf_consent')
 */
export async function saveConsentToFirestore(record: FirestoreConsent): Promise<boolean> {
  if (!db) {
    console.error("[FIRESTORE SERVER]: Datenbank ist nicht initialisiert.");
    return false;
  }
  try {
    const docRef = doc(db, "widerruf_consent", record.id);
    await setDoc(docRef, {
      ...record,
      persisted_at: new Date().toISOString()
    });
    console.log(`[FIRESTORE PERSISTIERT]: Consent ${record.id} für Txn ${record.transaction_id} erfolgreich in 'widerruf_consent' gespeichert.`);
    return true;
  } catch (error) {
    console.error(`[FIRESTORE FEHLER]: Speichern von Consent ${record.id} fehlgeschlagen:`, error);
    return false;
  }
}

/**
 * Liest alle persistenten Widerrufe direkt aus Firestore aus
 */
export async function getWiderrufeFromFirestore(limitCount: number = 100): Promise<FirestoreWiderruf[]> {
  if (!db) return [];
  try {
    const colRef = collection(db, "widerrufe");
    const q = query(colRef, limit(limitCount));
    const snapshot = await getDocs(q);
    const results: FirestoreWiderruf[] = [];
    snapshot.forEach(d => {
      results.push(d.data() as FirestoreWiderruf);
    });
    return results;
  } catch (error) {
    console.error("[FIRESTORE FEHLER]: Fehler beim Abrufen der Widerrufe:", error);
    return [];
  }
}

/**
 * Liest alle persistenten Zustimmungen direkt aus Firestore aus
 */
export async function getConsentsFromFirestore(limitCount: number = 100): Promise<FirestoreConsent[]> {
  if (!db) return [];
  try {
    const colRef = collection(db, "widerruf_consent");
    const q = query(colRef, limit(limitCount));
    const snapshot = await getDocs(q);
    const results: FirestoreConsent[] = [];
    snapshot.forEach(d => {
      results.push(d.data() as FirestoreConsent);
    });
    return results;
  } catch (error) {
    console.error("[FIRESTORE FEHLER]: Fehler beim Abrufen der Consents:", error);
    return [];
  }
}

export interface FirestoreCaseFile {
  id: string;
  userEmail: string;
  name: string;
  category: "VORVERFAHREN" | "SCHRIFTSAETZE" | "BEWEISMITTEL";
  date: string;
  size?: string;
  created_at: string;
}

/**
 * Speichert eine Gerichts- oder Mandantenakte persistent in Firestore
 */
export async function saveCaseFileToFirestore(file: FirestoreCaseFile): Promise<boolean> {
  if (!db) return false;
  try {
    const docRef = doc(db, "case_files", file.id);
    await setDoc(docRef, {
      ...file,
      persisted_at: new Date().toISOString()
    });
    console.log(`[FIRESTORE AKTE PERSISTIERT]: ${file.name} (${file.id}) für ${file.userEmail} gespeichert.`);
    return true;
  } catch (e) {
    console.warn("[FIRESTORE AKTE FEHLER]: Konnte Datei nicht speichern:", e);
    return false;
  }
}

/**
 * Liest Akten und Dokumente für einen Nutzer aus Firestore
 */
export async function getCaseFilesFromFirestore(userEmail: string): Promise<FirestoreCaseFile[]> {
  if (!db) return [];
  try {
    const colRef = collection(db, "case_files");
    const q = query(colRef, limit(100));
    const snapshot = await getDocs(q);
    const results: FirestoreCaseFile[] = [];
    const norm = userEmail.trim().toLowerCase();
    snapshot.forEach(d => {
      const data = d.data() as FirestoreCaseFile;
      if (!userEmail || data.userEmail?.toLowerCase() === norm) {
        results.push(data);
      }
    });
    return results;
  } catch (e) {
    console.warn("[FIRESTORE AKTEN FEHLER]: Konnte Akten nicht abrufen:", e);
    return [];
  }
}

/**
 * Löscht eine Akte aus Firestore
 */
export async function deleteCaseFileFromFirestore(fileId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const { deleteDoc } = await import("firebase/firestore");
    const docRef = doc(db, "case_files", fileId);
    await deleteDoc(docRef);
    console.log(`[FIRESTORE AKTE GELÖSCHT]: ${fileId}`);
    return true;
  } catch (e) {
    console.warn("[FIRESTORE AKTE LÖSCHEN FEHLER]:", e);
    return false;
  }
}

