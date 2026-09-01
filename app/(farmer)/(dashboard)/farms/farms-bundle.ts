/**
 * Typed translation bundle for the farms feature (list, new, detail, records).
 * Built server-side and passed as props to client components —
 * avoids "use server" boundaries and keeps client bundles small.
 */

export type FarmsBundle = {
  eyebrow: string;
  healthGood: string;
  healthWatch: string;
  unitsAcres: string;
  stages: {
    sowing: string;
    tillering: string;
    vegetative: string;
    grainFilling: string;
    ready: string;
    squaring: string;
    flowering: string;
    bollFilling: string;
    grandGrowth: string;
    ripening: string;
    harvest: string;
    panicleInitiation: string;
  };
  districts: {
    multan: string;
    sahiwal: string;
    faisalabad: string;
    vehari: string;
    bahawalpur: string;
    lodhran: string;
  };
  crops: {
    wheat: string;
    cotton: string;
    sugarcane: string;
    maize: string;
    rice: string;
  };
  list: {
    pageTitle: string;
    heading: string;
    description: string;
    addLink: string;
    openFarm: string;
    addNewFarm: string;
    emptyHeading: string;
  };
  new: {
    pageTitle: string;
    heading: string;
    description: string;
    fields: {
      name: string;
      district: string;
      crop: string;
      acres: string;
      location: string;
      primaryCrop: string;
      sowingDate: string;
      soilType: string;
      irrigationMethod: string;
    };
    placeholders: {
      name: string;
      district: string;
      crop: string;
      acres: string;
      location: string;
      soilType: string;
    };
    buttons: {
      saving: string;
      save: string;
    };
    success: {
      description: string;
      goToFarms: string;
      backToDashboard: string;
    };
    errors: {
      nameRequired: string;
      districtRequired: string;
      cropRequired: string;
      acresRequired: string;
    };
  };
  detail: {
    pageTitle: string;
    heroEyebrow: string;
    goodHealth: string;
    needsWatching: string;
    sownLabel: string;
    seasonHeading: string;
    activityHeading: string;
    viewAllRecords: string;
    logFieldEvent: string;
    scanCrop: string;
  };
  records: {
    eyebrow: string;
    types: {
      irrigation: string;
      fertilizer: string;
      pesticide: string;
      disease: string;
      harvest: string;
    };
    farmRecords: {
      pageTitle: string;
      heading: string;
      description: string;
    };
    new: {
      pageTitle: string;
      heading: string;
      description: string;
      fields: {
        type: string;
        farm: string;
        date: string;
        title: string;
        optional: string;
        details: string;
      };
      placeholders: {
        farm: string;
        titleIrrigation: string;
        titleOther: string;
        details: string;
      };
      buttons: {
        saving: string;
        save: string;
      };
      success: {
        description: string;
        backToDashboard: string;
        viewFarms: string;
      };
      errors: {
        farmRequired: string;
        dateRequired: string;
      };
    };
  };
};
