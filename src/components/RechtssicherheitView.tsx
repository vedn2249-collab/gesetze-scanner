import React, { useState } from "react";
import { 
  ShieldCheck, 
  Search, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ExternalLink, 
  Copy, 
  Check, 
  Scale, 
  Sparkles, 
  FileText, 
  ArrowRight,
  RefreshCw,
  Info,
  ShieldAlert,
  ChevronRight,
  Gavel,
  Lock,
  Crown,
  Printer
} from "lucide-react";
import { RagLegalCertaintyResult } from "../types";

interface RechtssicherheitViewProps {
  onTransferToScanner?: (text: string) => void;
  isPremiumUnlocked?: boolean;
  onTriggerSubscribe?: () => void;
}

const PRESET_RAG_SCENARIOS = [
  {
    id: "rag-1",
    title: "Eigenbedarfskündigung ohne Begründung (§ 573 BGB)",
    field: "Mietrecht",
    text: "Mein Vermieter hat mir gestern eine ordentliche Kündigung wegen 'Eigenbedarfs' geschickt. Im Brief steht lediglich: 'Ich benötige die Wohnung für meine Nichte ab dem 01.07.'. Es werden weder die aktuelle Wohnsituation der Nichte noch konkrete Nutzungsgründe dargelegt. Ich wohne seit 6 Jahren in der Wohnung.",
    focus: "Formwirksamkeit der Kündigung nach § 573 Abs. 3 BGB"
  },
  {
    id: "rag-2",
    title: "Mängelrüge & Mietminderung bei Heizungsausfall (§ 536 BGB)",
    field: "Mietrecht",
    text: "Seit 10 Tagen fällt bei Minusgraden im Winter die Heizung und Warmwasserversorgung in meiner Mietwohnung komplett aus. Die Raumtemperatur beträgt nur noch 14 Grad. Ich habe den Vermieter vor 7 Tagen per E-Mail und Einschreiben informiert, bisher erfolgte keine Reparatur. Darf ich die Miete mindern und die Miete einbehalten?",
    focus: "Mietminderungsquote und Zurückbehaltungsrecht nach § 536, § 320 BGB"
  },
  {
    id: "rag-3",
    title: "Kündigungsschutz im Betrieb (§ 1 KSchG)",
    field: "Arbeitsrecht",
    text: "Ich bin seit 4 Jahren in einem Unternehmen mit 28 festen Vollzeit-Mitarbeitern angestellt. Gestern erhielt ich ohne vorherige Abmahnung eine betriebsbedingte Kündigung. Ein Kollege mit gleicher Qualifikation, der erst vor 6 Monaten eingestellt wurde und keine Kinder hat, wurde nicht gekündigt. Ich bin verheiratet und habe zwei Kinder.",
    focus: "Fehlerhafte Sozialauswahl nach § 1 Abs. 3 KSchG & 3-Wochen-Klagefrist (§ 4 KSchG)"
  },
  {
    id: "rag-4",
    title: "Einbürgerungsanspruch nach 5 Jahren (§ 10 StAG)",
    field: "Ausländerrecht",
    text: "Ich lebe seit 5 Jahren ununterbrochen rechtmäßig mit einer Blauen Karte EU in Deutschland, bin vollzeitbeschäftigt (kein Bürgergeldbezug), habe das B1-Zertifikat telc Deutsch und den Test 'Leben in Deutschland' mit 31/33 Punkten bestanden. Ich möchte meine bisherige Staatsangehörigkeit behalten (Mehrstaatigkeit) und die Einbürgerung beantragen.",
    focus: "Rechtsanspruch auf Einbürgerung und Hinnahme der Mehrstaatigkeit nach § 10 Abs. 1 StAG"
  },
  {
    id: "rag-5",
    title: "Vorladung als Beschuldigter ohne Belehrung (§ 136 StPO)",
    field: "Strafprozessrecht",
    text: "Die Polizei hat mich als Beschuldigten wegen Diebstahls vorgeladen. Auf der Vorladung steht, ich müsse zwingend erscheinen. Bei einer ersten informellen Befragung an der Haustür wurde ich nicht darüber belehrt, dass ich schweigen darf und einen Anwalt hinzuziehen kann. Meine spontane Aussage wurde mitgeschrieben.",
    focus: "Beweisverwertungsverbot bei unterlassener Beschuldigtenbelehrung nach § 136 StPO"
  }
];

