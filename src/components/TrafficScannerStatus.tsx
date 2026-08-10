import React, { useState } from 'react';
import { RefreshCw, BookOpen, AlertCircle, Send, CheckCircle2, FileText, Sliders } from 'lucide-react';
import { LawSection, TrafficScanHistory, VehicleType } from '../types';

interface TrafficScannerStatusProps {
  laws: LawSection[];
  scans: TrafficScanHistory[];
  onTriggerScan: (updatedLaw: LawSection) => Promise<void>;
  isLoading: boolean;
}

export default function TrafficScannerStatus({ laws, scans, onTriggerScan, isLoading }: TrafficScannerStatusProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'laws' | 'simulate'>('status');
  
  // Simulation & Edit states
  const [selectedLawId, setSelectedLawId] = useState<string>(laws[0]?.id || 'law-2');
  const [lawCode, setLawCode] = useState('§ 21e StVO');
  const [lawTitle, setLawTitle] = useState('Elektrokleinstfahrzeuge im Straßenverkehr');
  const [lawContent, setLawContent] = useState('Personenbezogene E-Scooter dürfen nur auf Radwegen gefahren werden. Das Fahren auf Gehwegen ist verboten. Die Höchstgeschwindigkeit beträgt 20 km/h.');
  const [lawCategories, setLawCategories] = useState<VehicleType[]>(['escooter']);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSelectLawForSimulation = (lawId: string) => {
    setSelectedLawId(lawId);
    if (lawId === 'new') {
      setLawCode('§ ');
      setLawTitle('');
      setLawContent('');
      setLawCategories(['auto']);
    } else {
      const selected = laws.find(l => l.id === lawId);
      if (selected) {
        setLawCode(selected.code);
        setLawTitle(selected.title);
        setLawContent(selected.content);
        setLawCategories(selected.vehicleCategories);
      }
    }
  };

  const handleCategoryToggle = (cat: VehicleType) => {
    if (lawCategories.includes(cat)) {
      setLawCategories(lawCategories.filter(c => c !== cat));
    } else {
      setLawCategories([...lawCategories, cat]);
    }
  };

  const handleSimulateChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lawCode || !lawTitle || !lawContent) {
      setFeedback('⚠️ Bitte füllen Sie alle Gesetzfelder aus.');
      return;
    }
    setFeedback(null);

    const updatedLaw: LawSection = {
      id: selectedLawId === 'new' ? `law-${Date.now()}` : selectedLawId,
      code: lawCode,
      title: lawTitle,
      content: lawContent,
      vehicleCategories: lawCategories,
      lastUpdated: new Date().toISOString()
    };

    try {
      await onTriggerScan(updatedLaw);
      setFeedback('🎉 Gesetzesänderung erfolgreich in die StVO-Datenbank eingepflegt! Live-Matching ausgeführt.');
      if (selectedLawId === 'new') {
        setSelectedLawId(updatedLaw.id);
      }
    } catch (err) {
      console.error(err);
      setFeedback('Fehler beim Ausführen des Scans.');
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-950 border border-amber-500/20 shadow-gold-glow flex flex-col h-full">
      {/* Sub-tab Selectors */}
      <div className="flex border-b border-zinc-800 mb-5 pb-px gap-2">
        <button
          onClick={() => setActiveTab('status')}
          className={`px-3 py-1.5 text-xs font-mono font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'status' 
              ? 'border-amber-400 text-amber-400' 
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          🔍 Scan-Protokoll ({scans.length})
        </button>
        <button
          onClick={() => setActiveTab('laws')}
          className={`px-3 py-1.5 text-xs font-mono font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'laws' 
              ? 'border-amber-400 text-amber-400' 
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          📚 Überwachte Paragraphen ({laws.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('simulate');
            if (laws.length > 0 && !lawTitle) {
              handleSelectLawForSimulation(laws[0].id);
            }
          }}
          className={`px-3 py-1.5 text-xs font-mono font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'simulate' 
              ? 'border-amber-400 text-amber-400' 
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          ⚙️ Gesetzes-Editor & Simulator
        </button>
      </div>

      {/* TAB CONTENT 1: SCAN PROTOCOL */}
      {activeTab === 'status' && (
        <div className="flex flex-col h-full space-y-3">
          <div className="mb-1">
            <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
              24/7 StVO-Überwachungsprotokoll
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Automatische Abgleiche des Bundesgesetzblatts mit den Fahrzeugkategorien aller registrierten Abonnenten.
            </p>
          </div>

          <div className="flex-grow space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {scans.length === 0 ? (
              <div className="text-center py-12 text-xs font-mono text-zinc-500">Keine Scan-Protokolle vorhanden.</div>
            ) : (
              scans.map((scan) => (
                <div 
                  key={scan.id} 
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                    scan.status === 'change_detected'
                      ? 'bg-amber-950/30 border-amber-500/40'
                      : 'bg-black border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    scan.status === 'change_detected' ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'
                  }`} />
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-zinc-400">
                        {new Date(scan.timestamp).toLocaleString('de-DE')}
                      </span>
                      <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                        scan.status === 'change_detected' 
                          ? 'bg-amber-400 text-black' 
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {scan.status === 'change_detected' ? 'Änderung erkannt!' : 'Keine Änderung'}
                      </span>
                    </div>
                    <p className="text-xs font-mono font-bold text-white mt-1 leading-snug">
                      {scan.changeSummary}
                    </p>
                    {scan.affectedVehicles && scan.affectedVehicles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {scan.affectedVehicles.map(v => (
                          <span key={v} className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold uppercase">
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: MONITORED LAWS */}
      {activeTab === 'laws' && (
        <div className="flex flex-col h-full space-y-3">
          <div className="mb-1">
            <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              Aktuell in Echtzeit-Überwachung befindliche StVO-Paragraphen
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Diese Gesetze werden rund um die Uhr auf Novellierungen und Verordnungsänderungen überwacht.
            </p>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {laws.map((law) => (
              <div key={law.id} className="p-3.5 rounded-xl bg-black border border-zinc-800 hover:border-zinc-700 transition-all space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">{law.code}</span>
                    <h4 className="text-xs font-bold text-white leading-tight mt-1">{law.title}</h4>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                    Stand: {new Date(law.lastUpdated).toLocaleDateString('de-DE')}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 font-mono line-clamp-3 leading-relaxed bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                  "{law.content}"
                </p>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {law.vehicleCategories.map(cat => (
                    <span key={cat} className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-amber-300 border border-zinc-800 uppercase">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: LAW EDITOR & SIMULATOR */}
      {activeTab === 'simulate' && (
        <form onSubmit={handleSimulateChange} className="flex-grow flex flex-col justify-between gap-3">
          <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
            <div className="bg-amber-400/10 border border-amber-400/20 p-3 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] font-mono text-amber-300 leading-relaxed">
                <strong>Echtes StVO-Änderungs-Matching:</strong> Erfassen oder bearbeiten Sie einen Gesetzesparagraphen. Der Scanner analysiert die Textänderung und gleicht sie mit allen registrierten Fahrzeug-Abonnenten ab.
              </p>
            </div>

            {/* Select Law dropdown */}
            <div className="space-y-1">
              <label htmlFor="traffic-sim-select" className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Gesetz zum Bearbeiten wählen:</label>
              <select
                id="traffic-sim-select"
                value={selectedLawId}
                onChange={(e) => handleSelectLawForSimulation(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-amber-400"
              >
                {laws.map(l => (
                  <option key={l.id} value={l.id}>{l.code} - {l.title}</option>
                ))}
                <option value="new">+ Neuen StVO-Paragraphen hinzufügen</option>
              </select>
            </div>

            {/* Code & Title inputs */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1 space-y-1">
                <label htmlFor="traffic-law-code" className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Paragraph:</label>
                <input
                  id="traffic-law-code"
                  type="text"
                  value={lawCode}
                  onChange={(e) => setLawCode(e.target.value)}
                  className="w-full px-2.5 py-2 bg-black border border-zinc-800 rounded-lg text-white text-xs font-mono"
                  placeholder="§ 21a StVO"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label htmlFor="traffic-law-title" className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Titel / Bezeichnung:</label>
                <input
                  id="traffic-law-title"
                  type="text"
                  value={lawTitle}
                  onChange={(e) => setLawTitle(e.target.value)}
                  className="w-full px-2.5 py-2 bg-black border border-zinc-800 rounded-lg text-white text-xs font-mono"
                  placeholder="Helmpflicht und Sicherheitsgurte"
                />
              </div>
            </div>

            {/* Content Textarea */}
            <div className="space-y-1">
              <label htmlFor="traffic-law-content" className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Geänderter Wortlaut des Gesetzes:</label>
              <textarea
                id="traffic-law-content"
                value={lawContent}
                onChange={(e) => setLawContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-amber-400 font-mono leading-relaxed"
                placeholder="Geben Sie den Gesetzestext ein..."
              />
            </div>

            {/* Vehicle categories toggles */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Relevante Fahrzeugtypen:</span>
              <div className="flex flex-wrap gap-1">
                {(['auto', 'escooter', 'fahrrad', 'roller', 'motorrad', 'lkw', 'quad', 'fussgaenger'] as VehicleType[]).map((cat) => {
                  const isChecked = lawCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      id={`traffic-cat-toggle-${cat}`}
                      onClick={() => handleCategoryToggle(cat)}
                      className={`px-2 py-1 rounded text-[9px] font-mono font-bold border transition-all cursor-pointer uppercase ${
                        isChecked 
                          ? 'bg-amber-400 text-black border-amber-300' 
                          : 'bg-black text-zinc-500 border-zinc-800 hover:text-zinc-300'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {feedback && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px] font-mono leading-relaxed">
              {feedback}
            </div>
          )}

          <button
            type="submit"
            id="btn_trigger_traffic_scan"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-mono font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-gold-glow flex items-center justify-center gap-2 cursor-pointer border border-amber-200"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Gesetz aktualisieren & Abgleich ausführen
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
