export type ActiveTab = 
  | "verfahrens_schutz" 
  | "mock_trial"
  | "kosten_finanzen"
  | "fristen_kalender"
  | "akten_navigator"
  | "rechtsprechungs_radar"
  | "audio_tool"
  | "ki_coach"
  | "selbstvertreter_leitfaden"
  | "anwalts_suche"
  | "berufung" 
  | "revision" 
  | "wiederaufnahme" 
  | "verfassungsbeschwerde" 
  | "gesetzes_radar" 
  | "gesetzes_datenbank" 
  | "soforthilfe_info"
  | "verkehrs_scanner"
  | "verkehrs_ueberwachung"
  | "verkehrs_assistent"
  | "verkehrs_alerts";

export type VehicleType = 'roller' | 'motorrad' | 'quad' | 'auto' | 'lkw' | 'fahrrad' | 'escooter' | 'fussgaenger';

export interface TrafficUser {
  email: string;
  vehicles: VehicleType[];
  registeredAt: string;
  paidUntil: string | null;
  paymentType: 'yearly' | 'lifetime' | 'none';
}

export interface LawSection {
  id: string;
  code: string;
  title: string;
  content: string;
  vehicleCategories: VehicleType[];
  lastUpdated: string;
}

export interface TrafficScanHistory {
  id: string;
  timestamp: string;
  status: 'no_change' | 'change_detected';
  changeSummary: string;
  affectedVehicles: VehicleType[];
}

export interface TrafficLawAlert {
  id: string;
  timestamp: string;
  email: string;
  vehicles: VehicleType[];
  matchedKeywords: string[];
  changedTitle: string;
  lawExcerpt: string;
  geminiExplanation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface LegalCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  exampleText: string;
  relevantParagraphs: string[];
}

export interface PrecedentCase {
  court: string;
  fileNumber: string;
  date: string;
  topic: string;
  summary: string;
  relevance: string;
}

export interface TacticalStep {
  stepNumber: number;
  title: string;
  description: string;
  urgency: 'SOFORT' | 'IN_3_TAGEN' | 'FRISTABHÄNGIG' | 'EMPFEHLUNG';
}

export interface OpposingArgument {
  opposingPoint: string;
  counterStrategy: string;
  supportingParagraph: string;
}

export interface SuccessPrognosis {
  scorePercent: number;
  riskLevel: 'GERING' | 'MITTEL' | 'HOCH';
  mainReasoning: string;
  keyFactors: string[];
}

export interface DeadlineCalculation {
  isValid: boolean;
  remainingDays: number;
  calculatedDeadline: string;
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'NORMAL';
  dateWarning?: string | null;
  weekendNotice?: string;
}

export interface FullSchriftsatzResult {
  meta: {
    legal_domain: string;
    selected_tab: "BERUFUNG" | "REVISION" | "WIEDERAUFNAHME" | "VERFASSUNGSBESCHWERDE" | string;
    court_target: string;
    file_number: string;
    deadline_status: {
      is_valid: boolean;
      remaining_days: number;
      calculated_deadline: string;
      date_warning?: string | null;
    };
    cost_savings_potential: {
      estimated_attorney_hours_saved: string;
      argument_for_lawyer: string;
    };
    export_readiness: {
      format_supported: string[];
      ready_for_download: boolean;
    };
    legal_disclaimer: string;
  };
  legal_analysis: {
    referenced_laws_used: string[];
    identified_errors_or_grounds: string[];
    recommended_strategy: string;
    precedents?: PrecedentCase[];
    opposing_arguments?: OpposingArgument[];
    success_prognosis?: SuccessPrognosis;
    tactical_steps?: TacticalStep[];
  };
  draft_document: {
    header: string;
    antraege: string;
    begruendung: string;
    signature_block: string;
  };
}

export interface VerifiedRagNormCitation {
  code: string;
  book: string;
  title: string;
  officialUrl: string;
  exactWording: string;
  subsumptionFit: string; // Logischer Abgleich: Passen Tatbestandsmerkmale?
  elementsChecked: string[];
}

export interface SubsumptionElement {
  featureName: string;
  isFulfilled: boolean;
  burdenOfProof: string; // "Kläger" | "Beklagter" | "Staatsanwaltschaft" | "Behörde"
  evidenceStatus: string; // "Voll bewiesen" | "Streitig" | "Unbewiesen" | "Anscheinsbeweis"
  subsumption: string;
}

