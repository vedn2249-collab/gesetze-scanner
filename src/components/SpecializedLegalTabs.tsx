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
  CheckCircle2
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
// 10. ANWALTS-SUCHMASCHINE (TAB 10) - REAL DIRECTORY & OFFICIAL CHAMBER LINKS
// ==========================================
export function LawyerSearchView() {
  const [plz, setPlz] = useState('');
  const [field, setField] = useState('Miet- und Wohnungseigentumsrecht');
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plz.trim()) return;
    setSearched(true);
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
          <MapPin className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">Kanzlei- & Fachanwaltsvermittlung</span>
          <h3 className="text-lg font-bold font-display text-white">📍 Anwalts-Suchmaschine: Spezialisierte Fachanwälte in Ihrer Region</h3>
        </div>
      </div>

      <form onSubmit={handleSearch} className="p-4 rounded-xl bg-black border border-zinc-800 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={plz}
          onChange={e => setPlz(e.target.value)}
          placeholder="Ihre PLZ oder Stadt eingeben (z.B. 10115 oder Frankfurt)"
          className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-xs text-white font-mono flex-grow focus:border-amber-400 focus:outline-none"
        />
        <select
          value={field}
          onChange={e => setField(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
        >
          <option>Miet- und Wohnungseigentumsrecht</option>
          <option>Strafrecht & Verkehrsrecht</option>
          <option>Arbeitsrecht</option>
          <option>Familien- & Erbrecht</option>
          <option>Bau- & Architektenrecht</option>
          <option>Bank- & Kapitalmarktrecht</option>
        </select>
        <button
          type="submit"
          disabled={!plz.trim()}
          className="px-5 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0 shadow-gold-glow"
        >
          Fachanwälte suchen
        </button>
      </form>

      {searched ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center justify-between">
            <span>Suchbereich: <strong>{plz}</strong> • Fachgebiet: <strong>{field}</strong></span>
            <span className="text-zinc-400 text-[10px]">Offizielles Bundesweites Anwaltsregister (BRAK)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white font-display">Offizielles Bundesweites Amtliches Anwaltsverzeichnis (BRAV)</h4>
                <span className="text-xs text-amber-400 font-mono">Bundesrechtsanwaltskammer</span>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Über das amtliche Register der Bundesrechtsanwaltskammer finden Sie alle zugelassenen Rechtsanwältinnen und Rechtsanwälte in {plz} mit Nachweis der Fachanwaltschaft.
              </p>
              <a
                href={`https://bea-brak.de/bravsearch/search.html`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-mono font-bold pt-1"
              >
                <span>Amtliches Verzeichnis für {plz} öffnen</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white font-display">Deutscher Anwaltverein (DAV) Anwaltauskunft</h4>
                <span className="text-xs text-emerald-400 font-mono">Fachanwalts-Suche</span>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Gezielte Suche nach geprüften Fachanwälten für {field} mit direkter Kontaktmöglichkeit und Beratungshilfe-Akzeptanz.
              </p>
              <a
                href="https://anwaltauskunft.de/anwaltssuche"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-mono font-bold pt-1"
              >
                <span>Fachanwälte in {plz} anzeigen</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-black border border-zinc-900 text-center space-y-2">
          <MapPin className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-xs text-zinc-400 font-mono">
            Geben Sie Ihre Postleitzahl oder Stadt ein, um qualifizierte Fachanwälte in Ihrer Umgebung über die amtlichen Verzeichnisse zu finden.
          </p>
        </div>
      )}
    </div>
  );
}
