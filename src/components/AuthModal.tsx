import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  AuthError
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { X, Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
  onSuccess?: () => void;
  titleNotice?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "login",
  onSuccess,
  titleNotice
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user.email) {
        // Synchronisiere Google-Konto mit Backend & Firestore
        let localPremium = localStorage.getItem("gs_premium_unlocked") === "true";
        let localTraffic = localStorage.getItem("gs_traffic_unlocked") === "true";
        let localCredits = { berufung: 0, revision: 0, wiederaufnahme: 0, verfassungsbeschwerde: 0 };
        try {
          const rawCredits = localStorage.getItem("gs_schriftsatz_credits_map");
          if (rawCredits) localCredits = JSON.parse(rawCredits);
        } catch {}

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            initialState: {
              id: user.uid,
              isPremiumUnlocked: localPremium,
              isTrafficUnlocked: localTraffic,
              schriftsatzCredits: localCredits
            }
          })
        });
        const data = await res.json();
        if (data.user) {
          localStorage.setItem("gs_auth_session", JSON.stringify(data.user));
          window.dispatchEvent(new Event("gs-auth-changed"));
        }
      }

      setSuccessMsg("Erfolgreich mit Google angemeldet!");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError(err?.message || "Google-Anmeldung fehlgeschlagen.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Bitte füllen Sie alle Felder aus.");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    if (password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    setLoading(true);

    try {
      let localPremium = false;
      let localTraffic = false;
      let localCredits = { berufung: 0, revision: 0, wiederaufnahme: 0, verfassungsbeschwerde: 0 };

      try {
        localPremium = localStorage.getItem("gs_premium_unlocked") === "true";
        localTraffic = localStorage.getItem("gs_traffic_unlocked") === "true";
        const rawCredits = localStorage.getItem("gs_schriftsatz_credits_map");
        if (rawCredits) {
          localCredits = JSON.parse(rawCredits);
        }
      } catch (err) {
        console.warn("Error reading localStorage for sync", err);
      }

      // 1. Zuerst serverseitigen Auth-Endpunkt mit Firestore & Disk-Persistenz aufrufen
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload: any = { email: cleanEmail, password };
      if (mode === "register") {
        payload.initialState = {
          isPremiumUnlocked: localPremium,
          isTrafficUnlocked: localTraffic,
          schriftsatzCredits: localCredits
        };
      }

      const serverRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const serverData = await serverRes.json();

      if (!serverRes.ok || !serverData.success) {
        throw new Error(serverData.error || (mode === "register" ? "Registrierung fehlgeschlagen." : "Anmeldung fehlgeschlagen."));
      }

      // 2. Sitzung persistent speichern
      if (serverData.user) {
        localStorage.setItem("gs_auth_session", JSON.stringify(serverData.user));
        if (serverData.user.isPremiumUnlocked) {
          localStorage.setItem("gs_premium_unlocked", "true");
        }
        if (serverData.user.isTrafficUnlocked) {
          localStorage.setItem("gs_traffic_unlocked", "true");
        }
        if (serverData.user.schriftsatzCredits) {
          localStorage.setItem("gs_schriftsatz_credits_map", JSON.stringify(serverData.user.schriftsatzCredits));
        }
        window.dispatchEvent(new Event("gs-auth-changed"));
      }

      // 3. Optional: Versuche zusätzlich Firebase Client Auth, fange 'auth/operation-not-allowed' leise ab
      try {
        if (mode === "register") {
          await createUserWithEmailAndPassword(auth, cleanEmail, password);
        } else {
          await signInWithEmailAndPassword(auth, cleanEmail, password);
        }
      } catch (fbErr: any) {
        // operation-not-allowed in Firebase Console ist erwartet, wenn Provider noch nicht aktiviert wurde;
        // serverseitiges Konto ist bereits erfolgreich aktiv!
        console.log("Client Firebase Auth Status:", fbErr?.code || fbErr?.message);
      }

      setSuccessMsg(mode === "register" ? "Konto erfolgreich erstellt und verifiziert!" : "Erfolgreich angemeldet!");

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl space-y-5">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Kundenkonto & Abosicherung</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {mode === "login" ? "Bei Gesetzes-Scanner anmelden" : "Neues Kundenkonto erstellen"}
          </h2>
          <p className="text-xs text-zinc-400">
            {titleNotice || (mode === "login" 
              ? "Melden Sie sich an, um Ihre gekauften Abos & Guthaben auf allen Geräten zu nutzen."
              : "Erstellen Sie ein Konto, um Ihre Käufe & Schriftsatz-Guthaben dauerhaft zu sichern.")}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); setSuccessMsg(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === "login" 
                ? "bg-amber-400 text-black shadow-md font-extrabold" 
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Anmelden
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(null); setSuccessMsg(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === "register" 
                ? "bg-amber-400 text-black shadow-md font-extrabold" 
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Registrieren
          </button>
        </div>

        {/* 1-Click Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/80 hover:border-amber-400/50 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          )}
          <span>Mit Google anmelden</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-zinc-800 w-full"></div>
          <span className="bg-zinc-950 px-2 text-[10px] text-zinc-500 uppercase tracking-widest font-mono">oder mit E-Mail</span>
          <div className="border-t border-zinc-800 w-full"></div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-400 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase text-zinc-300 font-semibold block">E-Mail Adresse</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@beispiel.de"
                className="w-full pl-10 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/80 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase text-zinc-300 font-semibold block">Passwort</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/80 transition-colors"
              />
            </div>
          </div>

          {mode === "register" && (
            <div className="space-y-1 animate-in fade-in">
              <label className="text-[11px] font-mono uppercase text-zinc-300 font-semibold block">Passwort bestätigen</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/80 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-extrabold rounded-xl transition-all cursor-pointer shadow-gold-glow flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : mode === "login" ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Jetzt Anmelden</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Kostenloses Konto Erstellen</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-zinc-900">
          <p className="text-[11px] text-zinc-500">
            {mode === "login" ? (
              <>Noch kein Konto? <button type="button" onClick={() => setMode("register")} className="text-amber-400 font-bold hover:underline cursor-pointer">Hier Registrieren</button></>
            ) : (
              <>Bereits ein Konto? <button type="button" onClick={() => setMode("login")} className="text-amber-400 font-bold hover:underline cursor-pointer">Hier Anmelden</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
