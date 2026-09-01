import React, { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Scale,
  MapPin,
  ChevronRight,
  Info,
  CalendarDays,
  X,
  FileCheck,
  RotateCcw,
  Sparkles
} from "lucide-react";

// German Federal States
export const BUNDESLAENDER = [
  { id: "DE-BW", name: "Baden-Württemberg" },
  { id: "DE-BY", name: "Bayern" },
  { id: "DE-BE", name: "Berlin" },
  { id: "DE-BB", name: "Brandenburg" },
  { id: "DE-HB", name: "Bremen" },
  { id: "DE-HH", name: "Hamburg" },
  { id: "DE-HE", name: "Hessen" },
  { id: "DE-MV", name: "Mecklenburg-Vorpommern" },
  { id: "DE-NI", name: "Niedersachsen" },
  { id: "DE-NW", name: "Nordrhein-Westfalen" },
  { id: "DE-RP", name: "Rheinland-Pfalz" },
  { id: "DE-SL", name: "Saarland" },
  { id: "DE-SN", name: "Sachsen" },
  { id: "DE-ST", name: "Sachsen-Anhalt" },
  { id: "DE-SH", name: "Schleswig-Holstein" },
  { id: "DE-TH", name: "Thüringen" }
];

// Common Legal Deadline Types in German Law
export interface DeadlinePreset {
  id: string;
  name: string;
  category: string;
  days: number;
  weeks?: number;
  months?: number;
  norm: string;
  description: string;
  triggerExample: string;
}

export const DEADLINE_PRESETS: DeadlinePreset[] = [
  {
    id: "kschg_3w",
    name: "3-Wochen-Kündigungsschutzklage",
    category: "Arbeitsrecht",
    weeks: 3,
    days: 21,
    norm: "§ 4 Satz 1 KSchG",
    description: "Klage auf Feststellung, dass das Arbeitsverhältnis durch die Kündigung nicht aufgelöst ist.",
    triggerExample: "Tag des Zugangs des schriftlichen Kündigungsschreibens"
  },
  {
    id: "erbausschlagung_6w",
    name: "6-Wochen-Erbausschlagung",
    category: "Erbrecht",
    weeks: 6,
    days: 42,
    norm: "§ 1944 Abs. 1 BGB",
    description: "Ausschlagung einer überschuldeten Erbschaft gegenüber dem Nachlassgericht.",
    triggerExample: "Tag, an dem der Erbe von dem Anfall und dem Grund der Berufung Kenntnis erlangt"
  },
  {
    id: "bussgeld_2w",
    name: "2-Wochen-Einspruch Bußgeldbescheid",
    category: "Verkehrsrecht / OWiG",
    weeks: 2,
    days: 14,
    norm: "§ 67 Abs. 1 OWiG",
    description: "Einspruch gegen Bußgeldbescheid wegen Geschwindigkeitsüberschreitung, Rotlicht etc.",
    triggerExample: "Datum der förmlichen Zustellung (gelber Umschlag)"
  },
  {
    id: "mietminderung_ruege",
    name: "Mängelanzeige & Vorbehalt (§ 536 BGB)",
    category: "Mietrecht",
    days: 14,
    norm: "§ 536c BGB, § 556b BGB",
    description: "Mietzahlung unter Vorbehalt & Fristsetzung zur Mängelbeseitigung (z. B. Heizungsausfall).",
    triggerExample: "Auftreten des Mangels / Nächste Monatsmiete"
  },
  {
    id: "widerruf_14t",
    name: "14-Tage-Widerrufsfrist (Verbrauchervertrag)",
    category: "Zivilrecht",
    days: 14,
    norm: "§ 355 Abs. 2 BGB, § 312g BGB",
    description: "Widerruf bei Fernabsatzverträgen (Online-Kauf, Abo-Verträge).",
    triggerExample: "Warenerhalt oder Vertragsschluss mit Belehrung"
  },
  {
    id: "strafbefehl_2w",
    name: "2-Wochen-Einspruch Strafbefehl",
    category: "Strafrecht & StPO",
    weeks: 2,
    days: 14,
    norm: "§ 410 Abs. 1 StPO",
    description: "Einspruch gegen Strafbefehl des Amtsgerichts (sonst Rechtskraft wie Urteil!).",
    triggerExample: "Datum der förmlichen Zustellung durch die Post"
  },
  {
    id: "mahnung_widerspruch_2w",
    name: "2-Wochen-Widerspruch Mahnbescheid",
    category: "Zivilprozessrecht",
    weeks: 2,
    days: 14,
    norm: "§ 694 Abs. 1 ZPO",
    description: "Widerspruch gegen gerichtlichen Mahnbescheid zur Abwendung des Vollstreckungsbescheids.",
    triggerExample: "Zustellungsdatum des gerichtlichen Mahnbescheids"
  },
  {
    id: "berufung_1m",
    name: "1-Monats-Frist Berufung / Rechtsmittel",
    category: "Zivil- & Arbeitsgericht",
    months: 1,
    days: 30,
    norm: "§ 517 ZPO, § 66 ArbGG",
    description: "Einlegung der Berufung gegen ein erstinstanzliches Urteil.",
    triggerExample: "Zustellung des vollständigen Urteils mit Gründen"
  }
];

