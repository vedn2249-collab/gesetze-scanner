/**
 * PADDLE.JS (v2) SANDBOX INTEGRATION
 * 
 * Offizielle Paddle v2 SDK Einbindung für Test- & Sandbox-Umgebungen.
 * Ersetzt simulierte Zahlungen durch echte Checkout-Overlays.
 */

const metaEnv = typeof import.meta !== "undefined" ? (import.meta as any).env || {} : {};

// 1. PADDLE CLIENT-SIDE TOKEN (SANDBOX)
// Aus dem Paddle Dashboard: Developer Tools > Authentication > Client-side tokens
// Beginnt im Sandbox-Modus mit "test_..."
export const PADDLE_CLIENT_TOKEN =
  metaEnv.VITE_PADDLE_CLIENT_TOKEN ||
  "live_2125f462f48e3cfcbcf0cae3ee6"; // <--- HIER DEIN test_... PADDLE CLIENT-TOKEN EINTRAGEN

// 2. PADDLE PRICE-IDs (SANDBOX)
// Aus dem Paddle Dashboard: Catalog > Prices
// Beginnt mit "pri_..."
export const PADDLE_PRICE_IDS: Record<string, string> = {
  // Gesetzes-Scanner Hauptbereich
  allgemein_annual: metaEnv.VITE_PADDLE_PRICE_GESETZE_YEARLY || "pri_01m43kqve0zbkag8gj4y7ewbgy",
  allgemein_lifetime: metaEnv.VITE_PADDLE_PRICE_GESETZE_LIFETIME || "pri_01kzztzw480j8y5hpf9j5vrjce",
  gesetze_yearly: metaEnv.VITE_PADDLE_PRICE_GESETZE_YEARLY || "pri_01m43kqve0zbkag8gj4y7ewbgy",
  gesetze_lifetime: metaEnv.VITE_PADDLE_PRICE_GESETZE_LIFETIME || "pri_01kzztzw480j8y5hpf9j5vrjce",

  // StVO-Verkehrsmittel-Scanner
  traffic_yearly: metaEnv.VITE_PADDLE_PRICE_TRAFFIC_YEARLY || "pri_01kzzv93jdap172qte544rx8rh",
  traffic_annual: metaEnv.VITE_PADDLE_PRICE_TRAFFIC_YEARLY || "pri_01kzzv93jdap172qte544rx8rh",
  traffic_lifetime: metaEnv.VITE_PADDLE_PRICE_TRAFFIC_LIFETIME || "pri_01kzzvcsrtdrvp4qca01fq75kx",

  // Schriftsatz-Module (9,99 €)
  schriftsatz_berufung: metaEnv.VITE_PADDLE_PRICE_SCHRIFTSATZ_BERUFUNG || "pri_01kzzvjyq8vb13c0r3efh5nt3d",
  schriftsatz_revision: metaEnv.VITE_PADDLE_PRICE_SCHRIFTSATZ_REVISION || "pri_01kzzvn65fkjw187f6fmgecbhx",
  schriftsatz_wiederaufnahme: metaEnv.VITE_PADDLE_PRICE_SCHRIFTSATZ_WIEDERAUFNAHME || "pri_01kzzvtsk3tzhcppsw02t7htc2",
  schriftsatz_verfassungsbeschwerde: metaEnv.VITE_PADDLE_PRICE_SCHRIFTSATZ_VERFASSUNGSBESCHWERDE || "pri_01kzzvxr4nagkzgfh043m8wvm3",
  schriftsatz_single: metaEnv.VITE_PADDLE_PRICE_SCHRIFTSATZ_BERUFUNG || "pri_01kzzvjyq8vb13c0r3efh5nt3d",
};

declare global {
  interface Window {
    Paddle?: any;
  }
}

type CheckoutCallback = (event: { name: string; data?: any }) => void;
const eventListeners: Set<CheckoutCallback> = new Set();
let isPaddleInitialized = false;

/**
 * Lädt und initialisiert das offizielle Paddle.js (v2) SDK
 */
