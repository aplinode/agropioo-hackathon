/**
 * Typed translation bundle for the pest prediction feature.
 * Built server-side and passed as props to client components.
 */

export type PestBundle = {
  eyebrow: string;
  pageTitle: string;
  description: string;
  farmSelectorLabel: string;
  noFarmsTitle: string;
  noFarmsBody: string;
  addFarm: string;
  weatherUnavailable: string;
  weatherUnavailableBody: string;
  noPrediction: string;
  monitoring: string;
  monitoringBody: string;
  severity: {
    warning: string;
    critical: string;
  };
  status: {
    active: string;
    monitoring: string;
  };
  historyTitle: string;
  historySubtitle: string;
  historyEmpty: string;
  historyDate: string;
  historyFarm: string;
  historyPest: string;
  historyRisk: string;
  historyStatus: string;
  historyViewAll: string;
  detail: {
    back: string;
    weatherConditions: string;
    recommendation: string;
    farm: string;
    crop: string;
    stage: string;
  };
  alerts: {
    title: string;
    dismiss: string;
    noAlerts: string;
    viewAll: string;
    markRead: string;
    markedRead: string;
  };
  source: {
    live: string;
    cached: string;
    demo: string;
    outdated: string;
  };
  buttons: {
    refresh: string;
    updateStage: string;
  };
  errors: {
    generic: string;
    noFarm: string;
    serviceUnavailable: string;
    dataUnavailable: string;
  };
  recommendations: {
    aphid: string;
    whitefly: string;
    bollworm: string;
    jassid: string;
    armyworm: string;
    rust: string;
    locust: string;
    default: string;
  };
  treatment: {
    chemical: string;
    organic: string;
    costEstimate: string;
  };
  widget: {
    title: string;
    allClear: string;
    warningCount: string;
    warningCountPlural: string;
    criticalCount: string;
    criticalCountPlural: string;
    highestRisk: string;
    topFarm: string;
  };
  growthStage: {
    title: string;
    crop: string;
    stage: string;
    save: string;
    saving: string;
    success: string;
    error: string;
  };
};
