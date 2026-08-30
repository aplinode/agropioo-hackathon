/**
 * Typed translation bundle for the detect feature (upload UI, farm selector,
 * severity chips, errors). Built server-side and passed as props to client
 * components — avoids crossing the RSC boundary with a translator function.
 *
 * Disease-specific advice text (causes, steps, rescan timing, caution) comes
 * resolved from the API response, so it is NOT part of this static bundle.
 */
export type DetectBundle = {
  eyebrow: string;
  title: string;
  description: string;
  uploadPrompt: string;
  takePhoto: string;
  sampleScan: string;
  readingLeaf: string;
  analyzing: string;
  scanAnother: string;
  discussAdvisor: string;
  saveToFarm: string;
  savedToFarm: string;
  notSaved: string;
  confidence: string;
  whatToDo: string;
  caution: string;
  noFarmsTitle: string;
  noFarmsBody: string;
  addFarm: string;
  dismiss: string;
  pastScans: string;
  loadMore: string;
  invalidFile: string;
  serviceUnavailable: string;
  noDiagnosis: string;
  retry: string;
  savedStatus: string;
  unsavedStatus: string;
  dragDropPrompt: string;
  historyEmpty: string;
  severity: {
    watch: string;
    treatNow: string;
    clear: string;
  };
  chat: {
    newScan: string;
    placeholder: string;
    send: string;
    thinking: string;
    imagePreview: string;
    closePreview: string;
    emptyState: string;
    sessionsTitle: string;
    noSessions: string;
    deleteSession: string;
    deleteConfirm: string;
    cancel: string;
  };
};
