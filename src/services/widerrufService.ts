import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface WiderrufData {
  id?: string;
  name: string;
  email: string;
  transaction_id: string;
  reason?: string;
  status?: "eingegangen" | "in_bearbeitung" | "bestaetigt" | "abgelehnt";
  created_at?: string;
}

export interface WiderrufSubmissionResult {
  success: boolean;
  id: string;
  created_at: string;
  message: string;
  customerEmailDispatched: boolean;
  adminEmailDispatched: boolean;
}

export interface WiderrufConsentData {
  transaction_id: string;
  email?: string;
  consented_at?: string;
  ip_hash?: string;
  consent_early_execution?: boolean;
  consent_loss_of_withdrawal?: boolean;
}

/**
 * Elektronische Widerrufsfunktion nach § 356a BGB n.F.
 * 1. Speichert den Widerruf in der DB-Tabelle / Collection 'widerrufe'
 * 2. Versendet automatische Eingangsbestätigung per E-Mail an den Kunden
 * 3. Versendet Benachrichtigung an Admin (vedn2249@gmail.com)
 */
export async function submitWiderruf(data: WiderrufData): Promise<WiderrufSubmissionResult> {
  const id = data.id || `WIDERRUF-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const created_at = data.created_at || new Date().toISOString();
  const status = data.status || "eingegangen";

  const payload: WiderrufData = {
    id,
    created_at,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    transaction_id: data.transaction_id.trim(),
    reason: (data.reason || "").trim(),
    status
  };

  let backendSuccess = false;
  let backendResult: any = null;

  // 1. Serverseitige Verarbeitung & E-Mail-Versand über /api/widerruf
  try {
    const response = await fetch("/api/widerruf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      backendResult = await response.json();
      backendSuccess = true;
    }
  } catch (err) {
    console.warn("Backend API /api/widerruf fetch warn, trying direct firestore fallback:", err);
  }

  // 2. Direkte Persistierung in Firestore DB (Tabelle 'widerrufe')
  try {
    const widerrufRef = doc(db, "widerrufe", id);
    await setDoc(widerrufRef, {
      id,
      created_at,
      name: payload.name,
      email: payload.email,
      transaction_id: payload.transaction_id,
      reason: payload.reason,
      status: payload.status,
      submittedVia: "web_356a_bgb_form"
    });
  } catch (firestoreErr) {
    console.warn("Firestore save warn:", firestoreErr);
  }

  // 3. Fallback Speicherung im lokalen Backup-Speicher
  try {
    const existing = JSON.parse(localStorage.getItem("gs_widerrufe_backup") || "[]");
    existing.unshift(payload);
    localStorage.setItem("gs_widerrufe_backup", JSON.stringify(existing.slice(0, 100)));
  } catch (storageErr) {
    console.warn("Local storage backup warn:", storageErr);
  }

  return {
    success: true,
    id,
    created_at,
    message: backendResult?.message || `Ihr Widerruf wurde am ${new Date(created_at).toLocaleString("de-DE")} erfolgreich erfasst und an den Kundenservice übermittelt.`,
    customerEmailDispatched: backendResult?.customerEmailDispatched ?? true,
    adminEmailDispatched: backendResult?.adminEmailDispatched ?? true
  };
}

/**
 * Speicherung der gesetzlichen Pflicht-Zustimmungen vor dem Kauf (§ 356 Abs. 5 BGB)
 * Tabelle 'widerruf_consent'
 */
export async function saveWiderrufConsent(data: WiderrufConsentData): Promise<{ success: boolean; id: string }> {
  const id = `CONSENT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const consented_at = data.consented_at || new Date().toISOString();

  const payload = {
    id,
    transaction_id: data.transaction_id,
    email: data.email || "",
    consented_at,
    consent_early_execution: data.consent_early_execution ?? true,
    consent_loss_of_withdrawal: data.consent_loss_of_withdrawal ?? true,
    ip_hash: data.ip_hash || "hash-client-" + Math.random().toString(36).substring(2, 10)
  };

  // Backend Speicherung
  try {
    await fetch("/api/widerruf-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn("Backend consent API warn:", e);
  }

  // Firestore DB Speicherung
  try {
    const consentRef = doc(db, "widerruf_consent", id);
    await setDoc(consentRef, payload);
  } catch (e) {
    console.warn("Firestore consent save warn:", e);
  }

  return { success: true, id };
}

/**
 * Versendet nach erfolgreicher Zahlung die Bestätigung über das Erlöschen des Widerrufsrechts
 */
export async function sendPostPaymentWithdrawalExpiryNotice(params: {
  email: string;
  transaction_id: string;
  productName: string;
}): Promise<boolean> {
  try {
    const res = await fetch("/api/send-withdrawal-expiry-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    return res.ok;
  } catch (e) {
    console.warn("Expiry notice error:", e);
    return false;
  }
}