export interface SubsumptionChecklist {
  normCode: string;
  elements: SubsumptionElement[];
  overallResult: boolean;
}

export interface CostCalculationResult {
  streitwert: number;
  courtFeesGKG: number;
  lawyerFeesRVG: number;
  totalOwnRisk: number;
  opponentRisk: number;
  maxCostExposure: number;
  insuranceCovered: number;
  trafficLight: "GREEN" | "YELLOW" | "RED";
  verdict: string;
}

export interface MockTrialStatement {
  role: "RICHTER" | "GEGNER" | "VERTEIDIGER";
  speaker: string;
  argument: string;
  riskScore: number; // 1-10
}

export interface MockTrialSimulation {
  caseSummary: string;
  dialogue: MockTrialStatement[];
  judicialTendency: string;
}

export interface TacticalTiming {
  optimalFilingDate: string;
  timingStrategy: string;
  toneAnalysis: string;
  escalationScore: number; // 1-10
}

export interface TrickClauseFinding {
  clauseText: string;
  violatedNorm: string;
  bghPrecedent: string;
  isInvalid: boolean;
  userAdvantage: string;
}

export interface StatuteOfLimitations {
  claimOriginDate: string;
  regularExpiryDate: string; // 31.12. des 3. Jahres (§§ 195, 199 BGB)
  maxExpiryDate: string; // 10 bzw. 30 Jahre
  isStatuteBarred: boolean;
  applicableNorm: string;
  interruptionEvents: string[]; // z.B. Mahnbescheid, Verhandlungen § 203 BGB
}

export interface EvidenceItem {
  name: string;
  type: "URKUNDE" | "ZEUGE" | "SACHVERSTÄNDIGER" | "AUGENSCHEIN" | "PARTEIVERNEHMUNG";
  grade: number; // 1 (Sehr gut) bis 6 (Ungenügend)
  burdenOfProofFit: boolean;
  recommendation: string;
}

export interface EmotionalCheckResult {
  detectedAggressivePhrases: string[];
  suggestedNeutralPhrases: string[];
  deescalationScore: number; // 1-10
}

export interface MonteCarloSimulation {
  simulatedRuns: number; // z.B. 100
  winRatePercent: number; // z.B. 68%
  settlementRatePercent: number; // z.B. 22%
  lossRatePercent: number; // z.B. 10%
  expectedValueEur: number;
}

export interface PkhCalculationResult {
  isEligible: boolean;
  netIncomeEur: number;
  allowanceTotalEur: number;
  monthlyInstallmentEur: number; // 0 = Ratenfreie PKH
  verdict: string;
}

export interface ScanResult {
  sofortmassnahme: string;
  premium_teaser: string;
  verfahrens_check: string;
  taktik: string;
  schritte_mustertext: string;
  disclaimer: string;
  verified_rag_norms?: VerifiedRagNormCitation[]; // Official RAG Grounded Law Citations with Direct Links
  precedents?: PrecedentCase[];
  tactical_steps?: TacticalStep[];
  opposing_arguments?: OpposingArgument[];
  success_prognosis?: SuccessPrognosis;
  deadline_calc?: DeadlineCalculation;
  mustertext_template?: string;
  full_schriftsatz?: FullSchriftsatzResult;
  // Advanced Power Features
  subsumption_check?: SubsumptionChecklist;
  cost_calculation?: CostCalculationResult;
  mock_trial?: MockTrialSimulation;
  tactical_timing?: TacticalTiming;
  trick_clauses?: TrickClauseFinding[];
  markdown_with_rn?: string;
  confidence_score?: number; // 0.0 - 1.0
  confidence_warning?: string;
  // Features 26-50 Extensions
  statute_of_limitations?: StatuteOfLimitations;
  evidence_ranking?: EvidenceItem[];
  emotional_check?: EmotionalCheckResult;
  monte_carlo?: MonteCarloSimulation;
  pkh_calculation?: PkhCalculationResult;
}

export interface LawEntry {
  code: string;
  title: string;
  paragraph: string;
  content: string;
  tacticalNote: string;
}

export interface LawAlert {
  id: string;
  timestamp: string;
  category: string;
  lawCode: string;
  severity: "CRITICAL" | "HIGH" | "INFO";
  title: string;
  summary: string;
  impactOnSubscribers: string;
  recommendedAction: string;
  affectedParagraphs: string[];
}
