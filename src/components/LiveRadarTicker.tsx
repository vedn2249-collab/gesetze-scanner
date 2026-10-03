import React, { useState, useEffect } from "react";
import { Radio, ChevronRight, ChevronLeft, Sparkles, BookOpen, Clock, X } from "lucide-react";

interface RadarEvent {
  id: string;
  category: string;
  timeAgo: string;
  text: string;
  paragraph: string;
  court: string;
}

const RADAR_EVENTS: RadarEvent[] = [
  {
    id: "e1",
    category: "Strafrecht",
    court: "BGH",
    paragraph: "§ 315c StGB",
    timeAgo: "Vor 14 Min.",
    text: "BGH-Leitsatz zu § 315c StGB (Gefährdungsvorsatz & Fahrerlaubnisentzug) indexiert",
  },
  {
    id: "e2",
    category: "Zivil- & Fristenrecht",
    court: "BGB",
    paragraph: "§ 193 BGB",
    timeAgo: "Vor 28 Min.",
    text: "Fristenautomatik (§§ 187, 193 BGB & Feiertagskalender 2026 aller Bundesländer) synchronisiert",
  },
  {
    id: "e3",
    category: "Arbeitsrecht",
    court: "BAG",
    paragraph: "§ 626 BGB",
    timeAgo: "Vor 42 Min.",
    text: "BAG-Grundsatzurteil zu § 626 BGB (2-Wochen-Ausschlussfrist bei fristloser Kündigung)",
  },
  {
    id: "e4",
    category: "Vergütung & Kosten",
    court: "RVG",
    paragraph: "VV RVG 2026",
    timeAgo: "Vor 57 Min.",
    text: "RVG-Streitwerttabellen & Gebührensätze für alle Instanzenzüge kalibriert",
  },
  {
    id: "e5",
    category: "Strafprozessrecht",
    court: "StPO",
    paragraph: "§ 136 StPO",
    timeAgo: "Vor 71 Min.",
    text: "§ 136 Abs. 1 StPO Belehrungspflicht-Verwertungsfilter & Widerspruchsrüge aktualisiert",
  },
  {
    id: "e6",
    category: "Verfassungsrecht",
    court: "BVerfG",
    paragraph: "§ 102 StPO",
    timeAgo: "Vor 86 Min.",
    text: "BVerfG-Beschluss zu richterlichen Durchsuchungsbeschlüssen & Gefahr im Verzug",
  },
];

const DAILY_LEGAL_TIPS = [
  {
    title: "§ 136 Abs. 1 Satz 2 StPO: Schweigerecht",
    detail: "Macht der Beschuldigte vom Schweigerecht Gebrauch, darf dies vom Gericht zu keinem Zeitpunkt zu seinem Nachteil verwertet werden.",
    hint: "Rügeobliegenheit: Bei fehlender Belehrung muss der Verwertung bis zum Schluss der Vernehmung widersprochen werden (Widerspruchslösung des BGH).",
  },
  {
    title: "§ 193 BGB: Sonnabend- & Feiertagsregel",
    detail: "Fällt das Ende einer Frist auf einen Sonnabend, Sonntag oder gesetzlichen Feiertag, endet die Frist erst mit Ablauf des nächsten Werktages.",
    hint: "Achtung bei Notfristen (§ 224 Abs. 1 ZPO): Tag des Ereignisses zählt nicht mit (§ 187 Abs. 1 BGB)!",
  },
];

export const LiveRadarTicker: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showDailyTip, setShowDailyTip] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);

  // Check returning visitor state
  useEffect(() => {
    try {
      const lastVisit = localStorage.getItem("gs_last_visited_time");
      if (lastVisit) {
        setIsReturningUser(true);
      }
      localStorage.setItem("gs_last_visited_time", Date.now().toString());
    } catch {
      // Ignore localStorage issues
    }
  }, []);

  // Cycle through events automatically every 5.5s unless paused by user hover
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % RADAR_EVENTS.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const activeEvent = RADAR_EVENTS[currentIndex];
  const todayTip = DAILY_LEGAL_TIPS[0];

  return (
    <div
      id="legal-radar-ticker"
      className="bg-black/95 border-b border-zinc-800/80 backdrop-blur-md px-3 py-1.5 text-xs select-none transition-colors relative z-20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Left: Live Indicator & Kinetic Radar Waves */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="tracking-wider uppercase">Live-Radar</span>
          </div>

          {/* Kinetic Frequency Waveform Equalizer (4 animated frequency bars) */}
          <div
            className="flex items-end gap-0.5 h-4 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800"
            title="Echtzeit-Synchronisation mit juristischen Datenbanken aktiv"
          >
            <div className="w-1 bg-amber-400 rounded-full animate-eq-1"></div>
            <div className="w-1 bg-amber-300 rounded-full animate-eq-2"></div>
            <div className="w-1 bg-teal-400 rounded-full animate-eq-3"></div>
            <div className="w-1 bg-amber-400 rounded-full animate-eq-4"></div>
          </div>

          {isReturningUser && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Willkommen zurück</span>
            </span>
          )}
        </div>

        {/* Center: Live Rotating Law & Court Event */}
        <div className="flex-1 min-w-0 flex items-center justify-center sm:justify-start gap-2 overflow-hidden px-2">
          <span className="text-[10px] font-mono font-bold text-amber-400/90 shrink-0 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
            {activeEvent.timeAgo}
          </span>
          <span className="text-[10px] font-mono font-extrabold text-cyan-300 shrink-0">
            [{activeEvent.court}]
          </span>
          <p className="text-[11px] text-zinc-300 font-mono truncate transition-all duration-300">
            {activeEvent.text}
          </p>
        </div>

        {/* Right: Navigation Controls & Paragraph of the Day Trigger */}
        <div className="flex items-center gap-1.5 shrink-0 text-zinc-400">
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + RADAR_EVENTS.length) % RADAR_EVENTS.length)}
            className="p-1 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="Vorherige Radar-Meldung"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-zinc-500">
            {currentIndex + 1}/{RADAR_EVENTS.length}
          </span>
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % RADAR_EVENTS.length)}
            className="p-1 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="Nächste Radar-Meldung"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-zinc-800 mx-1"></div>

          {/* Paragraph des Tages button */}
          <button
            type="button"
            onClick={() => setShowDailyTip((prev) => !prev)}
            className="text-[10px] font-mono font-bold text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 hover:border-amber-400 px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer"
            title="Täglicher Fach-Impuls / Taktik-Tipp"
          >
            <BookOpen className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">§ Impuls des Tages</span>
          </button>
        </div>
      </div>

      {/* Popover: Paragraph of the Day Modal/Flyout */}
      {showDailyTip && (
        <div className="max-w-7xl mx-auto mt-2 p-3 bg-zinc-950 border border-amber-500/40 rounded-xl shadow-2xl text-left animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-mono font-bold text-amber-400 text-xs uppercase tracking-wider">
                Juristischer Impuls des Tages: {todayTip.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowDailyTip(false)}
              className="text-zinc-500 hover:text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 text-xs space-y-1.5 text-zinc-300">
            <p className="leading-relaxed">{todayTip.detail}</p>
            <p className="text-[11px] font-mono text-amber-300/90 bg-amber-400/10 p-2 rounded border border-amber-400/20">
              💡 <strong>Praxis-Taktik:</strong> {todayTip.hint}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveRadarTicker;
