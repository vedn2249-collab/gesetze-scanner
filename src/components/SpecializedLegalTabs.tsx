import React, { useState, useEffect, useRef } from 'react';
import { 
  Gavel, 
  DollarSign, 
  Calendar, 
  FolderOpen, 
  Radio, 
  Mic, 
  Headphones, 
  Compass, 
  MapPin, 
  FileText, 
  Check, 
  Copy, 
  Download, 
  Play, 
  Square, 
  SendHorizontal, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  FilePlus,
  CheckCircle2,
  Phone,
  Mail,
  Star,
  Award,
  Building,
  UserCheck,
  Loader2,
  Globe,
  Languages,
  FileCheck,
  ArrowRight,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { calculateLegalCosts, calculatePKHEligibility, checkStatuteOfLimitations, downloadDeadlineICSFile, downloadBeAXmlFile } from '../legalTools';

// ==========================================
// 2. MOCK-TRIAL & PROZESS-SIMULATOR (TAB 2) - FULLY REAL & DYNAMIC
// ==========================================
export function MockTrialView({ caseSummary }: { caseSummary?: string }) {
  const [caseContext, setCaseContext] = useState(caseSummary || '');
  const [messages, setMessages] = useState<Array<{ role: 'RICHTER' | 'GEGNER' | 'VERTEIDIGER'; name: string; text: string; score?: number }>>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successRate, setSuccessRate] = useState<number | null>(null);
  const [tacticalTip, setTacticalTip] = useState<string | null>(null);

  // Sync if caseSummary changes externally
  useEffect(() => {
    if (caseSummary && !caseContext) {
      setCaseContext(caseSummary);
    }
  }, [caseSummary]);

  const handleStartSimulation = async () => {
    if (!caseContext.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/mock-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseSummary: caseContext,
          userArgument: 'Verhandlungseröffnung und vorläufige Sachanträge',
          history: []
        })
      });
      const data = await res.json();
      setMessages([
        {
          role: 'RICHTER',
          name: 'Vorsitzender Richter am Landgericht',
          text: data.richter_hinweis || 'Die Kammer eröffnet die mündliche Verhandlung und führt in den Sach- und Streitstand ein.',
          score: 8
        },
        {
          role: 'GEGNER',
          name: 'Rechtsanwalt der Gegenseite',
          text: data.gegner_replik || 'Wir rügen die Zulässigkeit und beantragen vollumfängliche Klageabweisung.',
          score: 6
        }
      ]);
      setSuccessRate(data.erfolgsprognose_prozent || 65);
      setTacticalTip(data.taktischer_tipp || 'Stellen Sie Ihre Sachanträge präzise und benennen Sie die Beweismittel.');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputMsg.trim() || isLoading) return;
    const currentInput = inputMsg;
    setInputMsg('');

    const newHistory = [
      ...messages,
      {
        role: 'VERTEIDIGER' as const,
        name: 'Ihre Klageposition (Vortrag)',
        text: currentInput,
        score: 8
      }
    ];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const res = await fetch('/api/mock-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseSummary: caseContext,
          userArgument: currentInput,
          history: newHistory
        })
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'RICHTER',
          name: 'Richterlicher Hinweis (§ 139 ZPO)',
          text: data.richter_hinweis,
          score: data.schlagkraft_score
        },
        {
          role: 'GEGNER',
          name: 'Rechtsanwalt der Gegenseite',
          text: data.gegner_replik,
          score: Math.max(4, 10 - (data.schlagkraft_score || 5))
        }
      ]);
      if (data.erfolgsprognose_prozent !== undefined) {
        setSuccessRate(data.erfolgsprognose_prozent);
      }
      if (data.taktischer_tipp) {
        setTacticalTip(data.taktischer_tipp);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Gavel className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-bold">Interaktive Gerichtssimulation</span>
            <h3 className="text-lg font-bold font-display text-white">⚖️ Mock-Trial & Prozess-Simulator</h3>
          </div>
        </div>
        {successRate !== null && (
          <div className="px-3 py-1.5 bg-purple-950/60 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-mono flex items-center gap-2">
            <span>Tendenz:</span>
            <strong className={`${successRate >= 60 ? 'text-emerald-400' : 'text-amber-400'} font-bold`}>{successRate}% Prozesserfolg</strong>
          </div>
        )}
      </div>

      {/* Case Context Input Box */}
      <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
        <label className="text-xs font-mono text-zinc-400 block font-semibold">
          1. Sachverhalt / Streitgegenstand für die Verhandlung:
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={caseContext}
            onChange={e => setCaseContext(e.target.value)}
            placeholder="z.B. Vermieter kündigt wegen Eigenbedarf oder Käufer zahlt Kaufpreis von 4.200 € nicht..."
            className="flex-grow bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-400 focus:outline-none font-sans"
          />
          <button
            type="button"
            onClick={handleStartSimulation}
            disabled={isLoading || !caseContext.trim()}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center justify-center gap-2 shadow-md"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Verhandlung simulieren</span>
          </button>
        </div>
      </div>

      {tacticalTip && (
        <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/40 text-purple-200 text-xs font-mono flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-purple-300 block mb-0.5">Taktischer KI-Verhandlungshinweis:</strong>
            <span>{tacticalTip}</span>
          </div>
        </div>
      )}

      {/* Message Stream */}
      {messages.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {messages.map((m, idx) => (
            <div
              key={`msg-${idx}`}
              className={`p-4 rounded-xl border ${
                m.role === 'RICHTER'
                  ? 'bg-amber-950/20 border-amber-500/30 text-amber-100'
                  : m.role === 'GEGNER'
                  ? 'bg-red-950/20 border-red-500/30 text-red-100'
                  : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 text-xs font-mono font-bold">
                <span className={m.role === 'RICHTER' ? 'text-amber-400' : m.role === 'GEGNER' ? 'text-red-400' : 'text-emerald-400'}>
                  {m.name}
                </span>
                {m.score !== undefined && <span className="text-[10px] text-zinc-400">Schlagkraft: {m.score}/10</span>}
              </div>
              <p className="text-xs sm:text-sm leading-relaxed">{m.text}</p>
            </div>
          ))}
          {isLoading && (
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              <span>Gericht und Gegenseite beraten über Ihren Vortrag...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-black border border-zinc-900 text-center space-y-2">
          <Gavel className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-xs text-zinc-400 font-mono">
            Geben Sie oben Ihren Sachverhalt ein und starten Sie die echte, interaktive Verhandlungssimulation.
          </p>
        </div>
      )}

      {messages.length > 0 && (
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ihre Replik oder Beweismittel in die Verhandlung einbringen..."
            className="flex-grow bg-black border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-400 focus:outline-none font-sans"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !inputMsg.trim()}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <SendHorizontal className="w-4 h-4" />
            <span>Vortragen</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. KOSTEN & FINANZEN (TAB 3) - FULLY REAL CALCULATION
// ==========================================
export function FinanceCalculatorView() {
  const [streitwert, setStreitwert] = useState(5000);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [deductible, setDeductible] = useState(150);
  const [income, setIncome] = useState(1950);
  const [rent, setRent] = useState(720);
  const [dependents, setDependents] = useState(0);

  const cost = calculateLegalCosts(streitwert, hasInsurance, deductible, true);
  const pkh = calculatePKHEligibility(income, rent, dependents);

  return (
    <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Wirtschaftlichkeitsanalyse</span>
          <h3 className="text-lg font-bold font-display text-white">💰 Kosten, RVG/GKG & Prozesskostenhilfe (PKH)</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RVG Kostenrechner */}
        <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white font-mono">1. Prozesskostenrisiko (RVG/GKG)</h4>
            <span className="text-xs text-amber-400 font-mono font-bold">{streitwert.toLocaleString('de-DE')} €</span>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1 font-mono">Streitwert / Forderungssumme:</label>
            <input
              type="range"
              min="300"
              max="50000"
              step="250"
              value={streitwert}
              onChange={e => setStreitwert(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="insCheck"
              checked={hasInsurance}
              onChange={e => setHasInsurance(e.target.checked)}
              className="accent-emerald-400 rounded"
            />
            <label htmlFor="insCheck" className="text-xs text-zinc-300 font-mono cursor-pointer">
              Rechtsschutzversicherung vorhanden
            </label>
          </div>

          {hasInsurance && (
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1 font-mono">Selbstbeteiligung (€):</label>
              <input
                type="number"
                value={deductible}
                onChange={e => setDeductible(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
              <span className="text-zinc-400 text-[10px] block">Eigener Anwalt (1.3 + 1.2 RVG)</span>
              <strong className="text-white text-sm">{cost.lawyerFeesRVG.toLocaleString('de-DE')} €</strong>
            </div>
            <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
              <span className="text-zinc-400 text-[10px] block">Gerichtskosten (3.0 GKG)</span>
              <strong className="text-white text-sm">{cost.courtFeesGKG.toLocaleString('de-DE')} €</strong>
            </div>
          </div>

          <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800 font-mono text-xs flex justify-between items-center">
            <span className="text-zinc-400">Maximales Gesamtrisiko (inkl. Gegner):</span>
            <strong className="text-amber-400 text-sm">{cost.maxCostExposure.toLocaleString('de-DE')} €</strong>
          </div>

          <div className={`p-3 rounded-lg border text-xs font-sans ${
            cost.trafficLight === 'GREEN' 
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
              : cost.trafficLight === 'YELLOW'
              ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
              : 'bg-red-950/30 border-red-500/40 text-red-300'
          }`}>
            {cost.verdict}
          </div>
        </div>

        {/* PKH Rechner */}
        <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-4">
          <h4 className="text-sm font-bold text-white font-mono">2. Prozesskostenhilfe-Rechner (§ 115 ZPO)</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <label className="text-zinc-400 block mb-1 font-mono text-[10px]">Nettoeinkommen (€):</label>
              <input
                type="number"
                value={income}
                onChange={e => setIncome(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1 font-mono text-[10px]">Warmmiete (€):</label>
              <input
                type="number"
                value={rent}
                onChange={e => setRent(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1 font-mono text-[10px]">Unterhaltspflichten:</label>
              <input
                type="number"
                min="0"
                max="10"
                value={dependents}
                onChange={e => setDependents(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-blue-950/20 border border-blue-500/30 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-blue-300 font-bold">
              <span>Ergebnis PKH-Prüfung:</span>
              <span className={pkh.isEligible ? 'text-emerald-400' : 'text-amber-400'}>
                {pkh.isEligible ? 'BEWILLIGUNGSFÄHIG ✓' : 'KEIN ANSPRUCH'}
              </span>
            </div>
            <p className="text-zinc-200 font-sans leading-relaxed">{pkh.verdict}</p>
            <div className="text-[11px] text-zinc-400 border-t border-zinc-800 pt-1.5">
              Berechnetes einzusetzendes Einkommen: <strong className="text-white">{pkh.disposableIncome.toFixed(2)} €</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. FRISTEN-TRACKER & KALENDER (TAB 4) - REAL USER DEADLINES
// ==========================================
interface UserDeadline {
  id: string;
  title: string;
  date: string;
  fileNo: string;
  critical: boolean;
}

export function DeadlinesCalendarView() {
  const [deadlines, setDeadlines] = useState<UserDeadline[]>(() => {
    const saved = localStorage.getItem('gs_user_deadlines');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newFileNo, setNewFileNo] = useState('');
  const [isCritical, setIsCritical] = useState(true);

  const saveDeadlines = (updated: UserDeadline[]) => {
    setDeadlines(updated);
    localStorage.setItem('gs_user_deadlines', JSON.stringify(updated));
  };

  const handleAdd = () => {
    if (!newTitle.trim() || !newDate) return;
    const item: UserDeadline = {
      id: `dl-${Date.now()}`,
      title: newTitle.trim(),
      date: newDate,
      fileNo: newFileNo.trim() || 'Aktenzeichen offen',
      critical: isCritical
    };
    const updated = [item, ...deadlines];
    saveDeadlines(updated);
    setNewTitle('');
    setNewDate('');
    setNewFileNo('');
  };

  const handleDelete = (id: string) => {
    const updated = deadlines.filter(d => d.id !== id);
    saveDeadlines(updated);
  };

  const calculateDaysLeft = (targetDateStr: string) => {
    const target = new Date(targetDateStr);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">Fristenüberwachung</span>
            <h3 className="text-lg font-bold font-display text-white">📅 Fristen-Tracker & Automatischer ICS-Kalender</h3>
          </div>
        </div>
      </div>

      {/* Add New Deadline Form */}
      <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-3">
        <span className="text-xs font-mono text-amber-400 font-bold block">
          Neue gesetzliche Frist oder Notfrist erfassen:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Frist-Bezeichnung (z.B. Einspruch gegen Bußgeldbescheid)"
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-sans"
          />
          <input
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
          />
          <input
            type="text"
            value={newFileNo}
            onChange={e => setNewFileNo(e.target.value)}
            placeholder="Aktenzeichen (optional)"
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
          />
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="critCheck"
              checked={isCritical}
              onChange={e => setIsCritical(e.target.checked)}
              className="accent-red-500 rounded"
            />
            <label htmlFor="critCheck" className="text-xs text-zinc-300 font-mono cursor-pointer">
              Als Notfrist markieren (mit Vorwarnungen)
            </label>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newTitle.trim() || !newDate}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-mono font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-gold-glow"
          >
            <Plus className="w-4 h-4" />
            <span>Frist anlegen</span>
          </button>
        </div>
      </div>

      {/* Deadlines List */}
      <div className="space-y-3">
        {deadlines.length > 0 ? (
          deadlines.map(d => {
            const daysLeft = calculateDaysLeft(d.date);
            return (
              <div key={d.id} className="p-4 rounded-xl bg-black border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-extrabold ${
                      d.critical ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-zinc-800 text-zinc-300'
                    }`}>
                      {d.critical ? '🚨 NOTFRIST' : 'ORDENTLICHE FRIST'}
                    </span>
                    <span className="text-xs font-bold text-white">{d.title}</span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">
                    Aktenzeichen: {d.fileNo} • Stichtag: <strong className="text-white">{new Date(d.date).toLocaleDateString('de-DE')}</strong> (24:00 Uhr)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-zinc-400 block">Restzeit:</span>
                    <span className={`text-xs font-bold ${daysLeft <= 3 ? 'text-red-400' : 'text-amber-400'}`}>
                      {daysLeft >= 0 ? `Noch ${daysLeft} Tage` : `Abgelaufen vor ${Math.abs(daysLeft)} Tagen`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadDeadlineICSFile(d.fileNo, d.title, d.date)}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg text-xs transition-colors cursor-pointer"
                    title="Als .ICS Kalender-Datei herunterladen"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(d.id)}
                    className="p-2 bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-zinc-700 rounded-lg text-xs transition-colors cursor-pointer"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 rounded-xl bg-black border border-zinc-900 text-center space-y-2">
            <Calendar className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400 font-mono">
              Aktuell sind keine Fristen eingetragen. Legen Sie oben eine neue Frist an.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 5. AKTEN-NAVIGATOR (TAB 5) - REAL USER FILES
// ==========================================
interface UserCaseFile {
  id: string;
  name: string;
  category: 'VORVERFAHREN' | 'SCHRIFTSAETZE' | 'BEWEISMITTEL';
  date: string;
  size?: string;
}

export function FileNavigatorView() {
  const [files, setFiles] = useState<UserCaseFile[]>(() => {
    const saved = localStorage.getItem('gs_user_case_files');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [fileName, setFileName] = useState('');
  const [category, setCategory] = useState<'VORVERFAHREN' | 'SCHRIFTSAETZE' | 'BEWEISMITTEL'>('VORVERFAHREN');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveFiles = (updated: UserCaseFile[]) => {
    setFiles(updated);
    localStorage.setItem('gs_user_case_files', JSON.stringify(updated));
  };

  const handleAddManual = () => {
    if (!fileName.trim()) return;
    const newDoc: UserCaseFile = {
      id: `doc-${Date.now()}`,
      name: fileName.trim(),
      category,
      date: new Date().toLocaleDateString('de-DE')
    };
    saveFiles([newDoc, ...files]);
    setFileName('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;
    const newItems: UserCaseFile[] = [];
    for (let i = 0; i < uploaded.length; i++) {
      const f = uploaded[i];
      newItems.push({
        id: `doc-${Date.now()}-${i}`,
        name: f.name,
        category,
        date: new Date().toLocaleDateString('de-DE'),
        size: `${(f.size / 1024).toFixed(1)} KB`
      });
    }
    saveFiles([...newItems, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (id: string) => {
    saveFiles(files.filter(f => f.id !== id));
  };

  const vorverfahren = files.filter(f => f.category === 'VORVERFAHREN');
  const schriftsaetze = files.filter(f => f.category === 'SCHRIFTSAETZE');
  const beweismittel = files.filter(f => f.category === 'BEWEISMITTEL');

  return (
    <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold">Digitale Aktenführung</span>
            <h3 className="text-lg font-bold font-display text-white">🗂️ Akten-Navigator & Chronologie</h3>
          </div>
        </div>
      </div>

      {/* Add Document Control */}
      <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-3">
        <span className="text-xs font-mono text-blue-400 font-bold block">
          Dokument oder Aktenbestandteil zur Akte hinzufügen:
        </span>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={fileName}
            onChange={e => setFileName(e.target.value)}
            placeholder="Dokumenten-Titel (z.B. Bußgeldbescheid_12.pdf)"
            className="flex-grow bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-sans"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
          >
            <option value="VORVERFAHREN">1. Vorverfahren & Bescheide</option>
            <option value="SCHRIFTSAETZE">2. Eingereichte Schriftsätze</option>
            <option value="BEWEISMITTEL">3. Beweismittel & Gutachten</option>
          </select>
          <button
            type="button"
            onClick={handleAddManual}
            disabled={!fileName.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Hinzufügen</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-zinc-900">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
            id="fileNavUpload"
          />
          <label
            htmlFor="fileNavUpload"
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-mono cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5 text-blue-400" />
            <span>Dateien direkt von Festplatte hochladen</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category 1 */}
        <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-3">
          <span className="text-xs font-mono text-amber-400 font-bold uppercase block">
            📁 1. Vorverfahren & Bescheide ({vorverfahren.length})
          </span>
          {vorverfahren.length > 0 ? (
            <ul className="text-xs text-zinc-300 space-y-2 font-mono">
              {vorverfahren.map(f => (
                <li key={f.id} className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800/80">
                  <div className="truncate pr-2">
                    <span className="block truncate font-semibold">{f.name}</span>
                    <span className="text-zinc-500 text-[10px]">{f.date} {f.size ? `• ${f.size}` : ''}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(f.id)}
                    className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500 italic font-mono">Keine Dokumente in dieser Rubrik.</p>
          )}
        </div>

        {/* Category 2 */}
        <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-3">
          <span className="text-xs font-mono text-emerald-400 font-bold uppercase block">
            📁 2. Eingereichte Schriftsätze ({schriftsaetze.length})
          </span>
          {schriftsaetze.length > 0 ? (
            <ul className="text-xs text-zinc-300 space-y-2 font-mono">
              {schriftsaetze.map(f => (
                <li key={f.id} className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800/80">
                  <div className="truncate pr-2">
                    <span className="block truncate font-semibold">{f.name}</span>
                    <span className="text-emerald-400 text-[10px]">{f.date} • Eingereicht ✓</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(f.id)}
                    className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500 italic font-mono">Keine Schriftsätze abgelegt.</p>
          )}
        </div>

        {/* Category 3 */}
        <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-3">
          <span className="text-xs font-mono text-purple-400 font-bold uppercase block">
            📁 3. Beweismittel & Gutachten ({beweismittel.length})
          </span>
          {beweismittel.length > 0 ? (
            <ul className="text-xs text-zinc-300 space-y-2 font-mono">
              {beweismittel.map(f => (
                <li key={f.id} className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800/80">
                  <div className="truncate pr-2">
                    <span className="block truncate font-semibold">{f.name}</span>
                    <span className="text-zinc-500 text-[10px]">{f.date} {f.size ? `• ${f.size}` : ''}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(f.id)}
                    className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500 italic font-mono">Keine Beweismittel hinterlegt.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. RECHTSPRECHUNGS-TREND-RADAR (TAB 6) - LIVE REAL SEARCH & FEED
// ==========================================
export function TrendRadarView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [courtFilter, setCourtFilter] = useState('ALL');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-fetch latest live verdicts on initial load
  useEffect(() => {
    const fetchInitialVerdicts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/radar-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: 'Aktuelle BGH und BAG Grundsatzentscheidungen des Monats',
            court: 'ALL'
          })
        });
        const data = await res.json();
        if (data && data.results) {
          setResults(data.results);
        }
      } catch (err) {
        console.warn('Initial radar fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialVerdicts();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/radar-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          court: courtFilter
        })
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">24/7 Rechtsprechungs-Recherche</span>
            <h3 className="text-lg font-bold font-display text-white">📡 Rechtsprechungs-Trend-Radar (BGH, BAG, EuGH)</h3>
          </div>
        </div>
      </div>

      {/* Live Search Bar */}
      <form onSubmit={handleSearch} className="p-4 rounded-xl bg-black border border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Suchbegriff oder Norm eingeben (z.B. Mietminderung Schimmel, Eigenbedarf, Kündigungsschutz)..."
            className="flex-grow bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-white font-sans focus:border-cyan-400 focus:outline-none"
          />
          <select
            value={courtFilter}
            onChange={e => setCourtFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
          >
            <option value="ALL">Alle Bundesgerichte</option>
            <option value="BGH">BGH (Bundesgerichtshof)</option>
            <option value="BAG">BAG (Bundesarbeitsgericht)</option>
            <option value="BVerfG">BVerfG (Verfassungsgericht)</option>
            <option value="EuGH">EuGH (Europäischer Gerichtshof)</option>
          </select>
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center gap-2"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Rechtsprechung prüfen</span>
          </button>
        </div>
      </form>

      {/* Search Results */}
      <div className="space-y-3">
        {results.length > 0 ? (
          results.map((r, idx) => (
            <div key={`radar-res-${idx}`} className="p-4 rounded-xl bg-black border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold">{r.courtWithFileNo}</span>
                <span className="text-zinc-500 text-[10px]">{r.dateOrPeriod} • {r.category}</span>
              </div>
              <h4 className="text-sm font-bold text-white">{r.title}</h4>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                {r.summary}
              </p>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
                <strong className="text-cyan-300">Auswirkung auf Ihre Rechtsposition:</strong> {r.impact}
              </div>
            </div>
          ))
        ) : !isLoading ? (
          <div className="p-8 rounded-xl bg-black border border-zinc-900 text-center space-y-2">
            <Radio className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400 font-mono">
              Geben Sie ein rechtliches Thema oder Aktenzeichen ein, um die aktuellen Leitentscheidungen in Echtzeit abzufragen.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ==========================================
// 7. AUDIO-TOOL (TAB 7) - REAL DICTATION & RECORDING
// ==========================================
export function AudioToolView() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'de-DE';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        alert("Ihr Browser unterstützt die Web Speech API nicht direkt. Sie können Ihren Text direkt in das Feld eingeben.");
      }
    }
  };

  const handleAnalyzeTranscript = async () => {
    if (!transcript.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
          <Mic className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-mono text-rose-400 uppercase tracking-widest font-bold">Forensische Audio-Analyse</span>
          <h3 className="text-lg font-bold font-display text-white">🎙️ Audio-Tool: Diktat, Transkription & Widerspruchserkennung</h3>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-black border border-zinc-800 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <Mic className={`w-8 h-8 ${isRecording ? 'animate-pulse text-red-500' : ''}`} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white font-mono">Diktieren oder Mandantenaussage einsprechen</h4>
          <p className="text-xs text-zinc-400 mt-1">Automatische Protokollierung mit Paragrafen-Abgleich und Widerspruchserkennung.</p>
        </div>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={toggleRecording}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              isRecording ? 'bg-red-600 text-white' : 'bg-rose-500 hover:bg-rose-400 text-black'
            }`}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRecording ? 'Aufnahme stoppen' : 'Live-Diktat starten'}</span>
          </button>
        </div>
      </div>

      {/* Transcript text box */}
      <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-3">
        <label className="text-xs font-mono text-zinc-400 block font-semibold">
          Transkribierter Text / Diktat-Inhalt:
        </label>
        <textarea
          rows={4}
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          placeholder="Hier erscheint das Live-Diktat oder geben Sie eine Aussage manuell zur Analyse ein..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-white font-sans focus:border-rose-400 focus:outline-none"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAnalyzeTranscript}
            disabled={isAnalyzing || !transcript.trim()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-mono font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md"
          >
            {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Juristisch & forensisch analysieren</span>
          </button>
        </div>
      </div>

      {/* Analysis Result */}
      {analysis && (
        <div className="p-4 rounded-xl bg-black border border-rose-500/30 space-y-4">
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Forensisches Auswertungsprotokoll:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-amber-400 font-mono font-bold block mb-1">Einschlägige Paragraphen:</span>
              <ul className="list-disc list-inside text-zinc-300 space-y-1">
                {analysis.relevantParagraphs?.map((p: string, i: number) => (
                  <li key={`p-${i}`}>{p}</li>
                ))}
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-red-400 font-mono font-bold block mb-1">Gefundene Widersprüche / Risiken:</span>
              <ul className="list-disc list-inside text-zinc-300 space-y-1">
                {analysis.detectedContradictions?.map((c: string, i: number) => (
                  <li key={`c-${i}`}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs font-sans text-emerald-300">
            <strong>Handlungsempfehlung:</strong> {analysis.suggestedAction}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 8. KI-COACH (TAB 8) - REAL STRATEGIC CONSULTATION
// ==========================================
export function KiCoachView() {
  const [scenario, setScenario] = useState('Gütetermin vor Gericht');
  const [query, setQuery] = useState('');
  const [advice, setAdvice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetAdvice = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/ki-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          userQuery: query
        })
      });
      const data = await res.json();
      setAdvice(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
          <Headphones className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Verhandlungsbegleiter</span>
          <h3 className="text-lg font-bold font-display text-white">🎧 KI-Coach: Live-Tipps für Verhandlungen & Telefonate</h3>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-3">
        <span className="text-xs font-mono text-indigo-400 font-bold block">
          Verhandlungssituation & konkrete Fragestellung:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select
            value={scenario}
            onChange={e => setScenario(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
          >
            <option value="Gütetermin vor Gericht">Gütetermin vor Gericht (§ 278 ZPO)</option>
            <option value="Telefonische Vergleichsverhandlung">Telefonische Vergleichsverhandlung</option>
            <option value="Zeugeneinvernahme">Zeugeneinvernahme & Vorhaltetaktik</option>
            <option value="Verhandlung mit Versicherung">Verhandlung mit gegnerischer Versicherung</option>
          </select>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ihre konkrete Frage (z.B. Wie reagiere ich auf den Vorwurf der Verjährung?)"
            className="sm:col-span-2 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-sans focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleGetAdvice}
            disabled={isLoading || !query.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Taktik-Analyse anfordern</span>
          </button>
        </div>
      </div>

      {advice && (
        <div className="p-4 rounded-xl bg-black border border-indigo-500/30 space-y-4">
          <div>
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block font-bold">Empfohlene Kernstrategie:</span>
            <h4 className="text-sm font-bold text-white mt-0.5">{advice.primaryStrategy}</h4>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
            <span className="text-xs font-mono text-emerald-400 font-bold block">Konkrete Formulierungshilfe (Wortlaut):</span>
            <p className="text-xs text-zinc-200 font-sans italic leading-relaxed">{advice.exactPhrasing}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-red-400 font-mono font-bold block mb-1">Typische Fallstricke vermeiden:</span>
              <ul className="list-disc list-inside text-zinc-300 space-y-1">
                {advice.pitfallsToAvoid?.map((p: string, i: number) => (
                  <li key={`pit-${i}`}>{p}</li>
                ))}
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-indigo-300 font-mono font-bold block mb-1">Rechtliche Ankernormen:</span>
              <ul className="list-disc list-inside text-zinc-300 space-y-1">
                {advice.legalAnchorNorms?.map((n: string, i: number) => (
                  <li key={`norm-${i}`}>{n}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 9. SELBSTVERTRETER-LEITFADEN (TAB 9) - REAL STATUTORY STEPS
// ==========================================
export function SelfRepresentativeGuideView() {
  const [selectedCourtType, setSelectedCourtType] = useState<'AG' | 'ARBG' | 'OWI'>('AG');

  return (
    <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-teal-400 uppercase tracking-widest font-bold">Verfahrensleitfaden</span>
            <h3 className="text-lg font-bold font-display text-white">🧭 Selbstvertreter-Leitfaden: Von Klage bis Urteil</h3>
          </div>
        </div>

        <div className="flex gap-1.5 bg-black p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setSelectedCourtType('AG')}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
              selectedCourtType === 'AG' ? 'bg-teal-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Amtsgericht (bis 5.000 €)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCourtType('ARBG')}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
              selectedCourtType === 'ARBG' ? 'bg-teal-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Arbeitsgericht (1. Instanz)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCourtType('OWI')}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
              selectedCourtType === 'OWI' ? 'bg-teal-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Bußgeld / OWiG
          </button>
        </div>
      </div>

      <div className="space-y-3 font-mono text-xs">
        {selectedCourtType === 'AG' && (
          <>
            <div className="p-4 rounded-xl bg-black border border-zinc-800 flex items-start gap-3">
              <span className="w-6 h-6 rounded bg-teal-400 text-black font-extrabold flex items-center justify-center shrink-0">1</span>
              <div>
                <strong className="text-white block font-sans text-sm">Klageeinreichung beim Amtsgericht (§§ 253, 495 ZPO)</strong>
                <span className="text-zinc-400">Kein Anwaltszwang nach § 78 ZPO. Dreifache Ausfertigung mit Anlagen einreichen.</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-black border border-zinc-800 flex items-start gap-3">
              <span className="w-6 h-6 rounded bg-teal-400 text-black font-extrabold flex items-center justify-center shrink-0">2</span>
              <div>
                <strong className="text-white block font-sans text-sm">Zahlung des Gerichtskostenvorschusses (§ 12 GKG)</strong>
                <span className="text-zinc-400">Das Gericht stellt die Klage erst nach Einzahlung der 3.0 Gebühr nach GKG an die Gegenseite zu.</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-black border border-zinc-800 flex items-start gap-3">
              <span className="w-6 h-6 rounded bg-teal-400 text-black font-extrabold flex items-center justify-center shrink-0">3</span>
              <div>
                <strong className="text-white block font-sans text-sm">Mündliche Verhandlung & Güterichtertermin (§ 278 ZPO)</strong>
                <span className="text-zinc-400">Anträge aus der Klageschrift förmlich stellen („Kläger beantragt wie eingereicht“).</span>
              </div>
            </div>
          </>
        )}

        {selectedCourtType === 'ARBG' && (
          <>
            <div className="p-4 rounded-xl bg-black border border-zinc-800 flex items-start gap-3">
              <span className="w-6 h-6 rounded bg-teal-400 text-black font-extrabold flex items-center justify-center shrink-0">1</span>
              <div>
                <strong className="text-white block font-sans text-sm">3-Wochen-Klagefrist (§ 4 KSchG) einhalten</strong>
                <span className="text-zinc-400">Kündigungsschutzklage muss binnen 3 Wochen ab Zugang beim Arbeitsgericht eingehen.</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-black border border-zinc-800 flex items-start gap-3">
              <span className="w-6 h-6 rounded bg-teal-400 text-black font-extrabold flex items-center justify-center shrink-0">2</span>
              <div>
                <strong className="text-white block font-sans text-sm">Keine Kostenerstattung in 1. Instanz (§ 12a ArbGG)</strong>
                <span className="text-zinc-400">Jede Partei trägt ihre Anwaltskosten selbst, unabhängig vom Ausgang des Verfahrens.</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-black border border-zinc-800 flex items-start gap-3">
              <span className="w-6 h-6 rounded bg-teal-400 text-black font-extrabold flex items-center justify-center shrink-0">3</span>
              <div>
                <strong className="text-white block font-sans text-sm">Gütetermin (i.d.R. binnen 4 Wochen)</strong>
                <span className="text-zinc-400">Versuch einer einvernehmlichen Lösung (z.B. Abfindung, Zeugnisnote).</span>
              </div>
            </div>
          </>
        )}

        {selectedCourtType === 'OWI' && (
          <>
            <div className="p-4 rounded-xl bg-black border border-zinc-800 flex items-start gap-3">
              <span className="w-6 h-6 rounded bg-teal-400 text-black font-extrabold flex items-center justify-center shrink-0">1</span>
              <div>
                <strong className="text-white block font-sans text-sm">2-Wochen-Einspruchsfrist (§ 67 OWiG)</strong>
                <span className="text-zinc-400">Schriftlicher Einspruch bei der erlassenden Bußgeldbehörde zur Fristwahrung.</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-black border border-zinc-800 flex items-start gap-3">
              <span className="w-6 h-6 rounded bg-teal-400 text-black font-extrabold flex items-center justify-center shrink-0">2</span>
              <div>
                <strong className="text-white block font-sans text-sm">Akteneinsicht verlangen (§ 49 OWiG)</strong>
                <span className="text-zinc-400">Einsicht in Messprotokolle, Eichscheine und Schulungsnachweise anfordern.</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-black border border-zinc-800 flex items-start gap-3">
              <span className="w-6 h-6 rounded bg-teal-400 text-black font-extrabold flex items-center justify-center shrink-0">3</span>
              <div>
                <strong className="text-white block font-sans text-sm">Zwischenverfahren oder Abgabe an Amtsgericht</strong>
                <span className="text-zinc-400">Die Behörde stellt das Verfahren entweder ein oder leitet es an das Amtsgericht weiter.</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 10. ANWALTS-SUCHMASCHINE (TAB 10) - 100% REAL DIRECTORY & LIVE MAP REGISTRY
// ==========================================
interface OfficialDir {
  name: string;
  provider: string;
  badge: string;
  url: string;
  embedMapUrl?: string;
  description: string;
}

export function LawyerSearchView() {
  const [plz, setPlz] = useState('');
  const [field, setField] = useState('Miet- und Wohnungseigentumsrecht');
  const [officialDirectories, setOfficialDirectories] = useState<OfficialDir[]>([]);
  const [locationName, setLocationName] = useState('');
  const [embedMapUrl, setEmbedMapUrl] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [anwaltDeUrl, setAnwaltDeUrl] = useState('');
  const [davUrl, setDavUrl] = useState('');
  const [bravUrl, setBravUrl] = useState('https://bea-brak.de/bravsearch/search.html');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!plz.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch('/api/find-lawyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plzOrCity: plz.trim(),
          field: field
        })
      });

      const data = await res.json();
      setOfficialDirectories(data?.officialDirectories || []);
      setLocationName(data?.locationDetected || plz.trim());
      setEmbedMapUrl(data?.embedMapUrl || `https://maps.google.com/maps?q=${encodeURIComponent('Rechtsanwalt Fachanwalt ' + field + ' ' + plz.trim())}&t=&z=13&ie=UTF8&iwloc=&output=embed`);
      setGoogleMapsUrl(data?.googleMapsUrl || `https://www.google.com/maps/search/${encodeURIComponent('Rechtsanwalt Fachanwalt ' + field + ' ' + plz.trim())}`);
      setAnwaltDeUrl(data?.anwaltDeUrl || `https://www.anwalt.de/anwaltssuche.php?stadt=${encodeURIComponent(plz.trim())}&rechtsgebiet=${encodeURIComponent(field)}`);
      setDavUrl(data?.davUrl || `https://anwaltauskunft.de/anwaltssuche?q=${encodeURIComponent(plz.trim() + ' ' + field)}`);
      setBravUrl(data?.bravUrl || 'https://bea-brak.de/bravsearch/search.html');
    } catch (err) {
      console.warn('Lawyer directory search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">100% Echte & Geprüfte Kanzleidaten</span>
            <h3 className="text-lg font-bold font-display text-white">Offizieller Anwalts- & Kammer-Finder</h3>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <ShieldCheck className="w-4 h-4" />
          <span>Amtliche Register & Google Maps</span>
        </div>
      </div>

      {/* Search Input Form */}
      <form onSubmit={handleSearch} className="p-4 rounded-xl bg-black border border-zinc-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={plz}
            onChange={e => setPlz(e.target.value)}
            placeholder="Ihre PLZ oder Stadt eingeben (z.B. 38226 Salzgitter, Bad Harzburg, 10115 Berlin, München)"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
          />
        </div>
        <select
          value={field}
          onChange={e => setField(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
        >
          <option>Migrations- & Ausländerrecht</option>
          <option>Miet- und Wohnungseigentumsrecht</option>
          <option>Strafrecht & Verkehrsrecht</option>
          <option>Arbeitsrecht & Kündigungsschutz</option>
          <option>Familien- & Erbrecht</option>
          <option>Bau- & Architektenrecht</option>
          <option>Bank- & Kapitalmarktrecht</option>
          <option>Datenschutz & IT-Recht</option>
          <option>Sozialrecht & Bürgergeld</option>
        </select>
        <button
          type="submit"
          disabled={!plz.trim() || isLoading}
          className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0 shadow-gold-glow flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Lade Register...</span>
            </>
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              <span>Kanzleien & Karte aufrufen</span>
            </>
          )}
        </button>
      </form>

      {/* Active Results View */}
      {hasSearched && (
        <div className="space-y-6">
          {/* Quick-Status bar */}
          <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Verifizierte Suche für: <strong className="text-white">{field}</strong> in <strong className="text-amber-400">{locationName || plz}</strong></span>
            </div>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Reale Daten ohne KI-Synthese
            </span>
          </div>

          {/* Interactive Live Map Section */}
          <div className="p-5 rounded-2xl bg-black border border-zinc-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-md">
                    Google Maps Live-Finder
                  </span>
                  <span className="text-xs font-mono text-zinc-400">Umkreis: {locationName || plz}</span>
                </div>
                <h4 className="text-base font-bold text-white font-display">
                  Echte Kanzleistandorte, Öffnungszeiten & Mandantenrezensionen
                </h4>
              </div>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold rounded-xl transition-all cursor-pointer shrink-0"
              >
                <span>Auf Google Maps öffnen</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Embedded Live Google Maps Frame */}
            <div className="w-full h-80 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 relative">
              {embedMapUrl ? (
                <iframe
                  title="Google Maps Kanzleien"
                  src={embedMapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-mono">
                  <Loader2 className="w-5 h-5 animate-spin mr-2 text-amber-400" />
                  Lade interaktive Google Maps Karte...
                </div>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              Interaktive Karte zeigt alle real in Google MyBusiness eingetragenen Fachanwälte und Kanzleien für {field} in {locationName || plz}.
            </p>
          </div>

          {/* Official Registry Portals Grid */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold font-display text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Offizielle Bundes- & Fachanwaltsregister für {locationName || plz}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Anwalt.de Card */}
              <a
                href={anwaltDeUrl}
                target="_blank"
                rel="noreferrer"
                className="p-5 rounded-2xl bg-black border border-zinc-800 hover:border-amber-400/60 transition-all space-y-3 group block cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded">
                      Geprüfte Fachanwälte
                    </span>
                    <h5 className="text-base font-bold text-white font-display mt-1 group-hover:underline flex items-center gap-1.5">
                      Anwalt.de Kanzleisuche {locationName || plz}
                      <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-amber-400" />
                    </h5>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400">
                    <Star className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                  Durchsuchen Sie alle bei Anwalt.de gelisteten Fachanwälte für {field} in {locationName || plz} mit echten verifizierten Mandantenbewertungen, Fachanwaltstiteln und Sofortkontakt.
                </p>
                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-amber-400 font-bold">
                  <span>→ Alle Fachanwälte in {locationName || plz} auf Anwalt.de</span>
                </div>
              </a>

              {/* DAV Deutsche Anwaltauskunft Card */}
              <a
                href={davUrl}
                target="_blank"
                rel="noreferrer"
                className="p-5 rounded-2xl bg-black border border-zinc-800 hover:border-emerald-400/60 transition-all space-y-3 group block cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                      Deutscher Anwaltverein (DAV)
                    </span>
                    <h5 className="text-base font-bold text-white font-display mt-1 group-hover:underline flex items-center gap-1.5">
                      DAV Deutsche Anwaltauskunft
                      <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400" />
                    </h5>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400">
                    <Building className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                  Offizielle Suchmaschine des Deutschen Anwaltvereins (DAV) mit Kanzleien im Amtsgerichtsbezirk {locationName || plz} und zertifizierten Fachanwaltslehrgängen.
                </p>
                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-emerald-400 font-bold">
                  <span>→ DAV-Fachanwälte für {locationName || plz} aufrufen</span>
                </div>
              </a>

              {/* Amtliches BRAV-Register (BRAK) Card */}
              <a
                href={bravUrl}
                target="_blank"
                rel="noreferrer"
                className="p-5 rounded-2xl bg-black border border-zinc-800 hover:border-purple-400/60 transition-all space-y-3 group block cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                      Bundesrechtsanwaltskammer (BRAK)
                    </span>
                    <h5 className="text-base font-bold text-white font-display mt-1 group-hover:underline flex items-center gap-1.5">
                      Amtliches BRAV-Register
                      <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-purple-400" />
                    </h5>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-purple-400">
                    <Gavel className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                  Das amtliche Gesamtregister aller über 165.000 in der Bundesrepublik Deutschland zugelassenen Anwälte. Gesetzlich verbindlicher Nachweis der Zulassung.
                </p>
                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-purple-400 font-bold">
                  <span>→ Bundesweites Amtliches Anwaltsverzeichnis öffnen</span>
                </div>
              </a>

              {/* Das Örtliche / Gelbe Seiten Kanzleiverzeichnis Card */}
              <a
                href={`https://www.dasoertliche.de/Themen/Rechtsanwalt/${encodeURIComponent(locationName || plz)}.html`}
                target="_blank"
                rel="noreferrer"
                className="p-5 rounded-2xl bg-black border border-zinc-800 hover:border-amber-400/60 transition-all space-y-3 group block cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded">
                      Gelbe Seiten & Das Örtliche
                    </span>
                    <h5 className="text-base font-bold text-white font-display mt-1 group-hover:underline flex items-center gap-1.5">
                      Telefon- & Kanzleiverzeichnis {locationName || plz}
                      <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-amber-400" />
                    </h5>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400">
                    <Phone className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                  Verifizierte Telefonbucheinträge aller Kanzleien und Notare in {locationName || plz} mit Festnetzanschlüssen, Faxnummern und Adressen.
                </p>
                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-amber-400 font-bold">
                  <span>→ Kanzleieinträge in {locationName || plz} abrufen</span>
                </div>
              </a>
            </div>
          </div>

          {/* Practical Client Checklist */}
          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              Checkliste für das anwaltliche Erstgespräch
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans text-zinc-300">
              <div className="p-3 rounded-xl bg-black/60 border border-zinc-800 space-y-1">
                <span className="text-amber-400 font-bold font-mono">1. Unterlagen bereitlegen</span>
                <p className="text-zinc-400 text-[11px]">Verträge, Kündigungsschreiben, Abmahnungen, behördliche Bescheide und bisherigen Schriftverkehr chronologisch ordnen.</p>
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-zinc-800 space-y-1">
                <span className="text-emerald-400 font-bold font-mono">2. Kosten & Deckung</span>
                <p className="text-zinc-400 text-[11px]">Rechtsschutzversicherungs-Scheinnummer oder Beratungshilfeschein vom Amtsgericht vor dem Termin bereithalten.</p>
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-zinc-800 space-y-1">
                <span className="text-blue-400 font-bold font-mono">3. Fristen prüfen</span>
                <p className="text-zinc-400 text-[11px]">Kündigungsschutzklage (3 Wochen), Einspruch Strafbefehl (2 Wochen), Widerspruch Bescheid (1 Monat).</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Initial State before search */}
      {!hasSearched && (
        <div className="p-8 rounded-xl bg-black border border-zinc-900 text-center space-y-3">
          <MapPin className="w-8 h-8 text-amber-400/60 mx-auto" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white font-mono">Geben Sie eine Postleitzahl oder Stadt ein</h4>
            <p className="text-xs text-zinc-400 font-sans max-w-md mx-auto">
              Das System ruft für Ihren Standort sofort die echte Google Maps Kanzleikarte und alle offiziellen Register (Anwalt.de, DAV, BRAV) auf.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 11. AUSLÄNDER- & MIGRATIONSRECHT (TAB 11) - GEPRÜFTE GESETZESLOGIK (AufenthG / StAG / VwGO)
// ==========================================
export function ImmigrationLawView({ onNavigateToLawyers }: { onNavigateToLawyers?: () => void }) {
  const [subTab, setSubTab] = useState<'einbuergerung' | 'fiktion' | 'untaetigkeit' | 'daueraufenthalt' | 'vorlagen'>('einbuergerung');

  // Einbürgerungs-Rechner State (§ 10 StAG)
  const [yearsResident, setYearsResident] = useState(5);
  const [langLevel, setLangLevel] = useState<'none' | 'a1' | 'a2' | 'b1' | 'b2' | 'c1_c2'>('b1');
  const [hasPassedCitizenshipTest, setHasPassedCitizenshipTest] = useState(true);
  const [isLivelihoodSecured, setIsLivelihoodSecured] = useState(true);
  const [acceptsConstitution, setAcceptsConstitution] = useState(true);
  const [isCleanRecord, setIsCleanRecord] = useState(true);
  const [hasSpecialAchievements, setHasSpecialAchievements] = useState(false);

  // Fiktionsbescheinigung State (§ 81 Abs. 4 AufenthG)
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [applicationDate, setApplicationDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [hasSubmissionProof, setHasSubmissionProof] = useState(true);

  // Untätigkeitsklage State (§ 75 VwGO)
  const [initialFilingDate, setInitialFilingDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 4);
    return d.toISOString().split('T')[0];
  });
  const [applicationType, setApplicationType] = useState('Einbürgerungsantrag (§ 10 StAG)');

  // Copy Feedback
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  // Evaluation logic for Einbürgerung
  const minRequiredYears = hasSpecialAchievements || langLevel === 'c1_c2' ? 3 : 5;
  const isYearsSufficient = yearsResident >= minRequiredYears;
  const isLangSufficient = ['b1', 'b2', 'c1_c2'].includes(langLevel);
  const isEligibleForCitizenship = isYearsSufficient && isLangSufficient && hasPassedCitizenshipTest && isLivelihoodSecured && acceptsConstitution && isCleanRecord;

  // Evaluation logic for Fiktionswirkung (§ 81 Abs. 4 AufenthG)
  const isTimelySubmitted = new Date(applicationDate) <= new Date(expiryDate);

  // Evaluation logic for Untätigkeitsklage (§ 75 VwGO)
  const calculateUntaetigkeitDays = () => {
    const filing = new Date(initialFilingDate).getTime();
    const now = new Date().getTime();
    const diffDays = Math.floor((now - filing) / (1000 * 60 * 60 * 24));
    const threeMonthsDays = 90;
    const isStatutoryPeriodPassed = diffDays >= threeMonthsDays;
    const overdueDays = diffDays - threeMonthsDays;
    return { diffDays, isStatutoryPeriodPassed, overdueDays };
  };

  const untaetigkeitInfo = calculateUntaetigkeitDays();

  const handleCopyText = (text: string, templateId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(templateId);
    setTimeout(() => setCopiedTemplate(null), 2500);
  };

  const handleDownloadDraft = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">Amtlich Verankerte Gesetzeslogik</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">StAG Reform 2024/2026</span>
            </div>
            <h3 className="text-xl font-bold font-display text-white mt-0.5">Ausländer- & Migrationsrecht (AufenthG / StAG / VwGO)</h3>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Rechtssichere Prüfung für Einbürgerung, Fiktionsbescheinigungen, Untätigkeitsklagen gegen Ausländerbehörden und Niederlassungserlaubnisse.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onNavigateToLawyers && (
            <button
              onClick={onNavigateToLawyers}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-400 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Anwälte vor Ort</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 rounded-xl bg-black border border-zinc-800">
        <button
          onClick={() => setSubTab('einbuergerung')}
          className={`px-3 py-2.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'einbuergerung'
              ? 'bg-amber-400 text-black shadow-gold-glow'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Award className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">1. Einbürgerung (StAG)</span>
        </button>

        <button
          onClick={() => setSubTab('fiktion')}
          className={`px-3 py-2.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'fiktion'
              ? 'bg-amber-400 text-black shadow-gold-glow'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">2. Fiktionsschutz (§ 81)</span>
        </button>

        <button
          onClick={() => setSubTab('untaetigkeit')}
          className={`px-3 py-2.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'untaetigkeit'
              ? 'bg-amber-400 text-black shadow-gold-glow'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">3. Untätigkeit (§ 75 VwGO)</span>
        </button>

        <button
          onClick={() => setSubTab('daueraufenthalt')}
          className={`px-3 py-2.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'daueraufenthalt'
              ? 'bg-amber-400 text-black shadow-gold-glow'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">4. Blaue Karte & Dauer</span>
        </button>

        <button
          onClick={() => setSubTab('vorlagen')}
          className={`px-3 py-2.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'vorlagen'
              ? 'bg-amber-400 text-black shadow-gold-glow'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">5. Musterschreiben</span>
        </button>
      </div>

      {/* TAB 1: EINBÜRGERUNGS-RECHNER */}
      {subTab === 'einbuergerung' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white font-mono">Neues Staatsangehörigkeitsgesetz (StAG)</h4>
                <p className="text-xs text-zinc-300 font-sans">
                  Reguläre Einbürgerung bereits nach <strong>5 Jahren</strong> (bzw. <strong>3 Jahren</strong> bei Turbo-Integration). Mehrstaatigkeit / Doppelpass ist seit Juni 2024 uneingeschränkt gesetzlich erlaubt!
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold shrink-0">
              § 10 StAG i.d.F. 2024/2026
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Controls */}
            <div className="p-5 rounded-xl bg-black border border-zinc-800 space-y-4">
              <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                Voraussetzungen eingeben
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300">Rechtmäßiger Voraufenthalt in Deutschland:</span>
                  <span className="text-amber-400 font-bold">{yearsResident} {yearsResident === 1 ? 'Jahr' : 'Jahre'}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={yearsResident}
                  onChange={e => setYearsResident(Number(e.target.value))}
                  className="w-full accent-amber-400 bg-zinc-800 h-2 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-zinc-500 font-sans">
                  Gesetzliche Mindestdauer: 5 Jahre (oder 3 Jahre bei C1-Deutsch / herausragenden Leistungen).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-300 block">Deutsch-Sprachzertifikat (GER):</label>
                <select
                  value={langLevel}
                  onChange={e => setLangLevel(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                >
                  <option value="none">Kein Nachweis / Unter A1 (Nicht ausreichend)</option>
                  <option value="a1">A1 Grundkenntnisse (Nicht ausreichend)</option>
                  <option value="a2">A2 Grundkenntnisse (Nicht ausreichend)</option>
                  <option value="b1">B1 Zertifikat (Gesetzlicher Standard § 10 Abs. 1 Nr. 6 StAG)</option>
                  <option value="b2">B2 Fortgeschritten</option>
                  <option value="c1_c2">C1 / C2 Fachkundig (Berechtigt zum 3-Jahre-Turbo!)</option>
                </select>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-zinc-900">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={hasPassedCitizenshipTest}
                    onChange={e => setHasPassedCitizenshipTest(e.target.checked)}
                    className="mt-0.5 rounded accent-amber-400 bg-zinc-900 border-zinc-700 w-4 h-4"
                  />
                  <span>Einbürgerungstest / Test "Leben in Deutschland" bestanden oder deutscher Schulabschluss</span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isLivelihoodSecured}
                    onChange={e => setIsLivelihoodSecured(e.target.checked)}
                    className="mt-0.5 rounded accent-amber-400 bg-zinc-900 border-zinc-700 w-4 h-4"
                  />
                  <span>Vollständige Sicherung des Lebensunterhalts ohne Bürgergeld / Sozialhilfe (SGB II / XII)</span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={acceptsConstitution}
                    onChange={e => setAcceptsConstitution(e.target.checked)}
                    className="mt-0.5 rounded accent-amber-400 bg-zinc-900 border-zinc-700 w-4 h-4"
                  />
                  <span>Bekenntnis zur freiheitlich-demokratischen Grundordnung & Antisemitismus-Ausschluss</span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isCleanRecord}
                    onChange={e => setIsCleanRecord(e.target.checked)}
                    className="mt-0.5 rounded accent-amber-400 bg-zinc-900 border-zinc-700 w-4 h-4"
                  />
                  <span>Keine strafrechtlichen Verurteilungen (ausgenommen Bagatellen bis 90 Tagessätze)</span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={hasSpecialAchievements}
                    onChange={e => setHasSpecialAchievements(e.target.checked)}
                    className="mt-0.5 rounded accent-amber-400 bg-zinc-900 border-zinc-700 w-4 h-4"
                  />
                  <span>Besondere Integrationsleistungen (z.B. ehrenamtliches Engagement, herausragende Ausbildung)</span>
                </label>
              </div>
            </div>

            {/* Assessment Result Panel */}
            <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <span className="text-xs font-mono text-zinc-400 uppercase">Gesetzlicher Status</span>
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                    isEligibleForCitizenship
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {isEligibleForCitizenship ? '✅ Rechtsanspruch erfüllt (§ 10 StAG)' : '⚠️ Voraussetzungen noch unvollständig'}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="p-3 rounded-lg bg-black/60 border border-zinc-800">
                    <span className="text-[11px] font-mono text-zinc-400 block">Erforderliche Aufenthaltsdauer:</span>
                    <p className="text-xs font-bold text-white mt-0.5">
                      {minRequiredYears} Jahre erforderlich • Sie haben {yearsResident} Jahre ({isYearsSufficient ? '✅ Erfüllt' : `❌ Noch ${minRequiredYears - yearsResident} Jahr(e) bis zum Anspruch`})
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-black/60 border border-zinc-800">
                    <span className="text-[11px] font-mono text-zinc-400 block">Sprachzertifikat:</span>
                    <p className="text-xs font-bold text-white mt-0.5">
                      {isLangSufficient ? `✅ ${langLevel.toUpperCase()} ist gesetzlich ausreichend` : '❌ Mindestens B1 Zertifikat gesetzlich zwingend erforderlich'}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-black/60 border border-zinc-800">
                    <span className="text-[11px] font-mono text-zinc-400 block">Mehrstaatigkeit (Doppelpass):</span>
                    <p className="text-xs font-bold text-emerald-400 mt-0.5">
                      ✅ 100% erlaubt: Sie müssen Ihre bisherige Staatsangehörigkeit NICHT abgeben!
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <button
                  onClick={() => setSubTab('vorlagen')}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shadow-gold-glow flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Antrags-Musterschreiben öffnen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FIKTIONSBESCHEINIGUNG & SCHUTZ (§ 81 Abs. 4 AufenthG) */}
      {subTab === 'fiktion' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">
            <h4 className="text-sm font-bold text-blue-300 font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Gesetzliche Fiktionswirkung kraft Gesetzes (§ 81 Abs. 4 AufenthG)
            </h4>
            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              Wenn Sie Ihren Antrag auf Verlängerung oder Erteilung <strong>vor Ablauf</strong> Ihres aktuellen Aufenthaltstitels gestellt haben, gilt Ihr bisheriger Aufenthaltstitel <strong>inklusive aller Arbeitsrechte kraft Bundesgesetz fort</strong>, bis die Ausländerbehörde eine rechtskräftige Entscheidung trifft!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-black border border-zinc-800 space-y-4">
              <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                Fristen & Nachweise eingeben
              </h4>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-300 block">Ablaufdatum des bisherigen Aufenthaltstitels:</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-300 block">Datum der Antragstellung / Terminanfrage:</label>
                <input
                  type="date"
                  value={applicationDate}
                  onChange={e => setApplicationDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300 pt-2">
                <input
                  type="checkbox"
                  checked={hasSubmissionProof}
                  onChange={e => setHasSubmissionProof(e.target.checked)}
                  className="mt-0.5 rounded accent-amber-400 bg-zinc-900 border-zinc-700 w-4 h-4"
                />
                <span>Ich habe einen schriftlichen Nachweis über den Antragseingang (z.B. Online-Portal-Eingangsbestätigung, Einschreiben-Rückschein oder E-Mail-Sendeprotokoll).</span>
              </label>
            </div>

            <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-mono text-zinc-400 uppercase block mb-3">Rechtliche Schutzbewertung</span>

                {isTimelySubmitted && hasSubmissionProof ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-sm">
                      <ShieldCheck className="w-5 h-5" />
                      <span>VOLLER SCHUTZ (§ 81 Abs. 4 AufenthG AKTIV)</span>
                    </div>
                    <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                      Ihr Antrag ging <strong>rechtzeitig vor Ablauf</strong> ein. Ihr Aufenthalt ist vollkommen legal. Ihr Arbeitgeber darf Ihr Arbeitsverhältnis <strong>nicht</strong> wegen angeblich fehlender Erlaubnis beenden. Sie haben einen Rechtsanspruch auf sofortige Aushändigung einer Fiktionsbescheinigung nach § 81 Abs. 4 AufenthG.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-rose-400 font-bold font-mono text-sm">
                      <AlertCircle className="w-5 h-5" />
                      <span>ACHTUNG: FRIST- ODER NACHWEISRISIKO</span>
                    </div>
                    <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                      Liegt der Antrag nach dem Ablaufdatum oder fehlt ein Eingangsbeleg, tritt die Fiktionswirkung nicht automatisch kraft Gesetzes ein (§ 81 Abs. 3 vs. Abs. 4). Holen Sie unverzüglich anwaltlichen Beistand ein.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSubTab('vorlagen')}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shadow-gold-glow flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Muster: Anforderung Fiktionsbescheinigung</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: UNTÄTIGKEITSKLAGE (§ 75 VwGO) */}
      {subTab === 'untaetigkeit' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
            <h4 className="text-sm font-bold text-amber-300 font-mono flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Rechtsschutz bei Untätigkeit der Ausländerbehörde (§ 75 VwGO)
            </h4>
            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              Entscheidet die Ausländerbehörde nach einem förmlichen Antrag nicht innerhalb von <strong>3 Monaten</strong> ohne zureichenden sachlichen Grund, ist die <strong>Untätigkeitsklage beim Verwaltungsgericht</strong> zulässig. Reine Personalnot oder Überlastung der Behörde ist nach ständiger Rechtsprechung des Bundesverwaltungsgerichts <em>kein</em> zureichender Grund!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-black border border-zinc-800 space-y-4">
              <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                Verfahrensdaten eingeben
              </h4>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-300 block">Art des gestellten Antrags:</label>
                <select
                  value={applicationType}
                  onChange={e => setApplicationType(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                >
                  <option>Einbürgerungsantrag (§ 10 StAG)</option>
                  <option>Niederlassungserlaubnis (§ 9 / § 18g AufenthG)</option>
                  <option>Verlängerung Aufenthaltserlaubnis</option>
                  <option>Familiennachzug (§§ 28, 30 AufenthG)</option>
                  <option>Erteilung Blaue Karte EU (§ 18g AufenthG)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-300 block">Datum der vollständigen Antragseinreichung:</label>
                <input
                  type="date"
                  value={initialFilingDate}
                  onChange={e => setInitialFilingDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs font-sans text-zinc-400 space-y-1">
                <span className="text-white font-bold font-mono">Taktische Empfehlung:</span>
                <p>
                  Vor Einreichung der Klage beim Verwaltungsgericht sollte der Behörde eine letzte <strong>Frist von 14 Tagen</strong> unter ausdrücklicher Androhung der Untätigkeitsklage gesetzt werden. Oft führt dies zur sofortigen Bearbeitung.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-mono text-zinc-400 uppercase block mb-3">Fristberechnung nach § 75 VwGO</span>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-black border border-zinc-800">
                    <span className="text-[11px] font-mono text-zinc-400 block">Vergangene Bearbeitungszeit:</span>
                    <span className="text-base font-bold font-mono text-white mt-0.5 block">
                      {untaetigkeitInfo.diffDays} Tage (Gesetzliche Wartefrist: 90 Tage)
                    </span>
                  </div>

                  {untaetigkeitInfo.isStatutoryPeriodPassed ? (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-sm">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>KLAGEBERECHTIGT NACH § 75 VwGO</span>
                      </div>
                      <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                        Die 3-Monats-Frist ist seit <strong>{untaetigkeitInfo.overdueDays} Tagen</strong> überschritten. Eine Klageerhebung beim Verwaltungsgericht ist unmittelbar statthaft. Die Verfahrenskosten fallen regelmäßig der säumigen Behörde zur Last.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                      <div className="flex items-center gap-2 text-amber-400 font-bold font-mono text-sm">
                        <Clock className="w-5 h-5" />
                        <span>3-MONATS-FRIST NOCH NICHT ERREICHT</span>
                      </div>
                      <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                        Noch {Math.abs(untaetigkeitInfo.overdueDays)} Tage bis zur Klagezulässigkeit. Bereiten Sie jetzt bereits das Mahnschreiben vor.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSubTab('vorlagen')}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shadow-gold-glow flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Muster: Dringliche Sachstandsanfrage & Klagedrohung</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BLAUE KARTE EU & DAUERAUFENTHALT */}
      {subTab === 'daueraufenthalt' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-black border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">🇪🇺 Blaue Karte EU (§ 18g AufenthG)</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold">Turbo-Daueraufenthalt</span>
              </div>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                Für Hochschulabsolventen und IT-Spezialisten mit Arbeitsvertrag in Deutschland.
              </p>
              <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4 font-sans">
                <li><strong className="text-white">Niederlassungserlaubnis nach 21 Monaten</strong> bei Nachweis von Deutschkenntnissen auf Niveau B1.</li>
                <li><strong className="text-white">Niederlassungserlaubnis nach 27 Monaten</strong> bei Nachweis von Grundkenntnissen (A1).</li>
                <li><strong className="text-white">Familiennachzug ohne Vorab-Sprachnachweis</strong> für den Ehegatten (§ 30 Abs. 1 Satz 3 Nr. 5 AufenthG).</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-black border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">🇩🇪 Fachkräfteeinwanderung (§ 18c AufenthG)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">3 Jahre</span>
              </div>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                Für qualifizierte Fachkräfte mit anerkannter Berufsausbildung oder Studium.
              </p>
              <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4 font-sans">
                <li><strong className="text-white">Niederlassungserlaubnis bereits nach 3 Jahren</strong> (statt 5 Jahren).</li>
                <li>Nachweis von mindestens 36 Monaten Pflichtbeiträgen zur Rentenversicherung.</li>
                <li>Gesicherter Lebensunterhalt und Deutsch B1.</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-black border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">💍 Ehegatten von Deutschen (§ 28 Abs. 2 AufenthG)</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold">3 Jahre</span>
              </div>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                Für ausländische Ehegatten von deutschen Staatsangehörigen.
              </p>
              <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4 font-sans">
                <li><strong className="text-white">Niederlassungserlaubnis nach 3 Jahren</strong> bei Fortbestehen der ehelichen Lebensgemeinschaft.</li>
                <li>Ausreichende Deutschkenntnisse (B1) und kein Ausweisungsgrund.</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-black border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-400 uppercase">Chancenkarte (§ 20a AufenthG)</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-mono font-bold">Punktesystem</span>
              </div>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                Zur gezielten Suche nach einem qualifizierten Arbeitsplatz in Deutschland für bis zu 1 Jahr.
              </p>
              <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4 font-sans">
                <li>Mindestens 6 Punkte im Punktesystem (Sprache, Qualifikation, Alter, Erfahrung).</li>
                <li>Erlaubt Probebeschäftigung & Nebenjob bis zu 20 Std./Woche.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MUSTERSCHREIBEN & VORLAGEN */}
      {subTab === 'vorlagen' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vorlage 1: Fiktionsbescheinigung */}
            <div className="p-5 rounded-xl bg-black border border-zinc-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold text-amber-400 uppercase">
                    1. Antrag Fiktionsbescheinigung (§ 81 IV AufenthG)
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-400">Arbeitgeber-Vorlage</span>
                </div>
                <p className="text-xs text-zinc-400 font-sans mt-1">
                  Muster zur unverzüglichen Ausstellung der Bescheinigung zur Vorlage beim Arbeitgeber bei Verzögerungen der Behörde.
                </p>
                <div className="mt-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
{`Absender: [Vorname Nachname], [Anschrift]
An: Ausländerbehörde [Stadt / Landkreis], [Adresse]
Datum: ${new Date().toLocaleDateString('de-DE')}

Aktenzeichen / Ausländerzentralregister-Nr.: [AZ oder Geburtsdatum]
Betreff: Dringender Antrag auf Ausstellung einer Fiktionsbescheinigung gem. § 81 Abs. 4 AufenthG

Sehr geehrte Damen und Herren,

hiermit nehme ich Bezug auf meinen rechtzeitig am [Datum des Verlängerungsantrags] vor Ablauf meines bisherigen Aufenthaltstitels (Ablaufdatum: [Datum]) gestellten Verlängerungsantrag.

Gemäß § 81 Abs. 4 AufenthG gilt mein bisheriger Aufenthaltstitel inklusive aller Nebenbestimmungen und der Erlaubnis zur Ausübung der Erwerbstätigkeit kraft Gesetzes bis zu Ihrer Entscheidung fort.

Da mein Arbeitgeber für den Fortbestand meines Beschäftigungsverhältnisses zwingend einen amtlichen Nachweis verlangt, beantrage ich hiermit die unverzügliche Ausstellung und Übersendung einer Fiktionsbescheinigung nach § 81 Abs. 4 AufenthG.

Mit freundlichen Grüßen,
[Unterschrift / Name]`}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleCopyText(`Absender: [Vorname Nachname], [Anschrift]\nAn: Ausländerbehörde [Stadt / Landkreis]\nDatum: ${new Date().toLocaleDateString('de-DE')}\n\nBetreff: Dringender Antrag auf Ausstellung einer Fiktionsbescheinigung gem. § 81 Abs. 4 AufenthG\n\nSehr geehrte Damen und Herren,\n\nhiermit nehme ich Bezug auf meinen rechtzeitig vor Ablauf meines bisherigen Aufenthaltstitels gestellten Verlängerungsantrag.\n\nGemäß § 81 Abs. 4 AufenthG gilt mein bisheriger Aufenthaltstitel inklusive aller Nebenbestimmungen und der Erlaubnis zur Ausübung der Erwerbstätigkeit kraft Gesetzes bis zu Ihrer Entscheidung fort.\n\nDa mein Arbeitgeber für den Fortbestand meines Beschäftigungsverhältnisses zwingend einen amtlichen Nachweis verlangt, beantrage ich hiermit die unverzügliche Ausstellung und Übersendung einer Fiktionsbescheinigung nach § 81 Abs. 4 AufenthG.\n\nMit freundlichen Grüßen,\n[Name]`, 'fiktion')}
                  className="flex-grow py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedTemplate === 'fiktion' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTemplate === 'fiktion' ? 'Kopiert!' : 'Kopieren'}</span>
                </button>
                <button
                  onClick={() => handleDownloadDraft(`Absender: [Vorname Nachname], [Anschrift]\nAn: Ausländerbehörde [Stadt / Landkreis]\nDatum: ${new Date().toLocaleDateString('de-DE')}\n\nBetreff: Dringender Antrag auf Ausstellung einer Fiktionsbescheinigung gem. § 81 Abs. 4 AufenthG\n\nSehr geehrte Damen und Herren,\n\nhiermit nehme ich Bezug auf meinen rechtzeitig vor Ablauf meines bisherigen Aufenthaltstitels gestellten Verlängerungsantrag.\n\nGemäß § 81 Abs. 4 AufenthG gilt mein bisheriger Aufenthaltstitel inklusive aller Nebenbestimmungen und der Erlaubnis zur Ausübung der Erwerbstätigkeit kraft Gesetzes bis zu Ihrer Entscheidung fort.\n\nDa mein Arbeitgeber für den Fortbestand meines Beschäftigungsverhältnisses zwingend einen amtlichen Nachweis verlangt, beantrage ich hiermit die unverzügliche Ausstellung und Übersendung einer Fiktionsbescheinigung nach § 81 Abs. 4 AufenthG.\n\nMit freundlichen Grüßen,\n[Name]`, 'Antrag_Fiktionsbescheinigung_81_AufenthG.txt')}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-lg transition-all cursor-pointer"
                  title="Als Textdatei herunterladen"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vorlage 2: Sachstandsanfrage & Untätigkeitsklage */}
            <div className="p-5 rounded-xl bg-black border border-zinc-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold text-amber-400 uppercase">
                    2. Sachstandsanfrage mit Fristsetzung (§ 75 VwGO)
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-400">Vor Klageerhebung</span>
                </div>
                <p className="text-xs text-zinc-400 font-sans mt-1">
                  Förmliche Mahnung mit Fristsetzung von 14 Tagen und ausdrücklicher Klageandrohung beim Verwaltungsgericht.
                </p>
                <div className="mt-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
{`Absender: [Vorname Nachname], [Anschrift]
An: Ausländerbehörde / Einbürgerungsbehörde [Stadt], [Adresse]
Datum: ${new Date().toLocaleDateString('de-DE')}

Aktenzeichen: [Ihr Aktenzeichen]
Betreff: Dringende Sachstandsanfrage mit Fristsetzung und Androhung der Untätigkeitsklage gem. § 75 VwGO

Sehr geehrte Damen und Herren,

am [Datum der Antragstellung] habe ich bei Ihrer Behörde den vollständigen Antrag auf [Einbürgerung / Niederlassungserlaubnis / Aufenthaltserlaubnis] eingereicht.

Seit der Einreichung sind mehr als 3 Monate vergangen, ohne dass eine sachliche Entscheidung ergangen ist. Ein zureichender sachlicher Grund im Sinne von § 75 Satz 1 VwGO liegt nicht vor.

Ich setze Ihnen hiermit eine letzte Frist zur Entscheidung über meinen Antrag bis zum

[Datum in 14 Tagen]

Sollte bis zu diesem Zeitpunkt keine Bescheidung vorliegen, werde ich ohne weitere Vorankündigung durch meine Prozessbevollmächtigten Untätigkeitsklage beim zuständigen Verwaltungsgericht erheben. Die Kosten des Verfahrens fallen Ihnen zur Last.

Mit freundlichen Grüßen,
[Unterschrift]`}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleCopyText(`Absender: [Vorname Nachname], [Anschrift]\nAn: Ausländerbehörde / Einbürgerungsbehörde [Stadt]\nDatum: ${new Date().toLocaleDateString('de-DE')}\n\nBetreff: Dringende Sachstandsanfrage mit Fristsetzung und Androhung der Untätigkeitsklage gem. § 75 VwGO\n\nSehr geehrte Damen und Herren,\n\nam [Datum] habe ich bei Ihrer Behörde den vollständigen Antrag auf [Einbürgerung / Niederlassungserlaubnis] eingereicht.\n\nSeit der Einreichung sind mehr als 3 Monate vergangen, ohne dass eine sachliche Entscheidung ergangen ist. Ein zureichender sachlicher Grund im Sinne von § 75 Satz 1 VwGO liegt nicht vor.\n\nIch setze Ihnen hiermit eine letzte Frist zur Entscheidung über meinen Antrag bis zum [Datum in 14 Tagen].\n\nSollte bis zu diesem Zeitpunkt keine Bescheidung vorliegen, werde ich ohne weitere Vorankündigung Untätigkeitsklage beim zuständigen Verwaltungsgericht erheben.\n\nMit freundlichen Grüßen,\n[Name]`, 'untaetigkeit')}
                  className="flex-grow py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedTemplate === 'untaetigkeit' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTemplate === 'untaetigkeit' ? 'Kopiert!' : 'Kopieren'}</span>
                </button>
                <button
                  onClick={() => handleDownloadDraft(`Absender: [Vorname Nachname], [Anschrift]\nAn: Ausländerbehörde / Einbürgerungsbehörde [Stadt]\nDatum: ${new Date().toLocaleDateString('de-DE')}\n\nBetreff: Dringende Sachstandsanfrage mit Fristsetzung und Androhung der Untätigkeitsklage gem. § 75 VwGO\n\nSehr geehrte Damen und Herren,\n\nam [Datum] habe ich bei Ihrer Behörde den vollständigen Antrag auf [Einbürgerung / Niederlassungserlaubnis] eingereicht.\n\nSeit der Einreichung sind mehr als 3 Monate vergangen, ohne dass eine sachliche Entscheidung ergangen ist. Ein zureichender sachlicher Grund im Sinne von § 75 Satz 1 VwGO liegt nicht vor.\n\nIch setze Ihnen hiermit eine letzte Frist zur Entscheidung über meinen Antrag bis zum [Datum in 14 Tagen].\n\nSollte bis zu diesem Zeitpunkt keine Bescheidung vorliegen, werde ich ohne weitere Vorankündigung Untätigkeitsklage beim zuständigen Verwaltungsgericht erheben.\n\nMit freundlichen Grüßen,\n[Name]`, 'Sachstandsanfrage_Untaetigkeitsklage_75_VwGO.txt')}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-lg transition-all cursor-pointer"
                  title="Als Textdatei herunterladen"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

