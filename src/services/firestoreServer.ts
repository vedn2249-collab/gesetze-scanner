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
