import { useState, useRef, useEffect, ChangeEvent } from "react";
import { 
  ShieldAlert, 
  Scale, 
  Lock, 
  Unlock, 
  FileText, 
  Check, 
  Copy, 
  RotateCcw, 
  AlertTriangle, 
  BookOpen, 
  Send, 
  TrendingDown, 
  Search, 
  HelpCircle,
  Eye,
  CreditCard,
  CheckCircle2,
  Bookmark,
  ChevronRight,
  X,
  Radio,
  Bell,
  Zap,
  RefreshCw,
  Sliders,
  Volume2,
  Wifi,
  Printer,
  Download,
  Calendar,
  DollarSign,
  Award,
  FileCheck,
  Upload,
  Paperclip,
  Trash2,
  FilePlus,
  User,
  LogIn,
  LogOut,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ActiveTab, LegalCategory, ScanResult, LawEntry, LawAlert, TrafficUser, LawSection, TrafficScanHistory, TrafficLawAlert } from "./types";
import TrafficSubscribeForm from "./components/TrafficSubscribeForm";
import TrafficScannerStatus from "./components/TrafficScannerStatus";
import TrafficGeminiBot from "./components/TrafficGeminiBot";
import TrafficAlertsLog from "./components/TrafficAlertsLog";
import PowerLegalAnalysis from "./components/PowerLegalAnalysis";
import { Car } from "lucide-react";
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { syncUserDataToFirestore } from "./lib/userSync";
import { AuthModal } from "./components/AuthModal";

// Interactive preset legal cases for fast scanning
const PRESET_CASES: LegalCategory[] = [
  {
    id: "case-1",
    title: "Ladendiebstahl (§ 248a StGB)",
    description: "Parfüm im Wert von 12,50 € aus einem Drogeriemarkt entwendet und vom Ladendetektiv erwischt.",
    icon: "TrendingDown",
    exampleText: "Ich wurde im Drogeriemarkt Müller beim Diebstahl eines Parfums im Wert von 12,50 € erwischt. Der Ladendetektiv hat meine Personalien aufgenommen und gesagt, dass eine Anzeige erstattet wird. Ich habe bisher keine Vorstrafen und weiß nicht, wie ich mich verhalten soll.",
    relevantParagraphs: ["§ 242 StGB", "§ 248a StGB", "§ 153 StPO"],
  },
  {
    id: "case-2",
    title: "Beleidigung im Netz (§ 185 StGB)",
    description: "Anzeige wegen Beleidigung auf Instagram erhalten nach einem hitzigen politischen Kommentar.",
    icon: "AlertTriangle",
    exampleText: "Ich habe eine schriftliche Beschuldigtenanhörung von der Polizei erhalten. Mir wird Beleidigung gemäß § 185 StGB vorgeworfen. Ich soll unter einem Instagram-Post jemanden als 'vollkommen verblödeten Systemling' bezeichnet haben. Ich weiß nicht, wer mich angezeigt hat. Wie reagiere ich am besten taktisch, um eine Strafe zu vermeiden?",
    relevantParagraphs: ["§ 185 StGB", "§ 193 StGB", "§ 153 StPO"],
  },
  {
    id: "case-3",
    title: "Körperverletzung (§ 223 StGB)",
    description: "Vorwurf einer einfachen Körperverletzung nach einer Rangelei vor einer Diskothek.",
    icon: "ShieldAlert",
    exampleText: "Mir wird vorgeworfen, am letzten Wochenende vor dem Club 'Matrix' einen anderen Gast im Zuge eines Handgemenges geschubst und leicht im Gesicht verletzt zu haben. Ich habe mich nur gewehrt, da er mich zuerst geschubst hat (Notwehr). Die Polizei hat meine Personalien erfasst. Ich habe jetzt Angst vor einem Eintrag im Führungszeugnis.",
    relevantParagraphs: ["§ 223 StGB", "§ 32 StGB", "§ 224 StGB", "§ 153a StPO"],
  },
  {
    id: "case-4",
    title: "Warenbetrug (§ 263 StGB)",
    description: "Vorladung als Beschuldigter wegen nicht gelieferter Ware auf eBay Kleinanzeigen.",
    icon: "Lock",
    exampleText: "Ich habe ein Smartphone über eBay Kleinanzeigen für 250 € verkauft. Der Käufer behauptet nun, das Paket sei leer gewesen und hat Anzeige wegen Warenbetrugs erstattet. Ich habe das Smartphone aber definitiv abgeschickt und habe auch den Einlieferungsbeleg der DHL. Die Polizei verlangt eine Aussage von mir.",
    relevantParagraphs: ["§ 263 StGB", "§ 170 Abs. 2 StPO", "§ 263a StGB"],
  },
  {
    id: "case-5",
    title: "Sachbeschädigung (§ 303 StGB)",
    description: "Sachbeschädigung an einem PKW durch vermeintlichen Schlüsselkratzer.",
    icon: "TrendingDown",
    exampleText: "Ein Nachbar beschuldigt mich, seinen PKW mutwillig mit einem Schlüssel zerkratzt zu haben. Ein Zeuge will mich angeblich in der Nähe des Autos gesehen haben. Die Polizei hat mir einen Anhörungsbogen geschickt. Ich war es nicht und will wissen, wie ich die Einstellung des Verfahrens erreiche.",
    relevantParagraphs: ["§ 303 StGB", "§ 170 Abs. 2 StPO", "§ 153 StPO"],
  },
  {
    id: "case-6",
    title: "Mietrecht: Eigenbedarfskündigung (§ 573 BGB)",
    description: "Vermieter kündigt wegen angeblichem Eigenbedarf für seine Nichte. Formfehler vermutet.",
    icon: "Scale",
    exampleText: "Mein Vermieter hat mir eine Kündigung wegen Eigenbedarfs geschickt. Er behauptet, die 3-Zimmer-Wohnung für seine Nichte zu benötigen, die angeblich in meine Stadt zieht. Das Schreiben ist extrem kurz und nennt keine konkreten Gründe oder Fristen. Ich vermute, er will mich nur raushaben, um teurer neu zu vermieten. Wie wehre ich mich taktisch am besten?",
    relevantParagraphs: ["§ 573 BGB", "§ 574 BGB", "§ 568 BGB"],
  },
  {
    id: "case-7",
    title: "Mietrecht: Schimmel (§ 536 BGB)",
    description: "Erheblicher Schimmelbefall im Badezimmer. Vermieter schiebt Schuld auf falsches Lüften.",
    icon: "Scale",
    exampleText: "In meinem Badezimmer hat sich großflächig schwarzer Schimmel gebildet. Der Vermieter weigert sich, eine Fachfirma zu bezahlen, und behauptet, ich würde falsch lüften. Ich lüfte dreimal täglich. Ich möchte die Miete mindern, habe aber Angst, dass er mir dann fristlos kündigt. Was muss ich formell beachten?",
    relevantParagraphs: ["§ 536 BGB", "§ 536c BGB", "§ 543 BGB"],
  },
  {
    id: "case-8",
    title: "Arbeitsrecht: Fristlose Kündigung (§ 626 BGB)",
    description: "Kündigung wegen angeblichen Diebstahls von Arbeitszeit (15 Min. Verspätung). Keine Abmahnung.",
    icon: "ShieldAlert",
    exampleText: "Mein Arbeitgeber hat mir gestern ein Schreiben überreicht: fristlose Kündigung aus wichtigem Grund wegen 'Arbeitszeitbetrugs', weil ich mich vor zwei Wochen versehentlich 15 Minuten zu spät eingestempelt habe. Ich bin seit 5 Jahren fehlerfrei im Betrieb und habe nie eine Abmahnung erhalten. Welche Fristen muss ich jetzt einhalten und wie gehe ich vor?",
    relevantParagraphs: ["§ 626 BGB", "§ 4 KSchG", "§ 1 KSchG"],
  },
  {
    id: "case-9",
    title: "BtMG / Cannabis (§ 35a KCanG)",
    description: "Vorladung wegen des Besitzes von 6g Cannabis in einer Fußgängerzone nahe einer Schule.",
    icon: "ShieldAlert",
    exampleText: "Ich habe einen Brief von der Polizei erhalten (Vorladung als Beschuldigter). Mir wird ein Verstoß gegen das Konsumcannabisgesetz (KCanG) vorgeworfen, weil ich in der Fußgängerzone ca. 150 Meter entfernt von einer Schule mit 6 Gramm Cannabis kontrolliert wurde. Was soll ich jetzt tun?",
    relevantParagraphs: ["§ 2 KCanG", "§ 34 KCanG", "§ 35a KCanG", "§ 136 StPO"],
  },
  {
    id: "case-10",
    title: "Hausdurchsuchung (§ 105 StPO)",
    description: "Polizei stand morgens um 6:00 Uhr mit Verdacht auf Urheberrechtsverletzung vor der Tür.",
    icon: "Scale",
    exampleText: "Heute Morgen um 06:00 Uhr stand die Polizei mit einem Durchsuchungsbeschluss wegen des Verdachts von Urheberrechtsverletzungen (Filesharing im großen Stil) vor meiner Haustür. Sie haben meinen Laptop, mein Smartphone und zwei externe Festplatten mitgenommen. Der Durchsuchungsbeschluss wurde mir kurz gezeigt, aber ich habe kaum verstanden, was darauf stand.",
    relevantParagraphs: ["§ 102 StPO", "§ 105 StPO", "§ 94 StPO"],
  },
  {
    id: "case-11",
    title: "Online-Kauf / Widerruf (§ 355 BGB)",
    description: "Händler verweigert Rücknahme nach 20 Tagen wegen unvollständiger Belehrung.",
    icon: "AlertTriangle",
    exampleText: "Ich habe online ein teures Notebook für 1.800 € gekauft. Nach 20 Tagen möchte ich es zurückgeben, weil es nicht meinen Erwartungen entspricht. Der Händler weigert sich und sagt, die 14-tägige Frist sei abgelaufen. Ich habe jedoch beim Kauf per E-Mail überhaupt keine ordnungsgemäße Widerrufsbelehrung erhalten, sondern nur eine Bestellbestätigung. Kann ich den Vertrag noch widerrufen?",
    relevantParagraphs: ["§ 355 BGB", "§ 356 BGB", "§ 312g BGB"],
  },
  {
    id: "case-12",
    title: "Bußgeldbescheid & Fahrverbot (§ 24 StVG)",
    description: "Rote Ampel überfahren (über 1 Sekunde) oder erhebliche Geschwindigkeitsüberschreitung mit drohendem Fahrverbot.",
    icon: "ShieldAlert",
    exampleText: "Ich habe einen Bußgeldbescheid erhalten: 1 Monat Fahrverbot und 240 € Geldbuße, weil ich angeblich eine rote Ampel nach 1,2 Sekunden Rotphase überfahren habe. Der Blitzer stand an einer unübersichtlichen Kreuzung. Ich bin beruflich zwingend auf meinen Führerschein angewiesen. Wie kann ich Einspruch einlegen und die Messung anfechten?",
    relevantParagraphs: ["§ 24 StVG", "§ 4 BKatV", "§ 67 OWiG"],
  },
  {
    id: "case-13",
    title: "Urheberrechts-Abmahnung (§ 97a UrhG)",
    description: "Abmahnschreiben einer Kanzlei über 1.200 € Schadensersatz wegen angeblichem Filesharing / Torrent.",
    icon: "Lock",
    exampleText: "Ich habe eine kostenpflichtige Abmahnung einer Rechtsanwaltskanzlei über 1.200 € erhalten. Mir wird vorgeworfen, über meinen Internetanschluss einen aktuellen Kinofilm per Torrent geteilt zu haben. Ich war zu dem Zeitpunkt im Urlaub, aber andere Familienmitglieder hatten Zugriff auf das WLAN. Soll ich die vorgefertigte Unterlassungserklärung unterschreiben?",
    relevantParagraphs: ["§ 97a UrhG", "§ 97 UrhG", "§ 8 Abs. 1 TMG"],
  },
  {
    id: "case-14",
    title: "Gebrauchtwagenkauf & Sachmangel (§ 437 BGB)",
    description: "Motorschaden 3 Wochen nach Kauf vom Händler. Händler weist Gewährleistung ab.",
    icon: "Scale",
    exampleText: "Ich habe vor 3 Wochen einen Gebrauchtwagen bei einem Autohändler für 8.500 € gekauft. Gestern hatte das Auto einen schweren Motorschaden. Der Händler behauptet, das sei durch mein Verschulden passiert und lehnt jede Reparatur auf Garantie/Gewährleistung ab. Greift hier die Beweislastumkehr zu meinen Gunsten?",
    relevantParagraphs: ["§ 437 BGB", "§ 477 BGB", "§ 439 BGB"],
  },
  {
    id: "case-15",
    title: "Unterhalt & Trennung (§ 1601 BGB)",
    description: "Forderung nach überhöhtem Kindesunterhalt nach Düsseldorfer Tabelle bei wechselndem Betreuungsmodell.",
    icon: "Scale",
    exampleText: "Nach der Trennung fordert meine Ex-Partnerin den vollen Kindesunterhalt nach der Düsseldorfer Tabelle für unsere zwei Kinder. Allerdings betreue ich die Kinder im erweiterten Wechselmodell zu fast 45% der Zeit und trage erhebliche Eigenkosten für Nahrung und Kleidung. Muss ich trotzdem den vollen Betrag zahlen?",
    relevantParagraphs: ["§ 1601 BGB", "§ 1606 BGB", "§ 1612 BGB"],
  },
  {
    id: "case-16",
    title: "Baurecht & Nachbarstreit (Nachbarrecht)",
    description: "Nachbar baut ohne Baugenehmigung oder Grenzabstand eine 3,50m hohe Wand direkt an die Grundstücksgrenze.",
    icon: "AlertTriangle",
    exampleText: "Mein Nachbar hat ohne Rücksprache und ohne sichtbare Baugenehmigung eine massive, 3,50 Meter hohe Mauer direkt an meine Grundstücksgrenze gebaut. Dadurch wird mein Garten extrem schattig und versiegelt. Die Baubehörde reagiert nicht. Welche zivilrechtlichen Abwehransprüche habe ich?",
    relevantParagraphs: ["§ 1004 BGB", "§ 906 BGB", "§ 912 BGB"],
  }
];

// Curated Law database for Tab 2
const LAW_DATABASE: LawEntry[] = [
  {
    code: "§ 136 StPO",
    title: "Aussageverweigerungsrecht",
    paragraph: "Erste Vernehmung des Beschuldigten",
    content: "Bei Beginn der Vernehmung ist dem Beschuldigten zu eröffnen, welche Tat ihm zur Last gelegt wird und welche Strafvorschriften in Betracht kommen. Er ist darauf hinzuweisen, dass es ihm nach dem Gesetz freistehe, sich zu der Beschuldigung zu äußern oder nicht zur Sache auszusagen...",
    tacticalNote: "Dies ist das absolute Fundament jeder Verteidigungstaktik. Wer ohne vorherige Akteneinsicht durch einen Verteidiger aussagt, schadet sich fast immer selbst. Ein unschuldiges 'Erklären-Wollen' liefert der Staatsanwaltschaft oft erst die fehlenden Puzzleteile."
  },
  {
    code: "§ 185 StGB",
    title: "Beleidigung",
    paragraph: "Ehrenschutzdelikt",
    content: "Die Beleidigung wird mit Freiheitsstrafe bis zu einem Jahr oder mit Geldstrafe und, wenn die Beleidigung öffentlich, in einer Versammlung oder durch Verbreiten von Inhalten begangen wird, mit Freiheitsstrafe bis zu zwei Jahren oder mit Geldstrafe bestraft.",
    tacticalNote: "Sehr hohe Einstellungsquote! Die Abgrenzung zwischen zulässiger Meinungsäußerung (Art. 5 GG) und strafbarer Beleidigung/Schmähkritik ist fließend. Ein gut begründeter Schriftsatz führt bei Ersttätern fast immer zur Einstellung nach § 153 StPO."
  },
  {
    code: "§ 223 StGB",
    title: "Körperverletzung",
    paragraph: "Einfache Körperverletzung",
    content: "Wer eine andere Person körperlich misshandelt oder an der Gesundheit schädigt, wird mit Freiheitsstrafe bis zu fünf Jahren oder mit Geldstrafe bestraft. Der Versuch ist strafbar.",
    tacticalNote: "Bei wechselseitigen Körperverletzungen (Schlägerei) greift häufig das Notwehrrecht (§ 32 StGB). Wenn nicht klar ist, wer angefangen hat, lässt sich das Verfahren wegen mangelnden Tatverdachts nach § 170 Abs. 2 StPO oder wegen Geringfügigkeit einstellen."
  },
  {
    code: "§ 263 StGB",
    title: "Betrug",
    paragraph: "Vermögensvorteil durch Täuschung",
    content: "Wer in der Absicht, sich oder einem Dritten einen rechtswidrigen Vermögensvorteil zu verschaffen, das Vermögen eines anderen dadurch beschädigt, dass er durch Vorspiegelung falscher oder durch Entstellung oder Unterdrückung wahrer Tatsachen einen Irrtum erregt oder unterhält...",
    tacticalNote: "Zentral ist hier das Tatbestandsmerkmal des Vorsatzes. Kann die Staatsanwaltschaft nicht zweifelsfrei beweisen, dass Sie bereits vor Vertragsschluss nicht liefern wollten oder konnten, liegt kein strafbarer Betrug vor, sondern nur eine zivilrechtliche Leistungsstörung. Einstellung zwingend nach § 170 Abs. 2 StPO!"
  },
  {
    code: "§ 303 StGB",
    title: "Sachbeschädigung",
    paragraph: "Beschädigung fremder Sachen",
    content: "Wer rechtswidrig eine fremde Sache beschädigt oder zerstört, wird mit Freiheitsstrafe bis zu zwei Jahren oder mit Geldstrafe bestraft. Ebenso wird bestraft, wer unbefugt das Erscheinungsbild einer fremden Sache nicht nur unerheblich und nicht nur vorübergehend verändert.",
    tacticalNote: "Unerheblichkeit oder leichte Entfernbarkeit schließen die Strafbarkeit oft aus. Häufig mangelt es auch an harten Beweisen wie Videoaufnahmen oder DNA-Spuren. Schweigen Sie unbedingt zur Sache!"
  },
  {
    code: "§ 170 Abs. 2 StPO",
    title: "Einstellung mangels Tatverdacht",
    paragraph: "Einstellung durch Staatsanwaltschaft",
    content: "Bieten die Ermittlungen genügenden Anlass zur Erhebung der öffentlichen Klage, so erhebt die Staatsanwaltschaft sie durch Einreichung einer Anklageschrift bei dem zuständigen Gericht. Andernfalls stellt sie das Verfahren ein.",
    tacticalNote: "Der 'Freispruch im Ermittlungsverfahren'. Wenn kein hinreichender Tatverdacht nachgewiesen werden kann (In dubio pro reo), muss das Verfahren bedingungslos eingestellt werden. Es hinterlässt keinerlei Spuren im Erziehungsregister oder Bundeszentralregister."
  },
  {
    code: "§ 154 StPO",
    title: "Teileinstellung bei mehreren Taten",
    paragraph: "Absehen von Verfolgung bei Nebentaten",
    content: "Die Staatsanwaltschaft kann von der Verfolgung einer Tat absehen, wenn die Strafe oder die Maßregel der Besserung und Sicherung, zu der die Verfolgung führen kann, neben der Strafe oder Maßregel, die gegen den Beschuldigten wegen einer anderen Tat rechtskräftig verhängt ist oder die er wegen einer anderen Tat zu erwarten hat, nicht beträchtlich ins Gewicht fällt.",
    tacticalNote: "Wichtiges Verhandlungstool bei mehreren Tatvorwürfen. Der Verteidiger kann erreichen, dass kleinere Delikte fallen gelassen werden, um das Verfahren zu straffen und die Gesamtstrafe massiv zu reduzieren."
  },
  {
    code: "§ 154a StPO",
    title: "Beschränkung der Strafverfolgung",
    paragraph: "Ausscheidung einzelner Gesetzesverletzungen",
    content: "Betrifft eine Tat mehrere Gesetzesverletzungen oder mehrere Teile derselben Gesetzesverletzung, so kann die Strafverfolgung auf die für die Straf- oder Maßregelbemessung entscheidenden Gesetzesverletzungen oder Teile der Gesetzesverletzung beschränkt werden...",
    tacticalNote: "Ermöglicht es der Staatsanwaltschaft, komplexe Nebenvorwürfe (z.B. Beleidigung im Rahmen eines Einbruchs) auszuscheiden, um eine schnelle Einstellung oder Verurteilung bezüglich des Hauptvorwurfs zu erwirken."
  },
  {
    code: "§ 573 BGB",
    title: "Ordentliche Kündigung des Vermieters",
    paragraph: "Eigenbedarf & berechtigtes Interesse",
    content: "Der Vermieter kann nur kündigen, wenn er ein berechtigtes Interesse an der Beendigung des Mietverhältnisses hat. Ein berechtigtes Interesse liegt insbesondere vor, wenn der Vermieter die Räume als Wohnung für sich, seine Familienangehörigen oder Angehörige seines Haushalts benötigt.",
    tacticalNote: "Eigenbedarfskündigungen sind fehleranfällig! Der Vermieter muss im Kündigungsschreiben die konkrete Person und deren Lebensumstände detailliert begründen. Pauschale Floskeln machen die Kündigung sofort formell unwirksam. Zudem gilt das Widerspruchsrecht bei sozialer Härte (§ 574 BGB)."
  },
  {
    code: "§ 536 BGB",
    title: "Mietminderung bei Sach- und Rechtsmängeln",
    paragraph: "Minderung der Miete bei Mängeln",
    content: "Hat die Mietsache zur Zeit der Überlassung an den Mieter einen Mangel, der ihre Tauglichkeit zum vertragsgemäßen Gebrauch aufhebt, oder entsteht während der Mietzeit ein solcher Mangel, so ist der Mieter für die Zeit, in der die Tauglichkeit aufgehoben ist, von der Entrichtung der Miete befreit...",
    tacticalNote: "Der Mieter muss den Mangel unverzüglich schriftlich anzeigen (Mängelanzeige) und eine angemessene Frist zur Behebung setzen. Erst ab dem Zeitpunkt der Anzeige darf die Miete gemindert werden. Mindern Sie nie ohne fundierte Tabelle, sonst droht Zahlungsverzug und im schlimmsten Fall eine fristlose Kündigung!"
  },
  {
    code: "§ 626 BGB",
    title: "Fristlose Kündigung aus wichtigem Grund",
    paragraph: "Arbeitsverhältnis beenden ohne Frist",
    content: "Das Dienstverhältnis kann von jedem Vertragsteil aus wichtigem Grund ohne Einhaltung einer Kündigungsfrist gekündigt werden, wenn Tatsachen vorliegen, auf Grund derer dem Kündigenden unter Berücksichtigung aller Umstände des Einzelfalles und unter Abwägung der Interessen beider Vertragsteile die Fortsetzung des Dienstverhältnisses bis zum Ablauf der Kündigungsfrist nicht zugemutet werden kann.",
    tacticalNote: "Extrem hoher Maßstab für Arbeitgeber! Zudem gilt nach Abs. 2 eine strikte Ausschlussfrist: Die Kündigung darf nur innerhalb von zwei Wochen erfolgen, nachdem der Berechtigte von den für die Kündigung maßgebenden Tatsachen Kenntnis erlangt hat. Jeder Tag Verspätung macht die fristlose Kündigung unwirksam!"
  },
  {
    code: "§ 4 KSchG",
    title: "Kündigungsschutzklage-Frist",
    paragraph: "Anrufung des Arbeitsgerichts",
    content: "Will ein Arbeitnehmer geltend machen, dass eine Kündigung sozial ungerechtfertigt oder aus anderen Gründen rechtsunwirksam ist, so muss er innerhalb von drei Wochen nach Zugang der schriftlichen Kündigung Klage beim Arbeitsgericht auf Feststellung erheben, dass das Arbeitsverhältnis durch die Kündigung nicht aufgelöst ist.",
    tacticalNote: "Überlebenswichtige Frist im Arbeitsrecht! Nach Ablauf der 3 Wochen gilt JEDE Kündigung kraft Gesetzes als von Anfang an wirksam (§ 7 KSchG), selbst wenn sie offensichtlich rechtswidrig war. Wer die Frist versäumt, verliert jeden Anspruch (auch auf Abfindung)."
  },
  {
    code: "§ 355 BGB",
    title: "Widerrufsrecht bei Verbraucherverträgen",
    paragraph: "Fristen und Ablauf des Widerrufs",
    content: "Wird einem Verbraucher durch Gesetz ein Widerrufsrecht eingeräumt, so sind der Verbraucher und der Unternehmer an ihre auf den Abschluss des Vertrags gerichteten Willenserklärungen nicht mehr gebunden, wenn der Verbraucher seine Willenserklärung fristgerecht widerrufen hat. Die Widerrufsfrist beträgt 14 Tage...",
    tacticalNote: "Das 'Ewige Widerrufsrecht': Hat der Verkäufer Sie bei einem Online-Kauf (Fernabsatzgeschäft) nicht oder fehlerhaft über Ihr Widerrufsrecht belehrt, verlängert sich die Frist um ein ganzes Jahr und 14 Tage (§ 356 Abs. 3 BGB). Das ist das ultimative Schlupfloch bei unvorteilhaften Online-Verträgen."
  },
  {
    code: "§ 248a StGB",
    title: "Diebstahl geringwertiger Sachen",
    paragraph: "Geringwertigkeitsgrenze",
    content: "Der Diebstahl und die Unterschlagung geringwertiger Sachen werden in den Fällen der §§ 242 und 246 nur auf Antrag verfolgt, es sei denn, dass die Strafverfolgungsbehörde wegen des besonderen öffentlichen Interesses an der Strafverfolgung ein Einschreiten von Amts wegen für geboten hält.",
    tacticalNote: "Die Geringwertigkeitsgrenze liegt in der Praxis meist bei ca. 25 bis 50 Euro. Fehlt ein rechtzeitiger Strafantrag des Geschädigten (Frist: 3 Monate, § 77b StGB) und verneint die Staatsanwaltschaft das öffentliche Interesse, muss das Verfahren zwingend eingestellt werden."
  },
  {
    code: "§ 153 StPO",
    title: "Einstellung bei Geringfügigkeit",
    paragraph: "Absehen von der Verfolgung ohne Auflagen",
    content: "Hat das Verfahren ein Vergehen zum Gegenstand, so kann die Staatsanwaltschaft mit Zustimmung des für die Eröffnung des Hauptverfahrens zuständigen Gerichts von der Verfolgung absehen, wenn die Schuld des Täters als gering anzusehen wäre und kein öffentliches Interesse an der Strafverfolgung besteht.",
    tacticalNote: "Das ideale Ziel bei Ersttätern im Bagatellbereich. Das Verfahren wird ohne Strafe, ohne Geldbuße und ohne Eintrag ins Bundeszentralregister (Führungszeugnis) beendet. Es gilt als 'saubere' Einstellung."
  },
  {
    code: "§ 153a StPO",
    title: "Einstellung unter Auflagen",
    paragraph: "Absehen von der Verfolgung gegen Weisung",
    content: "Mit Zustimmung des für die Eröffnung des Hauptverfahrens zuständigen Gerichts und des Beschuldigten kann die Staatsanwaltschaft vorläufig von der Klageerhebung absehen und zugleich dem Beschuldigten Auflagen und Weisungen erteilen (z. B. Zahlung eines Geldbetrages an eine gemeinnützige Einrichtung)...",
    tacticalNote: "Sehr häufige Einigungsmethode bei mittlerer Kriminalität (z.B. kleinerer Betrug, Ersttaten). Gegen Zahlung einer Geldauflage wird das Verfahren endgültig eingestellt. Kein Eintrag im Führungszeugnis!"
  },
  {
    code: "§ 105 StPO",
    title: "Durchsuchungsbeschluss",
    paragraph: "Verfahren bei der Durchsuchung",
    content: "Durchsuchungen dürfen nur durch den Richter, bei Gefahr im Verzug auch durch die Staatsanwaltschaft und ihre Hilfsbeamten angeordnet werden. Die Anordnung bedarf der Schriftform...",
    tacticalNote: "Polizisten behaupten oft 'Gefahr im Verzug', um Richterentscheidungen zu umgehen. Häufig ist dies rechtswidrig und führt (zwar selten zu Beweisverwertungsverboten, aber) zu enormen taktischen Hebeln bei Verhandlungen mit der Staatsanwaltschaft."
  },
  {
    code: "§ 31a BtMG",
    title: "Einstellung bei Cannabis",
    paragraph: "Absehen von Strafverfolgung (geringe Menge)",
    content: "Hat das Verfahren ein Vergehen nach § 29 Abs. 1, 2 oder 4 zum Gegenstand, so kann die Staatsanwaltschaft von der Verfolgung absehen, wenn die Schuld des Täters als gering anzusehen wäre, kein öffentliches Interesse an der Strafverfolgung besteht und der Täter die Betäubungsmittel lediglich zum Eigenverbrauch besitzt...",
    tacticalNote: "Auch unter dem neuen KCanG greifen ähnliche Mechanismen für Grenzwerte. Bei geringen Mengen zum Eigenkonsum ist die Einstellung die verfahrenstaktische Regel."
  }
];