export async function initializePaddle(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Falls Script noch nicht vorhanden, dynamisch nachladen
  if (!window.Paddle) {
    await new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector('script[src*="paddle.com"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve());
        existingScript.addEventListener("error", () => reject(new Error("Paddle.js Ladefehler")));
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Fehler beim Laden von Paddle.js"));
      document.head.appendChild(script);
    });
  }

  if (!window.Paddle) {
    console.error("Paddle SDK konnte nicht im Window gefunden werden.");
    return false;
  }

  if (!isPaddleInitialized) {
    try {
      // 1. Umgebung automatisch an Hand des Tokens und der Konfiguration ermitteln
      const isLiveToken = PADDLE_CLIENT_TOKEN.startsWith("live_");
      const isExplicitLive = metaEnv.VITE_PADDLE_ENVIRONMENT === "live" || metaEnv.VITE_PADDLE_ENVIRONMENT === "production";
      const isLive = isLiveToken || isExplicitLive;

      if (!isLive) {
        // Nur in der Sandbox Testumgebung aufrufen (Paddle v2 Standard ist Live)
        window.Paddle.Environment.set("sandbox");
        console.log("Paddle.js SANDBOX Testmodus aktiviert.");
      } else {
        console.log("Paddle.js LIVE PRODUCTION Modus aktiv (Standard).");
      }

      // 2. Mit Client Token initialisieren
      window.Paddle.Initialize({
        token: PADDLE_CLIENT_TOKEN,
        eventCallback: (event: { name: string; data?: any }) => {
          console.log("[Paddle Event Empfangen]", event.name, event.data);
          eventListeners.forEach((callback) => {
            try {
              callback(event);
            } catch (err) {
              console.error("[Paddle Callback Error]", err);
            }
          });
        },
      });

      isPaddleInitialized = true;
      console.log(
        `Paddle.js erfolgreich initialisiert im ${isLive ? "LIVE" : "SANDBOX"} Modus mit Token:`,
        PADDLE_CLIENT_TOKEN.substring(0, 8) + "..."
      );
    } catch (e) {
      console.error("Fehler bei Paddle.Initialize:", e);
      return false;
    }
  }

  return true;
}

export interface OpenPaddleCheckoutOptions {
  planType: string;
  email?: string;
  discountCode?: string;
  onSuccess?: (data: any) => void;
  onClose?: () => void;
  onError?: (error: any) => void;
}

/**
 * Wandelt Paddle-Fehlerobjekte in präzise, verständliche Klartext-Meldungen um
 */
export function formatPaddleError(err: any): string {
  if (!err) return "Checkout abgebrochen oder von Paddle abgewiesen.";
  if (typeof err === "string") return err;

  const code = (err.code || err.type || "").toString().toLowerCase();
  const detail = (err.detail || err.message || "").toString();

  // 1. Häufigster Live-Fehler: Domain ist im Paddle Dashboard noch nicht freigeschaltet
  if (
    code.includes("domain") ||
    detail.toLowerCase().includes("domain") ||
    detail.toLowerCase().includes("origin") ||
    code === "domain_not_approved" ||
    code === "unapproved_domain"
  ) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `[Domain nicht autorisiert] Paddle LIVE blockiert Checkouts von dieser Domain (${origin}). In Live-Accounts müssen Sie die Domain im Paddle Dashboard unter „Developer Tools > Authentication > Approved Domains“ eintragen oder den Checkout auf Ihrer echten Domain testen.`;
  }

  // 2. Client-Token ungültig / falsch
  if (code.includes("token") || code.includes("auth") || detail.toLowerCase().includes("token")) {
    return `[Paddle Client-Token Fehler] Der Client-Token (${PADDLE_CLIENT_TOKEN?.substring(0, 10)}...) wurde von Paddle abgewiesen. Prüfen Sie „Developer Tools > Authentication > Client-side tokens“ in Ihrem Live-Dashboard.`;
  }

  // 3. Price-ID existiert nicht im Live-Account
  if (code.includes("price") || code.includes("item") || detail.toLowerCase().includes("price")) {
    return `[Preis-ID nicht gefunden] Die Preis-ID existiert nicht im Live-Produktkatalog von Paddle. Prüfen Sie „Catalog > Prices“ im Paddle Dashboard.`;
  }

  // 4. Paddle-Account noch in Überprüfung (Compliance/Verifizierung)
  if (code.includes("verification") || detail.toLowerCase().includes("verification") || detail.toLowerCase().includes("under review")) {
    return `[Live-Account Verifizierung ausstehend] Ihr Paddle Live-Account wurde von Paddle noch nicht vollständig freigeschaltet (Prüfung unter Paddle Dashboard > Verification nötig).`;
  }

  // 5. Explizites Detail oder Message
  if (detail) {
    return code ? `[${code}] ${detail}` : detail;
  }

  if (code) {
    return `Paddle Fehler-Code: ${code}`;
  }

  if (Array.isArray(err.errors) && err.errors.length > 0) {
    return err.errors.map((e: any) => e.detail || e.message || JSON.stringify(e)).join("; ");
  }

  try {
    const raw = JSON.stringify(err);
    if (raw && raw !== "{}") return `Paddle Fehler: ${raw}`;
  } catch {}

  return "Checkout abgebrochen oder ungültig.";
}

