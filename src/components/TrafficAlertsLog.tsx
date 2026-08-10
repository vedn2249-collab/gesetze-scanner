import React, { useState } from 'react';
import { Bell, ShieldAlert, ChevronDown, ChevronUp, FileText, CheckCircle } from 'lucide-react';
import { TrafficLawAlert } from '../types';

interface TrafficAlertsLogProps {
  alerts: TrafficLawAlert[];
  filterEmail: string | null;
}

export default function TrafficAlertsLog({ alerts, filterEmail }: TrafficAlertsLogProps) {
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  const filteredAlerts = filterEmail 
    ? alerts.filter(a => a.email.toLowerCase() === filterEmail.toLowerCase())
    : alerts;

  const toggleExpand = (id: string) => {
    setExpandedAlertId(expandedAlertId === id ? null : id);
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-950 border border-amber-500/20 shadow-gold-glow flex flex-col h-full">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-white font-display flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            Empfangene StVO-Warnmeldungen (Traffic Alerts)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {filterEmail 
              ? `Echtzeit-Gesetzeswarnungen für: ${filterEmail}`
              : 'Verlauf aller kürzlich generierten StVO-Warnmeldungen des Überwachungsnetzwerks.'}
          </p>
        </div>
        
        {filterEmail && (
          <span className="self-start sm:self-center text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 uppercase">
            Abonnent: {filterEmail}
          </span>
        )}
      </div>

      <div className="flex-grow space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-2">
            <div className="p-3 bg-zinc-900 rounded-full text-zinc-500 border border-zinc-800">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-zinc-300">Keine neuen Warnungen vorliegend</p>
              <p className="text-[11px] font-mono text-zinc-500 max-w-xs mt-0.5">
                Ihre Fahrzeuge sind aktuell auf dem neuesten StVO-Stand! Sobald sich eine Verordnung ändert, erscheint sie hier.
              </p>
            </div>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isExpanded = expandedAlertId === alert.id;
            return (
              <div 
                key={alert.id}
                className={`p-3.5 rounded-xl border transition-all duration-300 font-mono ${
                  isExpanded 
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-lg' 
                    : 'bg-black border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-amber-400/10 border border-amber-400/20 rounded-lg text-amber-400 mt-0.5 shrink-0">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-zinc-400">
                          {new Date(alert.timestamp).toLocaleString('de-DE')}
                        </span>
                        <span className="text-zinc-600 text-xs">•</span>
                        <span className="text-[10px] text-zinc-300 truncate max-w-[180px]">
                          An: {alert.email}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-0.5 leading-snug">
                        {alert.changedTitle}
                      </h4>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleExpand(alert.id)}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer border border-zinc-800"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1">
                  <span className="text-[9px] font-extrabold text-black bg-amber-400 px-2 py-0.5 rounded uppercase tracking-wider">
                    StVO Änderung
                  </span>
                  {alert.matchedKeywords && alert.matchedKeywords.map(kw => (
                    <span key={kw} className="text-[9px] bg-zinc-900 border border-zinc-800 text-amber-300 px-2 py-0.5 rounded uppercase font-bold">
                      Key: {kw}
                    </span>
                  ))}
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3">
                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3 h-3 text-amber-400" />
                        Auszug aus der Verordnung:
                      </span>
                      <p className="text-xs text-zinc-300 italic leading-relaxed">
                        "{alert.lawExcerpt}"
                      </p>
                    </div>

                    <div className="bg-amber-400/5 p-3 rounded-lg border border-amber-400/20 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Bürgerfreundliche KI-Erklärung:
                      </span>
                      <div className="text-xs text-zinc-200 leading-relaxed space-y-1.5">
                        {alert.geminiExplanation.split('\n').map((line, idx) => {
                          if (line.startsWith('###')) {
                            return <h5 key={idx} className="text-xs font-bold text-amber-300 mt-2 mb-0.5">{line.replace('###', '').trim()}</h5>;
                          }
                          return line ? <p key={idx} className="text-zinc-300">{line}</p> : <div key={idx} className="h-1" />;
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
