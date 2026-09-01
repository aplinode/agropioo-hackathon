export type WeatherBundle = {
  pageTitle: string;
  eyebrow: string;
  description: string;
  todayAdvisory: string;
  growthStage: string;
  severity: {
    info: string;
    warning: string;
    critical: string;
  };
  forecastTitle: string;
  forecastSubtitle: string;
  weatherUnavailable: string;
  weatherUnavailableBody: string;
  farmSelectorLabel: string;
  registerTitle: string;
  registerBody: string;
  registerCta: string;
  registerForm: {
    title: string;
    body: string;
    crop: string;
    sowing: string;
    soil: string;
    irrigation: string;
    soilTypes: string;
    irrigationMethods: string;
    save: string;
    saving: string;
    success: string;
    error: string;
  };
  historyTitle: string;
  historySubtitle: string;
  historyEmpty: string;
  historyDate: string;
  historySeverity: string;
  historyStatus: string;
  historyStatusNew: string;
  historyStatusSeen: string;
  historyStatusActed: string;
  historyLoadMore: string;
  historyViewAll: string;
  detail: {
    back: string;
    weatherConditions: string;
    recommendation: string;
    markActed: string;
    markAcknowledged: string;
    markedActed: string;
    markedSeen: string;
  };
  source: {
    live: string;
    cached: string;
    demo: string;
  };
  alerts: {
    title: string;
    dismiss: string;
    noAlerts: string;
    viewAll: string;
  };
  stages: {
    seedling: string;
    vegetative: string;
    flowering: string;
    maturation: string;
    harvestReady: string;
    generic: string;
  };
  metric: {
    temperature: string;
    precipitation: string;
    wind: string;
    humidity: string;
  };
  buttons: {
    register: string;
    refresh: string;
  };
  errors: {
    generic: string;
    noFarm: string;
  };
};
