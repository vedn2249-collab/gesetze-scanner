import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Mail, 
  ShieldCheck, 
  Printer, 
  Download,
  Calendar,
  Clock,
  Send
} from "lucide-react";
import { submitWiderruf, WiderrufSubmissionResult } from "../services/widerrufService";

interface WiderrufProps {
  onClose?: () => void;
  initialTransactionId?: string;
  initialEmail?: string;
  isModal?: boolean;
}

export const Widerruf: React.FC<WiderrufProps> = ({
  onClose,
  initialTransactionId = "",
  initialEmail = "",
  isModal = false
}) => {
  // Stufe 1 = Bestätigungsseite ("Wollen Sie den Vertrag widerrufen?")
  // Stufe 2 = Formular mit Pflichtfeldern
  // Stufe 3 = Erfolgsbestätigung
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [transactionId, setTransactionId] = useState(initialTransactionId);
  const [reason, setReason] = useState("");

  // Validation & Submission State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<WiderrufSubmissionResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Bitte geben Sie Ihren vollständigen Namen an.");
      return;
    }
    if (!email.trim() || !email.includes("@") || !email.includes(".")) {
      setErrorMessage("Bitte geben Sie eine gültige E-Mail-Adresse an.");
      return;
    }
    if (!transactionId.trim()) {
      setErrorMessage("Bitte geben Sie die Bestell- oder Transaktions-ID an (z. B. aus Ihrer Paddle-Kaufbestätigung).");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitWiderruf({
        name,
        email,
        transaction_id: transactionId,
        reason,
        status: "eingegangen"
      });

      setSubmissionResult(result);
      setStep(3);
    } catch (err: any) {
      setErrorMessage("Bei der Übermittlung ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder schreiben Sie an vedn2249@gmail.com.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadProof = () => {
    if (!submissionResult) return;
    const dateFormatted = new Date(submissionResult.created_at).toLocaleString("de-DE");
    const content = `===============================================================
WIDERRUFSBESTÄTIGUNG NACH § 356a BGB n.F.
Gesetzes-Scanner (gesetze-scanner.de / gesetze-scanner.onrender.com)
===============================================================

Hiermit wird der fristgerechte Eingang Ihrer elektronischen Widerrufserklärung
gemäß § 356a Bürgerliches Gesetzbuch (BGB) verbindlich bestätigt.

Widerrufs-ID:         ${submissionResult.id}
Eingangszeitpunkt:    ${dateFormatted}
Status:               Eingegangen / In Bearbeitung

KUNDENDATEN:
Name des Kunden:      ${name}
E-Mail-Adresse:       ${email}
Bestell-/Transakt.-ID:${transactionId}
${reason ? `Widerrufsgrund:       ${reason}\n` : ""}

EMPFÄNGER DES WIDERRUFS:
Betreiber:            Vedat Kurt (Gesetzes-Scanner)
Adresse:              SİDE MAH. 1549_1 SK. ASIM BEY APT. 2 SİTESİ NO: 14 İÇ KAPI NO: 8
                      07600 Manavgat Side Antalya / Türkei
Kundenservice:        vedn2249@gmail.com

RECHTLICHER HINWEIS:
Diese Bestätigung wurde unmittelbar nach Absenden des elektronischen
Widerrufsformulars automatisch generiert. Eine Kopie ging an ${email}
sowie an die Geschäftsleitung (vedn2249@gmail.com).

Bitte bewahren Sie dieses Dokument als gesetzlichen Nachweis auf.
===============================================================`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Widerrufsbestaetigung_${submissionResult.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const content = (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl w-full max-w-2xl overflow-hidden relative shadow-2xl text-left">
      {/* Top Gold Accent Border */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"></div>

      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-zinc-850 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-display font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Vertrag widerrufen</span>
              <span className="text-[10px] font-mono font-bold bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase">
                § 356a BGB n.F.
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Elektronische Widerrufsfunktion für digitale Verträge
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="px-6 pt-4 pb-2 bg-zinc-900/40 border-b border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <span className={step >= 1 ? "text-amber-400 font-bold" : "text-zinc-600"}>
          1. Bestätigung
        </span>
        <span className="text-zinc-700">───</span>
        <span className={step >= 2 ? "text-amber-400 font-bold" : "text-zinc-600"}>
          2. Formular
        </span>
        <span className="text-zinc-700">───</span>
        <span className={step === 3 ? "text-emerald-400 font-bold" : "text-zinc-600"}>
          3. Eingangsbestätigung
        </span>
      </div>

      {/* Content Body */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* STUFE 1: Bestätigungsseite ("Wollen Sie den Vertrag widerrufen?") */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-display font-bold text-white text-base">
                    Wollen Sie Ihren Vertrag wirklich widerrufen?
                  </h3>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    Nach § 356a BGB n.F. haben Sie das Recht, einen online geschlossenen Vertrag über diese elektronische Schaltfläche zu widerrufen.
                  </p>
                </div>
              </div>

              <div className="border-t border-amber-500/20 pt-3 text-xs text-zinc-400 space-y-2">
                <p>
                  <strong>Hinweis zu digitalen Leistungen (§ 356 Abs. 5 BGB):</strong><br />
                  Haben Sie beim Kauf der sofortigen Bereitstellung der Software (z. B. Durchführung einer Dokumentenanalyse, Abruf von RAG-Schriftsätzen) zugestimmt und wurde die Leistung bereits vollständig erbracht, erlischt das Widerrufsrecht mit Beginn der Ausführung vorzeitig.
                </p>
                <p>
                  Für noch <strong>nicht genutzte Zugänge oder Abonnements</strong> innerhalb der gesetzlichen 14-tägigen Frist wird der Widerruf unverzüglich bearbeitet und der Kaufbetrag erstattet.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 space-y-2">
              <h4 className="font-bold text-white text-[11px] font-mono uppercase tracking-wider">
                Ablauf Ihres Widerrufs:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
                <li>Angabe Ihrer Bestelldaten im nächsten Schritt</li>
                <li>Sofortige automatische Eingangsbestätigung per E-Mail auf Ihren Bildschirm & in Ihr Postfach</li>
                <li>Automatische Weiterleitung an den Kundenservice (<span className="text-amber-400 font-mono">vedn2249@gmail.com</span>)</li>
                <li>Rechtssichere Speicherung im System</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-display font-extrabold text-xs uppercase py-3.5 px-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <span>Ja, Widerruf fortsetzen</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose ? onClose : () => window.history.back()}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-mono text-xs py-3.5 px-5 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-400" />
                <span>Abbrechen / Zurück</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* STUFE 2: Formular mit Pflichtfeldern */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Schritt 2 von 2: Bitte füllen Sie alle erforderlichen Pflichtfelder aus.
                </span>
              </div>

              {/* Name (Pflichtfeld) */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-300 uppercase mb-1 font-bold">
                  Vollständiger Name des Bestellers *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vor- und Nachname (z. B. Max Mustermann)"
                  className="w-full bg-black border border-zinc-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors"
                />
              </div>

              {/* E-Mail (Pflichtfeld) */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-300 uppercase mb-1 font-bold">
                  E-Mail-Adresse (beim Kauf verwendet) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ihre.email@beispiel.de"
                  className="w-full bg-black border border-zinc-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors font-mono"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  An diese Adresse wird die sofortige Eingangsbestätigung versendet.
                </span>
              </div>

              {/* Bestell- / Transaktions-ID (Pflichtfeld) */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-300 uppercase mb-1 font-bold flex items-center justify-between">
                  <span>Bestell- / Transaktions-ID *</span>
                  <span className="text-[9px] text-amber-400 font-normal">z. B. txn_... oder GS-PADDLE-...</span>
                </label>
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="z. B. txn_01m43kqve0zbkag8gj4y7ewbgy oder Bestellnummer"
                  className="w-full bg-black border border-zinc-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors font-mono"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Sie finden die ID in Ihrer Rechnung oder Zahlungsbestätigungs-E-Mail von Paddle.
                </span>
              </div>

              {/* Grund (Optional) */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1 flex items-center justify-between">
                  <span>Grund des Widerrufs</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Optional (freiwillig)</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Optionaler Grund oder Anmerkung (hilft uns, den Service zu verbessern)..."
                  className="w-full bg-black border border-zinc-800 focus:border-amber-400 rounded-xl p-3 text-xs text-white focus:outline-none transition-colors"
                />
              </div>

              {/* Gesetzliche Erklärung */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über den Kauf der digitalen Dienstleistung bzw. Softwarebereitstellung von Gesetzes-Scanner.
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-display font-extrabold text-xs uppercase py-3.5 px-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                      <span>Widerruf wird übermittelt & erfasst...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Widerruf verbindlich absenden</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-mono text-xs py-3.5 px-4 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4 text-zinc-400" />
                  <span>Zurück</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* STUFE 3: Automatische Eingangsbestätigung */}
        {step === 3 && submissionResult && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="font-display font-extrabold text-xl text-white">
                  Ihr Widerruf ist eingegangen am {new Date(submissionResult.created_at).toLocaleDateString("de-DE")}
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-1">
                  Uhrzeit: {new Date(submissionResult.created_at).toLocaleTimeString("de-DE")} Uhr
                </p>
              </div>
            </div>

            {/* Official Confirmation Box */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-[10px] font-mono uppercase text-zinc-500">Widerrufs-Bestätigungs-ID</span>
                <span className="font-mono text-amber-400 font-bold">{submissionResult.id}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Name:</span>
                  <span className="font-medium text-white">{name}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">E-Mail-Adresse:</span>
                  <span className="font-mono text-white">{email}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Transaktions-ID:</span>
                  <span className="font-mono text-white">{transactionId}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Status:</span>
                  <span className="text-emerald-400 font-bold font-mono">Eingegangen (Bestätigt)</span>
                </div>
              </div>

              {reason && (
                <div className="pt-2 border-t border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Angegebener Grund:</span>
                  <span className="text-zinc-300 italic">{reason}</span>
                </div>
              )}
            </div>

            {/* Notification Badge */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Gesetzliche Eingangsbestätigung erteilt (§ 356a BGB)</span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Eine automatische Eingangsbestätigung wurde soeben an Ihre E-Mail-Adresse (<strong>{email}</strong>) versendet. Zeitgleich wurde der Kundenservice (<strong>vedn2249@gmail.com</strong>) benachrichtigt.
              </p>
            </div>

            {/* Print & Download Options */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadProof}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-mono text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Bestätigung herunterladen (.txt)</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-mono text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-zinc-400" />
                <span>Drucken</span>
              </button>
            </div>

            {onClose && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-display font-extrabold text-xs uppercase py-3 rounded-xl transition-all cursor-pointer text-center"
                >
                  Fertig & Schließen
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-black/80 border-t border-zinc-900 text-center text-[10px] font-mono text-zinc-500">
        Gesetzes-Scanner • Elektronischer Widerruf nach § 356a BGB n.F. • Betreiber: Vedat Kurt • Support: vedn2249@gmail.com
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-md cursor-pointer"
        />
        <div className="relative z-10 my-auto w-full max-w-2xl max-h-[92vh] overflow-y-auto">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        {content}
      </div>
    </div>
  );
};

export default Widerruf;