// Helper: Calculate Easter Sunday for a given year (Meeus/Jones/Butcher algorithm)
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// Get German holidays for a year and specific Bundesland
export function getGermanHolidays(year: number, stateId: string = "DE-NW"): { dateStr: string; name: string }[] {
  const easter = getEasterSunday(year);
  const holidays: { date: Date; name: string }[] = [];

  const addDays = (d: Date, days: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() + days);
    return res;
  };

  // Nationwide Federal Holidays
  holidays.push({ date: new Date(year, 0, 1), name: "Neujahr" });
  holidays.push({ date: addDays(easter, -2), name: "Karfreitag" });
  holidays.push({ date: addDays(easter, 1), name: "Ostermontag" });
  holidays.push({ date: new Date(year, 4, 1), name: "Tag der Arbeit" });
  holidays.push({ date: addDays(easter, 39), name: "Christi Himmelfahrt" });
  holidays.push({ date: addDays(easter, 50), name: "Pfingstmontag" });
  holidays.push({ date: new Date(year, 9, 3), name: "Tag der Deutschen Einheit" });
  holidays.push({ date: new Date(year, 11, 25), name: "1. Weihnachtstag" });
  holidays.push({ date: new Date(year, 11, 26), name: "2. Weihnachtstag" });

  // State-specific holidays
  if (["DE-BW", "DE-BY", "DE-ST"].includes(stateId)) {
    holidays.push({ date: new Date(year, 0, 6), name: "Heilige Drei Könige" });
  }
  if (["DE-BE", "DE-MV"].includes(stateId)) {
    holidays.push({ date: new Date(year, 2, 8), name: "Internationaler Frauentag" });
  }
  if (["DE-BW", "DE-BY", "DE-HE", "DE-NW", "DE-RP", "DE-SL"].includes(stateId)) {
    holidays.push({ date: addDays(easter, 60), name: "Fronleichnam" });
  }
  if (["DE-SL", "DE-BY"].includes(stateId)) {
    holidays.push({ date: new Date(year, 7, 15), name: "Mariä Himmelfahrt" });
  }
  if (["DE-BB", "DE-HB", "DE-HH", "DE-MV", "DE-NI", "DE-SN", "DE-ST", "DE-SH", "DE-TH"].includes(stateId)) {
    holidays.push({ date: new Date(year, 9, 31), name: "Reformationstag" });
  }
  if (["DE-BW", "DE-BY", "DE-NW", "DE-RP", "DE-SL"].includes(stateId)) {
    holidays.push({ date: new Date(year, 10, 1), name: "Allerheiligen" });
  }

  return holidays.map((h) => {
    const y = h.date.getFullYear();
    const m = String(h.date.getMonth() + 1).padStart(2, "0");
    const d = String(h.date.getDate()).padStart(2, "0");
    return {
      dateStr: `${y}-${m}-${d}`,
      name: h.name
    };
  });
}

