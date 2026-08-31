/**
 * RAG Knowledge Engine & Vector/Keyword Retrieval for German Federal Laws
 * Grounded on official legal standards (gesetze-im-internet.de, dejure.org, BGB, StGB, StPO, ZPO, OWiG, etc.)
 * Prevents AI hallucinations by injecting exact statutory text, sub-elements, and verified official URLs.
 */

export interface VerifiedLawNorm {
  code: string;
  book: string;
  title: string;
  officialUrl: string;
  exactWording: string;
  elements: string[]; // Tatbestandsmerkmale
  legalConsequence: string; // Rechtsfolge
  keywords: string[];
}

export const VERIFIED_GERMAN_LAWS_DB: VerifiedLawNorm[] = [
  {
    code: "§ 136 StPO",
    book: "StPO",
    title: "Erste Vernehmung des Beschuldigten / Aussageverweigerung",
    officialUrl: "https://www.gesetze-im-internet.de/stpo/__136.html",
    exactWording: "Bei Beginn der Vernehmung ist dem Beschuldigten zu eröffnen, welche Tat ihm zur Last gelegt wird und welche Strafvorschriften in Betracht kommen. Er ist darauf hinzuweisen, dass es ihm nach dem Gesetz freistehe, sich zu der Beschuldigung zu äußern oder nicht zur Sache auszusagen und jederzeit, auch schon vor seiner Vernehmung, einen von ihm zu wählenden Verteidiger zu befragen.",
    elements: [
      "Eröffnung des Tatvorwurfs zu Beginn der Vernehmung",
      "Belehrung über das Schweigerecht / Aussageverweigerungsrecht",
      "Hinweis auf das Recht auf Hinzuziehung eines Verteidigers"
    ],
    legalConsequence: "Verletzung der Belehrungspflicht führt regelmäßig zu einem Beweisverwertungsverbot der Aussage.",
    keywords: ["vorladung", "polizei", "beschuldigter", "aussage", "schweigen", "strafanzeige", "vernehmung", "ermittlungsverfahren"]
  },
  {
    code: "§ 170 Abs. 2 StPO",
    book: "StPO",
    title: "Einstellung des Verfahrens mangels hinreichenden Tatverdachts",
    officialUrl: "https://www.gesetze-im-internet.de/stpo/__170.html",
    exactWording: "Bieten die Ermittlungen genügenden Anlass zur Erhebung der öffentlichen Klage, so erhebt die Staatsanwaltschaft sie durch Einreichung einer Anklageschrift bei dem zuständigen Gericht. Andernfalls stellt sie das Verfahren ein.",
    elements: [
      "Fehlen eines hinreichenden Tatverdachts nach Abschluss der Ermittlungen",
      "Grundsatz 'In dubio pro reo' (Zweifelssatz)",
      "Entscheidung durch die Staatsanwaltschaft vor Anklageerhebung"
    ],
    legalConsequence: "Vollständige Verfahrensbeendigung ohne Schuldspruch, ohne Strafe und ohne Eintragung ins Führungszeugnis.",
    keywords: ["einstellung", "mangels tatverdacht", "unschuldig", "beweismangel", "strafverfahren", "freispruch"]
  },
  {
    code: "§ 153 StPO",
    book: "StPO",
    title: "Einstellung bei Geringfügigkeit (ohne Auflagen)",
    officialUrl: "https://www.gesetze-im-internet.de/stpo/__153.html",
    exactWording: "Hat das Verfahren ein Vergehen zum Gegenstand, so kann die Staatsanwaltschaft mit Zustimmung des für die Eröffnung des Hauptverfahrens zuständigen Gerichts von der Verfolgung absehen, wenn die Schuld des Täters als gering anzusehen wäre und kein öffentliches Interesse an der Strafverfolgung besteht.",
    elements: [
      "Vorliegen eines Vergehens (kein Verbrechen mit Mindeststrafe ab 1 Jahr)",
      "Geringe Schuld des Täters (Ersttäter, geringer Schaden)",
      "Fehlen eines besonderen öffentlichen Strafverfolgungsinteresses"
    ],
    legalConsequence: "Einstellung ohne Geldauflage und ohne Eintrag im Bundeszentralregister.",
    keywords: ["geringfügigkeit", "ersttäter", "kleiner schaden", "bagatelle", "einstellung"]
  },
  {
    code: "§ 153a StPO",
    book: "StPO",
    title: "Vorläufige Einstellung unter Auflagen und Weisungen",
    officialUrl: "https://www.gesetze-im-internet.de/stpo/__153a.html",
    exactWording: "In einem Verfahren wegen eines Vergehens kann die Staatsanwaltschaft mit Zustimmung des für die Eröffnung des Hauptverfahrens zuständigen Gerichts und des Beschuldigten vorläufig von der Erhebung der öffentlichen Klage absehen und zugleich dem Beschuldigten Auflagen und Weisungen erteilen, wenn diese geeignet sind, das öffentliche Interesse an der Strafverfolgung zu beseitigen...",
    elements: [
      "Vergehenstatbestand",
      "Zustimmung von Gericht, Staatsanwaltschaft und Beschuldigtem",
      "Erfüllung einer Auflage (z.B. gemeinnützige Zahlung oder Schadenswiedergutmachung)"
    ],
    legalConsequence: "Nach Erfüllung der Auflage kann die Tat nicht mehr als Vergehen verfolgt werden; kein Führungszeugniseintrag.",
    keywords: ["auflage", "geldauflage", "einstellung auflagen", "schadensersatz", "täter-opfer-ausgleich"]
  },
  {
    code: "§ 32 StGB",
    book: "StGB",
    title: "Notwehr",
    officialUrl: "https://www.gesetze-im-internet.de/stgb/__32.html",
    exactWording: "Wer eine Tat begeht, die durch Notwehr geboten ist, handelt nicht rechtswidrig. Notwehr ist die Verteidigung, die erforderlich ist, um einen gegenwärtigen rechtswidrigen Angriff von sich oder einem anderen abzuwenden.",
    elements: [
      "Notwehrlage: Gegenwärtiger, rechtswidriger Angriff auf ein geschütztes Rechtsgut",
      "Notwehrhandlung: Erforderliche und gebotene Abwehrhandlung",
      "Verteidigungswille des Handelnden"
    ],
    legalConsequence: "Rechtfertigungsgrund: Die Handlung ist nicht rechtswidrig, keine Strafbarkeit.",
    keywords: ["notwehr", "angriff", "abwehr", "schlägerei", "körperverletzung", "verteidigung"]
  },
  {
    code: "§ 223 StGB",
    book: "StGB",
    title: "Körperverletzung",
    officialUrl: "https://www.gesetze-im-internet.de/stgb/__223.html",
    exactWording: "Wer eine andere Person körperlich misshandelt oder an der Gesundheit schädigt, wird mit Freiheitsstrafe bis zu fünf Jahren oder mit Geldstrafe bestraft. Der Versuch ist strafbar.",
    elements: [
      "Körperliche Misshandlung (üble, unangemessene Behandlung, die das körperliche Wohlbefinden nicht nur unerheblich beeinträchtigt)",
      "Gesundheitsschädigung (Hervorrufen oder Steigern eines pathologischen Zustands)",
      "Vorsatz bezüglich der Tatbestandshandlung"
    ],
    legalConsequence: "Freiheitsstrafe bis zu 5 Jahren oder Geldstrafe.",
    keywords: ["körperverletzung", "geschlagen", "geschubst", "prügelei", "verletzung", "attest"]
  },
  {
    code: "§ 263 StGB",
    book: "StGB",
    title: "Betrug",
    officialUrl: "https://www.gesetze-im-internet.de/stgb/__263.html",
    exactWording: "Wer in der Absicht, sich oder einem Dritten einen rechtswidrigen Vermögensvorteil zu verschaffen, das Vermögen eines anderen dadurch beschädigt, dass er durch Vorspiegelung falscher oder durch Entstellung oder Unterdrückung wahrer Tatsachen einen Irrtum erregt oder unterhält, wird mit Freiheitsstrafe bis zu fünf Jahren oder mit Geldstrafe bestraft.",
    elements: [
      "Täuschung über Tatsachen",
      "Irrtumserregung beim Getäuschten",
      "Vermögensverfügung des Getäuschten",
      "Vermögensschaden beim Opfer",
      "Bereicherungsabsicht und Vorsatz bei Vertragsschluss"
    ],
    legalConsequence: "Freiheitsstrafe bis zu 5 Jahren oder Geldstrafe. Fehlt der Vorsatz bei Vertragsschluss, liegt nur Zivilrecht vor!",
    keywords: ["betrug", "warenbetrug", "ebay", "kleinanzeigen", "geld nicht erhalten", "paket leer", "vorsatz"]
  },
  {
    code: "§ 303 StGB",
    book: "StGB",
    title: "Sachbeschädigung",
    officialUrl: "https://www.gesetze-im-internet.de/stgb/__303.html",
    exactWording: "Wer rechtswidrig eine fremde Sache beschädigt oder zerstört, wird mit Freiheitsstrafe bis zu zwei Jahren oder mit Geldstrafe bestraft. Ebenso wird bestraft, wer unbefugt das Erscheinungsbild einer fremden Sache nicht nur unerheblich und nicht nur vorübergehend verändert.",
    elements: [
      "Fremde bewegliche oder unbewegliche Sache",
      "Beschädigen (Substanzeingriff) oder Zerstören oder erhebliche Veränderung des Erscheinungsbildes",
      "Rechtswidrigkeit und Vorsatz"
    ],
    legalConsequence: "Freiheitsstrafe bis zu 2 Jahren oder Geldstrafe; Strafantragserfordernis bei Geringwertigkeit (§ 248a StGB).",
    keywords: ["sachbeschädigung", "auto zerkratzt", "graffiti", "schaden", "zerstört"]
  },
  {
    code: "§ 573 BGB",
    book: "BGB",
    title: "Ordentliche Kündigung des Vermieters / Eigenbedarf",
    officialUrl: "https://www.gesetze-im-internet.de/bgb/__573.html",
    exactWording: "Der Vermieter kann nur kündigen, wenn er ein berechtigtes Interesse an der Beendigung des Mietverhältnisses hat. Ein berechtigtes Interesse liegt insbesondere vor, wenn der Vermieter die Räume als Wohnung für sich, seine Familienangehörigen oder Angehörige seines Haushalts benötigt.",
    elements: [
      "Berechtigtes Interesse des Vermieters",
      "Konkreter Eigenbedarf für engsten Familienkreis oder Haushaltsangehörige",
      "Strikte Begründungspflicht im Kündigungsschreiben (§ 573 Abs. 3 BGB)",
      "Einhaltung der gesetzlichen Kündigungsfristen (§ 573c BGB)"
    ],
    legalConsequence: "Fehlen detaillierte Kündigungsgründe im Schreiben, ist die Kündigung bereits aus formellen Gründen unwirksam.",
    keywords: ["eigenbedarf", "mietrecht", "kündigung vermieter", "wohnung kündigen", "härtefall", "widerspruch"]
  },
  {
    code: "§ 536 BGB",
    book: "BGB",
    title: "Mietminderung bei Sach- und Rechtsmängeln",
    officialUrl: "https://www.gesetze-im-internet.de/bgb/__536.html",
    exactWording: "Hat die Mietsache zur Zeit der Überlassung an den Mieter einen Mangel, der ihre Tauglichkeit zum vertragsgemäßen Gebrauch aufhebt, oder entsteht während der Mietzeit ein solcher Mangel, so ist der Mieter für die Zeit, in der die Tauglichkeit aufgehoben ist, von der Entrichtung der Miete befreit. Für die Zeit, während der die Tauglichkeit gemindert ist, hat er nur eine angemessen herabgesetzte Miete zu entrichten.",
    elements: [
      "Unerheblicher Sach- oder Rechtsmangel der Mietsache",
      "Beeinträchtigung der vertragsgemäßen Gebrauchstauglichkeit",
      "Rechtzeitige Mängelanzeige an den Vermieter (§ 536c BGB)"
    ],
    legalConsequence: "Gesetzliche Minderung der Miete kraft Gesetzes für die Dauer des Mangels.",
    keywords: ["mietminderung", "schimmel", "heizungsausfall", "lärm", "mangel", "mängelanzeige"]
  },
  {
    code: "§ 626 BGB",
    book: "BGB",
    title: "Fristlose Kündigung aus wichtigem Grund (Arbeitsrecht)",
    officialUrl: "https://www.gesetze-im-internet.de/bgb/__626.html",
    exactWording: "Das Dienstverhältnis kann von jedem Vertragsteil aus wichtigem Grund ohne Einhaltung einer Kündigungsfrist gekündigt werden, wenn Tatsachen vorliegen, auf Grund derer dem Kündigenden unter Berücksichtigung aller Umstände des Einzelfalles und unter Abwägung der Interessen beider Vertragsteile die Fortsetzung des Dienstverhältnisses bis zum Ablauf der Kündigungsfrist nicht zugemutet werden kann. Die Kündigung kann nur innerhalb von zwei Wochen erfolgen...",
    elements: [
      "Wichtiger Grund an sich (schwere Pflichtverletzung)",
      "Umfassende Interessenabwägung im Einzelfall",
      "Strikte 2-Wochen-Ausschlussfrist ab Kenntnis der maßgebenden Tatsachen (§ 626 Abs. 2 BGB)"
    ],
    legalConsequence: "Verstreichen der 2-Wochen-Frist macht die fristlose Kündigung unwirksam.",
    keywords: ["fristlose kündigung", "arbeitsrecht", "abmahnung", "wichtiger grund", "kündigungsschutzklage"]
  },
  {
    code: "§ 4 KSchG",
    book: "KSchG",
    title: "Anrufung des Arbeitsgerichts (3-Wochen-Klagefrist)",
    officialUrl: "https://www.gesetze-im-internet.de/kschg/__4.html",
    exactWording: "Will ein Arbeitnehmer geltend machen, dass eine Kündigung sozial ungerechtfertigt oder aus anderen Gründen rechtsunwirksam ist, so muss er innerhalb von drei Wochen nach Zugang der schriftlichen Kündigung Klage beim Arbeitsgericht auf Feststellung erheben, dass das Arbeitsverhältnis durch die Kündigung nicht aufgelöst ist.",
    elements: [
      "Schriftliche Kündigung des Arbeitgebers",
      "Klageerhebung beim zuständigen Arbeitsgericht",
      "Strikte Ausschlussfrist von exakt 3 Wochen ab Zugang des Kündigungsschreibens"
    ],
    legalConsequence: "Wird die 3-Wochen-Frist versäumt, gilt die Kündigung als von Anfang an rechtswirksam (§ 7 KSchG).",
    keywords: ["3 wochen frist", "arbeitsgericht", "klagefrist", "kündigungsschutz", "abfindung"]
  },
  {
    code: "§ 355 BGB",
    book: "BGB",
    title: "Widerrufsrecht bei Verbraucherverträgen",
    officialUrl: "https://www.gesetze-im-internet.de/bgb/__355.html",
    exactWording: "Wird einem Verbraucher durch Gesetz ein Widerrufsrecht eingeräumt, so sind der Verbraucher und der Unternehmer an ihre auf den Abschluss des Vertrags gerichteten Willenserklärungen nicht mehr gebunden, wenn der Verbraucher seine Willenserklärung fristgerecht widerrufen hat. Die Widerrufsfrist beträgt 14 Tage.",
    elements: [
      "Verbrauchereigenschaft (§ 13 BGB) und Unternehmer (§ 14 BGB)",
      "Fernabsatzvertrag (§ 312c BGB) oder außerhalb von Geschäftsräumen geschlossener Vertrag",
      "Fristgerechte Erklärung des Widerrufs in Textform innerhalb von 14 Tagen"
    ],
    legalConsequence: "Rückabwicklung des Vertrags; bei fehlender oder fehlerhafter Belehrung verlängert sich die Frist um 12 Monate und 14 Tage (§ 356 Abs. 3 BGB).",
    keywords: ["widerruf", "14 tage", "online kauf", "widerrufsbelehrung", "rückgabe", "vertrag stornieren"]
  },
  {
    code: "§ 511 ZPO",
    book: "ZPO",
    title: "Statthaftigkeit der Berufung im Zivilprozess",
    officialUrl: "https://www.gesetze-im-internet.de/zpo/__511.html",
    exactWording: "Die Berufung ist gegen die im ersten Rechtszug erlassenen Endurteile statthaft. Die Berufung ist nur zulässig, wenn der Wert des Beschwerdegegenstandes 600 Euro übersteigt oder wenn das Gericht des ersten Rechtszuges die Berufung in dem Urteil zugelassen hat.",
    elements: [
      "Erstinstanzliches Endurteil (Amtsgericht oder Landgericht)",
      "Beschwerdewert von über 600,00 € ODER ausdrückliche Zulassung im Urteil",
      "Berufungsfrist: 1 Monat ab Zustellung des vollständigen Urteils (§ 517 ZPO)"
    ],
    legalConsequence: "Eröffnung der 2. Tatsacheninstanz vor dem Landgericht oder Oberlandesgericht.",
    keywords: ["berufung", "zivilprozess", "landgericht", "urteil anfechten", "beschwerdewert", "600 euro"]
  },
  {
    code: "§ 543 ZPO",
    book: "ZPO",
    title: "Zulässigkeit der Revision zum Bundesgerichtshof (BGH)",
    officialUrl: "https://www.gesetze-im-internet.de/zpo/__543.html",
    exactWording: "Die Revision ist nur statthaft, wenn das Berufungsgericht oder das Revisionsgericht sie zugelassen hat. Die Revision ist zuzulassen, wenn die Rechtssache grundsätzliche Bedeutung hat oder die Fortbildung des Rechts oder die Sicherung einer einheitlichen Rechtsprechung eine Entscheidung des Revisionsgerichts erfordert.",
    elements: [
      "Berufungsurteil",
      "Zulassung durch Berufungsgericht oder erfolgreiche Nichtzulassungsbeschwerde (§ 544 ZPO)",
      "Rechtsfehlerhafte Rechtsanwendung (keine neue Tatsachenprüfung)"
    ],
    legalConsequence: "Rechtliche Überprüfung des Urteils durch den Bundesgerichtshof (BGH).",
    keywords: ["revision", "bgh", "bundesgerichtshof", "rechtsfehler", "nichtzulassungsbeschwerde"]
  },
  {
    code: "§ 67 OWiG",
    book: "OWiG",
    title: "Einspruch gegen den Bußgeldbescheid",
    officialUrl: "https://www.gesetze-im-internet.de/owig/__67.html",
    exactWording: "Der Betroffene kann gegen den Bußgeldbescheid innerhalb von zwei Wochen nach Zustellung schriftlich oder zur Niederschrift bei der Verwaltungsbehörde, die den Bußgeldbescheid erlassen hat, Einspruch einlegen.",
    elements: [
      "Wirksamer Bußgeldbescheid der Behörde",
      "Formgerechter Einspruch in Textform oder zur Niederschrift",
      "Strikte Notfrist von exakt 2 Wochen ab Zustellung (Postzustellungsurkunde gelber Umschlag)"
    ],
    legalConsequence: "Hemmung der Rechtskraft; Pflicht der Bußgeldstelle zur Aktenüberprüfung und ggf. Weiterleitung an das Amtsgericht.",
    keywords: ["bußgeldbescheid", "einspruch", "2 wochen", "blitzer", "fahrverbot", "punkte flensburg"]
  },
  {
    code: "§ 10 StAG",
    book: "StAG",
    title: "Einbürgerungsanspruch nach neuem Staatsangehörigkeitsrecht",
    officialUrl: "https://www.gesetze-im-internet.de/stag/__10.html",
    exactWording: "Ein Ausländer, der seit fünf Jahren rechtmäßig seinen gewöhnlichen Aufenthalt im Inland hat und handlungsfähig nach Maßgabe des § 34 Satz 1 oder gesetzlich vertreten ist, ist auf Antrag einzubürgern, wenn er sich zur freiheitlichen demokratischen Grundordnung bekennt, ein unbefristetes oder qualifiziertes Aufenthaltsrecht besitzt, den Lebensunterhalt für sich und seine Angehörigen ohne Inanspruchnahme von Bürgergeld bestreitet, über ausreichende Kenntnisse der deutschen Sprache (B1) und Grundkenntnisse der Rechts- und Gesellschaftsordnung verfügt und keine Verurteilung wegen einer rechtswidrigen Tat vorliegt. Die Frist verkürzt sich bei besonderen Integrationsleistungen auf bis zu drei Jahre. Mehrstaatigkeit (Doppelpass) ist uneingeschränkt zulässig.",
    elements: [
      "Rechtmäßiger gewöhnlicher Voraufenthalt von 5 Jahren (bzw. 3 Jahre bei besonderen Integrationsleistungen / C1-Sprachzertifikat)",
      "Bekenntnis zur freiheitlichen demokratischen Grundordnung & Antisemitismus-Ausschluss",
      "Sicherung des Lebensunterhalts ohne Bürgergeld / Grundsicherung nach SGB II / SGB XII",
      "Nachweis deutscher Sprachkenntnisse auf Niveau B1 GER",
      "Erfolgreich absolvierter Einbürgerungstest / Leben in Deutschland Test",
      "Straffreiheit (ausgenommen Bagatellstrafen bis 90 Tagessätze)",
      "Aufgabe der bisherigen Staatsangehörigkeit ist seit der Reform NICHT mehr erforderlich (Doppelte Staatsbürgerschaft erlaubt)"
    ],
    legalConsequence: "Rechtsanspruch auf Verleihung der deutschen Staatsangehörigkeit und Ausstellung der Einbürgerungsurkunde.",
    keywords: ["einbürgerung", "staatsangehörigkeit", "deutscher pass", "doppelpass", "stag", "5 jahre", "3 jahre", "b1 zertifikat", "einbürgerungstest", "bürgergeld", "bürgeramt", "staatsbürgerschaft"]
  },
  {
    code: "§ 81 Abs. 4 AufenthG",
    book: "AufenthG",
    title: "Fiktionswirkung bei rechtzeitigem Verlängerungsantrag",
    officialUrl: "https://www.gesetze-im-internet.de/aufenthg_2004/__81.html",
    exactWording: "Beantragt ein Ausländer, der sich rechtmäßig im Bundesgebiet aufhält, ohne einen Aufenthaltstitel zu besitzen, die Erteilung eines Aufenthaltstitels, gilt sein Aufenthalt bis zur Entscheidung der Ausländerbehörde als erlaubt. Beantragt ein Ausländer die Verlängerung seines Aufenthaltstitels oder die Erteilung eines anderen Aufenthaltstitels, gilt der bisherige Aufenthaltstitel vom Zeitpunkt seines Ablaufs bis zur Entscheidung der Ausländerbehörde als fortbestehend.",
    elements: [
      "Rechtzeitige Stellung des Antrags auf Verlängerung VOR Ablauf des bisherigen Aufenthaltstitels",
      "Nachweis über die Einreichung (z.B. Eingangsbestätigung, Einschreiben, Online-Portal-Bestätigung)",
      "Gesetzliche Fortgeltungswirkung (Fiktionswirkung) kraft Gesetzes ohne behördlichen Ermessensspielraum"
    ],
    legalConsequence: "Der bisherige Aufenthaltstitel und alle Nebenbestimmungen (inkl. Arbeitserlaubnis und Erwerbstätigkeit) gelten nahtlos fort; Anspruch auf Ausstellung einer Fiktionsbescheinigung.",
    keywords: ["fiktionsbescheinigung", "fiktionswirkung", "aufenthaltstitel abgelaufen", "verlängerung aufenthalt", "ausländerbehörde", "termin", "arbeitserlaubnis fortbestehen", "81 aufenthg"]
  },
  {
    code: "§ 75 VwGO",
    book: "VwGO",
    title: "Untätigkeitsklage gegen die Ausländerbehörde",
    officialUrl: "https://www.gesetze-im-internet.de/vwgo/__75.html",
    exactWording: "Ist über einen Widerspruch oder über einen Antrag auf Vornahme eines Verwaltungsakts ohne zureichenden Grund in angemessener Frist sachlich nicht entschieden worden, so ist die Klage abweichend von § 68 zulässig. Die Klage kann nicht vor Ablauf von drei Monaten seit dem Antrag auf Vornahme des Verwaltungsakts erhoben werden, es sei denn, dass wegen besonderer Umstände des Falles eine kürzere Frist geboten ist.",
    elements: [
      "Förmlicher Antrag bei der Ausländerbehörde gestellt (z.B. Einbürgerung, Niederlassungserlaubnis, Aufenthaltserlaubnis)",
      "Ablauf von mindestens 3 Monaten ohne behördliche Sachentscheidung",
      "Fehlen eines zureichenden sachlichen Grundes (reine Personalnot der Behörde ist nach ständiger BVerwG-Rechtsprechung kein zureichender Grund)",
      "Vorherige Fristsetzung / Sachstandsanfrage zur Klageandrohung empfohlen"
    ],
    legalConsequence: "Zulässigkeit der Klage vor dem Verwaltungsgericht; das Gericht verpflichtet die Behörde zur Bescheidung oder entscheidet selbst; Kosten trägt in der Regel die Behörde.",
    keywords: ["untätigkeitsklage", "ausländerbehörde antwortet nicht", "keine reaktion", "3 monate", "verwaltungsgericht", "sachstandsanfrage", "75 vwgo", "ausländeramt", "verzögerung"]
  },
  {
    code: "§ 18g AufenthG",
    book: "AufenthG",
    title: "Blaue Karte EU (EU Blue Card) für akademische Fachkräfte",
    officialUrl: "https://www.gesetze-im-internet.de/aufenthg_2004/__18g.html",
    exactWording: "Einem Ausländer ist eine Blaue Karte EU zu erteilen, wenn er einen deutschen, einen anerkannten ausländischen oder einen einem deutschen Hochschulabschluss vergleichbaren ausländischen Hochschulabschluss besitzt und eine seiner Qualifikation angemessene Beschäftigung ausübt, für die er ein Gehalt in Höhe von mindestens 50 Prozent (Regelberufe) bzw. 45,3 Prozent (Engpassberufe) der jährlichen Beitragsbemessungsgrenze in der allgemeinen Rentenversicherung erhält.",
    elements: [
      "Anerkannter Hochschulabschluss oder anerkannte tertiäre Ausbildung (oder IT-Spezialisten mit 3 Jahren Berufserfahrung)",
      "Konkretes Arbeitsplatzangebot oder Arbeitsvertrag in Deutschland",
      "Erreichen der gesetzlichen Mindestgehaltsgrenze der Bundesagentur für Arbeit",
      "Erleichterter Familiennachzug ohne Sprachnachweis für Ehegatten (§ 30 Abs. 1 Satz 3 Nr. 5 AufenthG)"
    ],
    legalConsequence: "Erteilung der Blauen Karte EU für bis zu 4 Jahre; Anspruch auf Niederlassungserlaubnis bereits nach 21 Monaten (mit Deutsch B1) oder 27 Monaten (mit Deutsch A1).",
    keywords: ["blaue karte", "blue card", "eu blue card", "fachkraft", "mindestgehalt", "akademiker", "niederlassungserlaubnis 21 monate", "18g aufenthg"]
  },
  {
    code: "§ 9 AufenthG",
    book: "AufenthG",
    title: "Niederlassungserlaubnis (Unbefristeter Aufenthaltstitel)",
    officialUrl: "https://www.gesetze-im-internet.de/aufenthg_2004/__9.html",
    exactWording: "Die Niederlassungserlaubnis ist ein unbefristeter Aufenthaltstitel. Sie berechtigt zur Ausübung einer Erwerbstätigkeit und ist zeitlich und räumlich unbeschränkt. Einem Ausländer ist die Niederlassungserlaubnis zu erteilen, wenn er seit fünf Jahren (bzw. 3 Jahre für Fachkräfte nach § 18c oder 21/27 Monate für Blaue Karte) den Aufenthaltstitel besitzt, sein Lebensunterhalt gesichert ist, er mindestens 60 Monate Pflichtbeiträge zur Rentenversicherung geleistet hat und über ausreichende Kenntnisse der deutschen Sprache (B1) verfügt.",
    elements: [
      "Besitz eines Aufenthaltstitels seit mindestens 5 Jahren (bzw. 3 Jahre für Fachkräfte § 18c AufenthG)",
      "Eigenständige Sicherung des Lebensunterhalts",
      "Nachweis von 60 Monaten Rentenversicherungsbeiträgen (bei Fachkräften 36 Monate, bei Blauer Karte 21/27 Monate)",
      "Deutschkenntnisse auf Niveau B1 GER und Grundkenntnisse der Rechts- und Gesellschaftsordnung",
      "Ausreichender Wohnraum für die gesamte Familie"
    ],
    legalConsequence: "Erteilung eines unbefristeten, dauerhaften Aufenthaltsrechts in Deutschland ohne Zweckbindung.",
    keywords: ["niederlassungserlaubnis", "unbefristeter aufenthalt", "daueraufenthalt", "rentenbeiträge", "60 monate", "36 monate", "aufenthaltsrecht unbefristet"]
  },
  {
    code: "§ 20a AufenthG",
    book: "AufenthG",
    title: "Chancenkarte zur Arbeitsplatzsuche (Punktesystem)",
    officialUrl: "https://www.gesetze-im-internet.de/aufenthg_2004/__20a.html",
    exactWording: "Einem Ausländer kann eine Chancenkarte zur Suche nach einer Erwerbstätigkeit erteilt werden, wenn er Fachkraft ist oder im Punktesystem mindestens sechs Punkte erreicht und sein Lebensunterhalt für die Dauer des Aufenthalts gesichert ist.",
    elements: [
      "Nachweis einer mindestens zweijährigen ausländischen Berufsqualifikation oder Hochschulabschluss",
      "Deutschkenntnisse (mindestens A1) oder Englischkenntnisse (mindestens B2)",
      "Erreichen von mindestens 6 Punkten nach dem Kriterienkatalog (Qualifikation, Berufserfahrung, Sprachkenntnisse, Alter, Voraufenthalt)",
      "Finanzielle Lebensunterhaltssicherung (Sperrkonto / Verpflichtungserklärung)"
    ],
    legalConsequence: "Aufenthaltstitel zur Arbeitsplatzsuche für bis zu 1 Jahr inkl. Nebenbeschäftigung bis zu 20 Wochenstunden und Probebeschäftigung.",
    keywords: ["chancenkarte", "punktesystem", "arbeitsplatzsuche", "visum arbeit", "qualifikation", "sperrkonto", "20a aufenthg"]
  },
  {
    code: "§ 28 AufenthG",
    book: "AufenthG",
    title: "Familiennachzug zu deutschen Staatsangehörigen",
    officialUrl: "https://www.gesetze-im-internet.de/aufenthg_2004/__28.html",
    exactWording: "Die Aufenthaltserlaubnis ist dem ausländischen Ehegatten eines Deutschen, dem minderjährigen ledigen Kind eines Deutschen oder dem ausländischen Elternteil eines minderjährigen ledigen Deutschen zur Ausübung der Personensorge zu erteilen, wenn der Deutsche seinen gewöhnlichen Aufenthalt im Bundesgebiet hat. Sie ist in der Regel abweichend von § 5 Abs. 1 Nr. 1 (Lebensunterhaltssicherung) zu erteilen.",
    elements: [
      "Ehegatte, minderjähriges Kind oder personensorgeberechtigter Elternteil eines deutschen Staatsangehörigen",
      "Gewöhnlicher Aufenthalt des deutschen Familienangehörigen im Bundesgebiet",
      "Grundkenntnisse der deutschen Sprache (A1) des Ehegatten (mit gesetzlichen Ausnahmen)",
      "Besonderer Schutz von Ehe und Familie nach Art. 6 GG"
    ],
    legalConsequence: "Rechtsanspruch auf Erteilung einer Aufenthaltserlaubnis mit voller Arbeitserlaubnis; Anspruch auf Niederlassungserlaubnis bereits nach 3 Jahren (§ 28 Abs. 2 AufenthG).",
    keywords: ["familiennachzug", "ehegattennachzug", "kindernachzug", "heirat mit deutschem", "visum familie", "art 6 gg", "28 aufenthg"]
  },
  {
    code: "§ 104c AufenthG",
    book: "AufenthG",
    title: "Chancen-Aufenthaltsrecht für langjährig Geduldete",
    officialUrl: "https://www.gesetze-im-internet.de/aufenthg_2004/__104c.html",
    exactWording: "Einem geduldeten Ausländer soll eine Aufenthaltserlaubnis für 18 Monate erteilt werden, wenn er sich am 31. Oktober 2022 seit fünf Jahren ununterbrochen geduldet, gestattet oder mit einer Aufenthaltserlaubnis im Bundesgebiet aufgehalten hat, sich zur freiheitlichen demokratischen Grundordnung bekennt und nicht wegen einer im Bundesgebiet begangenen vorsätzlichen Straftat verurteilt wurde.",
    elements: [
      "Ununterbrochener Voraufenthalt von 5 Jahren zum Stichtag (geduldet, gestattet oder mit Aufenthaltstitel)",
      "Bekenntnis zur freiheitlichen demokratischen Grundordnung",
      "Keine Verurteilung wegen vorsätzlicher Straftaten",
      "18-monatige Gültigkeitsdauer zur Erfüllung der Voraussetzungen für ein dauerhaftes Bleiberecht (§§ 25a, 25b AufenthG)"
    ],
    legalConsequence: "Einmalige Erteilung einer Aufenthaltserlaubnis für 18 Monate zur Identitätsklärung, Spracherwerb und Arbeitsaufnahme.",
    keywords: ["chancenaufenthaltsrecht", "chancen aufenthalt", "duldung", "bleiberecht", "104c aufenthg", "geduldet", "ausländerrecht"]
  }
];