export const RechtssicherheitView: React.FC<RechtssicherheitViewProps> = ({ 
  onTransferToScanner,
  isPremiumUnlocked = false,
  onTriggerSubscribe
}) => {
  const [inputText, setInputText] = useState("");
  const [specificFocus, setSpecificFocus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RagLegalCertaintyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedState, setCopiedState] = useState(false);

  const handleRunRagAssessment = async (textToAnalyze?: string, focusToApply?: string) => {
    // ENFORCE SUBSCRIPTION REQUIREMENT FOR RAG MODULE
    if (!isPremiumUnlocked) {
      setError("🔒 Modul gesperrt: Die RAG-Rechtssicherheitsprüfung ist ein Premium-Feature und erfordert ein aktives Abonnement.");
      if (onTriggerSubscribe) {
        onTriggerSubscribe();
      }
      return;
    }

    const query = textToAnalyze || inputText;
    const focus = focusToApply !== undefined ? focusToApply : specificFocus;

    if (!query.trim() || query.trim().length < 10) {
      setError("Bitte geben Sie einen Sachverhalt mit mindestens 10 Zeichen ein.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rag-legal-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situation: query,
          specificFocus: focus
        })
      });

      if (!response.ok) {
        throw new Error("Fehler bei der RAG-Rechtssicherheitsprüfung.");
      }

      const data: RagLegalCertaintyResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error("RAG assessment error:", err);
      setError(err.message || "Die Prüfung konnte nicht durchgeführt werden.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_RAG_SCENARIOS[0]) => {
    setInputText(preset.text);
    setSpecificFocus(preset.focus);
    if (!isPremiumUnlocked) {
      setError("🔒 Modul gesperrt: Bitte buchen Sie das Gesetzes-Scanner Abonnement (ab 4,99 €/Jahr), um RAG-Prüfungen durchzuführen.");
      if (onTriggerSubscribe) {
        onTriggerSubscribe();
      }
      return;
    }
    handleRunRagAssessment(preset.text, preset.focus);
  };

  const handleCopyReport = () => {
    if (!result) return;
    const textReport = `
=== RAG-RECHTSSICHERHEITSGUTACHTEN ===
Datum: ${new Date().toLocaleDateString("de-DE")}
Klassifikation: ${result.scenarioClassification.primaryField} (${result.scenarioClassification.subCategory})
Risikobewertung: ${result.scenarioClassification.riskScore}% | Dringlichkeit: ${result.scenarioClassification.urgencyLevel}

ZUSAMMENFASSUNG:
${result.summary}

GEPRÜFTE AMTLICHE NORMEN & TATBESTANDSMERKMALE:
${result.retrievedNorms.map(n => `
• ${n.code} - ${n.title} (${n.book})
  Amtlicher Link: ${n.officialUrl}
  Exakter Wortlaut: "${n.exactWording}"
  Erfüllungsstatus: ${n.overallElementMatch}
  Tatbestandsmerkmale:
${n.elementsChecks.map(el => `    - [${el.status === 'erfuellt' ? 'ERFÜLLT' : el.status === 'nicht_erfuellt' ? 'NICHT ERFÜLLT' : 'PRÜFUNGSBEDÜRFTIG'}] ${el.element}: ${el.explanation}`).join("\n")}
  Gesetzliche Rechtsfolge: ${n.legalConsequenceApplied}
`).join("\n")}

SUBSUMTIONS-SCHLUSSURTEIL:
${result.subsumptionConclusion}

HANDLUNGSEMPFEHLUNGEN:
${result.actionableRecommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}

OFFIZIELLE QUELLEN:
${result.officialSources.map(s => `• ${s.title}: ${s.url}`).join("\n")}
    `.trim();

    navigator.clipboard.writeText(textReport);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950/70 via-zinc-950 to-emerald-950/70 border border-teal-500/30 shadow-silver-glow relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-mono font-bold tracking-wider uppercase">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                RAG-Schnittstelle (Retrieval-Augmented Generation)
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                isPremiumUnlocked 
                  ? "bg-amber-400/10 text-amber-300 border-amber-400/30" 
                  : "bg-red-500/10 text-red-300 border-red-500/30"
              }`}>
                {isPremiumUnlocked ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Abo Aktiv (Premium Freigeschaltet)</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-red-400" />
                    <span>Nur mit Abonnement nutzbar</span>
                  </>
                )}
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-mono flex items-center gap-2">
              Rechtssicherheits- & Subsumtions-Prüfer
            </h2>
            <p className="text-sm text-zinc-300 max-w-3xl leading-relaxed">
              Geben Sie Ihren konkreten Sachverhalt ein. Das System durchsucht das aktuelle deutsche Bundesgesetzbuch (BGB, StGB, StPO, AufenthG, StAG, KSchG etc.), klassifiziert den Rechtsfall, gleicht jedes Tatbestandsmerkmal logisch ab und liefert amtliche Zitate mit Direktlink zu <strong>gesetze-im-internet.de</strong>.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end justify-center p-3 rounded-xl bg-black/50 border border-teal-500/20 text-xs font-mono shrink-0">
            <div className="flex items-center gap-2 text-teal-300 font-bold">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping"></span>
              Grounded RAG Live
            </div>
            <span className="text-zinc-400 text-[11px] mt-1">Amtliche Normen-Datenbank</span>
            <span className="text-emerald-400 text-[10px] mt-0.5">Halluzinationssicher verifiziert</span>
          </div>
        </div>
      </div>

      {/* Subscription Paywall Box if not unlocked */}
      {!isPremiumUnlocked && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-950 to-amber-950/40 border border-amber-500/40 shadow-gold-glow flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 mt-0.5 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-wider">
                  🔒 Premium-Abo erforderlich
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-black/60 px-2 py-0.5 rounded border border-zinc-800">
                  Ab 4,99 € / Jahr
                </span>
              </div>
              <h3 className="text-sm font-bold text-white font-mono">
                Schalten Sie die RAG-Rechtssicherheitsprüfung & Subsumtion frei
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl font-sans">
                Mit dem Gesetzes-Scanner Abonnement erhalten Sie unbegrenzten Zugriff auf den logischen Tatbestands-Abgleich, amtliche Paragrafen-Verifikation, Beweisverwertungsrügen und das 24/7 Gesetzes-Radar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onTriggerSubscribe}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-mono font-extrabold text-xs transition-all shadow-md hover:shadow-amber-400/20 shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <Crown className="w-4 h-4 text-black" />
            <span>Jetzt Abo buchen & freischalten</span>
            <ChevronRight className="w-4 h-4 text-black" />
          </button>
        </div>
      )}

      {/* Preset Scenarios */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            Schnellauswahl: Typische Sachverhalte mit hohem Klärungsbedarf
          </span>
          <span className="text-[11px] font-mono text-zinc-500">1-Klick RAG-Test</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {PRESET_RAG_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="p-3 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-teal-500/40 text-left transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-teal-400 px-2 py-0.5 rounded bg-teal-400/10 border border-teal-400/20">
                    {preset.field}
                  </span>
                  {!isPremiumUnlocked ? (
                    <Lock className="w-3.5 h-3.5 text-amber-400/70 group-hover:text-amber-400" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-1">
                  {preset.title}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                  {preset.text}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Input Form */}
      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-silver-glow">
        <div className="space-y-2">
          <label className="block text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" />
              1. Sachverhalt eingeben (Was ist passiert?)
            </span>
            <span className="text-[11px] text-zinc-500 font-normal">
              {inputText.length} Zeichen
            </span>
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Beschreiben Sie die Situation ausführlich (z.B. 'Ich habe eine Kündigung erhalten, obwohl ich seit 5 Jahren im Betrieb bin...' oder 'Der Nachbar hat mein Auto beim Ausparken beschädigt...')."
            rows={5}
            className="w-full bg-black border border-zinc-700 rounded-xl p-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all font-sans leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-mono font-bold text-zinc-400">
              2. Optionaler Prüffokus / Spezifische Fragestellung:
            </label>
            <input
              type="text"
              value={specificFocus}
              onChange={(e) => setSpecificFocus(e.target.value)}
              placeholder="z.B. 'Fristberechnung nach § 193 BGB' oder 'Schadensersatzanspruch'..."
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-teal-400 font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              disabled={isLoading || !inputText.trim()}
              onClick={() => handleRunRagAssessment()}
              className={`w-full py-2.5 px-4 rounded-xl font-mono font-extrabold text-xs transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer ${
                !isPremiumUnlocked
                  ? "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black hover:shadow-amber-500/20"
                  : "bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-black hover:shadow-teal-500/20"
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>RAG-Abgleich läuft...</span>
                </>
              ) : !isPremiumUnlocked ? (
                <>
                  <Lock className="w-4 h-4 text-black" />
                  <span>🔒 Mit Abo prüfen (Freischalten)</span>
                </>
              ) : (
                <>
                  <Scale className="w-4 h-4 text-black" />
                  <span>Tatbestände prüfen (RAG)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            {!isPremiumUnlocked && onTriggerSubscribe && (
              <button
                type="button"
                onClick={onTriggerSubscribe}
                className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-[11px] shrink-0 cursor-pointer"
              >
                Abo buchen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading State Skeleton */}
      {isLoading && (
        <div className="p-8 rounded-2xl bg-zinc-950 border border-teal-500/30 text-center space-y-4">
          <div className="relative inline-flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white font-mono">
              Bundesgesetzblatt wird durchsucht & Tatbestandsmerkmale werden abgeglichen...
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto font-sans">
              Die RAG-Engine ermittelt einschlägige Paragrafen, analysiert Definitionen und vollzieht die juristische Subsumtion.
            </p>
          </div>
        </div>
      )}

      {/* RAG Assessment Result */}
      {result && !isLoading && (
        <div className="space-y-6">
          {/* Classification & Summary Box */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-teal-500/30 space-y-4 shadow-silver-glow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-teal-400/10 text-teal-300 font-mono text-xs font-bold border border-teal-400/30">
                    {result.scenarioClassification.primaryField}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    • {result.scenarioClassification.subCategory}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white font-mono mt-1">
                  Juristische Fall-Klassifikation & RAG-Ergebnis
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-mono text-zinc-400 block">Dringlichkeit</span>
                  <span className={`text-xs font-mono font-bold ${
                    result.scenarioClassification.urgencyLevel === "HOCH"
                      ? "text-red-400"
                      : result.scenarioClassification.urgencyLevel === "MITTEL"
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}>
                    {result.scenarioClassification.urgencyLevel}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-black border border-zinc-800 text-center">
                  <span className="text-[10px] font-mono text-zinc-400 block">Rechtsrisiko</span>
                  <span className="text-sm font-mono font-extrabold text-amber-400">
                    {result.scenarioClassification.riskScore}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedState ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Kopiert!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Gutachten kopieren</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Als behördenkonformes PDF speichern oder drucken"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Drucken / PDF</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-zinc-800">
              <h4 className="text-xs font-mono font-bold text-teal-400 mb-1 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Sachverhalts-Zusammenfassung:
              </h4>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                {result.summary}
              </p>
            </div>
          </div>

          {/* Retrieved Grounded Norms & Element-by-Element Check */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Gavel className="w-4 h-4 text-teal-400" />
                2. Einschlägige Gesetzesnormen & Subsumtions-Abgleich ({result.retrievedNorms.length} Normen)
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">
                Wortlaut-Geprüft via gesetze-im-internet.de
              </span>
            </div>

            <div className="space-y-4">
              {result.retrievedNorms.map((norm, idx) => (
                <div
                  key={`${norm.code}-${idx}`}
                  className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 hover:border-zinc-700 transition-all"
                >
                  {/* Norm Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-extrabold text-teal-300">
                          {norm.code}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">
                          ({norm.book}) - {norm.title}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500 block mt-0.5">
                        Zitierweise: {norm.officialCitation}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border ${
                        norm.overallElementMatch === "VOLLSTÄNDIG"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : norm.overallElementMatch === "TEILWEISE"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-red-500/10 text-red-400 border-red-500/30"
                      }`}>
                        Tatbestand: {norm.overallElementMatch}
                      </span>

                      <a
                        href={norm.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-md bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-[11px] font-mono border border-teal-500/30 flex items-center gap-1.5 transition-all"
                      >
                        <span>Amtlicher Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Exact Legal Quote */}
                  <div className="p-3.5 rounded-xl bg-black border border-zinc-800/90 text-xs">
                    <span className="text-[10px] font-mono font-bold text-amber-400 block mb-1 uppercase tracking-wider">
                      📜 Exakter Gesetzestext / Amtlicher Wortlaut:
                    </span>
                    <p className="text-zinc-300 font-mono italic text-[11px] leading-relaxed">
                      "{norm.exactWording}"
                    </p>
                  </div>

                  {/* Tatbestandsmerkmale Checklist */}
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                      Tatbestandsmerkmale im Sachverhalt (Subsumtion):
                    </span>
                    <div className="space-y-2">
                      {norm.elementsChecks.map((el, elIdx) => (
                        <div
                          key={elIdx}
                          className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                            el.status === "erfuellt"
                              ? "bg-emerald-950/20 border-emerald-500/20 text-zinc-200"
                              : el.status === "nicht_erfuellt"
                              ? "bg-red-950/20 border-red-500/20 text-zinc-200"
                              : "bg-amber-950/20 border-amber-500/20 text-zinc-200"
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {el.status === "erfuellt" ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : el.status === "nicht_erfuellt" ? (
                              <XCircle className="w-4 h-4 text-red-400" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white">
                                {el.element}
                              </span>
                              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                el.status === "erfuellt"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : el.status === "nicht_erfuellt"
                                  ? "bg-red-500/20 text-red-300"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}>
                                {el.status === "erfuellt" ? "Erfüllt" : el.status === "nicht_erfuellt" ? "Nicht erfüllt" : "Prüfungsbedürftig"}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                              {el.explanation}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Applied Legal Consequence */}
                  <div className="p-3 rounded-xl bg-teal-950/20 border border-teal-500/20 text-xs">
                    <span className="text-[10px] font-mono font-bold text-teal-400 block mb-0.5 uppercase">
                      ⚖️ Gesetzliche Rechtsfolge:
                    </span>
                    <p className="text-zinc-200 font-sans text-xs">
                      {norm.legalConsequenceApplied}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subsumption Conclusion & Action Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <h4 className="text-xs font-mono font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
                <Scale className="w-4 h-4 text-teal-400" />
                3. Subsumtions-Schlussurteil
              </h4>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed whitespace-pre-line">
                {result.subsumptionConclusion}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                4. Konkrete Handlungsempfehlungen
              </h4>
              <ul className="space-y-2">
                {result.actionableRecommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-300 font-sans">
                    <span className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>

              {onTransferToScanner && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onTransferToScanner(inputText)}
                    className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-teal-300 hover:text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Im Verfahrens-Scanner für Voll-Schriftsatz öffnen</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Official Sources Index */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">
              Verifizierte Bundes-Rechtsquellen (gesetze-im-internet.de):
            </span>
            <div className="flex flex-wrap gap-2">
              {result.officialSources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-black hover:bg-zinc-900 border border-zinc-800 hover:border-teal-500/40 text-xs font-mono text-zinc-300 hover:text-teal-300 flex items-center gap-1.5 transition-all"
                >
                  <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                  <span>{source.title}</span>
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