// Format date in German format
function formatGermanDate(d: Date): string {
  return d.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const DeadlineCalculatorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialPresetId?: string;
}> = ({ isOpen, onClose, initialPresetId }) => {
  const [selectedState, setSelectedState] = useState<string>("DE-NW");
  const [selectedPresetId, setSelectedPresetId] = useState<string>(initialPresetId || "kschg_3w");
  
  const todayStr = useMemo(() => formatDateISO(new Date()), []);
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [customDays, setCustomDays] = useState<number>(21);
  const [customUnit, setCustomUnit] = useState<"days" | "weeks" | "months">("weeks");
  const [unitCount, setUnitCount] = useState<number>(3);
  const [useCustomDuration, setUseCustomDuration] = useState<boolean>(false);

  // When preset changes, update duration
  const activePreset = DEADLINE_PRESETS.find((p) => p.id === selectedPresetId);

  const handleSelectPreset = (p: DeadlinePreset) => {
    setSelectedPresetId(p.id);
    setUseCustomDuration(false);
    if (p.weeks) {
      setCustomUnit("weeks");
      setUnitCount(p.weeks);
    } else if (p.months) {
      setCustomUnit("months");
      setUnitCount(p.months);
    } else {
      setCustomUnit("days");
      setUnitCount(p.days);
    }
  };

  // CALCULATION LOGIC ACCORDING TO §§ 187, 188, 193 BGB
  const calculationResult = useMemo(() => {
    if (!startDate) return null;
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return null;

    // § 187 Abs. 1 BGB: Ereignisfrist - der Tag des Ereignisses (z. B. Zugang) zählt NICHT mit.
    // Frist beginnt am Tag danach (§ 187 Abs. 1 BGB).
    const nominalEnd = new Date(start);

    let unitText = "";
    if (useCustomDuration) {
      if (customUnit === "days") {
        nominalEnd.setDate(nominalEnd.getDate() + unitCount);
        unitText = `${unitCount} Tage`;
      } else if (customUnit === "weeks") {
        nominalEnd.setDate(nominalEnd.getDate() + unitCount * 7);
        unitText = `${unitCount} Wochen (${unitCount * 7} Tage)`;
      } else if (customUnit === "months") {
        nominalEnd.setMonth(nominalEnd.getMonth() + unitCount);
        unitText = `${unitCount} Monat(e)`;
      }
    } else if (activePreset) {
      if (activePreset.weeks) {
        nominalEnd.setDate(nominalEnd.getDate() + activePreset.weeks * 7);
        unitText = `${activePreset.weeks} Wochen (${activePreset.weeks * 7} Tage)`;
      } else if (activePreset.months) {
        nominalEnd.setMonth(nominalEnd.getMonth() + activePreset.months);
        unitText = `${activePreset.months} Monat(e)`;
      } else {
        nominalEnd.setDate(nominalEnd.getDate() + activePreset.days);
        unitText = `${activePreset.days} Tage`;
      }
    }

    // Check § 193 BGB: If nominalEnd falls on Saturday (6), Sunday (0), or a recognized Holiday in that Bundesland
    const year = nominalEnd.getFullYear();
    const holidays = getGermanHolidays(year, selectedState);
    if (nominalEnd.getMonth() === 11) {
      // Also get next year holidays if close to end of year
      holidays.push(...getGermanHolidays(year + 1, selectedState));
    }

    let actualEnd = new Date(nominalEnd);
    let shifted = false;
    let shiftReasons: string[] = [];

    const isNonWorkingDay = (d: Date): { nonWorking: boolean; reason: string } => {
      const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
      if (dayOfWeek === 6) return { nonWorking: true, reason: "Samstag (Sonnabend)" };
      if (dayOfWeek === 0) return { nonWorking: true, reason: "Sonntag" };

      const iso = formatDateISO(d);
      const matchHoliday = holidays.find((h) => h.dateStr === iso);
      if (matchHoliday) {
        return { nonWorking: true, reason: `Gesetzlicher Feiertag (${matchHoliday.name}) in ${BUNDESLAENDER.find((b) => b.id === selectedState)?.name}` };
      }
      return { nonWorking: false, reason: "" };
    };

    let check = isNonWorkingDay(actualEnd);
    while (check.nonWorking) {
      shifted = true;
      shiftReasons.push(`${formatGermanDate(actualEnd)}: ${check.reason}`);
      actualEnd.setDate(actualEnd.getDate() + 1);
      check = isNonWorkingDay(actualEnd);
    }

    // Remaining days from today
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(actualEnd);
    target.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - now.getTime();
    const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      eventDate: start,
      eventDateFormatted: formatGermanDate(start),
      nominalEndDate: nominalEnd,
      nominalEndDateFormatted: formatGermanDate(nominalEnd),
      actualEndDate: actualEnd,
      actualEndDateFormatted: formatGermanDate(actualEnd),
      shifted,
      shiftReasons,
      unitText,
      remainingDays,
      isExpired: remainingDays < 0
    };
  }, [startDate, selectedState, selectedPresetId, useCustomDuration, customUnit, unitCount, activePreset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl shadow-black relative overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Scale className="w-3.5 h-3.5" />
                §§ 187, 188, 193 BGB Fristen-Kalkulator
              </span>
              <span className="text-xs font-mono text-zinc-400">
                Inkl. Wochenend- & Bundesland-Feiertagsautomatik
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white">
              Interaktiver Rechts- & Klagefristen-Rechner
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Berechnen Sie Klage-, Rechtsmittel- und Ausschlagungsfristen exakt auf den Werktag. Fällt das rechnerische Fristende auf einen Samstag, Sonntag oder gesetzlichen Feiertag, verschiebt sich die Frist nach § 193 BGB automatisch auf den nächsten Werktag (24:00 Uhr).
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

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Top Config Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Bundesland Selector */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" />
                Bundesland (Feiertagsrecht)
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
              >
                {BUNDESLAENDER.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-zinc-500">
                Berücksichtigt z. B. Fronleichnam, Allerheiligen oder Frauentag.
              </p>
            </div>

            {/* 2. Start / Event Date */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                Ereignistag (z. B. Zugang)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
              />
              <p className="text-[11px] text-zinc-500">
                § 187 Abs. 1 BGB: Frist beginnt am Folgetag zu laufen.
              </p>
            </div>

            {/* 3. Mode Toggle */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2 flex flex-col justify-between">
              <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Berechnungs-Modus
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUseCustomDuration(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    !useCustomDuration
                      ? "bg-amber-400 text-black border-amber-400"
                      : "bg-black text-zinc-400 border-zinc-700 hover:text-white"
                  }`}
                >
                  Gesetzliche Muster
                </button>
                <button
                  type="button"
                  onClick={() => setUseCustomDuration(true)}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    useCustomDuration
                      ? "bg-amber-400 text-black border-amber-400"
                      : "bg-black text-zinc-400 border-zinc-700 hover:text-white"
                  }`}
                >
                  Freie Tage/Wochen
                </button>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {useCustomDuration ? "Benutzerdefinierte Dauer" : "Standardisierte Fristen (KSchG, BGB)"}
              </span>
            </div>
          </div>

          {/* Preset Buttons or Custom Duration Input */}
          {!useCustomDuration ? (
            <div className="space-y-3">
              <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                Vordefinierte gesetzliche Fristen (1-Klick Auswahl):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {DEADLINE_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-amber-400/15 border-amber-400 text-white shadow-sm"
                          : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                      }`}
                    >
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-white font-display">
                            {preset.name}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-amber-400 shrink-0">
                            {preset.norm}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-tight">
                          {preset.description}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>{preset.category}</span>
                        <span className="text-amber-300 font-bold">
                          {preset.weeks ? `${preset.weeks} Wochen` : preset.months ? `${preset.months} Monat` : `${preset.days} Tage`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-wrap items-center gap-4">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-zinc-300">Anzahl Einheiten:</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={unitCount}
                  onChange={(e) => setUnitCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-28 bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-zinc-300">Zeiteinheit:</span>
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value as any)}
                  className="bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="days">Tage (§ 188 Abs. 1 BGB)</option>
                  <option value="weeks">Wochen (§ 188 Abs. 2 BGB)</option>
                  <option value="months">Monate (§ 188 Abs. 2 BGB)</option>
                </select>
              </div>
            </div>
          )}

          {/* CALCULATION RESULT CARD */}
          {calculationResult && (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-zinc-900 via-black to-zinc-950 border-2 border-amber-500/50 shadow-gold-glow space-y-5">
              
              {/* Top Result Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase font-bold bg-amber-400 text-black px-2 py-0.5 rounded">
                      Verbindliches Fristende
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      § 188 Abs. 2 & § 193 BGB (24:00 Uhr)
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white">
                    {calculationResult.actualEndDateFormatted}
                  </h3>
                </div>

                <div className="shrink-0">
                  {calculationResult.isExpired ? (
                    <div className="px-4 py-2 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-mono font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span>ABGELAUFEN (vor {Math.abs(calculationResult.remainingDays)} Tagen)</span>
                    </div>
                  ) : calculationResult.remainingDays === 0 ? (
                    <div className="px-4 py-2 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold flex items-center gap-2 animate-pulse">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>HEUTE IST DER LETZTE TAG (bis 24:00 Uhr)</span>
                    </div>
                  ) : (
                    <div className="px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Noch {calculationResult.remainingDays} Tage verbleibend</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Subsumption & Norm Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Event & Nominal vs Actual */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5 text-xs font-mono">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                    1. Rechnerischer Ablauf:
                  </span>
                  <div className="space-y-1.5 text-zinc-300">
                    <div className="flex justify-between border-b border-zinc-900 pb-1">
                      <span className="text-zinc-500">Ereignis-Tag:</span>
                      <span className="text-white font-bold">{calculationResult.eventDateFormatted}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1">
                      <span className="text-zinc-500">Fristdauer:</span>
                      <span className="text-amber-300 font-bold">{calculationResult.unitText}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1">
                      <span className="text-zinc-500">Rechnerisches Ende:</span>
                      <span className="text-zinc-300">{calculationResult.nominalEndDateFormatted}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-zinc-400 font-bold">Rechtlich bindendes Fristende:</span>
                      <span className="text-emerald-400 font-extrabold">{calculationResult.actualEndDateFormatted}</span>
                    </div>
                  </div>
                </div>

                {/* § 193 BGB Weekend / Holiday Shift Explanation */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" />
                    2. Gesetzliche Fristverschiebung (§ 193 BGB):
                  </span>
                  
                  {calculationResult.shifted ? (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-200 text-[11px] font-mono space-y-1">
                        <span className="font-bold block">⚠️ Automatische Verlängerung greift:</span>
                        {calculationResult.shiftReasons.map((reason, idx) => (
                          <div key={idx} className="text-zinc-300 flex items-start gap-1">
                            <span>•</span>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-tight">
                        Nach § 193 BGB tritt an die Stelle des Samstags, Sonntags oder Feiertags der <strong>nächste Werktag</strong>. Schriftsätze können bis 24:00 Uhr dieses Tages bei Gericht oder Behörde eingereicht werden.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono">
                        ✅ Das Fristende fällt auf einen regulären Werktag (keine Feiertagsverschiebung erforderlich).
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-tight">
                        Der Schriftsatz muss bis spätestens 24:00 Uhr des Stichtags beim zuständigen Gericht / Gegner eingegangen sein.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action advice */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-3 text-xs font-mono">
                <span className="text-zinc-400">
                  Tipp: Reichen Sie Rechtsmittel stets mindestens 2–3 Werktage vor Fristablauf ein, um Übermittlungsrisiken (Fax/beA/Post) auszuschließen.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-mono text-zinc-500">
            Gesetzes-Scanner Präzisions-Fristenmodul (§§ 187 ff. BGB)
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-mono text-xs font-bold border border-zinc-700 transition-all cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
