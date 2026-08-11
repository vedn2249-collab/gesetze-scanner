import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
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
      if (mode === "register") {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Initialize user record in Firestore
        const userRef = doc(db, "users", user.uid);
        const existingDoc = await getDoc(userRef);

        if (!existingDoc.exists()) {
          // Sync existing local storage purchases if available
          let localPremium = false;
          let localTraffic = false;
          let localCredits = { berufung: 0, revision: 0, wiederaufnahme: 0, verfassungsbeschwerde: 0 };

          try {
            localPremium = localStorage.getItem("gs_is_premium") === "true";
            localTraffic = localStorage.getItem("gs_traffic_unlocked") === "true";
            const rawCredits = localStorage.getItem("gs_schriftsatz_credits_map");
            if (rawCredits) {
              localCredits = JSON.parse(rawCredits);
            }
          } catch (err) {
            console.warn("Error reading localStorage for sync", err);
          }

          await setDoc(userRef, {
            email: user.email,
            createdAt: new Date().toISOString(),
            isPremiumUnlocked: localPremium,
            isTrafficUnlocked: localTraffic,
            schriftsatzCredits: localCredits
          });
        }

        setSuccessMsg("Konto erfolgreich erstellt und eingeloggt!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMsg("Erfolgreich angemeldet!");
      }

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 800);
    } catch (err: any) {
      console.error("Auth error:", err);
      const authErr = err as AuthError;
      if (authErr.code === "auth/invalid-email") {
        setError("Ungültige E-Mail-Adresse.");
      } else if (authErr.code === "auth/user-not-found" || authErr.code === "auth/wrong-password" || authErr.code === "auth/invalid-credential") {
        setError("E-Mail oder Passwort ist falsch.");
      } else if (authErr.code === "auth/email-already-in-use") {
        setError("Diese E-Mail-Adresse wird bereits verwendet.");
      } else if (authErr.code === "auth/weak-password") {
        setError("Das Passwort ist zu schwach (mindestens 6 Zeichen).");
      } else {
        setError(err.message || "Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.");
      }
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