/**
 * Öffnet das echte Paddle Checkout Overlay
 */
export async function openPaddleCheckout(options: OpenPaddleCheckoutOptions): Promise<void> {
  const { planType, email, discountCode, onSuccess, onClose, onError } = options;

  const initialized = await initializePaddle();
  if (!initialized || !window.Paddle) {
    const errorMsg = "Paddle.js konnte nicht geladen werden. Bitte Internetverbindung prüfen.";
    if (onError) onError(new Error(errorMsg));
    else alert(errorMsg);
    return;
  }

  const priceId = PADDLE_PRICE_IDS[planType] || PADDLE_PRICE_IDS.allgemein_annual;

  if (!priceId) {
    const errorMsg = `Keine Price-ID für Tarif "${planType}" hinterlegt.`;
    if (onError) onError(new Error(errorMsg));
    else alert(errorMsg);
    return;
  }

  // Listener für diesen Checkout registrieren
  const handleEvent: CheckoutCallback = (event) => {
    if (event.name === "checkout.completed") {
      eventListeners.delete(handleEvent);
      if (onSuccess) onSuccess(event.data);
    } else if (event.name === "checkout.closed") {
      eventListeners.delete(handleEvent);
      if (onClose) onClose();
    } else if (event.name === "checkout.error") {
      console.error("[Paddle Checkout Error Event]", event.data);
      if (onError) onError(event.data);
    }
  };

  eventListeners.add(handleEvent);

  try {
    console.log("Öffne Paddle Checkout Overlay für Price-ID:", priceId, "Kunde:", email, "Rabattcode:", discountCode);
    
    const checkoutConfig: any = {
      items: [
        {
          priceId: priceId,
          quantity: 1,
        },
      ],
      customer: email && email.includes("@") ? { email: email.trim() } : undefined,
      settings: {
        displayMode: "overlay",
        theme: "dark",
        locale: "de",
        allowLogout: true,
        successUrl: `${window.location.origin}?payment_success=true&plan=${encodeURIComponent(planType)}`,
      },
    };

    // 100% Test-Rabattcode oder Discount-ID übergeben, falls angegeben
    if (discountCode && discountCode.trim()) {
      const trimmedCode = discountCode.trim();
      if (trimmedCode.startsWith("dsc_")) {
        checkoutConfig.discountId = trimmedCode;
      } else {
        checkoutConfig.discountCode = trimmedCode;
      }
    }

    window.Paddle.Checkout.open(checkoutConfig);
  } catch (err) {
    eventListeners.delete(handleEvent);
    console.error("Fehler beim Öffnen des Paddle Checkouts:", err);
    if (onError) onError(err);
    else alert("Fehler beim Starten des Paddle Checkouts: " + (err as Error).message);
  }
}
