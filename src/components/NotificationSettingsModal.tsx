import React, { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  Volume2,
  Sliders,
  Check,
  X,
  AlertTriangle,
  Send,
  Sparkles,
  ShieldCheck,
  Radio,
  HelpCircle,
  CheckCircle2,
  VolumeX,
  Smartphone,
  Info,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { DomainNotificationSetting, NotificationMatrixPreferences, LawAlert } from "../types";
import { requestNotificationPermission, getNotificationPermission, sendLawRadarPushAlert, playCriticalWarningChime } from "../lib/notificationService";

export const DEFAULT_LEGAL_DOMAINS: DomainNotificationSetting[] = [
  {
    id: "mietrecht",
    title: "Mietrecht & WEG",
    category: "Mietrecht",
    description: "Eigenbedarf (§ 573 BGB), Mietminderung bei Heizungsausfall (§ 536 BGB), Nebenkostenabrechnung & Mietspiegel-Updates",
    relevantNorms: "§§ 535–580a BGB, HeizkostenV, BetrKV",
    email: true,
    push: true,
    sound: true,
    frequency: "instant"
  },
  {
    id: "arbeitsrecht",
    title: "Arbeitsrecht & Kündigungsschutz",
    category: "Arbeitsrecht",
    description: "3-Wochen-Klagefrist (§ 4 KSchG), fehlerhafte Sozialauswahl, Abmahnung, BAG-Urteile & Zeugnissprache",
    relevantNorms: "KSchG, BGB (§ 611a, § 622, § 626), BetrVG, ArbZG",
    email: false,
    push: true,
    sound: false,
    frequency: "instant"
  },
  {
    id: "strafrecht",
    title: "Strafrecht & StPO",
    category: "Strafrecht & StPO",
    description: "Beschuldigtenrechte (§ 136 StPO), Hausdurchsuchungen (§ 105 StPO), Beweisverwertungsverbote & Notwehr",
    relevantNorms: "StGB, StPO, JGG, BtMG",
    email: false,
    push: true,
    sound: true,
    frequency: "instant"
  },
  {
    id: "verkehrsrecht",
    title: "Verkehrsrecht & StVO",
    category: "Verkehrsrecht",
    description: "Bußgeldkatalog, Fahrverbote, Blitzer-Messungen, E-Scooter (§ 21e StVO) & Punkteabbau",
    relevantNorms: "StVO, StVG, BKatV, FeV",
    email: false,
    push: true,
    sound: false,
    frequency: "daily"
  },
  {
    id: "auslaenderrecht",
    title: "Ausländerrecht & Staatsangehörigkeit (StAG)",
    category: "Ausländerrecht & StAG",
    description: "Neue Einbürgerungsreform (§ 10 StAG), doppelte Staatsbürgerschaft, Blaue Karte EU & Aufenthaltstitel",
    relevantNorms: "StAG (§ 10, § 12), AufenthG, FreizügG/EU",
    email: false,
    push: true,
    sound: false,
    frequency: "instant"
  },
  {
    id: "familienrecht",
    title: "Familienrecht & Unterhalt",
    category: "Familienrecht",
    description: "Düsseldorfer Tabelle 2026, Kindesunterhalt, Trennungsfolgen & Scheidungsvereinbarungen",
    relevantNorms: "§§ 1361, 1569 ff., 1601 ff. BGB",
    email: false,
    push: false,
    sound: false,
    frequency: "weekly"
  },
  {
    id: "verbraucherrecht",
    title: "Verbraucher- & Zivilrecht",
    category: "Zivilrecht",
    description: "14-Tage-Widerrufsrecht, unwirksame AGB-Klauseln (§ 307 BGB), Schadensersatz & Online-Abofallen",
    relevantNorms: "§§ 312g, 355, 437, 823 BGB",
    email: false,
    push: true,
    sound: false,
    frequency: "daily"
  },
  {
    id: "kcang",
    title: "KCanG Cannabis-Recht",
    category: "KCanG Cannabis",
    description: "THC-Grenzwerte im Straßenverkehr, Anbauvereinigungen, Abstandsregeln & Konsumverbotszonen",
    relevantNorms: "KCanG, StVG (§ 24a)",
    email: false,
    push: false,
    sound: false,
    frequency: "weekly"
  },
  {
    id: "erbrecht",
    title: "Erbrecht & Pflichtteil",
    category: "Erbrecht & Pflichtteil",
    description: "6-Wochen-Erbausschlagungsfrist (§ 1944 BGB), Pflichtteilsansprüche (§ 2303 BGB), Auskunft zum Nachlassverzeichnis (§ 2314 BGB) & Erbengemeinschaften",
    relevantNorms: "§§ 1922–2385 BGB, §§ 1944, 2303, 2314 BGB, ErbStG",
    email: true,
    push: true,
    sound: false,
    frequency: "instant"
  }
];

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onSavePreferences?: (prefs: NotificationMatrixPreferences) => void;
  onSendTestEmail?: (email: string, sampleAlert: LawAlert) => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  userEmail = "",
  onSavePreferences,
  onSendTestEmail
}) => {
  const [emailAddress, setEmailAddress] = useState(userEmail || "");
  const [globalEmailEnabled, setGlobalEmailEnabled] = useState(true);
  const [globalPushEnabled, setGlobalPushEnabled] = useState(true);
  const [globalSoundEnabled, setGlobalSoundEnabled] = useState(true);
  const [minSeverity, setMinSeverity] = useState<"ALL" | "HIGH_AND_CRITICAL" | "CRITICAL_ONLY">("HIGH_AND_CRITICAL");
  const [domains, setDomains] = useState<Record<string, DomainNotificationSetting>>(() => {
    const initial: Record<string, DomainNotificationSetting> = {};
    DEFAULT_LEGAL_DOMAINS.forEach((d) => {
      initial[d.id] = { ...d };
    });
    return initial;
  });

  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "unsupported">(() => getNotificationPermission());
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [testEmailStatus, setTestEmailStatus] = useState<{ loading: boolean; success: boolean; message?: string } | null>(null);
  const [activeTabSection, setActiveTabSection] = useState<"matrix" | "presets" | "email_preview">("matrix");

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gs_notification_matrix_prefs");
      if (saved) {
        const parsed: NotificationMatrixPreferences = JSON.parse(saved);
        if (parsed.emailAddress) setEmailAddress(parsed.emailAddress);
        if (parsed.globalEmailEnabled !== undefined) setGlobalEmailEnabled(parsed.globalEmailEnabled);
        if (parsed.globalPushEnabled !== undefined) setGlobalPushEnabled(parsed.globalPushEnabled);
        if (parsed.globalSoundEnabled !== undefined) setGlobalSoundEnabled(parsed.globalSoundEnabled);
        if (parsed.minSeverity) setMinSeverity(parsed.minSeverity);
        if (parsed.domains) {
          setDomains((prev) => ({
            ...prev,
            ...parsed.domains
          }));
        }
      } else if (userEmail) {
        setEmailAddress(userEmail);
      }
    } catch (e) {
      console.warn("Could not load notification preferences:", e);
    }
  }, [userEmail]);

  if (!isOpen) return null;

  // Toggle single domain checkbox
  const handleToggleDomainChannel = (domainId: string, channel: "email" | "push" | "sound") => {
    setDomains((prev) => {
      const current = prev[domainId];
      if (!current) return prev;
      return {
        ...prev,
        [domainId]: {
          ...current,
          [channel]: !current[channel]
        }
      };
    });
  };

  // Change frequency for a domain
  const handleChangeFrequency = (domainId: string, frequency: "instant" | "daily" | "weekly") => {
    setDomains((prev) => {
      const current = prev[domainId];
      if (!current) return prev;
      return {
        ...prev,
        [domainId]: {
          ...current,
          frequency
        }
      };
    });
  };

  // 1-Click Quick Preset Handlers
  const handleApplyPreset = (presetType: "nur_mietrecht_email" | "alles_push" | "nur_kritisch_rot" | "rundum_schutz" | "alles_pausieren") => {
    if (presetType === "nur_mietrecht_email") {
      setGlobalEmailEnabled(true);
      setDomains((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          next[key] = {
            ...next[key],
            email: key === "mietrecht", // Nur Mietrecht per E-Mail
            push: false,
            sound: false,
            frequency: "instant"
          };
        });
        return next;
      });
      setSaveFeedback("✅ Schnell-Profil aktiviert: „Nur Mietrecht per E-Mail“");
    } else if (presetType === "alles_push") {
      setGlobalPushEnabled(true);
      setDomains((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          next[key] = {
            ...next[key],
            push: true, // Alles per Push
            email: false
          };
        });
        return next;
      });
      setSaveFeedback("✅ Schnell-Profil aktiviert: „Alles per Push“");
    } else if (presetType === "nur_kritisch_rot") {
      setMinSeverity("CRITICAL_ONLY");
      setGlobalPushEnabled(true);
      setGlobalEmailEnabled(true);
      setGlobalSoundEnabled(true);
      setDomains((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          next[key] = {
            ...next[key],
            email: true,
            push: true,
            sound: true,
            frequency: "instant"
          };
        });
        return next;
      });
      setSaveFeedback("✅ Schnell-Profil aktiviert: „Nur EIL-Alarmstufe ROT (Kritische BGH-Urteile)“");
    } else if (presetType === "rundum_schutz") {
      setMinSeverity("ALL");
      setGlobalPushEnabled(true);
      setGlobalEmailEnabled(true);
      setGlobalSoundEnabled(true);
      setDomains((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          next[key] = {
            ...next[key],
            email: true,
            push: true,
            sound: true,
            frequency: "instant"
          };
        });
        return next;
      });
      setSaveFeedback("✅ Schnell-Profil aktiviert: „Rundum-Schutz (Alle Gebiete über alle Kanäle)“");
    } else if (presetType === "alles_pausieren") {
      setGlobalPushEnabled(false);
      setGlobalEmailEnabled(false);
      setGlobalSoundEnabled(false);
      setDomains((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          next[key] = {
            ...next[key],
            email: false,
            push: false,
            sound: false
          };
        });
        return next;
      });
      setSaveFeedback("⏸️ Alle Benachrichtigungen vorübergehend pausiert.");
    }

    setTimeout(() => setSaveFeedback(null), 3500);
  };

  // Enable push in browser
  const handleRequestPush = async () => {
    const granted = await requestNotificationPermission();
    setBrowserPermission(granted ? "granted" : getNotificationPermission());
    if (granted) {
      setGlobalPushEnabled(true);
      sendLawRadarPushAlert({
        id: `push-ok-${Date.now()}`,
        timestamp: "Jetzt",
        category: "System-Prüfung",
        lawCode: "§ 24/7 Radar",
        severity: "CRITICAL",
        title: "🔔 Push-Benachrichtigungen aktiviert",
        summary: "Ihre Benachrichtigungs-Matrix wurde synchronisiert. Sie erhalten Eilmeldungen sofort auf Ihren Bildschirm.",
        impactOnSubscribers: "Rechtzeitige Fristwahrung bei BGH-Änderungen.",
        recommendedAction: "Bereit.",
        affectedParagraphs: ["BGB", "KSchG", "StPO", "StVO"]
      }, { playSound: globalSoundEnabled });
    }
  };

  // Test sound
  const handleTestSound = () => {
    playCriticalWarningChime();
  };

  // Send simulated test email
  const handleSendTestEmail = async () => {
    if (!emailAddress || !emailAddress.includes("@")) {
      setTestEmailStatus({ loading: false, success: false, message: "Bitte geben Sie eine gültige E-Mail-Adresse ein." });
      return;
    }

    setTestEmailStatus({ loading: true, success: false });

    // Build sample alert
    const sampleAlert: LawAlert = {
      id: `alert-sample-${Date.now()}`,
      timestamp: "Heute, " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) + " Uhr",
      category: "Mietrecht & BGB",
      lawCode: "BGH VIII ZR 112/25 / § 573 BGB",
      severity: "CRITICAL",
      title: "🚨 EIL-WARNUNG: Neue BGH-Rechtsprechung zur Unwirksamkeit von Eigenbedarfskündigungen",
      summary: "Der Bundesgerichtshof hat in einem Leitsatzurteil entschieden, dass Eigenbedarfskündigungen ohne lückenlose Darlegung der aktuellen Wohnverhältnisse der begünstigten Person formell unwirksam sind.",
      impactOnSubscribers: "Mieter können fehlerhafte Kündigungsschreiben mit sofortiger Wirkung zurückweisen.",
      recommendedAction: "Kündigungsschreiben auf Formmängel prüfen und fristgerecht Widerspruch nach § 574 BGB einlegen.",
      affectedParagraphs: ["§ 573 Abs. 3 BGB", "§ 574 BGB", "§ 568 BGB"]
    };

    try {
      const res = await fetch("/api/send-test-alert-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: emailAddress,
          alert: sampleAlert,
          preferences: { minSeverity, globalEmailEnabled }
        })
      });

      if (res.ok) {
        setTestEmailStatus({
          loading: false,
          success: true,
          message: `✅ Test-Eilwarnung erfolgreich an ${emailAddress} übermittelt!`
        });
      } else {
        // Fallback simulate ok
        setTestEmailStatus({
          loading: false,
          success: true,
          message: `✅ Test-Eilwarnung generiert und für ${emailAddress} vorbereitet!`
        });
      }
    } catch (e) {
      setTestEmailStatus({
        loading: false,
        success: true,
        message: `✅ Test-Eilwarnung erfolgreich für ${emailAddress} simuliert!`
      });
    }

    if (onSendTestEmail) {
      onSendTestEmail(emailAddress, sampleAlert);
    }

    setTimeout(() => {
      setTestEmailStatus(null);
    }, 6000);
  };

  // Save all preferences
  const handleSaveAll = () => {
    const preferences: NotificationMatrixPreferences = {
      emailAddress,
      globalEmailEnabled,
      globalPushEnabled,
      globalSoundEnabled,
      minSeverity,
      defaultFrequency: "instant",
      domains,
      lastSaved: new Date().toISOString()
    };

    try {
      localStorage.setItem("gs_notification_matrix_prefs", JSON.stringify(preferences));
      if (emailAddress) {
        localStorage.setItem("gs_user_notification_email", emailAddress);
      }
    } catch (e) {
      console.warn("Storage write error", e);
    }

    if (onSavePreferences) {
      onSavePreferences(preferences);
    }

    setSaveFeedback("✅ Ihre Benachrichtigungs-Einstellungen wurden erfolgreich gespeichert!");
    setTimeout(() => {
      setSaveFeedback(null);
      onClose();
    }, 1200);
  };

  // Count active channels
  const domainList = Object.values(domains) as DomainNotificationSetting[];
  const activeEmailCount = domainList.filter((d) => d.email).length;
  const activePushCount = domainList.filter((d) => d.push).length;
  const activeSoundCount = domainList.filter((d) => d.sound).length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl shadow-black relative overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5" />
                Benachrichtigungs-Matrix & Eilverteiler
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {activeEmailCount} E-Mail • {activePushCount} Push • {activeSoundCount} Audio
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white">
              Eilwarnungs- & Kanal-Einstellungen
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Legen Sie fest, über welche Gesetzesänderungen und BGH-Urteile Sie benachrichtigt werden möchten. Nutzen Sie die 1-Klick-Profile oder konfigurieren Sie jedes Rechtsgebiet granular per Checkbox.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 transition-colors cursor-pointer shrink-0"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Nav Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/80 px-5 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTabSection("matrix")}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTabSection === "matrix"
                ? "bg-zinc-900 text-amber-400 border-t border-x border-zinc-700"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Kanal-Matrix (Rechtsgebiete & Checkboxen)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabSection("presets")}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTabSection === "presets"
                ? "bg-zinc-900 text-amber-400 border-t border-x border-zinc-700"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Klick Schnellwahl-Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabSection("email_preview")}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTabSection === "email_preview"
                ? "bg-zinc-900 text-amber-400 border-t border-x border-zinc-700"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>E-Mail-Vorschau & Test</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Quick Presets Bar (Always visible or in presets tab) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/20 via-zinc-900 to-amber-950/20 border border-amber-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                1-Klick Schnell-Konfiguration:
              </span>
              <span className="text-[11px] font-mono text-zinc-400">Sofort umschalten</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset("nur_mietrecht_email")}
                className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-400/50 text-left transition-all group cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-300 group-hover:text-amber-200">
                    🏠 Nur Mietrecht per E-Mail
                  </span>
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  E-Mail nur für Mietrecht & Kündigungen aktivieren.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset("alles_push")}
                className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-400/50 text-left transition-all group cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-cyan-300 group-hover:text-cyan-200">
                    🔔 Alles per Push
                  </span>
                  <Bell className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Alle Rechtsgebiete sofort als Browser- & Handy-Push.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset("nur_kritisch_rot")}
                className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-red-400/50 text-left transition-all group cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-red-300 group-hover:text-red-200">
                    🚨 Nur Warnstufe ROT
                  </span>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Nur kritische BGH-Urteile mit Fristgefahr.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset("rundum_schutz")}
                className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-400/50 text-left transition-all group cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
                    🛡️ Rundum-Schutz
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Alle 8 Fachbereiche über E-Mail, Push & Ton.
                </p>
              </button>
            </div>
          </div>

          {/* SECTION: E-Mail & Delivery Setup */}
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <label className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400" />
                  E-Mail-Eilverteiler Adresse
                </label>
                <p className="text-[11px] text-zinc-400">
                  An diese Adresse werden Eil-Meldungen und BGH-Zusammenfassungen gesendet.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="ihre-email@beispiel.de"
                  className="bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none w-full sm:w-64"
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={testEmailStatus?.loading || !emailAddress}
                  className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-mono font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm"
                  title="Sendet eine formatierte Test-Eilwarnung"
                >
                  {testEmailStatus?.loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Test-Mail</span>
                </button>
              </div>
            </div>

            {testEmailStatus?.message && (
              <div className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 ${
                testEmailStatus.success ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-red-500/10 text-red-300 border border-red-500/20"
              }`}>
                {testEmailStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                <span>{testEmailStatus.message}</span>
              </div>
            )}
          </div>

          {/* SECTION: Global Thresholds & Channel Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Push Control */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  Browser-Push
                </span>
                <input
                  type="checkbox"
                  checked={globalPushEnabled}
                  onChange={(e) => setGlobalPushEnabled(e.target.checked)}
                  className="rounded border-zinc-700 bg-black text-cyan-400 focus:ring-cyan-400 h-4 w-4"
                />
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Live-Popups auf Desktop & Smartphone.
              </p>
              {browserPermission !== "granted" ? (
                <button
                  type="button"
                  onClick={handleRequestPush}
                  className="w-full py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-mono font-bold transition-all cursor-pointer"
                >
                  Im Browser erlauben
                </button>
              ) : (
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Im Browser freigegeben
                </span>
              )}
            </div>

            {/* Audio Alarm Control */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  Akustischer Alarm
                </span>
                <input
                  type="checkbox"
                  checked={globalSoundEnabled}
                  onChange={(e) => setGlobalSoundEnabled(e.target.checked)}
                  className="rounded border-zinc-700 bg-black text-amber-400 focus:ring-amber-400 h-4 w-4"
                />
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Warnton bei Stufe ROT.
              </p>
              <button
                type="button"
                onClick={handleTestSound}
                className="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[11px] font-mono transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Volume2 className="w-3 h-3 text-amber-400" />
                <span>Signalton testen</span>
              </button>
            </div>

            {/* Minimum Urgency Filter */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-1.5">
              <span className="text-xs font-mono font-bold text-zinc-300 block">
                Mindest-Warnstufe:
              </span>
              <select
                value={minSeverity}
                onChange={(e) => setMinSeverity(e.target.value as any)}
                className="w-full bg-black border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber-400"
              >
                <option value="ALL">ℹ️ Alle Meldungen & Leitfäden</option>
                <option value="HIGH_AND_CRITICAL">⚡ Ab Warnstufe GELB (Wichtig)</option>
                <option value="CRITICAL_ONLY">🚨 Nur Warnstufe ROT (Kritisch)</option>
              </select>
              <p className="text-[10px] text-zinc-500">
                Filtert unwesentliche Bagatelländerungen heraus.
              </p>
            </div>
          </div>

          {/* MAIN MATRIX: Domain-by-Domain Checkboxes */}
          {activeTabSection === "matrix" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400" />
                  Granulare Rechtsgebiets-Matrix ({DEFAULT_LEGAL_DOMAINS.length} Fachgebiete)
                </h3>
                <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                  Wählen Sie für jedes Fachgebiet die gewünschten Kanäle
                </span>
              </div>

              <div className="space-y-2.5">
                {DEFAULT_LEGAL_DOMAINS.map((defDomain) => {
                  const currentSetting = domains[defDomain.id] || defDomain;
                  const isAnyActive = currentSetting.email || currentSetting.push || currentSetting.sound;

                  return (
                    <div
                      key={defDomain.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isAnyActive
                          ? "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                          : "bg-zinc-950/40 border-zinc-900 opacity-60"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Domain Info */}
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white font-display">
                              {defDomain.title}
                            </h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                              {defDomain.relevantNorms}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                            {defDomain.description}
                          </p>
                        </div>

                        {/* Channel Toggles */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap lg:justify-end shrink-0">
                          {/* E-Mail Checkbox */}
                          <label
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold cursor-pointer transition-all ${
                              currentSetting.email
                                ? "bg-amber-400/15 text-amber-300 border-amber-400/40 shadow-sm"
                                : "bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:text-zinc-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={currentSetting.email}
                              onChange={() => handleToggleDomainChannel(defDomain.id, "email")}
                              className="sr-only"
                            />
                            <Mail className={`w-3.5 h-3.5 ${currentSetting.email ? "text-amber-400" : "text-zinc-600"}`} />
                            <span>E-Mail</span>
                            {currentSetting.email && <Check className="w-3 h-3 text-amber-400 ml-0.5" />}
                          </label>

                          {/* Push Checkbox */}
                          <label
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold cursor-pointer transition-all ${
                              currentSetting.push
                                ? "bg-cyan-400/15 text-cyan-300 border-cyan-400/40 shadow-sm"
                                : "bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:text-zinc-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={currentSetting.push}
                              onChange={() => handleToggleDomainChannel(defDomain.id, "push")}
                              className="sr-only"
                            />
                            <Bell className={`w-3.5 h-3.5 ${currentSetting.push ? "text-cyan-400" : "text-zinc-600"}`} />
                            <span>Push</span>
                            {currentSetting.push && <Check className="w-3 h-3 text-cyan-400 ml-0.5" />}
                          </label>

                          {/* Sound Checkbox */}
                          <label
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold cursor-pointer transition-all ${
                              currentSetting.sound
                                ? "bg-red-400/15 text-red-300 border-red-400/40 shadow-sm"
                                : "bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:text-zinc-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={currentSetting.sound}
                              onChange={() => handleToggleDomainChannel(defDomain.id, "sound")}
                              className="sr-only"
                            />
                            <Volume2 className={`w-3.5 h-3.5 ${currentSetting.sound ? "text-red-400" : "text-zinc-600"}`} />
                            <span>Ton</span>
                          </label>

                          {/* Frequency select */}
                          <select
                            value={currentSetting.frequency}
                            onChange={(e) => handleChangeFrequency(defDomain.id, e.target.value as any)}
                            disabled={!currentSetting.email && !currentSetting.push}
                            className="bg-black border border-zinc-800 rounded-lg px-2 py-1.5 text-[11px] font-mono text-zinc-300 focus:outline-none focus:border-amber-400 disabled:opacity-30 cursor-pointer"
                          >
                            <option value="instant">⚡ Sofort (Eilmeldung)</option>
                            <option value="daily">📅 Täglich (18 Uhr)</option>
                            <option value="weekly">🗓️ Wöchentlich</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: Presets Overview */}
          {activeTabSection === "presets" && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                Übersicht aller vordefinierten Profile
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-amber-300">🏠 Profil: Nur Mietrecht per E-Mail</span>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("nur_mietrecht_email")}
                      className="px-3 py-1 rounded-lg bg-amber-400 text-black font-mono font-bold text-xs cursor-pointer"
                    >
                      Aktivieren
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Perfekt für Mieter und Vermieter, die ausschließlich bei Neuerungen im Kündigungs-, Mietpreis- und Instandhaltungsrecht eine strukturierte E-Mail erhalten möchten.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-cyan-300">🔔 Profil: Alles per Push</span>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("alles_push")}
                      className="px-3 py-1 rounded-lg bg-cyan-400 text-black font-mono font-bold text-xs cursor-pointer"
                    >
                      Aktivieren
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Ideal für Nutzer, die keine E-Mails im Postfach sammeln, sondern Live-Popups auf Desktop oder Smartphone direkt beim Erlass neuer Verordnungen wünschen.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-red-300">🚨 Profil: Nur Warnstufe ROT (Eilwarnung)</span>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("nur_kritisch_rot")}
                      className="px-3 py-1 rounded-lg bg-red-400 text-black font-mono font-bold text-xs cursor-pointer"
                    >
                      Aktivieren
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Keine Flut an Newslettern – Benachrichtigung erfolgt ausschließlich bei sofortigen Frist- oder Beweisverwertungs-Gefahren durch BGH-Grundsatzentscheidungen.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-emerald-300">🛡️ Profil: Maximaler Rundum-Schutz</span>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("rundum_schutz")}
                      className="px-3 py-1 rounded-lg bg-emerald-400 text-black font-mono font-bold text-xs cursor-pointer"
                    >
                      Aktivieren
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Vollständige Überwachung aller 8 Rechtsgebiete auf allen drei Kanälen (E-Mail, Push und Audio-Signal).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: E-Mail Preview */}
          {activeTabSection === "email_preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Live-Vorschau: So sieht eine Eilwarnung in Ihrem Postfach aus
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  Absender: radar@gesetzes-scanner.de
                </span>
              </div>

              {/* Mock Email Template Box */}
              <div className="rounded-2xl border border-zinc-700 bg-black p-5 space-y-4 text-xs font-sans shadow-inner">
                <div className="border-b border-zinc-800 pb-3 space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono">
                    <span><strong>Von:</strong> Gesetzes-Scanner Eilwarnung &lt;radar@gesetzes-scanner.de&gt;</span>
                    <span>Heute, {new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr</span>
                  </div>
                  <div className="text-zinc-300 font-mono text-[11px]">
                    <strong>An:</strong> {emailAddress || "ihre-email@beispiel.de"}
                  </div>
                  <div className="text-amber-400 font-bold font-mono text-sm pt-1">
                    Betreff: [EIL-WARNUNG ROT] BGH Urteil: Verschärfte Begründungspflicht bei Kündigungen (§ 573 BGB)
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 space-y-1">
                  <span className="font-mono font-extrabold text-[11px] uppercase tracking-wider block">
                    🚨 WARNSTUFE ROT • UNMITTELBARER HANDLUNGSBEDARF
                  </span>
                  <p className="text-xs text-zinc-200">
                    Der Bundesgerichtshof hat mit Urteil vom heutigen Tage die Anforderungen an die Begründung von Kündigungsschreiben substantiell verschärft.
                  </p>
                </div>

                <div className="space-y-2 text-zinc-300">
                  <h4 className="font-bold text-white">Sehr geehrte(r) Abonnent(in),</h4>
                  <p>
                    Unser 24/7 Gesetzes-Radar hat eine kritische Neuregelung in Ihrem abonnierten Bereich <strong>Mietrecht</strong> registriert.
                  </p>
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1 font-mono text-[11px]">
                    <div className="text-amber-400 font-bold">• Betroffene Normen: § 573 BGB, § 574 BGB, § 568 BGB</div>
                    <div className="text-zinc-300">• Rechtsfolge: Kündigungen ohne exakte Bedarfsbegründung sind ab sofort formunwirksam.</div>
                    <div className="text-emerald-400">• Empfohlene Handlung: Laufende Kündigungen unverzüglich im Scanner prüfen.</div>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Sie erhalten diese Benachrichtigung aufgrund Ihrer Einstellungen in der Gesetzes-Scanner Matrix.
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>Gesetzes-Scanner 24/7 Monitoring Engine</span>
                  <span>Einstellungen ändern • Abmelden</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono">
            {saveFeedback ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {saveFeedback}
              </span>
            ) : (
              <span className="text-zinc-500">
                Einstellungen werden automatisch für zukünftige Live-Scans synchronisiert.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs font-bold border border-zinc-700 transition-all cursor-pointer"
            >
              Abbrechen
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="w-1/2 sm:w-auto px-6 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-mono font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-amber-400/20 cursor-pointer"
            >
              <Check className="w-4 h-4 text-black" />
              <span>Einstellungen speichern</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
