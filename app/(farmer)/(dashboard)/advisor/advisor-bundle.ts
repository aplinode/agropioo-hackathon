export type AdvisorBundle = {
  pageTitle: string;
  sidebar: {
    title: string;
    newConversation: string;
    noConversations: string;
    rename: string;
    delete: string;
    deleteConfirm: string;
    closeSidebar: string;
  };
  chat: {
    placeholder: string;
    send: string;
    thinking: string;
    openingGreeting: string;
    photoRedirect: string;
    nonFarmingRedirect: string;
    tryAsking: string;
    suggested1: string;
    suggested2: string;
    suggested3: string;
    suggested4: string;
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
  };
};
