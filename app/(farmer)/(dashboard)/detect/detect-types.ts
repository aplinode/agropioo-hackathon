/** Shared types for the detect feature UI. */

export type Severity = "watch" | "treat_now" | "clear";

export interface DiagnosisResult {
  scanId: string | null;
  diseaseName: string;
  confidence: number;
  severity: Severity;
  crop: string;
  causes: string;
  steps: string[];
  rescanTiming: string;
  caution: string;
  imageUrl: string;
  saveStatus: "saved" | "not_saved";
}

export interface FarmOption {
  id: string;
  name: string;
  crops: string;
}

export interface ScanHistoryItem {
  id: string;
  diseaseName: string;
  confidence: number;
  severity: Severity;
  crop: string;
  causes: string;
  steps: string[];
  rescanTiming: string;
  caution: string;
  imageUrl: string;
  createdAt: string;
  farmId: string | null;
  farmName: string | null;
  saveStatus: "saved" | "not_saved";
}

/** Build a DiagnosisResult from a history row (for the tapped-card view). */
export function toDiagnosis(scan: ScanHistoryItem): DiagnosisResult {
  return {
    scanId: scan.id,
    diseaseName: scan.diseaseName,
    confidence: scan.confidence,
    severity: scan.severity,
    crop: scan.crop,
    causes: scan.causes,
    steps: scan.steps,
    rescanTiming: scan.rescanTiming,
    caution: scan.caution,
    imageUrl: scan.imageUrl,
    saveStatus: scan.saveStatus,
  };
}

/** The subset of a scan needed for the advisor pre-fill message. */
export interface AdvisorDraft {
  crop: string;
  diseaseName: string;
  confidence: number;
  severity: Severity;
}
