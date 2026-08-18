import { CostCalculationResult } from "./types";

/**
 * RVG (Rechtsanwaltsvergütungsgesetz) & GKG (Gerichtskostengesetz) Rechner
 * Berechnet das Prozesskostenrisiko, Anwalts- und Gerichtskosten mit Ampel-Bewertung.
 */
export function calculateLegalCosts(
  streitwert: number = 5000,
  hasInsurance: boolean = false,
  deductible: number = 150,
  isCourtProcess: boolean = true
): CostCalculationResult {
  const sw = streitwert > 0 ? streitwert : 5000;

  // 1.0 RVG Gebühr (Anlage 2 zu § 13 Abs. 1 RVG)
  let baseRvgFee = 334.0;
  if (sw <= 500) baseRvgFee = 49.0;
  else if (sw <= 1000) baseRvgFee = 88.0;
  else if (sw <= 2000) baseRvgFee = 166.0;
  else if (sw <= 3000) baseRvgFee = 222.0;
  else if (sw <= 4000) baseRvgFee = 278.0;
  else if (sw <= 5000) baseRvgFee = 334.0;
  else if (sw <= 10000) baseRvgFee = 614.0;
  else if (sw <= 25000) baseRvgFee = 894.0;
  else baseRvgFee = 894.0 + Math.ceil((sw - 25000) / 10000) * 150.0;

  // 1.3 Verfahrensgebühr (VV 3100) + 1.2 Terminsgebühr (VV 3104) + 20 € Auslagenpauschale
  const multiplier = isCourtProcess ? 2.5 : 1.3;
  const netLawyer = baseRvgFee * multiplier + 20.0;
  const grossLawyer = Math.round(netLawyer * 1.19 * 100) / 100; // 19% MwSt

  // 3.0 GKG Gerichtsgebühr (KV 1210)
  let baseGkgFee = 161.0;
  if (sw <= 500) baseGkgFee = 38.0;
  else if (sw <= 1000) baseGkgFee = 58.0;
  else if (sw <= 2000) baseGkgFee = 98.0;
  else if (sw <= 3000) baseGkgFee = 119.0;
  else if (sw <= 5000) baseGkgFee = 161.0;
  else baseGkgFee = 161.0 + Math.ceil((sw - 5000) / 5000) * 80.0;

  const courtFees = isCourtProcess ? Math.round(baseGkgFee * 3.0 * 100) / 100 : 0;
  const totalWorstCase = Math.round((grossLawyer + courtFees + grossLawyer) * 100) / 100;

  // Ampel-Indikator
  const costRatio = totalWorstCase / sw;
  let trafficLight: "GREEN" | "YELLOW" | "RED" = "GREEN";
  let verdict = "Wirtschaftlich hochgradig sinnvoll. Das Kostenrisiko steht in einem sehr günstigen Verhältnis zum Streitwert.";

  if (costRatio > 0.75) {
    trafficLight = "RED";
    verdict = "Hohes Kostenrisiko! Die Prozesskosten übersteigen einen unverhältnismäßigen Teil des Streitwerts. Außergerichtlicher Vergleich zwingend empfohlen.";
  } else if (costRatio > 0.35) {
    trafficLight = "YELLOW";
    verdict = "Wirtschaftlich vertretbar. Ein Vergleich oder außergerichtliche Einigung sollte primär angestrebt werden.";
  }

  let totalOwnRisk = totalWorstCase;
  let insuranceCovered = 0;

  if (hasInsurance) {
    insuranceCovered = Math.max(0, totalWorstCase - deductible);
    totalOwnRisk = deductible;
    verdict += " Durch bestehende Rechtsschutzversicherung ist Ihr Eigenrisiko auf die Selbstbeteiligung gedeckelt.";
  }

  return {
    streitwert: sw,
    courtFeesGKG: courtFees,
    lawyerFeesRVG: grossLawyer,
    totalOwnRisk: Math.round(totalOwnRisk * 100) / 100,
    opponentRisk: grossLawyer,
    maxCostExposure: totalWorstCase,
    insuranceCovered: Math.round(insuranceCovered * 100) / 100,
    trafficLight,
    verdict
  };
}

/**
 * Erzeugt eine RFC 5545 konforme .ics Datei mit Notfrist und Vorwarnungen (3 Tage, 24 Stunden)
 */