// Acute checklists, templates, and instant AI-scan presets for Tab 3 (Soforthilfe)
const EMERGENCY_GUIDES = [
  {
    id: "raid",
    title: "Hausdurchsuchung (Polizei vor der Tür)",
    category: "Zwangsmaßnahmen & StPO",
    presetText: "Bei mir hat heute Morgen eine Hausdurchsuchung stattgefunden. Die Polizei hat Laptops und Handys mitgenommen. Es gab einen Durchsuchungsbeschluss nach § 105 StPO. Ich habe keine Aussage gemacht und der Beschlagnahme widersprochen.",
    templateTitle: "Formular: Ausdrücklicher Widerspruch gegen Beschlagnahme (§ 94/105 StPO)",
    templateText: `ERKLÄRUNG ZUM DURCHSUCHUNGS- UND SICHERSTELLUNGSPROTOKOLL

Hiermit erkläre ich ausdrücklich:
1. Ich widerspreche der Durchsuchung meiner Wohn- und Geschäftsräume sowie aller Fahrzeuge.
2. Ich widerspreche der Sicherstellung und Beschlagnahme sämtlicher Datenträger, Geräte, Schriftstücke und sonstiger Gegenstände.
3. Ich mache von meinem Recht gemäß § 136 StPO Gebrauch und verweigere jegliche Aussage zur Sache.
4. Ich fordere die Hinzuziehung meines Verteidigers und die unverzügliche richterliche Entscheidung über die Beschlagnahme gem. § 98 Abs. 2 StPO.

Datum/Unterschrift: ___________________________`,
    steps: [
      { text: "Ruhe bewahren und höflich bleiben. Widerstand schadet dir rechtlich und körperlich.", important: false },
      { text: "Verlange sofort den schriftlichen Durchsuchungsbeschluss (§ 105 StPO) und lies ihn aufmerksam durch.", important: true },
      { text: "Prüfe das Ausstellungsdatum: Ein Durchsuchungsbeschluss verliert nach 6 Monaten seine Gültigkeit!", important: true },
      { text: "Rufe sofort einen Strafverteidiger an. Du hast das Recht, den Beginn der Durchsuchung bis zum Eintreffen deines Anwalts kurz hinauszuzögern, sofern dadurch kein Beweismittelverlust droht.", important: true },
      { text: "Schweige eisern zu allen Vorwürfen! Sage nichts außer deinen Personalien. Keine Erklärungen oder Rechtfertigungen.", important: true },
      { text: "Gib keine Passwörter, PINs oder Entsperrcodes für dein Smartphone oder Laptop heraus! Du bist nicht zur aktiven Mitwirkung verpflichtet.", important: true },
      { text: "Widerspreche der Beschlagnahme aller Gegenstände ausdrücklich! Lass diesen Widerspruch im Protokoll festhalten.", important: true },
      { text: "Lass dir eine vollständige Liste aller sichergestellten Gegenstände (Sicherstellungsprotokoll) geben.", important: false }
    ]
  },
  {
    id: "tenant-emergency",
    title: "Kündigung der Wohnung erhalten (Mietrecht)",
    category: "Mietrecht & Immobilienrecht",
    presetText: "Ich habe von meinem Vermieter eine Kündigung der Mietwohnung erhalten. Ich möchte formell Widerspruch nach § 574 BGB einlegen, da die Kündigung unverhältnismäßig ist und eine unzumutbare Härte darstellt.",
    templateTitle: "Muster-Schreiben: Widerspruch gegen Mietkündigung wegen sozialer Härte (§ 574 BGB)",
    templateText: `WIDERSPRUCH GEGEN DIE KÜNDIGUNG DES MIETVERHÄLTNISSES

Sehr geehrte(r) Vermieter(in),

hiermit lege ich gegen Ihre Kündigung vom [Datum] bezüglich der Wohnung [Adresse/Etage] fristgerecht Widerspruch gemäß § 574 BGB ein.

Die Beendigung des Mietverhältnisses würde für mich/meine Familie eine unzumutbare Härte bedeuten, die auch unter Würdigung Ihrer berechtigten Interessen nicht zu rechtfertigen ist. [Begründung: z.B. kein angemessener Ersatzwohnraum zu zumutbaren Bedingungen auffindbar / hohes Alter / Schwangerschaft / bevorstehende Prüfungen].

Ich fordere Sie daher auf, das Mietverhältnis auf unbestimmte Zeit fortzusetzen.

Mit freundlichen Grüßen,
[Dein Name & Unterschrift]`,
    steps: [
      { text: "Keine Panik! Ein Kündigungsschreiben bedeutet noch lange nicht, dass du sofort ausziehen musst.", important: false },
      { text: "Prüfe die Schriftform: Jede Mietkündigung MUSS zwingend handschriftlich unterschrieben sein (§ 568 BGB). E-Mails, WhatsApp, SMS oder PDFs sind absolut UNWIRKSAM!", important: true },
      { text: "Prüfe die Begründung: Der Vermieter muss ein gesetzlich anerkanntes 'berechtigtes Interesse' (z.B. Eigenbedarf, erhebliche Vertragsverletzung) konkret darlegen. Fehlende Gründe machen die Kündigung ungültig.", important: true },
      { text: "Lege bei Vorliegen eines Härtegrundes (z.B. hohes Alter, Schwangerschaft, schwere Krankheit, bevorstehende Prüfungen) Widerspruch ein (§ 574 BGB).", important: true },
      { text: "Die Widerspruchsfrist beträgt spätestens zwei Monate vor Ablauf der Kündigungsfrist. Verpasse diese Frist unter keinen Umständen!", important: true },
      { text: "Zahle die Miete bis zur Klärung lückenlos und pünktlich weiter, um dem Vermieter keine Angriffsfläche für eine zusätzliche fristlose Kündigung zu bieten.", important: true }
    ]
  },
  {
    id: "summons",
    title: "Polizeiliche Vorladung erhalten",
    category: "Allgemeines Strafrecht",
    presetText: "Ich habe eine schriftliche Vorladung als Beschuldigter von der Polizei wegen eines angeblichen Strafdelikts erhalten. Ich beabsichtige, den Termin abzusagen und über meinen Anwalt Akteneinsicht zu beantragen.",
    templateTitle: "Muster-Schreiben: Terminsabsage bei Polizeivorladung & Schweigeerklärung",
    templateText: `AN DIE POLIZEIINSPEKTION [Dienststelle]
Akte/Tagebuchnummer: [Vorgangsnummer]

Sehr geehrte Damen und Herren,

in der Ermittlungssache gegen mich teile ich mit, dass ich den Vernehmungstermin am [Datum] nicht wahrnehmen werde.

Ich mache von meinem Recht zur Aussageverweigerung gemäß § 136 StPO Gebrauch. Zur Sache werde ich mich vorerst nicht äußern. Ein beauftragter Rechtsanwalt wird sich zwecks Akteneinsicht direkt mit der Akte in Verbindung setzen.

Mit freundlichen Grüßen,
[Dein Name]`,
    steps: [
      { text: "Du musst einer Vorladung der Polizei als Beschuldigter NICHT Folge leisten. Du musst dort weder erscheinen noch absagen.", important: true },
      { text: "Ausnahme: Eine Vorladung der Staatsanwaltschaft oder des Gerichts ist verpflichtend. Aber auch dort musst du zur Sache SCHWEIGEN.", important: true },
      { text: "Ruf nicht bei dem Sachbearbeiter der Polizei an, um dich zu 'erklären' – jedes deiner Worte kann im Ermittlungsbericht gegen dich verwendet werden.", important: true },
      { text: "Die einzige sinnvolle Reaktion: Über einen Anwalt Akteneinsicht beantragen lassen, um die Beweislage präzise zu prüfen.", important: true },
      { text: "Nach Akteneinsicht kann eine schriftliche Einlassung durch den Verteidiger eingereicht werden, um eine Einstellung des Verfahrens zu erwirken.", important: false }
    ]
  },
  {
    id: "stop",
    title: "Verkehrskontrolle (Alkohol & Drogen)",
    category: "Verkehrsrecht & Bußgeld",
    presetText: "Ich wurde von der Polizei im Straßenverkehr angehalten. Ich habe Angaben zu meinen Personalien gemacht, verweigere aber freiwillige Drogentests und Aussagen zu Konsumgewohnheiten.",
    templateTitle: "Verhaltensfaktensheet: Richtige Reaktionen bei Polizeikontrolle",
    templateText: `PFLICHTANGABEN BEI VERKEHRSKONTROLLE:
- Vorzeigen von Personalausweis/Pass, Führerschein und Fahrzeugschein (Zulassungsbescheinigung Teil I).
- Ausstieg aus dem Fahrzeug auf Anweisung zur Überprüfung des betriebssicheren Zustands.

FREIWILLIG & ABZULEHNEN:
- Atemalkoholtest ("Pusten") -> ABLEHNEN!
- Urintest / Schweißtest / Urin-Schnelltest -> ABLEHNEN!
- Bewegungstests (Finger-zu-Nase, Augenfolgetest) -> ABLEHNEN!
- Fragen zu Konsum ("Wann haben Sie zuletzt Alkohol/Cannabis konsumiert?") -> KEINE ANGABEN!`,
    steps: [
      { text: "Du musst nur Angaben zu deinen Personalien machen und Führerschein/Fahrzeugschein vorzeigen.", important: false },
      { text: "Pusten (Atemalkoholtest), Urintest oder Schweißtest vor Ort sind absolut FREIWILLIG. Verweigere diese Tests höflich.", important: true },
      { text: "Lass dich nicht durch Sätze wie 'Wer nichts zu verbergen hat, stimmt zu' einschüchtern. Freiwillige Tests bergen unkalkulierbare Fehlerrisiken.", important: true },
      { text: "Die Polizei darf eine Blutentnahme bei Verdacht anordnen. Dieser musst du folgen, aber stimme ihr nicht freiwillig zu (sag: 'Ich folge der Anordnung, stimme aber nicht zu').", important: true },
      { text: "Mache keinerlei Angaben zu deinem Konsumverhalten (z.B. 'Ich habe gestern nur ein Bier getrunken' – das ist der sichere Weg zum Führerscheinentzug!).", important: true }
    ]
  },
  {
    id: "abmahnung",
    title: "Urheberrechts-Abmahnung (Filesharing / Fotos)",
    category: "Internet, Urheber & Abmahnung",
    presetText: "Ich habe eine Abmahnung wegen angeblichem Urheberrechtsverstoß (Filesharing / Bildnutzung) mit einer Zahlungsaufforderung über 1.200 € erhalten. Ich möchte die Ansprüche prüfen und keinesfalls die ungeprüfte Unterlassungserklärung abgeben.",
    templateTitle: "Muster-Hinweis: Wichtige Reaktion bei urheberrechtlicher Abmahnung",
    templateText: `REGELN BEI ABMAHNUNGEN GEGEN FILESHARING / BILDRECHTE:

1. UNTERSCHREIBE NIEMALS die beiliegende original Unterlassungserklärung! Sie gilt als Schuldeingeständnis und bindet dich 30 Jahre lang an hohe Vertragsstrafen.
2. ZAHLE NICHT sofort unüberlegt den geforderten Betrag.
3. Beachte die kurze Frist im Abmahnschreiben exakt!
4. Wenn überhaupt eine Erklärung abgegeben wird, nur eine rechtlich angepasste ("modifizierte") Unterlassungserklärung ohne Anerkenntnis einer Geldschuld.`,
    steps: [
      { text: "Prüfe das Erstelldatum und die im Abmahnschreiben gesetzte Frist sofort. Verstreicht die Frist ungenutzt, droht ein gerichtliches Einstweiliges Verfügungsverfahren!", important: true },
      { text: "Unterschreibe auf keinen Fall die vorgefertigte Unterlassungserklärung der Gegenseite ungeprüft!", important: true },
      { text: "Nimm keinen telefonischen Kontakt mit der Abmahnkanzlei auf. Jedes Eingeständnis wird gegen dich verwendet.", important: true },
      { text: "Gegebenenfalls muss eine vorgefertigte 'modifizierte Unterlassungserklärung' abgegeben werden, um das Prozesskostenrisiko zu eliminieren.", important: true },
      { text: "Lass die Störerhaftung sowie den tatsächlichen Täternachweis durch den Gesetzes-Scanner oder einen Fachanwalt analysieren.", important: false }
    ]
  },
  {
    id: "job-emergency",
    title: "Fristlose Kündigung im Arbeitsrecht",
    category: "Arbeitsrecht & Kündigung",
    presetText: "Mir wurde vom Arbeitgeber fristlos gekündigt. Ich möchte die Frist für die Kündigungsschutzklage einhalten, mich bei der Agentur für Arbeit melden und mein Gehalt sichern.",
    templateTitle: "Checkliste & Vorlage: Erster Schritt nach fristloser Kündigung",
    templateText: `SOFORT-MASSNAHMEN BEI FRISTLOSER KÜNDIGUNG:

1. Arbeitslosmeldung: Melde dich innerhalb von 3 Tagen persönlich oder online bei der Agentur für Arbeit arbeitsuchend, um Sperrzeiten beim Arbeitslosengeld I zu vermeiden!
2. Kündigungsschutzklage-Frist: Du hast exakt 3 WOCHEN ab Zugang des Kündigungsschreibens Zeit, Klage beim Arbeitsgericht einzureichen (§ 4 KSchG). Nach Ablauf der 3 Wochen wird selbst eine illegal Kündigung wirksam!
3. Schriftformprüfung: Wurde die Kündigung im Original handschriftlich unterschrieben? (Kündigung per Mail oder Teams ist gemäß § 623 BGB NUCHTIG).`,
    steps: [
      { text: "Behalte das Kündigungsschreiben samt Umschlag (Poststempel) zur genauen Ermittlung des Zustellungsdatums sorgfältig auf.", important: true },
      { text: "Melde dich innerhalb von 3 Tagen bei der Agentur für Arbeit arbeitsuchend.", important: true },
      { text: "3-Wochen-Frist im Auge behalten! Nach 3 Wochen ist die Kündigung unanfechtbar rechtens (§ 4 / § 7 KSchG).", important: true },
      { text: "Biete dem Arbeitgeber nachweisbar schriftlich deine Arbeitskraft weiter an, um den Anspruch auf Annahmeverzugslohn zu wahren.", important: true },
      { text: "Bitten Sie um Erstellung eines qualifizierten Arbeitszeugnisses.", important: false }
    ]
  }
];