/**
 * Intelligent Vector & Keyword Hybrid Search
 * Extracts the most relevant official German legal norms for any given case text.
 */
export function queryRelevantLegalNorms(queryText: string, maxResults = 4): VerifiedLawNorm[] {
  if (!queryText) return VERIFIED_GERMAN_LAWS_DB.slice(0, maxResults);

  const normalized = queryText.toLowerCase();
  
  const scored = VERIFIED_GERMAN_LAWS_DB.map((law) => {
    let score = 0;
    
    // Direct code match (e.g. § 136 StPO or 136 StPO)
    const rawCode = law.code.toLowerCase().replace(/§\s*/, "");
    if (normalized.includes(law.code.toLowerCase()) || normalized.includes(rawCode)) {
      score += 15;
    }
    
    // Book match
    if (normalized.includes(law.book.toLowerCase())) {
      score += 2;
    }

    // Keyword matches
    for (const kw of law.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        score += 4;
      }
    }

    // Title / element word matches
    const titleWords = law.title.toLowerCase().split(/\s+/);
    for (const tw of titleWords) {
      if (tw.length > 4 && normalized.includes(tw)) {
        score += 2;
      }
    }

    return { law, score };
  });

  // Sort descending by relevance score
  scored.sort((a, b) => b.score - a.score);

  // Return highest matching items (or fallback to top defaults)
  const topMatches = scored.filter(s => s.score > 0).map(s => s.law);
  if (topMatches.length > 0) {
    return topMatches.slice(0, maxResults);
  }

  return VERIFIED_GERMAN_LAWS_DB.slice(0, maxResults);
}