export function generateDeadlineICS(
  fileNumber: string,
  topic: string,
  deadlineDateStr?: string
): string {
  const now = new Date();
  let deadline = new Date();

  if (deadlineDateStr && !isNaN(Date.parse(deadlineDateStr))) {
    deadline = new Date(deadlineDateStr);
  } else {
    // Standard: 14 Tage Frist
    deadline.setDate(deadline.getDate() + 14);
  }

  deadline.setHours(23, 59, 0, 0);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatIcsDate = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

  const dtStamp = formatIcsDate(now);
  const dtStart = formatIcsDate(deadline);
  const end = new Date(deadline.getTime() + 60000);
  const dtEnd = formatIcsDate(end);

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Gesetzes-Scanner//Legal Deadline Engine 2026//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${now.getTime()}-legal-deadline@gesetze-scanner.de
DTSTAMP:${dtStamp}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:🚨 NOTFRIST: ${topic || "Rechtsmittel einlegen"} (Az: ${fileNumber || "12 C 456/26"})
DESCRIPTION:Ablauf der gesetzlichen Ausschlussfrist in der Rechtssache: ${topic || "Einspruch / Berufung"}. Unbedingt Schriftsatz vor 24:00 Uhr einreichen!
STATUS:CONFIRMED
PRIORITY:1
BEGIN:VALARM
TRIGGER:-P3D
ACTION:DISPLAY
DESCRIPTION:Erinnerung: Noch 3 Tage bis zum Fristablauf (${fileNumber || "Az"})
END:VALARM
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Dringend: Noch 24 Stunden Notfrist (${fileNumber || "Az"})!
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

/**
 * Triggert den direkten Browser-Download einer .ics Fristendatei
 */
export function downloadDeadlineICSFile(fileNumber: string, topic: string, deadlineDateStr?: string) {
  const icsString = generateDeadlineICS(fileNumber, topic, deadlineDateStr);
  const blob = new Blob([icsString], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Notfrist_${fileNumber ? fileNumber.replace(/[\/\s]/g, "_") : "Frist"}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 26. Verjährungs-Jäger (§§ 195, 199 BGB)
 * Berechnet die regelmäßige Verjährung (3 Jahre zum Jahresende) und Höchstfristen (10/30 Jahre)
 */
export function checkStatuteOfLimitations(claimYear: number = 2023): {
  regularExpiryDate: string;
  maxExpiryDate: string;
  isStatuteBarred: boolean;
  explanation: string;
} {
  const currentYear = new Date().getFullYear();
  // Regelmäßige Verjährung: 3 Jahre, beginnt mit Ablauf des Entstehungsjahres (§ 199 Abs. 1 BGB)
  const expiryYear = claimYear + 3;
  const regularExpiry = `31.12.${expiryYear}`;
  const maxExpiry = `31.12.${claimYear + 10}`;

  const isBarred = currentYear > expiryYear;

  return {
    regularExpiryDate: regularExpiry,
    maxExpiryDate: maxExpiry,
    isStatuteBarred: isBarred,
    explanation: isBarred
      ? `Anspruch aus ${claimYear} ist mit Ablauf des ${regularExpiry} regelmäßig verjährt (§ 214 BGB Einrede).`
      : `Anspruch verjährt regulär erst am ${regularExpiry} um 24:00 Uhr.`
  };
}

/**
 * 32. beA-Export (Generierung strukturierter XJustiz-konformer XML-Daten für das elektronische Anwaltspostfach)
 */
export function generateBeAXmlMetadata(
  fileNumber: string,
  courtTarget: string,
  parties: { sender: string; opponent: string },
  subject: string
): string {
  const dateIso = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<xjustiz:nachricht xmlns:xjustiz="http://www.xjustiz.de" version="3.3.1">
  <xjustiz:kopf>
    <xjustiz:nachrichtenId>${Date.now()}-bea-transfer</xjustiz:nachrichtenId>
    <xjustiz:erstellungszeitpunkt>${dateIso}</xjustiz:erstellungszeitpunkt>
    <xjustiz:empfaenger>${courtTarget || "Zuständiges Gericht"}</xjustiz:empfaenger>
    <xjustiz:aktenzeichenEmpfaenger>${fileNumber || "12 C 456/26"}</xjustiz:aktenzeichenEmpfaenger>
  </xjustiz:kopf>
  <xjustiz:inhalt>
    <xjustiz:betreff>${subject || "Fristwahrender Schriftsatz"}</xjustiz:betreff>
    <xjustiz:beteiligte>
      <xjustiz:partei rolle="Antragsteller">${parties.sender || "Mandant"}</xjustiz:partei>
      <xjustiz:partei rolle="Antragsgegner">${parties.opponent || "Gegenseite"}</xjustiz:partei>
    </xjustiz:beteiligte>
    <xjustiz:qualifizierteSignatur vorhanden="true" />
  </xjustiz:inhalt>
</xjustiz:nachricht>`;
}

/**
 * Download-Helfer für beA XML
 */
export function downloadBeAXmlFile(fileNumber: string, court: string, sender: string, opponent: string, subject: string) {
  const xmlData = generateBeAXmlMetadata(fileNumber, court, { sender, opponent }, subject);
  const blob = new Blob([xmlData], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `beA_XJustiz_${fileNumber ? fileNumber.replace(/[\/\s]/g, "_") : "Schriftsatz"}.xml`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 49. Prozesskostenhilfe-Automatik (PKH-Rechner nach § 115 ZPO)
 */
export function calculatePKHEligibility(netIncome: number, rentCost: number, dependents: number = 0) {
  // Grundfreibetrag 2026 für Erwerbstätige ca. 552 € + Unterkunftskosten
  const basicAllowance = 552.0;
  const dependentAllowance = dependents * 400.0;
  const totalDeductions = basicAllowance + rentCost + dependentAllowance;
  const disposableIncome = Math.max(0, netIncome - totalDeductions);

  let monthlyRate = 0;
  let eligible = false;
  let verdict = "";

  if (disposableIncome <= 20) {
    eligible = true;
    monthlyRate = 0;
    verdict = "Anspruch auf vollumfängliche, ratenfreie Prozesskostenhilfe (PKH) nach § 115 ZPO.";
  } else if (disposableIncome <= 600) {
    eligible = true;
    monthlyRate = Math.round(disposableIncome / 2);
    verdict = `PKH-Bewilligung mit monatlicher Ratenzahlung von ca. ${monthlyRate} € möglich.`;
  } else {
    eligible = false;
    monthlyRate = 0;
    verdict = "Einkommensgrenzen für PKH überschritten. Eigenfinanzierung oder Rechtsschutz erforderlich.";
  }

  return {
    isEligible: eligible,
    disposableIncome,
    monthlyRate,
    verdict
  };
}