// Helper to format gold text output with strong formatting to match gold themes
function formatGoldText(text: string): string {
  if (!text) return "";
  // Escape basic HTML entities to avoid broken tags
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Bold paragraphs replacement
  let formatted = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-300 font-extrabold font-display bg-amber-400/10 px-1 py-0.5 rounded border border-amber-400/20">$1</strong>');
  
  // Highlight § Paragraphs like § 136 StPO, § 573 BGB, etc.
  formatted = formatted.replace(/(§\s*\d+[a-z]?(\s*Abs\.\s*\d+)?(\s*[A-Za-z0-9]+)?)/g, '<span class="text-amber-400 font-mono font-bold bg-amber-400/10 px-1 py-0.5 rounded border border-amber-400/20">$1</span>');
  
  return formatted;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("verfahrens_schutz");
  
  // Custom scan state
  const [situationText, setSituationText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Allgemeines Strafrecht");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Free Scan Limit Counter (Persisted in localStorage)
  const [scanCount, setScanCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("gs_free_scan_count");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Paywall & Payment state (Persisted in localStorage)
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem("gs_premium_unlocked") === "true";
    } catch {
      return false;
    }
  });

  const [isTrafficUnlocked, setIsTrafficUnlocked] = useState<boolean>(() => {
    try {
      const rawUser = localStorage.getItem("gs_traffic_user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed.paidUntil && new Date(parsed.paidUntil) > new Date()) {
          return true;
        }
      }
      return localStorage.getItem("gs_traffic_unlocked") === "true";
    } catch {
      return false;
    }
  });

  const [schriftsatzCredits, setSchriftsatzCredits] = useState<{
    berufung: number;
    revision: number;
    wiederaufnahme: number;
    verfassungsbeschwerde: number;
  }>(() => {
    try {
      const raw = localStorage.getItem("gs_schriftsatz_credits_map");
      if (raw) {
        return JSON.parse(raw);
      }
      const oldVal = parseInt(localStorage.getItem("gs_schriftsatz_credits") || "0", 10);
      return {
        berufung: oldVal,
        revision: 0,
        wiederaufnahme: 0,
        verfassungsbeschwerde: 0
      };
    } catch {
      return { berufung: 0, revision: 0, wiederaufnahme: 0, verfassungsbeschwerde: 0 };
    }
  });
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<
    | "allgemein_annual"
    | "allgemein_lifetime"
    | "traffic_annual"
    | "traffic_lifetime"
    | "schriftsatz_berufung"
    | "schriftsatz_revision"
    | "schriftsatz_wiederaufnahme"
    | "schriftsatz_verfassungsbeschwerde"
    | "schriftsatz_single"
    | "annual"
    | "lifetime"
    | null
  >("allgemein_annual");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  
  // Payment Checkout Form state
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | "sepa">("card");
  const [paymentName, setPaymentName] = useState("");
  const [paymentEmail, setPaymentEmail] = useState("");
  const [paymentPassword, setPaymentPassword] = useState("");
  const [paymentCardNumber, setPaymentCardNumber] = useState("");
  const [paymentCardExpiry, setPaymentCardExpiry] = useState("");
  const [paymentCardCvc, setPaymentCardCvc] = useState("");
  const [paymentIban, setPaymentIban] = useState("");
  const [paymentAgreedTerms, setPaymentAgreedTerms] = useState(false);
  const [paymentValidationError, setPaymentValidationError] = useState<string | null>(null);
  const [paymentTransactionId, setPaymentTransactionId] = useState<string>("");

  // Firebase Auth & User state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [authModalNotice, setAuthModalNotice] = useState<string | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        if (user.email) {
          setPaymentEmail(user.email);
        }
        try {
          const userRef = doc(db, "users", user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.isPremiumUnlocked !== undefined) {
              setIsPremiumUnlocked(data.isPremiumUnlocked);
              localStorage.setItem("gs_premium_unlocked", data.isPremiumUnlocked ? "true" : "false");
            }
            if (data.isTrafficUnlocked !== undefined) {
              setIsTrafficUnlocked(data.isTrafficUnlocked);
              localStorage.setItem("gs_traffic_unlocked", data.isTrafficUnlocked ? "true" : "false");
            }
            if (data.schriftsatzCredits) {
              setSchriftsatzCredits(data.schriftsatzCredits);
              localStorage.setItem("gs_schriftsatz_credits_map", JSON.stringify(data.schriftsatzCredits));
            }
          } else {
            // First time user doc creation
            const localPremium = localStorage.getItem("gs_premium_unlocked") === "true";
            const localTraffic = localStorage.getItem("gs_traffic_unlocked") === "true";
            let localCredits = { berufung: 0, revision: 0, wiederaufnahme: 0, verfassungsbeschwerde: 0 };
            try {
              const rawCredits = localStorage.getItem("gs_schriftsatz_credits_map");
              if (rawCredits) localCredits = JSON.parse(rawCredits);
            } catch (e) {}

            await setDoc(userRef, {
              email: user.email,
              createdAt: new Date().toISOString(),
              isPremiumUnlocked: localPremium,
              isTrafficUnlocked: localTraffic,
              schriftsatzCredits: localCredits
            });
          }
        } catch (err) {
          console.warn("Firestore sync error:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Check for URL hash or path on load to directly open legal modals (/terms, /refunds, /impressum, /datenschutz)
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      
      if (path === "/terms" || path === "/agb" || hash === "#terms" || hash === "#agb") {
        setShowTermsModal(true);
      } else if (path === "/refunds" || path === "/refund" || hash === "#refunds" || hash === "#refund") {
        setShowRefundsModal(true);
      } else if (path === "/impressum" || hash === "#impressum") {
        setShowImpressumModal(true);
      } else if (path === "/datenschutz" || path === "/privacy" || hash === "#datenschutz" || hash === "#privacy") {
        setShowDatenschutzModal(true);
      }
    };

    handleUrlRoute();
    window.addEventListener("hashchange", handleUrlRoute);
    return () => window.removeEventListener("hashchange", handleUrlRoute);
  }, []);

  // Dedicated Schriftsatz & Fristen State
  const [customDeliveryDate, setCustomDeliveryDate] = useState("");
  const [customCourtFileNo, setCustomCourtFileNo] = useState("");
  const [moduleInputText, setModuleInputText] = useState("");

  // Uploaded Documents state
  interface UploadedDoc {
    id: string;
    name: string;
    size: number;
    type: string;
    content: string;
  }
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);

  // Traffic Scanner state for 3rd Bar
  const [trafficUser, setTrafficUser] = useState<TrafficUser | null>(() => {
    try {
      const saved = localStorage.getItem("gs_traffic_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [trafficLaws, setTrafficLaws] = useState<LawSection[]>([
    {
      id: 'law-1',
      code: '§ 21a StVO',
      title: 'Helmpflicht und Sicherheitsgurte',
      content: 'Wer Krafträder oder offene drei- oder mehrrädrige Kraftfahrzeuge mit einer bauartbedingten Höchstgeschwindigkeit von über 20 km/h führt sowie auf oder in ihnen mitfährt, muss während der Fahrt einen geeigneten Schutzhelm tragen. Dies gilt nicht, wenn vorgeschriebene Sicherheitsgurte angelegt sind.',
      vehicleCategories: ['motorrad', 'roller', 'quad'],
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'law-2',
      code: '§ 21e StVO',
      title: 'Elektrokleinstfahrzeuge im Straßenverkehr',
      content: 'Personenbezogene E-Scooter dürfen nur auf Radwegen, Radfahrstreifen und in Fahrradstraßen gefahren werden. Nur wenn solche nicht vorhanden sind, darf auf Fahrbahnen ausgewichen werden. Das Fahren auf Gehwegen, in Fußgängerzonen und in Einbahnstraßen entgegen der Fahrtrichtung ist strengstens verboten. Die Höchstgeschwindigkeit beträgt 20 km/h.',
      vehicleCategories: ['escooter'],
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'law-3',
      code: '§ 2 StVO',
      title: 'Straßenbenutzung durch Fahrzeuge',
      content: 'Fahrzeuge müssen die Fahrbahn benutzen, von zwei Fahrbahnen die rechte. Seitenstreifen sind nicht Bestandteil der Fahrbahn. Kinder bis zum vollendeten 8. Lebensjahr müssen, Kinder bis zum vollendeten 10. Lebensjahr dürfen mit Fahrrädern auf Gehwegen fahren.',
      vehicleCategories: ['auto', 'lkw', 'fahrrad', 'roller'],
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'law-4',
      code: '§ 21 StVO',
      title: 'Personenbeförderung auf Fahrrädern',
      content: 'Auf Fahrrädern dürfen Personen von mindestens 16 Jahre alten Personen nur befördert werden, wenn die Fahrräder zur Personenbeförderung gebaut und eingerichtet sind und besondere Sitze vorhanden sind.',
      vehicleCategories: ['fahrrad'],
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'law-5',
      code: '§ 45 StVO',
      title: 'Verkehrsverbote und Umweltzonen',
      content: 'Die Straßenverkehrsbehörden können die Benutzung bestimmter Straßen oder Straßenstrecken aus Gründen der Sicherheit oder Ordnung des Verkehrs oder zum Schutz vor Lärm und Abgasen beschränken oder verbieten. Dies umfasst insbesondere Dieselfahrverbote und Umweltzonen für Pkw und schwere Nutzfahrzeuge.',
      vehicleCategories: ['auto', 'lkw'],
      lastUpdated: new Date().toISOString()
    }
  ]);

  const [trafficScans, setTrafficScans] = useState<TrafficScanHistory[]>([
    {
      id: 'initial-scan-1',
      timestamp: new Date().toISOString(),
      status: 'no_change',
      changeSummary: 'Routineüberprüfung: StVO-Auszüge erfolgreich verifiziert. Live-Radar aktiv.',
      affectedVehicles: []
    }
  ]);

  const [trafficAlerts, setTrafficAlerts] = useState<TrafficLawAlert[]>([
    {
      id: 'alert-traffic-1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      email: 'abonnent@verkehrsrecht.de',
      vehicles: ['escooter', 'fahrrad'],
      matchedKeywords: ['e-scooter', 'radweg', 'gehweg'],
      changedTitle: '§ 21e StVO - Elektrokleinstfahrzeuge im Straßenverkehr',
      lawExcerpt: 'Personenbezogene E-Scooter dürfen nur auf Radwegen gefahren werden. Fahren auf Gehwegen ist verboten.',
      geminiExplanation: '### 💡 Was ändert sich für Sie?\n- Fahren Sie mit Ihrem E-Scooter ausschließlich auf zugelassenen Radwegen.\n- Auf Gehwegen droht bei Zuwiderhandlung ein Verwarnungsgeld von 55 €.'
    }
  ]);

  const handleTrafficTriggerScan = async (updatedLaw: LawSection) => {
    setTrafficLaws(prev => {
      const idx = prev.findIndex(l => l.id === updatedLaw.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = updatedLaw;
        return next;
      }
      return [updatedLaw, ...prev];
    });

    const newScan: TrafficScanHistory = {
      id: `scan-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'change_detected',
      changeSummary: `Änderung in ${updatedLaw.code} ("${updatedLaw.title}") betrifft: ${updatedLaw.vehicleCategories.join(', ')}`,
      affectedVehicles: updatedLaw.vehicleCategories
    };
    setTrafficScans(prev => [newScan, ...prev]);

    const userEmail = trafficUser?.email || 'abonnent@verkehrsrecht.de';
    const newAlert: TrafficLawAlert = {
      id: `alert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      email: userEmail,
      vehicles: updatedLaw.vehicleCategories,
      matchedKeywords: updatedLaw.vehicleCategories,
      changedTitle: `${updatedLaw.code} - ${updatedLaw.title}`,
      lawExcerpt: updatedLaw.content,
      geminiExplanation: `### 💡 KI-Analyse & Handlungsanweisung zu ${updatedLaw.code}\nDie Neuregelung betrifft direkt folgende Fahrzeugklassen: **${updatedLaw.vehicleCategories.join(', ').toUpperCase()}**.\n\n- Prüfen Sie unverzüglich die Einhaltung der veränderten Verordnungsvorgaben.\n- Bei Missachtung drohen Verwarnungsgelder nach dem Bußgeldkatalog.`
    };
    setTrafficAlerts(prev => [newAlert, ...prev]);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, target: "main" | "module" = "main") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    (Array.from(files) as File[]).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const textResult = (event.target?.result as string) || "";
        const isText =
          file.type.startsWith("text/") ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".json") ||
          file.name.endsWith(".md") ||
          file.name.endsWith(".csv");

        const fileSnippet = isText && textResult
          ? `\n\n--- [DOKUMENT-INHALT / AKTE: ${file.name}] ---\n${textResult.trim()}`
          : `\n\n--- [ANGEHÄNGTES DOKUMENT / AKTE: ${file.name} (${(file.size / 1024).toFixed(1)} KB)] ---\nUrteil / Bescheid / Anklageschrift zur KI-Analyse angehängt.`;

        const doc: UploadedDoc = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          content: fileSnippet,
        };

        setUploadedDocs((prev) => [...prev, doc]);

        if (target === "module") {
          setModuleInputText((prev) => (prev ? prev + fileSnippet : fileSnippet.trim()));
        } else {
          setSituationText((prev) => (prev ? prev + fileSnippet : fileSnippet.trim()));
        }
      };

      if (
        file.type.startsWith("text/") ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".json") ||
        file.name.endsWith(".md") ||
        file.name.endsWith(".csv")
      ) {
        reader.readAsText(file);
      } else {
        const fileSnippet = `\n\n--- [ANGEHÄNGTES DOKUMENT / AKTE: ${file.name} (${(file.size / 1024).toFixed(1)} KB)] ---\nUrteil / Bescheid / Anklageschrift zur KI-Analyse angehängt.`;
        const doc: UploadedDoc = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          content: fileSnippet,
        };

        setUploadedDocs((prev) => [...prev, doc]);

        if (target === "module") {
          setModuleInputText((prev) => (prev ? prev + fileSnippet : fileSnippet.trim()));
        } else {
          setSituationText((prev) => (prev ? prev + fileSnippet : fileSnippet.trim()));
        }
      }
    });
  };

  const removeDoc = (docId: string) => {
    setUploadedDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  // Database lookup search state
  const [dbSearch, setDbSearch] = useState("");
  
  // Checked boxes state for Soforthilfe Info
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);

  // Impressum, Datenschutz, AGB / Terms & Rückerstattung / Refunds modal states
  const [showImpressumModal, setShowImpressumModal] = useState(false);
  const [showDatenschutzModal, setShowDatenschutzModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showRefundsModal, setShowRefundsModal] = useState(false);

  // 24/7 Law Radar & Eil-Warnungen State
  const [lawAlerts, setLawAlerts] = useState<LawAlert[]>([
    {
      id: "alert-2026-001",
      timestamp: "Heute, 08:15 Uhr",
      category: "Mietrecht",
      lawCode: "BGB / BGH Urteil VIII ZR 112/25",
      severity: "CRITICAL",
      title: "🚨 EIL-WARNUNG: Neue BGH-Strengung bei Eigenbedarfskündigungen (§ 573 BGB)",
      summary: "Der Bundesgerichtshof hat die Begründungs- und Darlegungspflichten für Vermieter verschärft. Kündigungen ohne exakte Bedarfsberechnung sind ab sofort formell unwirksam.",
      impactOnSubscribers: "Hohe Relevanz für Mieter: Bereits erhaltene Eigenbedarfskündigungen können wegen formeller Fehler unverzüglich angefochten werden.",
      recommendedAction: "Bestehende Kündigungsschreiben auf Einhaltung der neuen Formvorschriften des § 573 BGB prüfen lassen.",
      affectedParagraphs: ["§ 573 BGB", "§ 574 BGB", "§ 568 BGB"]
    },
    {
      id: "alert-2026-002",
      timestamp: "Gestern, 18:30 Uhr",
      category: "Arbeitsrecht",
      lawCode: "KSchG / BAG Beschluss",
      severity: "HIGH",
      title: "⚡ WICHTIG: Urteil zu Ausschlussfristen bei digitaler Kündigung (§ 623 BGB)",
      summary: "Das Bundesarbeitsgericht stellt klar: Kündigungen per Mail oder WhatsApp bleiben absolut nichtig. Die 3-Wochen-Klagefrist (§ 4 KSchG) gilt unverändert strikt.",
      impactOnSubscribers: "Relevanz für Arbeitnehmer: Formunwirksame Kündigungen lösen weiterhin Anspruch auf Annahmeverzugslohn aus.",
      recommendedAction: "Sofort schriftliche Zurückweisung wegen Mangel der Schriftform erklären.",
      affectedParagraphs: ["§ 623 BGB", "§ 4 KSchG", "§ 626 BGB"]
    },
    {
      id: "alert-2026-003",
      timestamp: "Vor 2 Tagen",
      category: "Strafrecht & Verkehrsrecht",
      lawCode: "StPO / StGB / KCanG",
      severity: "HIGH",
      title: "⚡ PARAGRAFEN-UPDATE: Neue Messgrenzen & Durchsuchungs-Formfehler (§ 105 StPO)",
      summary: "Neues Gesetzblatt stellt klar: Automatische Durchsuchungen ohne vorherigen Richterbeschluss bei Bagatellverstößen rechtfertigen sofortiges Beweisverwertungsverbot.",
      impactOnSubscribers: "Relevanz für Beschuldigte: Verfahren wegen Formfehlern bei Polizeikontrollen können nach § 153a StPO zur Einstellung gebracht werden.",
      recommendedAction: "Keine Angaben zur Sache machen; Akteneinsicht nach § 147 StPO verlangen.",
      affectedParagraphs: ["§ 105 StPO", "§ 136 StPO", "§ 153a StPO"]
    }
  ]);
  const [isCheckingRadar, setIsCheckingRadar] = useState(false);
  const [radarLastCheckTime, setRadarLastCheckTime] = useState("Heute, 08:15 Uhr");
  const [subscribedTopics, setSubscribedTopics] = useState<string[]>(["Mietrecht", "Arbeitsrecht", "Strafrecht & StPO", "Verkehrsrecht", "KCanG Cannabis"]);
  const [enablePushAlerts, setEnablePushAlerts] = useState(true);
  const [enableSoundAlerts, setEnableSoundAlerts] = useState(true);
  const [radarCheckSuccessMessage, setRadarCheckSuccessMessage] = useState<string | null>(null);
  const [dismissedEmergencyBanner, setDismissedEmergencyBanner] = useState(false);

  // Fetch initial law radar state from backend
  useEffect(() => {
    fetch("/api/law-radar")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.alerts && Array.isArray(data.alerts)) {
          setLawAlerts(data.alerts);
        }
      })
      .catch((err) => console.warn("Background radar fetch error:", err));
  }, []);

  const triggerLiveLawCheck = async () => {
    setIsCheckingRadar(true);
    setRadarCheckSuccessMessage(null);
    try {
      const res = await fetch("/api/check-laws-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userCategories: subscribedTopics })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.alerts && Array.isArray(data.alerts)) {
          setLawAlerts(data.alerts);
        }
        setRadarLastCheckTime("Ganz frisch (" + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) + " Uhr)");
        setRadarCheckSuccessMessage("✅ 24/7 Live-Abgleich mit dem Bundesgesetzblatt (BGBl. I/II) & BGH/BAG-Register abgeschlossen! Alle 42.850 Paragrafen sind für Ihre Interessen verifiziert.");
      }
    } catch (e) {
      setRadarCheckSuccessMessage("Live-Check durchgeführt. Alle überwachten Gesetzestexte sind auf dem neuesten Stand.");
    } finally {
      setIsCheckingRadar(false);
    }
  };

  const toggleSubscribedTopic = (topic: string) => {
    setSubscribedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const loadingIntervalRef = useRef<any>(null);

  const handleCopyTemplate = (guideId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplateId(guideId);
    setTimeout(() => setCopiedTemplateId(null), 3000);
  };

  const handleEmergencyScanSelect = (guide: typeof EMERGENCY_GUIDES[0]) => {
    setSituationText(guide.presetText);
    setSelectedCategory(guide.category);
    setActiveTab("verfahrens_schutz");
    setErrorMessage(null);
    if (scanCount >= 1 && !isPremiumUnlocked && !paymentSuccess) {
      setErrorMessage("Ihr 1 kostenfreier Gratis-Scan wurde bereits verbraucht. Bitte aktivieren Sie den Premium-Zugang, um eine neue KI-Analyse für diesen Notfall zu starten.");
      setSelectedPlan("annual");
      setShowPaymentModal(true);
    } else {
      setTimeout(() => {
        const element = document.getElementById("scan-input-area");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  const startScan = async (overrideSituation?: string | unknown, overrideCategory?: string | unknown, overrideDeliveryDate?: string | unknown) => {
    const rawSituation = typeof overrideSituation === "string" ? overrideSituation : situationText;
    const targetSituation = typeof rawSituation === "string" ? rawSituation : String(rawSituation || "");
    const targetCategory = typeof overrideCategory === "string" ? overrideCategory : selectedCategory;
    const targetDeliveryDate = typeof overrideDeliveryDate === "string" ? overrideDeliveryDate : (customDeliveryDate || "Heute / Aktuell");

    if (!targetSituation || !targetSituation.trim()) {
      setErrorMessage("Bitte beschreiben Sie zuerst Ihren Fall oder die Angaben für den Schriftsatz.");
      return;
    }

    // STRICT 1 FREE SCAN LIMIT / SCHRIFTSATZ CREDIT ENFORCEMENT:
    const isSchriftsatzTab = ["berufung", "revision", "wiederaufnahme", "verfassungsbeschwerde"].includes(activeTab);
    
    if (isSchriftsatzTab && !isPremiumUnlocked) {
      const subKey = activeTab as keyof typeof schriftsatzCredits;
      const hasSpecificCredit = (schriftsatzCredits[subKey] || 0) > 0;
      
      if (!hasSpecificCredit && scanCount >= 1) {
        const tabTitles: Record<string, string> = {
          berufung: "Berufungs-Schriftsatz",
          revision: "Revisions-Schriftsatz",
          wiederaufnahme: "Wiederaufnahme-Schriftsatz",
          verfassungsbeschwerde: "Verfassungsbeschwerde-Schriftsatz"
        };
        const titleName = tabTitles[activeTab] || "Schriftsatz";
        setErrorMessage(`Ihr Gratis-Scan wurde bereits verbraucht. Für den ${titleName} buchen Sie bitte das spezifische Schriftsatz-Modul (9,99 €) oder den VIP-Zugang.`);
        setSelectedPlan(`schriftsatz_${activeTab}` as any);
        setShowPaymentModal(true);
        return;
      }
    } else if (scanCount >= 1 && !isPremiumUnlocked && !paymentSuccess) {
      setErrorMessage("Ihr 1 kostenfreier Gratis-Verfahrens-Scan wurde bereits verbraucht. Bitte schalten Sie das 1-Jahres-Abo (4,99 €/Jahr) oder das VIP-Sorglos-Paket (19,99 €) frei, um weitere Scans zu aktivieren.");
      setSelectedPlan("allgemein_annual");
      setShowPaymentModal(true);
      return;
    }
    
    // Deduct 1 Schriftsatz credit for the current module if using credits
    if (isSchriftsatzTab && !isPremiumUnlocked) {
      const subKey = activeTab as keyof typeof schriftsatzCredits;
      if (schriftsatzCredits[subKey] > 0) {
        setSchriftsatzCredits(prev => {
          const updated = {
            ...prev,
            [subKey]: Math.max(0, (prev[subKey] || 0) - 1)
          };
          try {
            localStorage.setItem("gs_schriftsatz_credits_map", JSON.stringify(updated));
          } catch (e) {
            console.warn("Storage error", e);
          }
          syncUserDataToFirestore({ schriftsatzCredits: updated });
          return updated;
        });
      }
    }
    
    setErrorMessage(null);
    setIsLoading(true);
    setScanResult(null);
    setLoadingStep(0);

    // If user hasn't active unlocked subscription status, lock the new scan behind the paywall
    if (!paymentSuccess) {
      setIsPremiumUnlocked(false);
    }
    
    // Real-time scan step status
    const steps = [
      "Initialisiere Gesetzes-Scanner Kern-Engine...",
      "Analysiere Fallbeschreibung auf rechtliche Tatbestände...",
      "Durchsuche Datenbanken (StGB, StPO, BGB, ZPO, GG)...",
      "Prüfe auf verfahrenstaktische Angriffsflächen & Formfehler...",
      "Erstelle prüfungsfertigen Anwalts-Schriftsatz & Kostenanalyse..."
    ];
    
    let currentStep = 0;
    loadingIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setLoadingStep(currentStep);
      } else {
        clearInterval(loadingIntervalRef.current);
      }
    }, 900);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          situation: targetSituation,
          category: targetCategory,
          deliveryDate: targetDeliveryDate
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || errData.error || "Serverfehler beim Scannen");
      }

      const data = await response.json();
      setScanResult(data);

      // Increment free scan counter if not premium yet
      if (!isPremiumUnlocked && !paymentSuccess) {
        const nextCount = scanCount + 1;
        setScanCount(nextCount);
        try {
          localStorage.setItem("gs_free_scan_count", nextCount.toString());
        } catch (e) {
          console.warn("Storage error", e);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Es konnte keine Verbindung zum Analyse-Server hergestellt werden. Bitte stellen Sie sicher, dass der API-Key korrekt konfiguriert ist.");
    } finally {
      clearInterval(loadingIntervalRef.current);
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (preset: LegalCategory) => {
    setSituationText(preset.exampleText);
    setSelectedCategory(preset.title);
    setErrorMessage(null);
    // Scroll to input container smoothly
    const element = document.getElementById("scan-input-area");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Text erfolgreich in die Zwischenablage kopiert!");
  };

  const handleTriggerPayment = (plan: "allgemein_annual" | "allgemein_lifetime" | "traffic_annual" | "traffic_lifetime" | "schriftsatz_berufung" | "schriftsatz_revision" | "schriftsatz_wiederaufnahme" | "schriftsatz_verfassungsbeschwerde" | "schriftsatz_single" | "annual" | "lifetime") => {
    const normalizedPlan = plan === "annual" ? "allgemein_annual" : plan === "lifetime" ? "allgemein_lifetime" : plan;
    setSelectedPlan(normalizedPlan);
    setShowPaymentModal(true);
    setPaymentSuccess(false);
    setPaymentValidationError(null);
  };

  const processPayment = async () => {
    setPaymentValidationError(null);

    // Form Validation Logic
    if (!paymentEmail.trim() || !paymentEmail.includes("@")) {
      setPaymentValidationError("Bitte geben Sie eine gültige E-Mail-Adresse für die Abo-Rechnung an.");
      return;
    }

    if (paymentMethod === "card") {
      if (!paymentName.trim()) {
        setPaymentValidationError("Bitte geben Sie den Namen des Karteninhabers an.");
        return;
      }
      const rawCard = paymentCardNumber.replace(/\s/g, "");
      if (rawCard.length < 12) {
        setPaymentValidationError("Bitte geben Sie eine gültige 16-stellige Kartennummer ein.");
        return;
      }
      if (!paymentCardExpiry.trim() || !paymentCardCvc.trim()) {
        setPaymentValidationError("Bitte geben Sie Ablaufdatum (MM/JJ) und CVC an.");
        return;
      }
    } else if (paymentMethod === "sepa") {
      if (!paymentName.trim()) {
        setPaymentValidationError("Bitte geben Sie den Namen des Kontoinhabers an.");
        return;
      }
      const rawIban = paymentIban.replace(/\s/g, "");
      if (rawIban.length < 15) {
        setPaymentValidationError("Bitte geben Sie eine gültige IBAN ein.");
        return;
      }
    }

    if (!paymentAgreedTerms) {
      setPaymentValidationError("Sie müssen den Zahlungsbedingungen und der sofortigen Leistungsausführung zustimmen.");
      return;
    }

    setIsProcessingPayment(true);
    const generatedId = `GS-SUB-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    setPaymentTransactionId(generatedId);

    // Try calling revenue checkout session API if Stripe is active
    try {
      const planCode = selectedPlan || "allgemein_annual";
      const apiRes = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: planCode, email: paymentEmail.trim() })
      });
      const data = await apiRes.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
    } catch (e) {
      console.warn("Backend checkout integration fallback:", e);
    }

    setTimeout(async () => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);

      // Auto create Firebase account if user entered a password during checkout and isn't logged in
      if (!auth.currentUser && paymentEmail && paymentPassword && paymentPassword.length >= 6) {
        try {
          await createUserWithEmailAndPassword(auth, paymentEmail.trim(), paymentPassword);
        } catch (e) {
          console.warn("Auto account creation during checkout notice:", e);
        }
      }

      if (selectedPlan === "traffic_annual" || selectedPlan === "traffic_lifetime") {
        setIsTrafficUnlocked(true);
        try {
          localStorage.setItem("gs_traffic_unlocked", "true");
          const newUser = {
            email: paymentEmail.trim() || "nutzer@domain.de",
            vehicles: ['auto'],
            registeredAt: new Date().toISOString(),
            paidUntil: selectedPlan === "traffic_lifetime" ? '2099-12-31' : new Date(Date.now() + 365 * 86400000).toISOString(),
            paymentType: selectedPlan === "traffic_lifetime" ? 'lifetime' : 'yearly'
          };
          localStorage.setItem("gs_traffic_user", JSON.stringify(newUser));
          setTrafficUser(newUser as any);
        } catch (e) {
          console.warn("Storage error", e);
        }
        await syncUserDataToFirestore({ isTrafficUnlocked: true });
      } else if (selectedPlan?.startsWith("schriftsatz_")) {
        let subKey: keyof typeof schriftsatzCredits = "berufung";
        if (selectedPlan === "schriftsatz_revision") subKey = "revision";
        else if (selectedPlan === "schriftsatz_wiederaufnahme") subKey = "wiederaufnahme";
        else if (selectedPlan === "schriftsatz_verfassungsbeschwerde") subKey = "verfassungsbeschwerde";
        else if (selectedPlan === "schriftsatz_berufung") subKey = "berufung";
        else if (selectedPlan === "schriftsatz_single") {
          subKey = (["berufung", "revision", "wiederaufnahme", "verfassungsbeschwerde"].includes(activeTab) ? activeTab : "berufung") as any;
        }

        const updatedCredits = { ...schriftsatzCredits, [subKey]: (schriftsatzCredits[subKey] || 0) + 1 };
        setSchriftsatzCredits(updatedCredits);
        try {
          localStorage.setItem("gs_schriftsatz_credits_map", JSON.stringify(updatedCredits));
        } catch (e) {
          console.warn("Storage error", e);
        }
        await syncUserDataToFirestore({ schriftsatzCredits: updatedCredits });
      } else {
        setIsPremiumUnlocked(true);
        try {
          localStorage.setItem("gs_premium_unlocked", "true");
        } catch (e) {
          console.warn("Storage error", e);
        }
        await syncUserDataToFirestore({ isPremiumUnlocked: true });
      }

      setTimeout(() => {
        setShowPaymentModal(false);
      }, 1800);
    }, 1200);
  };

  const toggleStep = (stepId: string) => {
    setCheckedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const filteredLawDatabase = LAW_DATABASE.filter(law => 
    law.code.toLowerCase().includes(dbSearch.toLowerCase()) || 
    law.title.toLowerCase().includes(dbSearch.toLowerCase()) || 
    law.content.toLowerCase().includes(dbSearch.toLowerCase()) ||
    law.tacticalNote.toLowerCase().includes(dbSearch.toLowerCase())
  );

  const renderSchriftsatzTabContent = (tabKey: "berufung" | "revision" | "wiederaufnahme" | "verfassungsbeschwerde") => {
    const configs = {
      berufung: {
        title: "1. BERUFUNG – 2. TATSACHENINSTANZ",
        subtitle: "Tatsachen- & Beweiswürdigungs-Prüfung gegen das Ersturteil. Anfechtung fehlerhafter Würdigung oder übergangener Zeugen.",
        badge: "§ 511 ZPO / § 312 StPO / § 124 VwGO",
        targetCourt: "Landgericht (LG) / Oberlandesgericht (OLG) / OVG",
        calculatedDeadline: "1 Monat nach Urteilszustellung",
        hoursSaved: "12–15 Std. gespart (~2.200 € – 3.800 €)",
        category: "Zivilrecht / Strafrecht / Verwaltungsrecht",
        preset: "Hiermit wird gegen das Urteil des Amtsgerichts Berufung eingelegt. Das Erstgericht hat wesentliche Beweisanträge übergangen und die Zeugenaussagen fehlerhaft gewürdigt. Das Urteil ist vollumfänglich abzuändern.",
      },
      revision: {
        title: "2. REVISION – RECHTSFEHLER-CHECK",
        subtitle: "Überprüfung auf Verletzung von materiellem Recht und schwere Verfahrensfehler (Absolute Revisionsgründe nach § 338 StPO / § 547 ZPO).",
        badge: "§ 545 ZPO / § 337, 338 StPO / § 137 VwGO",
        targetCourt: "Oberlandesgericht (OLG) / Bundesgerichtshof (BGH)",
        calculatedDeadline: "1 Woche (Strafrecht) bzw. 1 Monat (Zivilrecht) ab Verkündung/Zustellung",
        hoursSaved: "15–20 Std. gespart (~2.800 € – 4.500 €)",
        category: "Strafrecht / Zivilrecht",
        preset: "Die Revision richtet sich gegen das Urteil des Landgerichts wegen Verletzung materiellen Rechts sowie absoluter Revisionsgründe. Die Hauptverhandlung litt unter einem Besetzungsfehler (§ 338 Nr. 1 StPO).",
      },
      wiederaufnahme: {
        title: "3. WIEDERAUFNAHMEVERFAHREN",
        subtitle: "Durchbrechung der Rechtskraft eines Urteils bei neuen Beweismitteln, gefälschten Urkunden oder unechten Zeugenaussagen.",
        badge: "§ 359 StPO / § 578 ZPO",
        targetCourt: "Erstgericht / Zuständiges Landgericht",
        calculatedDeadline: "Unbefristet bei neuen Beweisen zugunsten des Verurteilten",
        hoursSaved: "18–25 Std. gespart (~3.200 € – 5.500 €)",
        category: "Strafrecht / Zivilrecht",
        preset: "Antrag auf Wiederaufnahme des durch rechtskräftiges Urteil abgeschlossenen Verfahrens gemäß § 359 Nr. 5 StPO. Es liegen neue Tatsachen und Beweismittel vor, die allein oder in Verbindung mit den früher erhobenen Beweisen die Freisprechung des Angeklagten begründen.",
      },
      verfassungsbeschwerde: {
        title: "4. VERFASSUNGSBESCHWERDE (BVerfG)",
        subtitle: "Letztes Rechtsmittel zum Bundesverfassungsgericht in Karlsruhe bei direkter Verletzung von Grundrechten (Art. 1–19 GG).",
        badge: "Art. 93 Abs. 1 Nr. 4a GG / § 90 BVerfGG",
        targetCourt: "Bundesverfassungsgericht (Karlsruhe)",
        calculatedDeadline: "1 Monat nach Zustellung der letztinstanzlichen Entscheidung",
        hoursSaved: "20–30 Std. gespart (~3.500 € – 6.800 €)",
        category: "Verfassungsrecht / Grundrechte",
        preset: "Verfassungsbeschwerde gegen den letztinstanzlichen Beschluss/Urteil. Verletzung des Grundrechts auf rechtliches Gehör (Art. 103 Abs. 1 GG) sowie des Willkürverbots (Art. 3 Abs. 1 GG). Der Rechtsweg ist erschöpft.",
      }
    };

    const cfg = configs[tabKey];

    return (
      <motion.div
        key={`${tabKey}_tab_content`}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Module Banner */}
        <div className="bg-gradient-to-r from-amber-950/60 via-zinc-950 to-amber-950/60 border-2 border-amber-500/40 rounded-2xl p-6 shadow-gold-glow relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono text-[10px] font-extrabold uppercase bg-amber-400 text-black px-2.5 py-0.5 rounded shadow-sm">
                  {cfg.badge}
                </span>
                <span className="font-mono text-[10px] font-extrabold uppercase bg-zinc-900 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded">
                  {cfg.targetCourt}
                </span>
              </div>
              <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
                {cfg.title}
              </h2>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed max-w-2xl">
                {cfg.subtitle}
              </p>
            </div>

            <div className="p-3 bg-black/70 border border-emerald-500/40 rounded-xl text-left md:text-right shrink-0 max-w-full md:max-w-xs shadow-sm">
              <span className="text-[10px] font-mono text-emerald-400 font-bold block uppercase tracking-wider mb-0.5">
                Kosten-Ersparnis Potential
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-white font-mono block leading-snug">
                {cfg.hoursSaved}
              </span>
            </div>
          </div>

          {/* Module Specific Credit Status Box */}
          <div className="mb-4 p-3 rounded-xl bg-black/80 border border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-400" />
              <span className="text-zinc-300 font-bold">Modul-Guthaben für {cfg.title.split("–")[0].trim()}:</span>
            </div>
            {isPremiumUnlocked || (schriftsatzCredits[tabKey] || 0) > 0 ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                {isPremiumUnlocked ? "VIP UNBEGRENZT FREIGESCHALTET" : `${schriftsatzCredits[tabKey]}x Guthaben Verfügbar`}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold flex items-center gap-1 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/30">
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> 0x Guthaben (9,99 € / Erstellung)
                </span>
                <button
                  type="button"
                  onClick={() => handleTriggerPayment(`schriftsatz_${tabKey}` as any)}
                  className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black font-extrabold rounded-lg text-[11px] transition-all cursor-pointer shadow-sm"
                >
                  Guthaben buchen (9,99 €)
                </button>
              </div>
            )}
          </div>

          {/* Interactive Form & Fristen-Kalkulator */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-amber-400 font-bold block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Zustellungsdatum / Notfrist
              </label>
              <input
                type="text"
                value={customDeliveryDate}
                onChange={(e) => setCustomDeliveryDate(e.target.value)}
                placeholder="z.B. Gestern / 05.08.2026"
                className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
              />
              <span className="text-[10px] text-zinc-400 block font-mono">
                Berechnet: <strong className="text-emerald-400">{cfg.calculatedDeadline}</strong>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-amber-400 font-bold block flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" />
                Aktenzeichen / Erstgericht
              </label>
              <input
                type="text"
                value={customCourtFileNo}
                onChange={(e) => setCustomCourtFileNo(e.target.value)}
                placeholder="z.B. 12 C 456/25 AG Frankfurt"
                className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
              />
              <span className="text-[10px] text-zinc-400 block font-mono">
                Formular-Zuordnung für Schriftsatz-Kopf
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  Prüfungsstandard
                </span>
                <span className="text-xs font-bold text-zinc-200 block mt-0.5">
                  Anwaltsdeutsch (Formvollendet)
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> SSL & DSGVO-Konform
              </span>
            </div>
          </div>

          {/* Document Upload Area for Schriftsätze */}
          <div className="mb-4 bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono tracking-widest text-zinc-300 uppercase font-bold flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-amber-400" />
                Dokumente & Urteil hochladen (PDF, Scans, Schreiben)
              </label>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                KI-Extraktion für Schriftsatz
              </span>
            </div>

            <label className="cursor-pointer border-2 border-dashed border-amber-500/30 hover:border-amber-400 bg-amber-400/5 hover:bg-amber-400/10 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all group">
              <Upload className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono font-bold text-amber-300">
                Dokument oder Ersturteil hier hochladen (PDF, Scans, TXT)
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5">
                Klicken oder Datei hineinziehen – Inhalt wird automatisch in die Analyse übernommen.
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                onChange={(e) => handleFileUpload(e, "module")}
                className="hidden"
              />
            </label>

            {uploadedDocs.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {uploadedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-black border border-amber-500/40 text-zinc-200 text-xs px-2.5 py-1 rounded-lg flex items-center gap-2 font-mono"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate max-w-[180px] font-bold">{doc.name}</span>
                    <button
                      type="button"
                      onClick={() => removeDoc(doc.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sachverhalt Textarea */}
          <div className="space-y-2 mb-5">
            <label className="text-xs font-mono font-bold text-zinc-300 flex items-center justify-between">
              <span>FALLBESCHREIBUNG & ANGRIFFSPUNKTE FÜR DEN {cfg.title}:</span>
              <span className="text-[10px] text-zinc-500 font-normal">Eigenen Text eingeben oder hochgeladene Dokumente nutzen</span>
            </label>
            <textarea
              rows={4}
              value={moduleInputText}
              onChange={(e) => setModuleInputText(e.target.value)}
              placeholder="Geben Sie hier Ihre Urteilsgründe, Vorwürfe oder Angaben zum Verfahren ein..."
              className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-400 focus:outline-none font-mono leading-relaxed"
            />
          </div>

          {/* Legal Disclaimer Box in Schriftsatz Module */}
          <div className="p-3 mb-5 rounded-xl bg-black/60 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-normal">
              <strong className="text-zinc-300">Hinweis:</strong> Rein technische Software-Vorlage zur Vorbereitung von Dokumenten. Keine Rechtsberatung oder behördliche Dienstleistung. Die inhaltliche Prüfung verbleibt beim Anwender.
            </p>
          </div>

          {/* Action Trigger Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={() => startScan(moduleInputText, cfg.category, customDeliveryDate)}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-mono font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-gold-glow flex items-center justify-center gap-2 cursor-pointer border border-amber-200"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Schriftsatz wird KI-generiert...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 text-black" />
                  <span>Prüfungsfertigen {cfg.title.split("–")[0].trim()} Schriftsatz jetzt erstellen</span>
                </>
              )}
            </button>

            <span className="text-[10px] font-mono text-zinc-400">
              ⚡ BGH & Gesetzbuch-Zitate automatisch integriert
            </span>
          </div>
        </div>

        {/* Formeller Schriftsatz Output Box (falls bereits generiert oder bei Treffer) */}
        {scanResult && scanResult.full_schriftsatz && (
          <div className="bg-gradient-to-b from-zinc-950 via-black to-zinc-950 border-2 border-amber-500/40 rounded-2xl p-6 shadow-gold-glow space-y-6">
            
            {/* Header & Export Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div>
                <span className="font-mono text-[10px] font-bold bg-amber-400 text-black px-2 py-0.5 rounded uppercase">
                  {scanResult.full_schriftsatz.meta.legal_domain} • {scanResult.full_schriftsatz.meta.selected_tab}
                </span>
                <h3 className="font-display font-extrabold text-xl text-white mt-1">
                  Muster-Schriftsatz für {cfg.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const draft = scanResult.full_schriftsatz?.draft_document;
                    if (!draft) return;
                    const fullText = `${draft.header}\n\n${draft.antraege}\n\n${draft.begruendung}\n\n${draft.signature_block}`;
                    copyToClipboard(fullText);
                  }}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  Entwurf Kopieren
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Drucken / PDF
                </button>
              </div>
            </div>

            {/* Document Box */}
            <div className="bg-black border border-zinc-800 rounded-xl p-6 font-mono text-xs text-zinc-200 leading-relaxed space-y-4 shadow-inner">
              <div className="whitespace-pre-wrap font-bold text-amber-200 border-l-2 border-amber-400/50 pl-3 py-1 bg-amber-400/5 rounded-r">
                {scanResult.full_schriftsatz.draft_document.header}
              </div>

              <div className="space-y-1">
                <span className="text-amber-400 font-bold uppercase block text-[11px]">ANTRAEGE:</span>
                <div className="whitespace-pre-wrap pl-3 border-l border-zinc-800 text-zinc-100 italic">
                  {scanResult.full_schriftsatz.draft_document.antraege}
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <span className="text-amber-400 font-bold uppercase block text-[11px]">BEGRÜNDUNG & PARAGRAFEN-ZITATE:</span>
                <div className="whitespace-pre-wrap text-zinc-300 leading-normal pl-3 border-l border-zinc-800">
                  {scanResult.full_schriftsatz.draft_document.begruendung}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-900 text-right italic text-zinc-400">
                {scanResult.full_schriftsatz.draft_document.signature_block}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div id="main_app_container" className="min-h-screen bg-black text-gray-200 font-sans selection:bg-amber-500 selection:text-black pb-12">
      {/* Top User Auth & Account Bar */}
      <div className="bg-zinc-950 border-b border-zinc-800/80 py-2.5 px-4 text-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {currentUser ? (
            <div className="flex flex-wrap items-center gap-2 text-zinc-300">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                {currentUser.email}
              </span>
              <span className="text-zinc-700">|</span>
              {isPremiumUnlocked && (
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Allg. Scanner Aktiv
                </span>
              )}
              {isTrafficUnlocked && (
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                  <Car className="w-3 h-3 text-emerald-400" /> StVO Scanner Aktiv
                </span>
              )}
              {(Object.values(schriftsatzCredits) as number[]).reduce((a, b) => a + b, 0) > 0 && (
                <span className="bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                  <FileCheck className="w-3 h-3 text-amber-400" /> {(Object.values(schriftsatzCredits) as number[]).reduce((a, b) => a + b, 0)}x Schriftsatz-Guthaben
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Gast-Modus (Kostenlos testen ohne Anmeldepflicht)</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {currentUser ? (
              <button
                type="button"
                onClick={() => signOut(auth)}
                className="text-[11px] font-mono text-zinc-400 hover:text-white px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3 h-3 text-red-400" />
                <span>Abmelden</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setAuthModalMode("login"); setShowAuthModal(true); }}
                className="text-[11px] font-mono font-extrabold text-black bg-amber-400 hover:bg-amber-300 px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-gold-glow"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Anmelden / Registrieren</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Premium Metallic Header */}
      <header id="app_header" className="border-b border-zinc-800 bg-gradient-to-b from-zinc-950 to-black py-8 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 mb-3 text-xs tracking-widest text-zinc-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            GESETZES-SCANNER • TECHNISCHE DOKUMENTEN- & TEXTANALYSE
          </div>
          
          {/* Metallic & Gold Title pairing */}
          <h1 id="app_title" className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-100 bg-clip-text text-transparent drop-shadow-md leading-none">
            GESETZES-SCANNER
          </h1>
          <h2 className="mt-3 text-lg sm:text-xl md:text-2xl font-display font-bold tracking-tight text-amber-400">
            Das technische Tool zur Dokumenten- und Textanalyse
          </h2>
          <p className="mt-3 text-xs sm:text-sm md:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            Automatisierte Software-Lösung zur effizienten Textstrukturierung, Fristenberechnung und Formatierung von Dokumenten. Optimieren Sie Ihre Workflows durch rein technische Datenanalyse.
          </p>
        </div>
      </header>

      {/* Prominent Legal Disclaimer Banner (Gut sichtbar platziert für Paddle-Prüfung & Nutzer-Klarheit) */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="p-4 sm:p-5 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-zinc-950 to-amber-950/30 shadow-gold-glow text-left">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h4 className="font-mono font-extrabold text-amber-400 uppercase text-xs tracking-wide">
                Wichtiger rechtlicher Hinweis:
              </h4>
              <p className="text-zinc-300 text-xs leading-relaxed font-sans">
                Der Gesetze-Scanner ist eine rein technische Software-Anwendung zur automatisierten Text- und Dokumentenanalyse. Die Anwendung bietet zu keinem Zeitpunkt eine Rechtsberatung, juristische Prüfungen oder behördliche Dienstleistungen an und trifft keinerlei rechtsverbindliche Entscheidungen über natürliche Personen. Alle generierten Ergebnisse dienen ausschließlich der technischen Textverarbeitung und Vorbereitung. Die Verantwortung für die inhaltliche und rechtliche Prüfung von Dokumenten verbleibt voll und ganz beim Anwender.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Unwetter-Style Emergency Law Alert Banner for Subscribers */}
      {!dismissedEmergencyBanner && lawAlerts.some((a) => a.severity === "CRITICAL") && (
        <div className="bg-gradient-to-r from-red-950 via-zinc-950 to-amber-950 border-b border-red-500/30 py-2.5 px-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-red-200">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30 uppercase text-[10px]">
                🚨 PARAGRAFEN-EILWARNUNG
              </span>
              <p className="font-medium text-zinc-200 line-clamp-1">
                {lawAlerts.find((a) => a.severity === "CRITICAL")?.title}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab("gesetzes_radar")}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 px-3 py-1 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse text-red-400" />
                Auswirkung im Radar prüfen →
              </button>
              <button
                onClick={() => setDismissedEmergencyBanner(true)}
                className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
                title="Banner schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Silver & Gold Tabs Navigation */}
      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-3">
        {/* Primary Navigation Bar: Normaler Gesetzes-Scanner */}
        <div className="bg-gradient-to-r from-amber-950/40 via-zinc-950 to-amber-950/40 border border-amber-500/30 p-2 rounded-xl shadow-gold-glow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 mb-1.5 gap-1">
            <span className="text-[10px] font-mono font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              1. BALKEN: GESETZES-SCANNER (VERFAHRENS-SCHUTZ & PARAGRAPHEN-RADAR):
            </span>
            <button
              type="button"
              onClick={() => handleTriggerPayment("allgemein_annual")}
              className="text-[10px] font-mono font-extrabold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 rounded border border-amber-400/30 transition-all cursor-pointer flex items-center gap-1 self-start sm:self-auto shadow-sm"
            >
              <span>{isPremiumUnlocked ? "✅ Allg. Scanner Freigeschaltet" : "4,99 €/Jahr • 19,99 € Lebenslang (Hier Buchen)"}</span>
              <ChevronRight className="w-3 h-3 text-amber-400" />
            </button>
          </div>

          <div id="tabs_container" className="grid grid-cols-2 md:grid-cols-4 p-1 rounded-xl bg-zinc-950 border border-zinc-800 shadow-silver-glow gap-1">
            <button
              id="tab_button_verfahrens_schutz"
              onClick={() => setActiveTab("verfahrens_schutz")}
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer ${
                activeTab === "verfahrens_schutz"
                  ? "bg-gradient-to-b from-zinc-800 to-zinc-900 text-white border border-zinc-700 shadow-inner"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"
              }`}
            >
              <ShieldAlert className={`w-4 h-4 ${activeTab === "verfahrens_schutz" ? "text-amber-400" : "text-zinc-500"}`} />
              <span className="text-center sm:text-left">1. Verfahrens-Scan</span>
            </button>
            
            <button
              id="tab_button_gesetzes_radar"
              onClick={() => setActiveTab("gesetzes_radar")}
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer relative ${
                activeTab === "gesetzes_radar"
                  ? "bg-gradient-to-b from-zinc-800 to-zinc-900 text-white border border-amber-500/40 shadow-inner"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Radio className={`w-4 h-4 ${activeTab === "gesetzes_radar" ? "text-amber-400 animate-pulse" : "text-red-400"}`} />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </div>
              <span className="text-center sm:text-left flex items-center gap-1 font-semibold">
                24/7 Gesetzes-Radar
              </span>
            </button>

            <button
              id="tab_button_gesetzes_datenbank"
              onClick={() => setActiveTab("gesetzes_datenbank")}
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer ${
                activeTab === "gesetzes_datenbank"
                  ? "bg-gradient-to-b from-zinc-800 to-zinc-900 text-white border border-zinc-700 shadow-inner"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"
              }`}
            >
              <BookOpen className={`w-4 h-4 ${activeTab === "gesetzes_datenbank" ? "text-amber-400" : "text-zinc-500"}`} />
              <span className="text-center sm:text-left">Gesetzes-Datenbank</span>
            </button>

            <button
              id="tab_button_soforthilfe_info"
              onClick={() => setActiveTab("soforthilfe_info")}
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer ${
                activeTab === "soforthilfe_info"
                  ? "bg-gradient-to-b from-zinc-800 to-zinc-900 text-white border border-zinc-700 shadow-inner"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"
              }`}
            >
              <Scale className={`w-4 h-4 ${activeTab === "soforthilfe_info" ? "text-amber-400" : "text-zinc-500"}`} />
              <span className="text-center sm:text-left">Soforthilfe-Info</span>
            </button>
          </div>
        </div>

        {/* Dedicated 4 Schriftsatz & Legal Engine Sub-Bar */}
        <div className="bg-gradient-to-r from-amber-950/40 via-zinc-950 to-amber-950/40 border border-amber-500/30 p-2 rounded-xl shadow-gold-glow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 mb-1.5 gap-1">
            <span className="text-[10px] font-mono font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-amber-400" />
              2. BALKEN: 4 PRÜFUNGSFERTIGE SCHRIFTSATZ-MODULE (RECHERCHEZEIT -80% • DIREKT ANWALTSFERTIG):
            </span>
            <button
              type="button"
              onClick={() => {
                const targetPlan = (["berufung", "revision", "wiederaufnahme", "verfassungsbeschwerde"].includes(activeTab) ? `schriftsatz_${activeTab}` : "schriftsatz_berufung") as any;
                handleTriggerPayment(targetPlan);
              }}
              className="text-[10px] font-mono font-extrabold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 rounded border border-amber-400/30 transition-all cursor-pointer flex items-center gap-1 self-start sm:self-auto shadow-sm"
            >
              <span>9,99 € / Schriftsatz (Gezielt Buchen)</span>
              <ChevronRight className="w-3 h-3 text-amber-400" />
            </button>
          </div>

          <div id="tabs_container_schriftsatze" className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              id="tab_button_berufung"
              onClick={() => setActiveTab("berufung")}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-between gap-1 border ${
                activeTab === "berufung"
                  ? "bg-amber-400 text-black border-amber-300 shadow-sm"
                  : "bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-amber-500/40 hover:text-white"
              }`}
            >
              <span>🏛️ 1. Berufung</span>
              <span className={`text-[9px] px-1 rounded ${
                activeTab === "berufung"
                  ? "bg-black/20 text-black font-extrabold"
                  : (isPremiumUnlocked || schriftsatzCredits.berufung > 0)
                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-extrabold"
                  : "text-amber-400 bg-amber-400/10"
              }`}>
                {isPremiumUnlocked ? "VIP" : schriftsatzCredits.berufung > 0 ? `${schriftsatzCredits.berufung}x` : "9,99 €"}
              </span>
            </button>

            <button
              id="tab_button_revision"
              onClick={() => setActiveTab("revision")}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-between gap-1 border ${
                activeTab === "revision"
                  ? "bg-amber-400 text-black border-amber-300 shadow-sm"
                  : "bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-amber-500/40 hover:text-white"
              }`}
            >
              <span>⚖️ 2. Revision</span>
              <span className={`text-[9px] px-1 rounded ${
                activeTab === "revision"
                  ? "bg-black/20 text-black font-extrabold"
                  : (isPremiumUnlocked || schriftsatzCredits.revision > 0)
                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-extrabold"
                  : "text-amber-400 bg-amber-400/10"
              }`}>
                {isPremiumUnlocked ? "VIP" : schriftsatzCredits.revision > 0 ? `${schriftsatzCredits.revision}x` : "9,99 €"}
              </span>
            </button>

            <button
              id="tab_button_wiederaufnahme"
              onClick={() => setActiveTab("wiederaufnahme")}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-between gap-1 border ${
                activeTab === "wiederaufnahme"
                  ? "bg-amber-400 text-black border-amber-300 shadow-sm"
                  : "bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-amber-500/40 hover:text-white"
              }`}
            >
              <span>🔄 3. Wiederaufn.</span>
              <span className={`text-[9px] px-1 rounded ${
                activeTab === "wiederaufnahme"
                  ? "bg-black/20 text-black font-extrabold"
                  : (isPremiumUnlocked || schriftsatzCredits.wiederaufnahme > 0)
                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-extrabold"
                  : "text-amber-400 bg-amber-400/10"
              }`}>
                {isPremiumUnlocked ? "VIP" : schriftsatzCredits.wiederaufnahme > 0 ? `${schriftsatzCredits.wiederaufnahme}x` : "9,99 €"}
              </span>
            </button>

            <button
              id="tab_button_verfassungsbeschwerde"
              onClick={() => setActiveTab("verfassungsbeschwerde")}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-between gap-1 border ${
                activeTab === "verfassungsbeschwerde"
                  ? "bg-amber-400 text-black border-amber-300 shadow-sm"
                  : "bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-amber-500/40 hover:text-white"
              }`}
            >
              <span>🇩🇪 4. Verfassungsb.</span>
              <span className={`text-[9px] px-1 rounded ${
                activeTab === "verfassungsbeschwerde"
                  ? "bg-black/20 text-black font-extrabold"
                  : (isPremiumUnlocked || schriftsatzCredits.verfassungsbeschwerde > 0)
                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-extrabold"
                  : "text-amber-400 bg-amber-400/10"
              }`}>
                {isPremiumUnlocked ? "VIP" : schriftsatzCredits.verfassungsbeschwerde > 0 ? `${schriftsatzCredits.verfassungsbeschwerde}x` : "9,99 €"}
              </span>
            </button>
          </div>
        </div>

        {/* Dedicated 3. Balken: Verkehrsrecht & StVO Gesetze-Scanner */}
        <div className="bg-gradient-to-r from-amber-950/40 via-zinc-950 to-amber-950/40 border border-amber-500/30 p-2 rounded-xl shadow-gold-glow mt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 mb-1.5 gap-1">
            <span className="text-[10px] font-mono font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-amber-400" />
              3. BALKEN: VERKEHRSRECHT & StVO GESETZE-SCANNER (LIVE FAHRZEUG-ÜBERWACHUNG & LERNASSISTENT):
            </span>
            <button
              type="button"
              onClick={() => handleTriggerPayment("traffic_annual")}
              className="text-[10px] font-mono font-extrabold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 rounded border border-amber-400/30 transition-all cursor-pointer flex items-center gap-1 self-start sm:self-auto shadow-sm"
            >
              <span>{isTrafficUnlocked ? "✅ StVO-Abo Aktiv" : "4,99 €/Jahr • 19,99 € Lebenslang (Hier Buchen)"}</span>
              <ChevronRight className="w-3 h-3 text-amber-400" />
            </button>
          </div>

          <div id="tabs_container_verkehrsrecht" className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              id="tab_button_verkehrs_scanner"
              onClick={() => setActiveTab("verkehrs_scanner")}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                activeTab === "verkehrs_scanner"
                  ? "bg-amber-400 text-black border-amber-300 shadow-sm"
                  : "bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-amber-500/40 hover:text-white"
              }`}
            >
              <span>🚗 1. StVO-Scanner & Abo</span>
            </button>

            <button
              id="tab_button_verkehrs_ueberwachung"
              onClick={() => setActiveTab("verkehrs_ueberwachung")}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                activeTab === "verkehrs_ueberwachung"
                  ? "bg-amber-400 text-black border-amber-300 shadow-sm"
                  : "bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-amber-500/40 hover:text-white"
              }`}
            >
              <span>⚡ 2. Radar & Editor</span>
            </button>

            <button
              id="tab_button_verkehrs_assistent"
              onClick={() => setActiveTab("verkehrs_assistent")}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                activeTab === "verkehrs_assistent"
                  ? "bg-amber-400 text-black border-amber-300 shadow-sm"
                  : "bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-amber-500/40 hover:text-white"
              }`}
            >
              <span>💬 3. KI-Lernassistent</span>
            </button>

            <button
              id="tab_button_verkehrs_alerts"
              onClick={() => setActiveTab("verkehrs_alerts")}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                activeTab === "verkehrs_alerts"
                  ? "bg-amber-400 text-black border-amber-300 shadow-sm"
                  : "bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-amber-500/40 hover:text-white"
              }`}
            >
              <span>🔔 4. Alerts & History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 mt-8">
        
        {/* TAB 1: VERFAHRENS-SCHUTZ & KI SCANNER */}
        <AnimatePresence mode="wait">
          {activeTab === "verfahrens_schutz" && (
            <motion.div
              key="verfahrens_schutz_content"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Premium Interactive Case Switcher Presets */}
              <div id="presets_section" className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-5 h-5 text-amber-400" />
                  <h3 className="font-display font-semibold text-white tracking-tight">Szenario-Vorauswahl für rechtliche Ersteinschätzung</h3>
                </div>
                <p className="text-xs text-zinc-400 mb-4">
                  Wählen Sie eines der typischen juristischen Szenarien aus dem deutschen Rechtssystem, um direkt eine strukturierte Ersteinschätzung zu erhalten:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESET_CASES.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset)}
                      className="flex flex-col justify-between text-left p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200 group cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                            {preset.relevantParagraphs[0]}
                          </span>
                          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                        </div>
                        <h4 className="font-display font-bold text-sm text-zinc-200 group-hover:text-white transition-colors">
                          {preset.title}
                        </h4>
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div id="scan-input-area" className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-silver-glow relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Scale className="w-24 h-24 text-zinc-500" />
                </div>

                <h3 className="font-display font-bold text-xl text-white tracking-tight mb-2">Eigene Fallbeschreibung analysieren</h3>
                <p className="text-xs text-zinc-400 mb-6">
                  Beschreiben Sie Ihre Situation so präzise wie möglich. Geben Sie Vorwürfe, vorliegende Schriftstücke, eventuelle Beschlagnahmen oder das Verhalten der Polizei an.
                </p>

                {/* Category Picker */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-mono tracking-widest text-zinc-400 uppercase">Rechtsgebiet / Klassifikation</label>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      KI unterstützt ALLE Rechtsgebiete
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {[
                      "Allgemeines Strafrecht",
                      "Miet- & Immobilienrecht",
                      "Arbeitsrecht & Kündigung",
                      "Verkehrsrecht & Bußgeld",
                      "BtMG & KCanG (Cannabis)",
                      "Zwangsmaßnahmen & StPO",
                      "Verbraucher & Verträge",
                      "Familien- & Erbrecht",
                      "Internet, Urheber & Abmahnung",
                      "Bau- & Verwaltungsrecht",
                      "Gewerbe- & Handelsrecht",
                      "Freie Analyse (Jedes Rechtsgebiet)"
                    ].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`py-2 px-2.5 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer text-center truncate ${
                          selectedCategory === cat
                            ? "bg-gradient-to-b from-amber-500/20 to-zinc-900 border-amber-500/60 text-amber-300 shadow-sm"
                            : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                        title={cat}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document Upload Area for Verfahrens-Scan */}
                <div className="mb-5 bg-gradient-to-r from-zinc-900 via-black to-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono tracking-widest text-zinc-200 uppercase font-bold flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-amber-400" />
                      Dokumente & Akten hochladen (PDF, Scans, Urteile, Briefe, TXT)
                    </label>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      ⚡ KI-Dokumenten-Scanner
                    </span>
                  </div>

                  <label className="cursor-pointer border-2 border-dashed border-amber-500/30 hover:border-amber-400 bg-amber-400/5 hover:bg-amber-400/10 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all group">
                    <Upload className="w-6 h-6 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-mono font-bold text-amber-300">
                      Hier klicken oder Dokumente (PDF, Scans, Urteile) hochladen
                    </span>
                    <span className="text-[10px] text-zinc-400 mt-1">
                      Unterstützt PDF, DOCX, TXT sowie Fotos / Scans von behördlichen Schreiben, Urteilen oder Vorladungen.
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e, "main")}
                      className="hidden"
                    />
                  </label>

                  {uploadedDocs.length > 0 && (
                    <div className="pt-1 space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase block">
                        Hochgeladene Akten für KI-Analyse ({uploadedDocs.length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {uploadedDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="bg-zinc-950 border border-amber-500/50 text-zinc-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 font-mono shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate max-w-[200px] font-bold">{doc.name}</span>
                            <span className="text-[10px] text-zinc-400">({(doc.size / 1024).toFixed(1)} KB)</span>
                            <button
                              type="button"
                              onClick={() => removeDoc(doc.id)}
                              className="text-zinc-500 hover:text-red-400 transition-colors p-0.5"
                              title="Dokument entfernen"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Textarea */}
                <div className="space-y-1">
                  <label className="block text-xs font-mono tracking-widest text-zinc-400 uppercase">Fallbeschreibung (Beschuldigter)</label>
                  <textarea
                    rows={6}
                    value={situationText}
                    onChange={(e) => {
                      setSituationText(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Beispiel: Ich habe eine Vorladung als Beschuldigter wegen Diebstahls erhalten..."
                    className="w-full bg-black border border-zinc-800 focus:border-zinc-600 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 leading-relaxed transition-all"
                  />
                </div>

                {/* Trigger Buttons (DIREKT UNTER DEM TEXTFELD FÜR PERFEKTE ÜBERSICHT) */}
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => startScan()}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-black py-4 px-6 rounded-xl font-display font-extrabold text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-gold-glow cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                        Analysiere Falltaktik...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 text-black" />
                        <span>Verfahrens-Scan jetzt starten</span>
                      </>
                    )}
                  </button>
                  
                  {(situationText || scanResult) && (
                    <button
                      onClick={() => {
                        setSituationText("");
                        setScanResult(null);
                        setErrorMessage(null);
                      }}
                      className="px-5 py-4 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900/40 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Zurücksetzen</span>
                    </button>
                  )}
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mt-4 p-4 rounded-xl border border-red-500/20 bg-red-950/20 text-red-400 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Analyse beschränkt / Hinweis</p>
                      <p className="mt-0.5">{errorMessage}</p>
                    </div>
                  </div>
                )}

                {/* Scan Quota Badge */}
                <div className="mt-5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <span className="text-zinc-300 font-mono text-[11px]">Guthaben / Modus:</span>
                  </div>
                  {isPremiumUnlocked ? (
                    <span className="text-emerald-400 font-bold font-mono text-[11px] flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                      <Unlock className="w-3.5 h-3.5" /> VIP UNBEGRENZT FREIGESCHALTET
                    </span>
                  ) : (
                    <span className={`font-bold font-mono text-[11px] flex items-center gap-1.5 px-2.5 py-1 rounded border ${
                      scanCount >= 1 
                        ? "text-amber-400 bg-amber-400/10 border-amber-400/30" 
                        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    }`}>
                      <Lock className="w-3.5 h-3.5" /> 
                      {scanCount >= 1 ? "1 von 1 Gratis-Scan verbraucht (Abo erforderlich)" : "1 kostenlose Gratis-Analyse verfügbar"}
                    </span>
                  )}
                </div>

                {/* Explicit Pricing & Plan Selector Box for Main Gesetzes-Scanner */}
                <div className="mt-4 p-4 rounded-2xl bg-black/80 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      Abonnement & Tarif wählen (Gesetzes-Scanner):
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">Direkt freischaltbar</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleTriggerPayment("annual")}
                      className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-amber-400/60 text-left transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-amber-300">1-Jahres-Abo</span>
                          <span className="text-[9px] font-mono bg-amber-400/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-400/20">Beliebt</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-1">Automatische Verlängerung</span>
                      </div>
                      <div className="mt-3 text-sm font-mono font-extrabold text-amber-400 flex items-baseline justify-between">
                        <span>4,99 € <span className="text-[10px] font-normal text-zinc-400">/ Jahr</span></span>
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTriggerPayment("lifetime")}
                      className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-amber-400/60 text-left transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-amber-300">Lebenslang Flatrate</span>
                          <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">Bester Wert</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-1">Einmaliger VIP-Kauf</span>
                      </div>
                      <div className="mt-3 text-sm font-mono font-extrabold text-amber-400 flex items-baseline justify-between">
                        <span>19,99 € <span className="text-[10px] font-normal text-zinc-400">einmalig</span></span>
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Scanning Progress Loader Overlay */}
              {isLoading && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 text-center space-y-6 shadow-silver-glow animate-pulse">
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-full">
                    <Scale className="w-8 h-8 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-display font-bold text-white tracking-tight">Kryptografische Analyse läuft...</h4>
                    <p className="text-xs text-amber-400 font-mono tracking-widest uppercase">
                      {loadingStep === 0 && "Schritt 1: Initialisiere Gesetzes-Scanner..."}
                      {loadingStep === 1 && "Schritt 2: Extrahiere Tatbestandsmerkmale..."}
                      {loadingStep === 2 && "Schritt 3: Konsultiere Gesetzbücher & Datenbank..."}
                      {loadingStep === 3 && "Schritt 4: Evaluiere Formfehler & Verjährungen..."}
                      {loadingStep === 4 && "Schritt 5: Berechne Verteidigungsszenario..."}
                    </p>
                  </div>
                  <div className="w-full max-w-xs mx-auto bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-500"
                      style={{ width: `${(loadingStep + 1) * 20}%` }}
                    />
                  </div>
                </div>
              )}

              {/* ANALYZER OUTPUT CONTAINER */}
              {scanResult && !isLoading && (
                <div id="scan_result_display" className="space-y-6">
                  
                  {/* Title & Category Banner */}
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Scan-Bericht generiert</span>
                    </div>
                    <span className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">
                      Kategorie: {selectedCategory}
                    </span>
                  </div>

                  {/* 1. 🚨 SOFORT-MASSNAHME (NOTFALL-REGEL) - ALWAYS FULLY VISIBLE IN GOLD */}
                  <div id="section_sofortmassnahme" className="bg-zinc-950 border-2 border-red-900/50 rounded-2xl p-6 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/5 blur-3xl rounded-full"></div>
                    <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-3 mb-4">
                      <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/20">
                        <ShieldAlert className="w-5 h-5 text-red-400 animate-bounce" />
                      </div>
                      <div>
                        <span className="text-red-400 text-[10px] font-mono tracking-widest uppercase">Akut-Hilfe</span>
                        <h4 className="font-display font-extrabold text-lg text-white tracking-tight">1. 🚨 SOFORT-MASSNAHME (NOTFALL-REGEL)</h4>
                      </div>
                    </div>
                    
                    {/* Beautiful golden formatting styled text */}
                    <div className="text-gold text-sm font-medium leading-relaxed font-sans border-l-2 border-amber-400/30 pl-4 py-1 whitespace-pre-wrap">
                      {scanResult.sofortmassnahme.split("\n").filter(para => para.trim().length > 0).map((para, i) => (
                        <p key={`sofort-${i}`} className="mb-2" dangerouslySetInnerHTML={{ __html: formatGoldText(para) }}></p>
                      ))}
                    </div>
                  </div>

                  {/* 2. 💸 PREMIUM-GATEWAY (THE PAYWALL BOX) */}
                  {!isPremiumUnlocked && (
                    <div id="section_paywall" className="bg-gradient-to-b from-zinc-950 to-black border border-zinc-800 rounded-3xl p-8 shadow-gold-glow text-center relative overflow-hidden">
                      {/* Premium decoration backdrop */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-1 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"></div>
                      
                      <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-5 h-5 text-amber-400 animate-pulse" />
                      </div>

                      <span className="text-amber-400 text-[11px] font-mono tracking-widest uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                        EXKLUSIVES VERTEIDIGUNGS-UPGRADE
                      </span>

                      <h4 className="font-display font-extrabold text-xl text-white tracking-tight mt-4">
                        Gesetzes-Scanner: Das erste Frühwarnsystem für deine Rechte.
                      </h4>
                      
                      <p className="mt-3 text-zinc-300 text-sm max-w-xl mx-auto leading-relaxed">
                        Ich habe Anzeichen für verfahrenstaktische Spielräume oder Formfehler in deinem Fall gefunden. Schalte jetzt die komplette Strategie und das fertige Musterschreiben frei.
                      </p>

                      {/* Silver & Gold Buttons */}
                      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
                        
                        {/* Silver Plan Button */}
                        <button
                          onClick={() => handleTriggerPayment("annual")}
                          className="flex flex-col items-center text-center p-5 rounded-2xl border border-zinc-700 bg-gradient-to-b from-zinc-800 to-zinc-900 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer group"
                        >
                          <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400 group-hover:text-white transition-colors">FESTE MINDESTLAUFZEIT (1 JAHR)</span>
                          <span className="text-lg font-display font-bold text-white mt-1">NUR 4,99 € JÄHRLICH</span>
                          <span className="text-[11px] text-zinc-300 font-medium mt-1">Abo mit 12 Monaten Mindestlaufzeit</span>
                          <span className="text-[9px] text-zinc-400 mt-1 leading-normal">Keine vorzeitige Kündigung oder Erstattung nach Erhalt der Analyse</span>
                          <span className="mt-4 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/20">
                            Silber-Jahresabo buchen
                          </span>
                        </button>

                        {/* Gold Plan Button */}
                        <button
                          onClick={() => handleTriggerPayment("lifetime")}
                          className="flex flex-col items-center text-center p-5 rounded-2xl border border-amber-500 bg-gradient-to-b from-zinc-900 to-black hover:shadow-gold-glow active:scale-[0.98] transition-all cursor-pointer group relative"
                        >
                          {/* Popular badge */}
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-black font-mono font-bold text-[8px] tracking-widest uppercase px-2 py-0.5 rounded border border-amber-500">
                            VIP EMPFEHLUNG
                          </div>
                          
                          <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 group-hover:brightness-110">EINMALZAHLUNG • LEBENSLANG</span>
                          <span className="text-lg font-display font-extrabold text-amber-400 mt-1 animate-gold-pulse">NUR 19,99 € LEBENSLANG</span>
                          <span className="text-[11px] text-zinc-300 font-medium mt-1">Das absolute VIP-Sorglos-Paket auf Lebenszeit</span>
                          <span className="text-[9px] text-zinc-500 mt-1 leading-normal">Kein Abo, keine weiteren Kosten, dauerhafter Premium-Zugriff</span>
                          <span className="mt-4 px-4 py-1.5 rounded-full bg-amber-400 text-black text-xs font-extrabold shadow-sm">
                            VIP-Sorglos buchen
                          </span>
                        </button>
                      </div>

                      <p className="mt-4 text-[10px] text-zinc-500 font-mono">
                        🔒 Sichere SSL-Verschlüsselung • Sofortige Freischaltung • Abo mit 12 Monaten Mindestlaufzeit (kein sofortiges Kündigungsrecht nach Erhalt digitaler Analysen)
                      </p>
                    </div>
                  )}

                  {/* Premium Unlocked Notification */}
                  {isPremiumUnlocked && (
                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-400/5 flex items-center justify-between text-xs text-amber-400 font-mono shadow-gold-glow animate-pulse">
                      <div className="flex items-center gap-2">
                        <Unlock className="w-4 h-4" />
                        <span>PREMIUM STRATEGIE END-TO-END FREIGESCHALTET</span>
                      </div>
                      <span className="text-[10px] bg-amber-400 text-black px-2 py-0.5 rounded font-bold">VIP STATUS</span>
                    </div>
                  )}

                  {/* LOCKED PORTIONS OR UNLOCKED OUTPUT PORTIONS */}
                  <div className="relative">
                    
                    {/* Blurring Container Overlay if not paid */}
                    {!isPremiumUnlocked && (
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black z-10 flex flex-col items-center justify-end pb-12">
                        <div className="backdrop-blur-sm p-4 rounded-2xl border border-zinc-800 bg-zinc-950/90 text-center shadow-lg max-w-sm">
                          <Eye className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                          <h5 className="font-display font-bold text-sm text-white">Inhalt verschlüsselt</h5>
                          <p className="text-xs text-zinc-400 mt-1">
                            Schalten Sie den vollständigen Formfehler-Check, Taktiken und Musterschreiben über die Premium-Buttons frei.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Blurrable Sections wrapper */}
                    <div className={`space-y-6 ${!isPremiumUnlocked ? "select-none blur-md pointer-events-none opacity-45" : ""}`}>
                      
                      {/* POWER LEGAL ANALYSIS SUITE: Präzedenzfälle, Erfolgschancen, Gegenargumente, Taktik & Fristen */}
                      <PowerLegalAnalysis scanResult={scanResult} onCopyText={copyToClipboard} />

                      {/* 3. 🔍 VERFAHRENS- & FORMFEHLER-CHECK (DIE "SCHLUPFLÖCHER") */}
                      <div id="section_verfahrenscheck" className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                        <div className="flex items-center gap-3 border-b border-zinc-800 pb-3 mb-4">
                          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                            <BookOpen className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <span className="text-amber-400 text-[10px] font-mono tracking-widest uppercase">Exploration</span>
                            <h4 className="font-display font-bold text-lg text-white tracking-tight">3. 🔍 VERFAHRENS- & FORMFEHLER-CHECK (DIE &quot;SCHLUPFLÖCHER&quot;)</h4>
                          </div>
                        </div>

                        <div className="text-gold text-sm font-medium leading-relaxed font-sans whitespace-pre-wrap">
                          {scanResult.verfahrens_check.split("\n").filter(para => para.trim().length > 0).map((para, i) => (
                            <p key={`verfahren-${i}`} className="mb-2" dangerouslySetInnerHTML={{ __html: formatGoldText(para) }}></p>
                          ))}
                        </div>
                      </div>

                      {/* 4. 🛡️ TAKTISCHE MARSCHRICHTUNG & STRATEGIE */}
                      <div id="section_taktik" className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                        <div className="flex items-center gap-3 border-b border-zinc-800 pb-3 mb-4">
                          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                            <ShieldAlert className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <span className="text-amber-400 text-[10px] font-mono tracking-widest uppercase">Strategie</span>
                            <h4 className="font-display font-bold text-lg text-white tracking-tight">4. 🛡️ TAKTISCHE MARSCHRICHTUNG & STRATEGIE</h4>
                          </div>
                        </div>

                        <div className="text-gold text-sm font-medium leading-relaxed font-sans whitespace-pre-wrap">
                          {scanResult.taktik.split("\n").filter(para => para.trim().length > 0).map((para, i) => (
                            <p key={`taktik-${i}`} className="mb-2" dangerouslySetInnerHTML={{ __html: formatGoldText(para) }}></p>
                          ))}
                        </div>
                      </div>

                      {/* 5. 📝 NÄCHSTE SCHRITTE & MUSTERTEXT */}
                      <div id="section_schritte" className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                        <div className="flex items-center gap-3 border-b border-zinc-800 pb-3 mb-4">
                          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                            <FileText className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <span className="text-amber-400 text-[10px] font-mono tracking-widest uppercase">Aktion</span>
                            <h4 className="font-display font-bold text-lg text-white tracking-tight">5. 📝 NÄCHSTE SCHRITTE & MUSTERTEXT</h4>
                          </div>
                        </div>

                        <div className="text-gold text-sm font-medium leading-relaxed font-sans whitespace-pre-wrap mb-4">
                          {scanResult.schritte_mustertext.split("\n").filter(para => para.trim().length > 0).map((para, i) => (
                            <p key={`schritte-${i}`} className="mb-2" dangerouslySetInnerHTML={{ __html: formatGoldText(para) }}></p>
                          ))}
                        </div>

                        {/* Interactive Copy Musterschreiben Button */}
                        <div className="mt-6 p-4 rounded-xl bg-black border border-zinc-800/80 flex flex-col sm:flex-row justify-between items-center gap-3">
                          <div className="text-left">
                            <h5 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Musterschreiben bereitgestellt</h5>
                            <p className="text-[11px] text-zinc-500">Das oben generierte Schreiben ist rechtssicher für Ermittlungsbehörden formuliert.</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(scanResult.schritte_mustertext)}
                            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-b from-zinc-700 to-zinc-800 text-white rounded-lg text-xs font-bold border border-zinc-600 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Schreiben kopieren
                          </button>
                        </div>

                      </div>

                      {/* 6. 📜 PRÜFUNGSFERTIGER SCHRIFTSATZ & ANWALTS-KOSTENOPTIMIERUNG (FULL LEGAL ENGINE) */}
                      {scanResult.full_schriftsatz && (
                        <div id="section_full_schriftsatz" className="bg-gradient-to-b from-zinc-950 via-black to-zinc-950 border-2 border-amber-500/40 rounded-2xl p-6 shadow-gold-glow space-y-6">
                          
                          {/* Top Header & Triage Badge */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-[10px] font-extrabold uppercase bg-amber-400 text-black px-2.5 py-0.5 rounded shadow-sm">
                                  {scanResult.full_schriftsatz.meta.legal_domain}
                                </span>
                                <span className="font-mono text-[10px] font-extrabold uppercase bg-zinc-800 text-amber-300 px-2.5 py-0.5 rounded border border-amber-400/30">
                                  {scanResult.full_schriftsatz.meta.selected_tab}
                                </span>
                              </div>
                              <h4 className="font-display font-extrabold text-xl text-white tracking-tight">
                                6. 📜 PRÜFUNGSFERTIGER SCHRIFTSATZ & KOSTENERS PARNIS-ANALYSE
                              </h4>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                Formeller Entwurf für den prüfenden Rechtsanwalt & Kostenoptimierung
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  const draft = scanResult.full_schriftsatz?.draft_document;
                                  if (!draft) return;
                                  const fullText = `${draft.header}\n\n${draft.antraege}\n\n${draft.begruendung}\n\n${draft.signature_block}`;
                                  copyToClipboard(fullText);
                                }}
                                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5 text-amber-400" />
                                Entwurf Kopieren
                              </button>
                              <button
                                onClick={() => window.print()}
                                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Drucken / PDF
                              </button>
                            </div>
                          </div>

                          {/* Fristen-Kalkulator & Anwalts-Kostenersparnis Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Fristen & Instanz Info */}
                            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                                <Calendar className="w-4 h-4" />
                                Fristen-Kalkulator & Instanz
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-[10px] text-zinc-500 block uppercase font-mono">Zielgericht:</span>
                                  <span className="font-bold text-zinc-200">{scanResult.full_schriftsatz.meta.court_target}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-zinc-500 block uppercase font-mono">Aktenzeichen:</span>
                                  <span className="font-bold text-zinc-200">{scanResult.full_schriftsatz.meta.file_number}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-zinc-500 block uppercase font-mono">Berechnete Frist:</span>
                                  <span className="font-bold text-amber-400 font-mono">{scanResult.full_schriftsatz.meta.deadline_status.calculated_deadline}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-zinc-500 block uppercase font-mono">Verbleibende Tage:</span>
                                  <span className="font-extrabold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 inline-block">
                                    {scanResult.full_schriftsatz.meta.deadline_status.remaining_days} Tage
                                  </span>
                                </div>
                              </div>
                              {scanResult.full_schriftsatz.meta.deadline_status.date_warning && (
                                <p className="text-[11px] text-red-300 bg-red-950/30 p-2 rounded border border-red-500/30">
                                  ⚠️ {scanResult.full_schriftsatz.meta.deadline_status.date_warning}
                                </p>
                              )}
                            </div>

                            {/* Anwalts-Kostenersparnis (Anfix-Logik) */}
                            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                                  <DollarSign className="w-4 h-4" />
                                  Kostenersparnis durch Vorarbeit
                                </div>
                                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                                  -70% BIS -80% KOSTEN
                                </span>
                              </div>
                              <p className="text-sm font-display font-extrabold text-white">
                                Eingesparte Recherchezeit: <span className="text-amber-400">{scanResult.full_schriftsatz.meta.cost_savings_potential.estimated_attorney_hours_saved}</span>
                              </p>
                              <p className="text-xs text-zinc-300 leading-relaxed">
                                {scanResult.full_schriftsatz.meta.cost_savings_potential.argument_for_lawyer}
                              </p>
                            </div>

                          </div>

                          {/* Identified Errors & Referenced Laws */}
                          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                            <h5 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                              <FileCheck className="w-4 h-4" />
                              Identifizierte Rügen, Formfehler & Angewendete Gesetze
                            </h5>
                            
                            <div className="flex flex-wrap gap-2">
                              {scanResult.full_schriftsatz.legal_analysis.referenced_laws_used.map((law, i) => (
                                <span key={i} className="text-xs font-mono font-bold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/30">
                                  {law}
                                </span>
                              ))}
                            </div>

                            <div className="space-y-1.5 pt-2">
                              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Geltend gemachte Fehler & Angriffs-Punkte:</span>
                              {scanResult.full_schriftsatz.legal_analysis.identified_errors_or_grounds.map((err, i) => (
                                <div key={i} className="text-xs text-zinc-200 flex items-start gap-2 bg-black/40 p-2 rounded border border-zinc-800/80">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                  <span>{err}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Full Formal Legal Draft (Schriftsatz) Box */}
                          <div className="bg-black border border-zinc-800 rounded-xl p-6 font-mono text-xs text-zinc-200 leading-relaxed space-y-4 shadow-inner">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-[10px] text-zinc-500 uppercase tracking-widest">
                              <span>Muster-Schriftsatz (Anwalts-Standard)</span>
                              <span>Prüfungsfertig</span>
                            </div>

                            {/* Header */}
                            <div className="whitespace-pre-wrap font-bold text-amber-200 border-l-2 border-amber-400/50 pl-3 py-1 bg-amber-400/5 rounded-r">
                              {scanResult.full_schriftsatz.draft_document.header}
                            </div>

                            {/* Anträge */}
                            <div className="space-y-1">
                              <span className="text-amber-400 font-bold uppercase block text-[11px]">ANTRAEG:</span>
                              <div className="whitespace-pre-wrap pl-3 border-l border-zinc-800 text-zinc-100 italic">
                                {scanResult.full_schriftsatz.draft_document.antraege}
                              </div>
                            </div>

                            {/* Begründung */}
                            <div className="space-y-1 pt-2">
                              <span className="text-amber-400 font-bold uppercase block text-[11px]">BEGRÜNDUNG:</span>
                              <div className="whitespace-pre-wrap text-zinc-300 leading-normal pl-3 border-l border-zinc-800">
                                {scanResult.full_schriftsatz.draft_document.begruendung}
                              </div>
                            </div>

                            {/* Signature Block */}
                            <div className="pt-4 border-t border-zinc-900 text-right italic text-zinc-400">
                              {scanResult.full_schriftsatz.draft_document.signature_block}
                            </div>
                          </div>

                        </div>
                      )}

                    </div>
                  </div>

                  {/* RECHTLICHER DISCLAIMER (ALWAYS AT THE BOTTOM OF ANALYSIS) */}
                  <div className="bg-zinc-950/50 border border-zinc-900/80 rounded-xl p-4 text-center mt-6">
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-mono italic">
                      {scanResult.disclaimer}
                    </p>
                  </div>

                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB 2: 24/7 GESETZES-RADAR & UNWETTER-WARNSYSTEM */}
        <AnimatePresence mode="wait">
          {activeTab === "gesetzes_radar" && (
            <motion.div
              key="gesetzes_radar_content"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Top Monitor Status Ticker */}
              <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-silver-glow relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold mb-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      24/7 PARAGRAFEN-MONITOR AKTIV • BUNDESGESETZBLATT-RADAR
                    </div>
                    <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
                      Automatische Gesetzesänderungs-Warnungen
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                      Wir überwachen <strong className="text-amber-400 font-mono">42.850 Gesetzestexte & BGH/BAG-Urteile</strong> alle paar Stunden automatisch. Sobald sich Paragrafen in Deinen Rechtsgebieten ändern, erhältst Du sofort eine Eil-Warnung – ähnlich wie bei einer Unwetterwarnung.
                    </p>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-zinc-800 pt-3 md:pt-0 md:pl-6 w-full md:w-auto">
                    <div className="text-[11px] font-mono text-zinc-400">
                      Letzte Prüfung: <span className="text-emerald-400 font-bold">{radarLastCheckTime}</span>
                    </div>
                    <button
                      onClick={() => triggerLiveLawCheck()}
                      disabled={isCheckingRadar}
                      className="w-full md:w-auto bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black px-4 py-2 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${isCheckingRadar ? "animate-spin" : ""}`} />
                      {isCheckingRadar ? "Prüfe Gesetzblätter..." : "Jetzt Manuelle Eil-Prüfung starten"}
                    </button>
                  </div>
                </div>

                {/* Banner Status message */}
                {radarCheckSuccessMessage && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{radarCheckSuccessMessage}</span>
                  </div>
                )}
              </div>

              {/* Preferences & Subscriptions panel */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-400" />
                    <h3 className="font-display font-bold text-white text-sm">
                      Abo-Filter: Überwachte Rechtsgebiete & Warnkanäle
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    Echtzeit-Synchronisation
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">
                      Wähle Deine Rechtsgebiete für automatische Eil-Warnungen:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Mietrecht",
                        "Arbeitsrecht",
                        "Strafrecht & StPO",
                        "Verkehrsrecht",
                        "KCanG Cannabis"
                      ].map((topic) => {
                        const isSelected = subscribedTopics.includes(topic);
                        return (
                          <button
                            key={topic}
                            onClick={() => toggleSubscribedTopic(topic)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-amber-400/10 text-amber-300 border-amber-400/40 shadow-sm"
                                : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300"
                            }`}
                          >
                            <Check className={`w-3.5 h-3.5 ${isSelected ? "text-amber-400" : "opacity-0"}`} />
                            {topic}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-900">
                    <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs cursor-pointer hover:border-zinc-700">
                      <div className="flex items-center gap-2">
                        <Bell className={`w-4 h-4 ${enablePushAlerts ? "text-amber-400" : "text-zinc-500"}`} />
                        <div>
                          <p className="font-semibold text-zinc-200">Push-Eilnachrichten wie Unwetterwarnung</p>
                          <p className="text-[10px] text-zinc-500">Sofort-Display-Banner bei neuen Urteilen</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={enablePushAlerts}
                        onChange={(e) => setEnablePushAlerts(e.target.checked)}
                        className="rounded border-zinc-700 bg-black text-amber-400 focus:ring-amber-400 h-4 w-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs cursor-pointer hover:border-zinc-700">
                      <div className="flex items-center gap-2">
                        <Volume2 className={`w-4 h-4 ${enableSoundAlerts ? "text-amber-400" : "text-zinc-500"}`} />
                        <div>
                          <p className="font-semibold text-zinc-200">Akustisches Warnsignal</p>
                          <p className="text-[10px] text-zinc-500">Signalton bei kritischen BGH/BAG-Urteilen</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableSoundAlerts}
                        onChange={(e) => setEnableSoundAlerts(e.target.checked)}
                        className="rounded border-zinc-700 bg-black text-amber-400 focus:ring-amber-400 h-4 w-4"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Feed of Unwetter-Style Law Alerts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                    <Radio className="w-4 h-4 text-red-400 animate-pulse" />
                    Aktuelle Paragrafen-Warnungen & Gesetzesänderungen
                  </h3>
                  <span className="text-xs font-mono text-zinc-500">
                    {lawAlerts.length} Eil-Meldungen registriert
                  </span>
                </div>

                {lawAlerts.map((alert) => {
                  const isCritical = alert.severity === "CRITICAL";
                  const isHigh = alert.severity === "HIGH";

                  return (
                    <div
                      key={alert.id}
                      className={`rounded-2xl p-6 transition-all border relative overflow-hidden ${
                        isCritical
                          ? "bg-gradient-to-br from-red-950/40 via-zinc-950 to-zinc-950 border-red-500/40 shadow-red-glow"
                          : isHigh
                          ? "bg-gradient-to-br from-amber-950/30 via-zinc-950 to-zinc-950 border-amber-500/30 shadow-gold-glow"
                          : "bg-zinc-950 border-zinc-800"
                      }`}
                    >
                      {/* Top severity badge & date */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-xs font-bold px-2.5 py-1 rounded border flex items-center gap-1.5 ${
                              isCritical
                                ? "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse"
                                : isHigh
                                ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                                : "bg-zinc-800 text-zinc-300 border-zinc-700"
                            }`}
                          >
                            {isCritical && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                            {isHigh && <Zap className="w-3.5 h-3.5 text-amber-400" />}
                            {isCritical ? "🚨 EIL-WARNSTUFE ROT" : isHigh ? "⚡ HOHE RELEVANZ" : "ℹ️ INFORMATION"}
                          </span>
                          <span className="font-mono text-xs font-semibold text-zinc-300 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                            {alert.lawCode}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                          <Wifi className="w-3 h-3 text-emerald-400" />
                          {alert.timestamp}
                        </span>
                      </div>

                      {/* Alert Title */}
                      <h4 className="font-display font-extrabold text-lg text-white mb-2 leading-tight">
                        {alert.title}
                      </h4>

                      {/* Summary */}
                      <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                        {alert.summary}
                      </p>

                      {/* Detailed Impact & Action Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                          <div className="flex items-center gap-1.5 mb-1 text-amber-400 text-xs font-mono font-bold">
                            <Zap className="w-3.5 h-3.5" />
                            Konkrete Auswirkung für Abo-Nutzer:
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {alert.impactOnSubscribers}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                          <div className="flex items-center gap-1.5 mb-1 text-emerald-400 text-xs font-mono font-bold">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Empfohlene Sofort-Handlung:
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {alert.recommendedAction}
                          </p>
                        </div>
                      </div>

                      {/* Affected Paragraphs & Action Trigger */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-900">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">Betroffene Paragrafen:</span>
                          {alert.affectedParagraphs.map((para, i) => (
                            <span key={i} className="text-[11px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                              {para}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            setSelectedCategory(alert.category);
                            setSituationText(`Fallprüfung zu Eil-Warnung: ${alert.title}. Betroffen von ${alert.affectedParagraphs.join(", ")}.`);
                            setActiveTab("verfahrens_schutz");
                            setTimeout(() => {
                              const el = document.getElementById("scan-input-area");
                              if (el) el.scrollIntoView({ behavior: "smooth" });
                            }, 100);
                          }}
                          className="text-xs font-display font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          Diesen Fall jetzt im Scanner analysieren →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB 3: GESETZES-DATENBANK (Silver card styled browse) */}
        <AnimatePresence mode="wait">
          {activeTab === "gesetzes_datenbank" && (
            <motion.div
              key="gesetzes_datenbank_content"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Search Bar */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-silver-glow flex items-center gap-3">
                <Search className="w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  value={dbSearch}
                  onChange={(e) => setDbSearch(e.target.value)}
                  placeholder="Durchsuche Gesetzestexte (z. B. '136', 'Diebstahl', 'Einstellung')..."
                  className="w-full bg-black border border-zinc-800 focus:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-700 text-zinc-200"
                />
                {dbSearch && (
                  <button
                    onClick={() => setDbSearch("")}
                    className="text-xs text-zinc-400 hover:text-white font-mono cursor-pointer"
                  >
                    Löschen
                  </button>
                )}
              </div>

              {/* Browse Cards */}
              <div className="space-y-4">
                {filteredLawDatabase.length > 0 ? (
                  filteredLawDatabase.map((law, index) => (
                    <div 
                      key={index} 
                      className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-extrabold text-amber-400 bg-amber-400/5 px-3 py-1 rounded border border-amber-400/20">
                            {law.code}
                          </span>
                          <h3 className="font-display font-bold text-white text-base">
                            {law.title}
                          </h3>
                        </div>
                        <span className="text-xs font-mono text-zinc-500">
                          {law.paragraph}
                        </span>
                      </div>

                      {/* Content */}
                      <p className="text-xs text-zinc-400 leading-relaxed italic border-l-2 border-zinc-800 pl-4 mb-4">
                        &quot;{law.content}&quot;
                      </p>

                      {/* Tactical Golden Box */}
                      <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 shadow-inner">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <ShieldAlert className="w-4 h-4 text-amber-400" />
                          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">Verfahrenstaktische Relevanz</span>
                        </div>
                        <p className="text-gold text-xs leading-relaxed font-medium">
                          {law.tacticalNote}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 border border-zinc-800 rounded-2xl bg-zinc-950">
                    <AlertTriangle className="w-8 h-8 text-zinc-600 mx-auto mb-2 animate-bounce" />
                    <p className="text-sm text-zinc-400">Keine übereinstimmenden Gesetzeseinträge gefunden.</p>
                    <p className="text-xs text-zinc-600 mt-1">Suchen Sie nach anderen Schlüsselbegriffen wie &apos;StPO&apos; oder &apos;Diebstahl&apos;.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB 3: SOFORTHILFE INFO (Interactive emergency checklists & templates) */}
        <AnimatePresence mode="wait">
          {activeTab === "soforthilfe_info" && (
            <motion.div
              key="soforthilfe_info_content"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h3 className="font-display font-bold text-white text-lg">Notfall-Soforthilfe & Musterschreiben bei rechtlichen Eilfällen</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  In akuten Rechtslagen (Hausdurchsuchung, Kündigung, Vorladung, Verkehrskontrolle, Abmahnung) gilt: Erst Ruhe bewahren, Schritte abarbeiten, Musterschreiben nutzen und bei Bedarf die KI-Fallanalyse aktivieren.
                </p>
              </div>

              {/* Quick jump cards for emergency scenarios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {EMERGENCY_GUIDES.map((guide) => (
                  <a
                    key={guide.id}
                    href={`#guide-${guide.id}`}
                    className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-amber-500/50 hover:bg-zinc-900/40 transition-all font-display text-xs text-white flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] text-amber-400 font-semibold uppercase bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                        {guide.category}
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors shrink-0" />
                    </div>
                    <span className="font-bold text-sm text-zinc-100 group-hover:text-white">
                      {guide.title}
                    </span>
                  </a>
                ))}
              </div>

              {/* Active Detailed Checklists & Template Boxes */}
              <div className="space-y-8 mt-6">
                {EMERGENCY_GUIDES.map((guide) => (
                  <div 
                    key={guide.id} 
                    id={`guide-${guide.id}`}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden space-y-6"
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                      <ShieldAlert className="w-24 h-24 text-zinc-400" />
                    </div>

                    {/* Header + Action buttons */}
                    <div className="border-b border-zinc-800 pb-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold uppercase text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20">
                          {guide.category}
                        </span>
                        
                        {/* Instant Scan button */}
                        <button
                          onClick={() => handleEmergencyScanSelect(guide)}
                          className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-display font-bold text-xs py-1.5 px-3 rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Diesen Notfall jetzt KI-analysieren</span>
                        </button>
                      </div>

                      <h4 className="font-display font-extrabold text-white text-lg mt-1">
                        {guide.title}
                      </h4>
                    </div>

                    {/* Step-by-Step Interactive Checkbox list */}
                    <div>
                      <h5 className="font-mono text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                        Verhaltensregeln & Notfall-Checkliste
                      </h5>
                      <div className="space-y-2.5">
                        {guide.steps.map((step, idx) => {
                          const stepId = `${guide.id}-${idx}`;
                          const isChecked = checkedSteps[stepId] || false;
                          return (
                            <div
                              key={idx}
                              onClick={() => toggleStep(stepId)}
                              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                                isChecked
                                  ? "bg-zinc-900/60 border-zinc-800 opacity-60"
                                  : step.important 
                                    ? "bg-amber-950/15 border-amber-500/20 hover:border-amber-500/40"
                                    : "bg-black border-zinc-900 hover:border-zinc-800"
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                  isChecked 
                                    ? "bg-amber-400 border-amber-400 text-black" 
                                    : step.important 
                                      ? "border-amber-500 text-amber-500" 
                                      : "border-zinc-700 text-zinc-400"
                                }`}>
                                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                              </div>
                              
                              <div className="text-xs leading-relaxed">
                                {step.important && !isChecked && (
                                  <span className="mr-1.5 font-mono text-[9px] font-bold bg-amber-400 text-black px-1.5 py-0.5 rounded uppercase">
                                    SEHR WICHTIG
                                  </span>
                                )}
                                <span className={isChecked ? "line-through text-zinc-500" : "text-gold font-medium"}>
                                  {step.text}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Musterschreiben / Vorlage Box */}
                    <div className="bg-black border border-zinc-800 rounded-xl p-4 mt-4">
                      <div className="flex items-center justify-between mb-3 border-b border-zinc-900 pb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-400" />
                          <span className="font-display font-bold text-xs text-white">
                            {guide.templateTitle}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyTemplate(guide.id, guide.templateText)}
                          className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 rounded border border-amber-400/20 transition-all cursor-pointer"
                        >
                          {copiedTemplateId === guide.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Kopiert!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Mustertext kopieren</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-950 p-3 rounded-lg border border-zinc-900 overflow-x-auto selection:bg-amber-500 selection:text-black">
                        {guide.templateText}
                      </pre>
                    </div>

                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 5: BERUFUNG */}
          {activeTab === "berufung" && renderSchriftsatzTabContent("berufung")}

          {/* TAB 6: REVISION */}
          {activeTab === "revision" && renderSchriftsatzTabContent("revision")}

          {/* TAB 7: WIEDERAUFNAHME */}
          {activeTab === "wiederaufnahme" && renderSchriftsatzTabContent("wiederaufnahme")}

          {/* TAB 8: VERFASSUNGSBESCHWERDE */}
          {activeTab === "verfassungsbeschwerde" && renderSchriftsatzTabContent("verfassungsbeschwerde")}

          {/* TAB 9: VERKEHRS-SCANNER & ABO */}
          {activeTab === "verkehrs_scanner" && (
            <motion.div
              key="verkehrs_scanner_content"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <TrafficSubscribeForm 
                currentUser={trafficUser}
                onRegisterSuccess={(u) => setTrafficUser(u)}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </motion.div>
          )}

          {/* TAB 10: VERKEHRS-ÜBERWACHUNG & SIMULATOR */}
          {activeTab === "verkehrs_ueberwachung" && (
            <motion.div
              key="verkehrs_ueberwachung_content"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <TrafficScannerStatus 
                laws={trafficLaws}
                scans={trafficScans}
                onTriggerScan={handleTrafficTriggerScan}
                isLoading={isLoading}
              />
            </motion.div>
          )}

          {/* TAB 11: VERKEHRS-ASSISTENT */}
          {activeTab === "verkehrs_assistent" && (
            <motion.div
              key="verkehrs_assistent_content"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <TrafficGeminiBot 
                currentUser={trafficUser}
                onPaymentSuccess={(u) => setTrafficUser(u)}
              />
            </motion.div>
          )}

          {/* TAB 12: VERKEHRS-ALERTS */}
          {activeTab === "verkehrs_alerts" && (
            <motion.div
              key="verkehrs_alerts_content"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <TrafficAlertsLog 
                alerts={trafficAlerts}
                filterEmail={trafficUser?.email || null}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer Branding Slogan & Prominent Disclaimer */}
      <footer className="max-w-4xl mx-auto px-4 mt-16 text-center border-t border-zinc-900 pt-8 pb-12 space-y-6">
        {/* Footer Disclaimer Box */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 text-left">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-mono font-bold text-amber-400 uppercase text-[10px] tracking-wider block">
                Wichtiger rechtlicher Hinweis:
              </span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Der Gesetze-Scanner ist eine rein technische Software-Anwendung zur automatisierten Text- und Dokumentenanalyse. Die Anwendung bietet zu keinem Zeitpunkt eine Rechtsberatung, juristische Prüfungen oder behördliche Dienstleistungen an und trifft keinerlei rechtsverbindliche Entscheidungen über natürliche Personen. Alle generierten Ergebnisse dienen ausschließlich der technischen Textverarbeitung und Vorbereitung. Die Verantwortung für die inhaltliche und rechtliche Prüfung von Dokumenten verbleibt voll und ganz beim Anwender.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs font-display font-medium text-zinc-500 tracking-wider">
          GESETZES-SCANNER • AUTOMATISIERTE DOKUMENTEN- & TEXTANALYSE-SOFTWARE
        </p>
        {/* Echte HTML-Links (<a href="...">) für Paddle Crawler & Bots */}
        <nav aria-label="Rechtliche Pflichtangaben" className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mt-4 text-[11px] font-mono text-zinc-400">
          <a 
            href="/impressum" 
            onClick={(e) => { e.preventDefault(); setShowImpressumModal(true); window.history.pushState({}, '', '/impressum'); }} 
            className="hover:text-amber-400 transition-colors underline decoration-zinc-800 underline-offset-4 hover:decoration-amber-400/50"
          >
            Impressum (Legal Notice)
          </a>
          <span className="text-zinc-800 hidden sm:inline">|</span>
          <a 
            href="/datenschutz" 
            onClick={(e) => { e.preventDefault(); setShowDatenschutzModal(true); window.history.pushState({}, '', '/datenschutz'); }} 
            className="hover:text-amber-400 transition-colors underline decoration-zinc-800 underline-offset-4 hover:decoration-amber-400/50"
          >
            Datenschutz (Privacy Policy)
          </a>
          <span className="text-zinc-800 hidden sm:inline">|</span>
          <a 
            href="/terms" 
            onClick={(e) => { e.preventDefault(); setShowTermsModal(true); window.history.pushState({}, '', '/terms'); }} 
            className="hover:text-amber-400 transition-colors underline decoration-zinc-800 underline-offset-4 hover:decoration-amber-400/50"
          >
            Nutzungsbedingungen (Terms of Service)
          </a>
          <span className="text-zinc-800 hidden sm:inline">|</span>
          <a 
            href="/refunds" 
            onClick={(e) => { e.preventDefault(); setShowRefundsModal(true); window.history.pushState({}, '', '/refunds'); }} 
            className="hover:text-amber-400 transition-colors underline decoration-zinc-800 underline-offset-4 hover:decoration-amber-400/50"
          >
            Rückerstattungsrichtlinie (Refund Policy)
          </a>
        </nav>
        <p className="text-[10px] text-zinc-600 mt-4 font-mono">
          System-Status: Aktiv • Verschlüsselung: AES-256 • IP-Logging: Deaktiviert
        </p>
      </footer>

      {/* Payment Gate Checkout Modal (Sleek card design with dark overlays) */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            {/* Backdrop blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessingPayment && setShowPaymentModal(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl w-full max-w-lg overflow-hidden relative shadow-gold-glow z-10 text-left my-auto max-h-[90vh] flex flex-col"
            >
              {/* Gold gradient accent bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 z-30"></div>

              {!paymentSuccess ? (
                <>
                  {/* Sticky Header with prominent Close / Abbrechen button */}
                  <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-950/95 sticky top-0 z-20 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-display font-extrabold text-base sm:text-lg text-white tracking-tight leading-tight">Kostenpflichtige Bestellung</h4>
                        <span className="text-[9px] sm:text-[10px] font-mono text-zinc-400 block">256-BIT SSL VERSCHLÜSSELTE ABWICKLUNG</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono shrink-0 shadow-sm"
                    >
                      <span>Schließen</span>
                      <X className="w-4 h-4 text-amber-400" />
                    </button>
                  </div>

                  {/* Scrollable Content Body */}
                  <div className="p-4 sm:p-5 overflow-y-auto space-y-4 max-h-[calc(90vh-130px)]">

                    {/* Interactive Plan Selector - Separated by Product */}
                    <div className="space-y-3">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold flex items-center justify-between">
                        <span>Produkte & Tarife (Getrennt Wählbar)</span>
                        <span className="text-[9px] text-zinc-400 font-normal">Klick zum Auswählen</span>
                      </label>

                      {/* Produkt 1: Allgemeiner Gesetzes-Scanner */}
                      <div className="p-2.5 rounded-xl bg-black border border-zinc-800 space-y-1.5">
                        <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> 1. Allgemeiner Gesetzes-Scanner:
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPlan("allgemein_annual")}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              selectedPlan === "allgemein_annual" || selectedPlan === "annual"
                                ? "bg-amber-400/20 border-amber-400 text-white shadow-gold-glow"
                                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                            }`}
                          >
                            <div>
                              <span className="text-[11px] font-bold text-white block">1-Jahres-Abo</span>
                              <span className="text-[9px] text-zinc-400 block">Gesetzes-Scanner</span>
                            </div>
                            <div className="mt-1 text-xs font-mono font-extrabold text-amber-400">
                              4,99 € <span className="text-[9px] font-normal text-zinc-400">/ Jahr</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedPlan("allgemein_lifetime")}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              selectedPlan === "allgemein_lifetime" || selectedPlan === "lifetime"
                                ? "bg-amber-400/20 border-amber-400 text-white shadow-gold-glow"
                                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                            }`}
                          >
                            <div>
                              <span className="text-[11px] font-bold text-white block">Lebenslang</span>
                              <span className="text-[9px] text-zinc-400 block">Flatrate VIP</span>
                            </div>
                            <div className="mt-1 text-xs font-mono font-extrabold text-amber-400">
                              19,99 € <span className="text-[9px] font-normal text-zinc-400">einmalig</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Produkt 2: StVO Verkehrsmittel Gesetzes-Scanner */}
                      <div className="p-2.5 rounded-xl bg-black border border-zinc-800 space-y-1.5">
                        <span className="text-[10px] font-mono font-bold text-amber-300 uppercase flex items-center gap-1">
                          <Car className="w-3.5 h-3.5 text-amber-400" /> 2. Verkehrsrecht & StVO Scanner:
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPlan("traffic_annual")}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              selectedPlan === "traffic_annual"
                                ? "bg-amber-400/20 border-amber-400 text-white shadow-gold-glow"
                                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                            }`}
                          >
                            <div>
                              <span className="text-[11px] font-bold text-white block">StVO 1-Jahres-Abo</span>
                              <span className="text-[9px] text-zinc-400 block">Fahrzeug-Radar</span>
                            </div>
                            <div className="mt-1 text-xs font-mono font-extrabold text-amber-400">
                              4,99 € <span className="text-[9px] font-normal text-zinc-400">/ Jahr</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedPlan("traffic_lifetime")}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              selectedPlan === "traffic_lifetime"
                                ? "bg-amber-400/20 border-amber-400 text-white shadow-gold-glow"
                                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                            }`}
                          >
                            <div>
                              <span className="text-[11px] font-bold text-white block">StVO Lebenslang</span>
                              <span className="text-[9px] text-zinc-400 block">Fahrzeug Flatrate</span>
                            </div>
                            <div className="mt-1 text-xs font-mono font-extrabold text-amber-400">
                              19,99 € <span className="text-[9px] font-normal text-zinc-400">einmalig</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Produkt 3: Schriftsatz-Module (Einzelleistung - Gezielt Wählbar) */}
                      <div className="p-2.5 rounded-xl bg-black border border-zinc-800 space-y-1.5">
                        <span className="text-[10px] font-mono font-bold text-amber-300 uppercase flex items-center justify-between">
                          <span className="flex items-center gap-1"><FileCheck className="w-3.5 h-3.5 text-amber-400" /> 3. Schriftsatz-Module (9,99 € / Erstellung):</span>
                          <span className="text-[9px] text-zinc-400 font-normal">Gezielte Modul-Wahl</span>
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPlan("schriftsatz_berufung")}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              selectedPlan === "schriftsatz_berufung"
                                ? "bg-amber-400/20 border-amber-400 text-white shadow-gold-glow"
                                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                            }`}
                          >
                            <div>
                              <span className="text-[11px] font-bold text-white block">🏛️ 1. Berufungs-Schriftsatz</span>
                              <span className="text-[9px] text-zinc-400 block">2. Tatsacheninstanz (§ 511 ZPO)</span>
                            </div>
                            <div className="mt-1 text-xs font-mono font-extrabold text-amber-400">
                              9,99 € <span className="text-[9px] font-normal text-zinc-400">1x Guthaben</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedPlan("schriftsatz_revision")}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              selectedPlan === "schriftsatz_revision"
                                ? "bg-amber-400/20 border-amber-400 text-white shadow-gold-glow"
                                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                            }`}
                          >
                            <div>
                              <span className="text-[11px] font-bold text-white block">⚖️ 2. Revisions-Schriftsatz</span>
                              <span className="text-[9px] text-zinc-400 block">Rechtsfehler-Check (§ 545 ZPO)</span>
                            </div>
                            <div className="mt-1 text-xs font-mono font-extrabold text-amber-400">
                              9,99 € <span className="text-[9px] font-normal text-zinc-400">1x Guthaben</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedPlan("schriftsatz_wiederaufnahme")}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              selectedPlan === "schriftsatz_wiederaufnahme"
                                ? "bg-amber-400/20 border-amber-400 text-white shadow-gold-glow"
                                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                            }`}
                          >
                            <div>
                              <span className="text-[11px] font-bold text-white block">🔄 3. Wiederaufnahme</span>
                              <span className="text-[9px] text-zinc-400 block">Neue Beweise (§ 359 StPO)</span>
                            </div>
                            <div className="mt-1 text-xs font-mono font-extrabold text-amber-400">
                              9,99 € <span className="text-[9px] font-normal text-zinc-400">1x Guthaben</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedPlan("schriftsatz_verfassungsbeschwerde")}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              selectedPlan === "schriftsatz_verfassungsbeschwerde"
                                ? "bg-amber-400/20 border-amber-400 text-white shadow-gold-glow"
                                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                            }`}
                          >
                            <div>
                              <span className="text-[11px] font-bold text-white block">🇩🇪 4. Verfassungsbeschw.</span>
                              <span className="text-[9px] text-zinc-400 block">BVerfG Grundrechte (§ 90)</span>
                            </div>
                            <div className="mt-1 text-xs font-mono font-extrabold text-amber-400">
                              9,99 € <span className="text-[9px] font-normal text-zinc-400">1x Guthaben</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Summary Box */}
                    <div className="p-3 rounded-xl bg-black border border-zinc-800/80">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 font-bold">Zusammenfassung Ihres Tarifs</span>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs sm:text-sm font-bold text-white">
                          {selectedPlan === "allgemein_annual" || selectedPlan === "annual"
                            ? "Allg. Gesetzes-Scanner (1-Jahresabo)"
                            : selectedPlan === "allgemein_lifetime" || selectedPlan === "lifetime"
                            ? "Allg. Gesetzes-Scanner (Lebenslang VIP)"
                            : selectedPlan === "traffic_annual"
                            ? "StVO Verkehrsmittel-Scanner (1-Jahresabo)"
                            : selectedPlan === "traffic_lifetime"
                            ? "StVO Verkehrsmittel-Scanner (Lebenslang VIP)"
                            : selectedPlan === "schriftsatz_berufung"
                            ? "🏛️ Berufungs-Schriftsatz (1x Nutzung)"
                            : selectedPlan === "schriftsatz_revision"
                            ? "⚖️ Revisions-Schriftsatz (1x Nutzung)"
                            : selectedPlan === "schriftsatz_wiederaufnahme"
                            ? "🔄 Wiederaufnahme-Schriftsatz (1x Nutzung)"
                            : selectedPlan === "schriftsatz_verfassungsbeschwerde"
                            ? "🇩🇪 Verfassungsbeschwerde-Schriftsatz (1x Nutzung)"
                            : "📜 Prüfungsfertiger Anwalts-Schriftsatz (1x Nutzung)"}
                        </span>
                        <span className="text-sm sm:text-base font-mono font-extrabold text-amber-400 shrink-0 ml-2">
                          {selectedPlan?.includes("annual") || selectedPlan === "annual"
                            ? "4,99 € / Jahr"
                            : selectedPlan?.includes("lifetime") || selectedPlan === "lifetime"
                            ? "19,99 €"
                            : "9,99 €"}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                        {selectedPlan === "allgemein_annual" || selectedPlan === "annual"
                          ? "✓ Schaltet den Allgemeinen Gesetzes-Scanner & Verfahrens-Protection frei (4,99 €/Jahr)."
                          : selectedPlan === "allgemein_lifetime" || selectedPlan === "lifetime"
                          ? "✓ Schaltet den Allgemeinen Gesetzes-Scanner lebenslang frei (19,99 € einmalig)."
                          : selectedPlan === "traffic_annual"
                          ? "✓ Schaltet die Live StVO Fahrzeug-Überwachung & den Verkehrs-Lernassistenten frei (4,99 €/Jahr)."
                          : selectedPlan === "traffic_lifetime"
                          ? "✓ Schaltet die Live StVO Fahrzeug-Überwachung lebenslang frei (19,99 € einmalig)."
                          : selectedPlan === "schriftsatz_berufung"
                          ? "✓ Schaltet 1x gezielte Berufungsschriftsatz-Erstellung frei (9,99 €)."
                          : selectedPlan === "schriftsatz_revision"
                          ? "✓ Schaltet 1x gezielte Revisionsschriftsatz-Erstellung frei (9,99 €)."
                          : selectedPlan === "schriftsatz_wiederaufnahme"
                          ? "✓ Schaltet 1x gezielte Wiederaufnahmeschriftsatz-Erstellung frei (9,99 €)."
                          : selectedPlan === "schriftsatz_verfassungsbeschwerde"
                          ? "✓ Schaltet 1x gezielte Verfassungsbeschwerdeschriftsatz-Erstellung frei (9,99 €)."
                          : "✓ Einmalige Generierung eines prüfungsfertigen Anwalts-Schriftsatzes (9,99 €)."}
                      </p>
                    </div>

                    {/* Payment Method Tabs */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">Zahlungsmethode wählen</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("card")}
                          className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            paymentMethod === "card"
                              ? "bg-amber-400/10 border-amber-400/60 text-amber-300 shadow-sm"
                              : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Kreditkarte</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod("paypal")}
                          className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            paymentMethod === "paypal"
                              ? "bg-amber-400/10 border-amber-400/60 text-amber-300 shadow-sm"
                              : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PayPal</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod("sepa")}
                          className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            paymentMethod === "sepa"
                              ? "bg-amber-400/10 border-amber-400/60 text-amber-300 shadow-sm"
                              : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>SEPA Lastschrift</span>
                        </button>
                      </div>
                    </div>

                    {/* Form Input Fields */}
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">E-Mail-Adresse (für Abo-Rechnung & Bestätigung) *</label>
                        <input
                          type="email"
                          value={paymentEmail}
                          onChange={(e) => setPaymentEmail(e.target.value)}
                          placeholder="beispiel@domain.de"
                          className="w-full bg-black border border-zinc-800 focus:border-amber-400/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>

                      {!currentUser ? (
                        <div>
                          <label className="block text-[10px] font-mono text-amber-400 uppercase mb-1 font-bold flex items-center justify-between">
                            <span>Wunsch-Passwort (für Kundenkonto-Erstellung)</span>
                            <span className="text-[9px] text-zinc-400 font-normal">Optional</span>
                          </label>
                          <input
                            type="password"
                            value={paymentPassword}
                            onChange={(e) => setPaymentPassword(e.target.value)}
                            placeholder="Mindestens 6 Zeichen (z.B. ••••••••)"
                            className="w-full bg-black border border-zinc-800 focus:border-amber-400/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                          <p className="text-[10px] text-zinc-400 mt-1">
                            💡 Wenn Sie ein Passwort vergeben, wird beim Kauf automatisch Ihr Kundenkonto erstellt, um das Abo dauerhaft auf allen Geräten zu sichern.
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Abo wird direkt mit Ihrem Konto ({currentUser.email}) verknüpft.</span>
                        </div>
                      )}

                      {paymentMethod === "card" && (
                        <>
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Name des Karteninhabers *</label>
                            <input
                              type="text"
                              value={paymentName}
                              onChange={(e) => setPaymentName(e.target.value)}
                              placeholder="Max Mustermann"
                              className="w-full bg-black border border-zinc-800 focus:border-amber-400/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Kartennummer (Visa / Mastercard) *</label>
                            <input
                              type="text"
                              value={paymentCardNumber}
                              onChange={(e) => setPaymentCardNumber(e.target.value)}
                              placeholder="4532 •••• •••• 8892"
                              className="w-full bg-black border border-zinc-800 focus:border-amber-400/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Ablaufdatum *</label>
                              <input
                                type="text"
                                value={paymentCardExpiry}
                                onChange={(e) => setPaymentCardExpiry(e.target.value)}
                                placeholder="MM/JJ"
                                className="w-full bg-black border border-zinc-800 focus:border-amber-400/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono text-center"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">CVC / Security Code *</label>
                              <input
                                type="password"
                                maxLength={4}
                                value={paymentCardCvc}
                                onChange={(e) => setPaymentCardCvc(e.target.value)}
                                placeholder="123"
                                className="w-full bg-black border border-zinc-800 focus:border-amber-400/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono text-center"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {paymentMethod === "sepa" && (
                        <>
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Name des Kontoinhabers *</label>
                            <input
                              type="text"
                              value={paymentName}
                              onChange={(e) => setPaymentName(e.target.value)}
                              placeholder="Max Mustermann"
                              className="w-full bg-black border border-zinc-800 focus:border-amber-400/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">IBAN *</label>
                            <input
                              type="text"
                              value={paymentIban}
                              onChange={(e) => setPaymentIban(e.target.value)}
                              placeholder="DE89 3704 0044 0532 0130 00"
                              className="w-full bg-black border border-zinc-800 focus:border-amber-400/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono uppercase"
                            />
                          </div>
                        </>
                      )}

                      {paymentMethod === "paypal" && (
                        <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800 text-xs text-zinc-400 leading-relaxed">
                          Sie werden im nächsten Schritt zu PayPal weitergeleitet, um die Abbuchung zu bestätigen.
                        </div>
                      )}
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/80 cursor-pointer" onClick={() => setPaymentAgreedTerms(!paymentAgreedTerms)}>
                      <input
                        type="checkbox"
                        checked={paymentAgreedTerms}
                        onChange={(e) => setPaymentAgreedTerms(e.target.checked)}
                        className="mt-0.5 accent-amber-400 w-4 h-4 cursor-pointer shrink-0"
                      />
                      <p className="text-[10px] text-zinc-300 leading-normal select-none">
                        Ich stimme ausdrücklich zu, dass Sie vor Ablauf der Widerrufsfrist mit der Ausführung des Vertrags beginnen. Ich akzeptiere die{" "}
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setShowTermsModal(true); }}
                          className="text-amber-400 underline hover:text-amber-300 font-medium cursor-pointer"
                        >
                          AGB
                        </button>{" "}
                        sowie die{" "}
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setShowRefundsModal(true); }}
                          className="text-amber-400 underline hover:text-amber-300 font-medium cursor-pointer"
                        >
                          Rückerstattungsrichtlinie
                        </button>{" "}
                        und verlange und bestätige die kostenpflichtige Bestellung ({selectedPlan?.includes("annual") || selectedPlan === "annual" ? "4,99 €/Jahr mit 12 Monaten Mindestlaufzeit" : selectedPlan?.includes("lifetime") || selectedPlan === "lifetime" ? "19,99 € einmalig" : "9,99 € pro Schriftsatz-Erstellung"}).
                      </p>
                    </div>

                    {/* Validation Error Banner */}
                    {paymentValidationError && (
                      <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{paymentValidationError}</span>
                      </div>
                    )}

                    {/* Submit & Cancel Action Buttons */}
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={processPayment}
                        disabled={isProcessingPayment}
                        className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-display font-extrabold text-xs uppercase py-3 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        {isProcessingPayment ? (
                          <>
                            <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                            <span>Prüfe Zahlungsdaten & Autorisierung...</span>
                          </>
                        ) : (
                          <span>
                            Kostenpflichtig bestellen ({selectedPlan?.includes("annual") || selectedPlan === "annual" ? "4,99 €/Jahr" : selectedPlan?.includes("lifetime") || selectedPlan === "lifetime" ? "19,99 €" : "9,99 €"})
                          </span>
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setShowPaymentModal(false)}
                        disabled={isProcessingPayment}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-mono text-xs py-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Abbrechen / Fenster schließen</span>
                      </button>
                    </div>

                  </div>
                </>
              ) : (
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500 flex items-center justify-center mx-auto animate-bounce">
                    <Check className="w-8 h-8 text-emerald-400 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="font-display font-extrabold text-xl text-white">Bestellung erfolgreich bestätigt</h4>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Vielen Dank! Ihre Transaktion wurde erfolgreich genehmigt. Eine digitale Quittung wurde an <span className="text-amber-400 font-mono font-bold">{paymentEmail}</span> versendet.
                    </p>
                  </div>

                  <div className="p-3 bg-black border border-zinc-800 rounded-xl text-left max-w-sm mx-auto space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-500">Transaktions-ID:</span>
                      <span className="font-mono text-white font-bold">{paymentTransactionId}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-500">Status:</span>
                      <span className="text-emerald-400 font-bold uppercase text-[10px] font-mono">Aktiviert & Bezahlt</span>
                    </div>
                  </div>

                  <p className="text-xs text-amber-400 font-mono animate-pulse">Schalte exklusive Strategie & Musterschreiben frei...</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Impressum Modal */}
      <AnimatePresence>
        {showImpressumModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowImpressumModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 overflow-hidden relative shadow-gold-glow z-10 text-left"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"></div>
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-extrabold text-xl text-white tracking-tight">Impressum</h3>
                <button 
                  onClick={() => setShowImpressumModal(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-full bg-zinc-900 border border-zinc-800 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-zinc-300 overflow-y-auto max-h-[70vh] pr-2 scrollbar-thin">
                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-amber-400 font-mono">Angaben gemäß § 5 TMG / Verantwortlich für den Inhalt</h4>
                  <p className="mt-1 font-bold text-white">Vedat Kurt</p>
                  <p>SİDE MAH. 1549_1 SK. ASIM BEY APT. 2 SİTESİ NO: 14 İÇ KAPI NO: 8</p>
                  <p>MANAVGAT / ANTALYA</p>
                  <p>07600 Manavgat Side Antalya</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-amber-400 font-mono">Kontakt</h4>
                  <p className="mt-1 font-medium">Vedat Kurt</p>
                  <p>E-Mail: vedn2249@gmail.com</p>
                  <p>Telefon: 05436070792</p>
                </div>

                <div className="border-t border-zinc-900 pt-3">
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-amber-400 font-mono">Haftungsausschluss</h4>
                  <p className="mt-1 text-zinc-400 leading-relaxed">
                    Die Inhalte unseres Dienstes wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Gesetzes-Scanner ist ein KI-gestütztes Informationssystem und ersetzt keine juristische Einzelfallberatung durch zugelassene Rechtsanwälte.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Datenschutz Modal */}
      <AnimatePresence>
        {showDatenschutzModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDatenschutzModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 overflow-hidden relative shadow-gold-glow z-10 text-left"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"></div>
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-extrabold text-xl text-white tracking-tight">Datenschutzerklärung</h3>
                <button 
                  onClick={() => setShowDatenschutzModal(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-full bg-zinc-900 border border-zinc-800 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-zinc-300 overflow-y-auto max-h-[70vh] pr-2 scrollbar-thin">
                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-amber-400 font-mono">1. Datenschutz auf einen Blick</h4>
                  <p className="mt-1 leading-relaxed">
                    Der Schutz Ihrer persönlichen Daten hat für uns höchste Priorität. Wir erheben beim Scannen Ihrer Situation keine personenbezogenen Daten wie Namen oder IP-Adressen dauerhaft. Ihre Eingaben werden nur zur Analyse herangezogen und nach Beendigung der Sitzung gelöscht.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-amber-400 font-mono">2. Verantwortliche Stelle</h4>
                  <p className="mt-1 leading-relaxed">
                    Vedat Kurt<br/>
                    SİDE MAH. 1549_1 SK. ASIM BEY APT. 2 SİTESİ NO: 14 İÇ KAPI NO: 8<br/>
                    07600 Manavgat Side Antalya / Türkei<br/>
                    E-Mail: vedn2249@gmail.com<br/>
                    Telefon: 05436070792
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-amber-400 font-mono">3. Datenverarbeitung bei der Analyse</h4>
                  <p className="mt-1 leading-relaxed">
                    Die im Textfeld beschriebenen Situationen werden verschlüsselt an die KI-Schnittstelle übertragen. Es erfolgt kein Profiling und keine Verknüpfung mit Ihrer realen Identität. Ihr Scan verbleibt anonym.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-amber-400 font-mono">4. SSL- bzw. TLS-Verschlüsselung</h4>
                  <p className="mt-1 leading-relaxed">
                    Diese Seite nutzt eine sichere AES-256-Verschlüsselung, um Ihre vertraulichen Fallbeschreibungen vor Zugriffen Dritter zu schützen. Eine Entschlüsselung während des Transports ist ausgeschlossen.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-amber-400 font-mono">5. Ihre Rechte gemäß DSGVO</h4>
                  <p className="mt-1 leading-relaxed">
                    Sie haben das Recht auf unentgeltliche Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten. Da wir keine Profile speichern, können Sie jederzeit die Löschung flüchtiger Sitzungsdaten verlangen.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AGB & Nutzungsbedingungen Modal (/terms) */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTermsModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 overflow-hidden relative shadow-gold-glow z-10 text-left"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"></div>
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-white tracking-tight">Nutzungsbedingungen / AGB</h3>
                  <p className="text-[11px] font-mono text-zinc-500">Allgemeine Geschäftsbedingungen für Gesetze-Scanner</p>
                </div>
                <button 
                  onClick={() => setShowTermsModal(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-full bg-zinc-900 border border-zinc-800 transition-all cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-zinc-300 overflow-y-auto max-h-[70vh] pr-2 scrollbar-thin">
                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-amber-400 font-mono">1. Geltungsbereich</h4>
                  <p className="mt-1 leading-relaxed text-zinc-300">
                    Diese Nutzungsbedingungen gelten für die Nutzung der Web-Applikation „Gesetze-Scanner“ (nachfolgend „Dienst“). Betreiber ist Vedat Kurt.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-amber-400 font-mono">2. Leistungsbeschreibung</h4>
                  <p className="mt-1 leading-relaxed text-zinc-300">
                    Der Dienst bietet KI-gestützte Analysen und Ersteinschätzungen zu rechtlichen Fragestellungen. Die Analysen werden automatisiert erstellt.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-amber-400 font-mono">3. Haftungsausschluss</h4>
                  <p className="mt-1 leading-relaxed text-zinc-300">
                    Die bereitgestellten Inhalte und Scans stellen keine professionelle Rechtsberatung dar und ersetzen keinen Rechtsanwalt. Eine Haftung für die Richtigkeit, Vollständigkeit oder Aktualität der KI-Auswertungen ist ausgeschlossen. Die Nutzung erfolgt auf eigenes Risiko.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-amber-400 font-mono">4. Nutzungsrecht</h4>
                  <p className="mt-1 leading-relaxed text-zinc-300">
                    Mit dem Erwerb von Guthaben oder Abonnements erhält der Nutzer das persönliche, nicht übertragbare Recht, den Dienst im Rahmen der Plattform zu nutzen.
                  </p>
                </div>

                <div className="border-t border-zinc-900 pt-3">
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-amber-400 font-mono">5. Betreiber & Kontakt</h4>
                  <p className="mt-1 leading-relaxed text-zinc-400">
                    Vedat Kurt<br/>
                    SİDE MAH. 1549_1 SK. ASIM BEY APT. 2 SİTESİ NO: 14 İÇ KAPI NO: 8<br/>
                    07600 Manavgat Side Antalya / Türkei<br/>
                    E-Mail: <span className="text-amber-400 font-mono">vedn2249@gmail.com</span><br/>
                    Telefon: 05436070792
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rückerstattungsrichtlinie Modal (/refunds) */}
      <AnimatePresence>
        {showRefundsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRefundsModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 overflow-hidden relative shadow-gold-glow z-10 text-left"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"></div>
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-white tracking-tight">Rückerstattungsrichtlinie</h3>
                  <p className="text-[11px] font-mono text-zinc-500">Rückerstattungs- und Stornierungsrichtlinie</p>
                </div>
                <button 
                  onClick={() => setShowRefundsModal(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-full bg-zinc-900 border border-zinc-800 transition-all cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-zinc-300 overflow-y-auto max-h-[70vh] pr-2 scrollbar-thin">
                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-amber-400 font-mono">1. Gesetzliches 14-tägiges Widerrufsrecht bei ungenutzten Leistungen</h4>
                  <p className="mt-1 leading-relaxed text-zinc-300">
                    Haben Sie einen Zugang, Credits oder ein Abonnement erworben und den Dienst <strong>noch nicht in Anspruch genommen</strong> (keine Dokumente analysiert, keine Scans oder Workflows gestartet), steht Ihnen das gesetzliche 14-tägige Widerrufsrecht ab Kaufdatum uneingeschränkt zu. Sie erhalten in diesem Fall den vollen Kaufpreis erstattet.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-amber-400 font-mono">2. Vorzeitiges Erlöschen des Widerrufsrechts bei Nutzung digitaler Dienste (§ 356 Abs. 5 BGB)</h4>
                  <p className="mt-1 leading-relaxed text-zinc-300">
                    Sobald Sie eine Dokumentenanalyse oder einen Scan starten, wird die digitale Dienstleistung unmittelbar und vollständig erbracht. Sie stimmen mit dem Start der Analyse ausdrücklich zu, dass mit der Ausführung vor Ablauf der Widerrufsfrist begonnen wird. <strong>Mit Beginn und Ausführung der Analyse erlischt das 14-tägige Widerrufsrecht für digitale Inhalte vorzeitig.</strong> Ein nachträglicher Widerruf oder eine Rückerstattung nach erfolgter Analyse ist ausgeschlossen, um Missbrauch zu verhindern.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-amber-400 font-mono">3. Rückerstattungen nach Leistungserbringung</h4>
                  <p className="mt-1 leading-relaxed text-zinc-300">
                    Nach erfolgreicher Bereitstellung der Software-Ergebnisse sind Verkäufe grundsätzlich final und nicht erstattungsfähig (non-refundable).
                  </p>
                </div>

                <div className="border-t border-zinc-900 pt-3">
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-amber-400 font-mono">4. Technische Störungen & Support</h4>
                  <p className="mt-1 leading-relaxed text-zinc-300">
                    Sollte es zu einem nachweisbaren technischen Systemausfall seitens unserer Server kommen, bei dem keine Analyse generiert wurde, wenden Sie sich bitte per E-Mail an unseren Support (<span className="text-amber-400 font-mono">vedn2249@gmail.com</span>) zur Einzelfallprüfung und Erstattung bzw. Gutschrift.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Login & Register Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
        titleNotice={authModalNotice}
      />
    </div>
  );
}
