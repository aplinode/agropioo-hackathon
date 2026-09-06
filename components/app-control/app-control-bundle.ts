export type AppControlBundle = {
  pageTitle: string;
  floating: {
    open: string;
    close: string;
    ariaLabel: string;
    pulseAria: string;
    unread: string;
  };
  panel: {
    minimize: string;
    maximize: string;
    close: string;
    newTab: string;
    newTabAria: string;
  };
  tabs: {
    close: string;
    closeAria: string;
    deleteTitle: string;
    deleteConfirm: string;
    cancel: string;
  };
  sidebar: {
    title: string;
    newConversation: string;
    noConversations: string;
    rename: string;
    delete: string;
    deleteTitle: string;
    deleteConfirm: string;
    cancel: string;
    closeSidebar: string;
  };
  chat: {
    placeholder: string;
    send: string;
    thinking: string;
    openingGreeting: string;
    tryAsking: string;
    suggested1: string;
    suggested2: string;
    suggested3: string;
    suggested4: string;
    emptyEyebrow: string;
    emptyTitle: string;
    emptyBody: string;
    onlineStatus: string;
    typing: string;
    composerHint: string;
    farmerYou: string;
    showMore: string;
    showLess: string;
    attachment: string;
    removeAttachment: string;
    fileTooLarge: string;
    unsupportedType: string;
    confirmYes: string;
    confirmNo: string;
    retry: string;
  };
  cards: {
    navigate: string;
    confirmation: string;
    priceTable: string;
    pnlSummary: string;
    weatherForecast: string;
    recordDiff: string;
  };
  errors: {
    serviceUnavailable: string;
    rateLimited: string;
    network: string;
    generic: string;
  };
  aria: {
    openSidebar: string;
    sendMessage: string;
    chatMessages: string;
    attachFile: string;
  };
};
