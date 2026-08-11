export type ActiveTab = 
  | "verfahrens_schutz" 
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

export interface ScanResult {
  sofortmassnahme: string;
  premium_teaser: string;
  verfahrens_check: string;
  taktik: string;
  schritte_mustertext: string;
  disclaimer: string;
  precedents?: PrecedentCase[];
  tactical_steps?: TacticalStep[];
  opposing_arguments?: OpposingArgument[];
  success_prognosis?: SuccessPrognosis;
  deadline_calc?: DeadlineCalculation;
  mustertext_template?: string;
  full_schriftsatz?: FullSchriftsatzResult;
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
