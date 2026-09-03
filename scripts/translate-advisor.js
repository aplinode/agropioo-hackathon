const fs = require('fs');
let sd = fs.readFileSync('catalog/sd.ts', 'utf8');

const translations = [
  ['"app.advisor.chat.farmerYou": "You"', '"app.advisor.chat.farmerYou": "توھان"'],
  ['"app.advisor.chat.composerHint": "Type your question..."', '"app.advisor.chat.composerHint": "پنھن جو سوال ٽائپ ڪريو..."'],
  ['"app.advisor.chat.typing": "typing..."', '"app.advisor.chat.typing": "ٽائپ ڪري..."'],
  ['"app.advisor.chat.onlineStatus": "Online"', '"app.advisor.chat.onlineStatus": "آن لائن"'],
  ['"app.advisor.chat.emptyBody": "Start a conversation to get advice on crops, weather, soil, and market prices."', '"app.advisor.chat.emptyBody": "ٻج، موسم، مٹي، ۽ بازار جا قيمت تي مشورو حاصل ڪرڻ لاءِ ڳالهابين شروع ڪريو."'],
  ['"app.advisor.chat.emptyTitle": "Ask anything about your farm"', '"app.advisor.chat.emptyTitle": "فارم جي باري ۾ ڪجهه پڇو"'],
  ['"app.advisor.chat.emptyEyebrow": "Advisor chat"', '"app.advisor.chat.emptyEyebrow": "مشاور ڳالهابين"'],
  ['"app.advisor.pageTitle": "Advisor"', '"app.advisor.pageTitle": "مشاور"'],
  ['"app.advisor.sidebar.title": "Conversations"', '"app.advisor.sidebar.title": "ڳالهابين"'],
  ['"app.advisor.sidebar.newConversation": "New conversation"', '"app.advisor.sidebar.newConversation": "نئون ڳالهابين"'],
  ['"app.advisor.sidebar.noConversations": "No conversations yet. Start a new one!"', '"app.advisor.sidebar.noConversations": "اڃا ڳالهابين نه آهن. نئون شروع ڪريو!"'],
  ['"app.advisor.sidebar.rename": "Rename"', '"app.advisor.sidebar.rename": "نالو بدلائيو"'],
  ['"app.advisor.sidebar.delete": "Delete"', '"app.advisor.sidebar.delete": "ڊليٽ"'],
  ['"app.advisor.sidebar.deleteTitle": "Delete conversation"', '"app.advisor.sidebar.deleteTitle": "ڳالهابين ڊليٽ ڪريو"'],
  ['"app.advisor.sidebar.deleteConfirm": "Delete this conversation? This cannot be undone."', '"app.advisor.sidebar.deleteConfirm": "ھي ڳالهابين ڊليٽ ڪرڻو آهي؟ ھو واپس نه ٿي سکي."'],
  ['"app.advisor.sidebar.cancel": "Cancel"', '"app.advisor.sidebar.cancel": "منسوخ"'],
  ['"app.advisor.sidebar.closeSidebar": "Close sidebar"', '"app.advisor.sidebar.closeSidebar": "بند ڪريو"'],
  ['"app.advisor.chat.placeholder": "Ask about your crops, weather, prices…"', '"app.advisor.chat.placeholder": "ٻج، موسم، قيمت جي باري ۾ پڇو..."'],
  ['"app.advisor.chat.send": "Send"', '"app.advisor.chat.send": "ڇڏيو"'],
  ['"app.advisor.chat.thinking": "Thinking…"', '"app.advisor.chat.thinking": "سوچ ڪري..."'],
  ['"app.advisor.chat.openingGreeting": "Assalam-o-Alaikum! I\'m your Agropioo farming advisor. Ask me anything about your crops, weather, mandi prices, or government schemes."', '"app.advisor.chat.openingGreeting": "سلام عليڪم! مون توھان جو Agropioo ڪسان مشاور آهي. ٻج، موسم، منڊي قيمت، يا حڪومتي منصوبن جي باري ۾ پڇو."'],
  ['"app.advisor.chat.photoRedirect": "Photo detection lives on the Detect page — tap Scan Crop to identify diseases from photos."', '"app.advisor.chat.photoRedirect": "فوٹو پڇو پڇو صفحے تي آهي — فوٹون کان بيماري پڌران لاءِ ٻج اسڪين ٽيپ ڪريو."'],
  ['"app.advisor.chat.nonFarmingRedirect": "I\'m here to help with farming questions. How can I assist with your crops or farm?"', '"app.advisor.chat.nonFarmingRedirect": "مون ڪسان جي سوالن ۾ مدد لاءِ آهييو آهي. ٻج يا فارم ۾ مدد ڪيئن ڪري سڪندس؟"'],
  ['"app.advisor.chat.tryAsking": "Try asking"', '"app.advisor.chat.tryAsking": "ڇڏي وڃو"'],
  ['"app.advisor.chat.suggested1": "What disease is affecting my wheat?"', '"app.advisor.chat.suggested1": "ڳنم ۾ ڪهڙي بيماري آهي؟"'],
  ['"app.advisor.chat.suggested2": "Will it rain today in Multan?"', '"app.advisor.chat.suggested2": "ملتان ۾ اڄ پانهَن پئي؟"'],
  ['"app.advisor.chat.suggested3": "What are today\'s mandi prices?"', '"app.advisor.chat.suggested3": "اڄ جا منڊي قيمت ڪهڙا آهن؟"'],
  ['"app.advisor.chat.suggested4": "Tell me about Kissan Card scheme"', '"app.advisor.chat.suggested4": "ڪسن ڪارڊ منصوبن جي باري ۾ چيو"'],
  ['"app.advisor.errors.serviceUnavailable": "Advisor service is temporarily unavailable. Please try again in a moment."', '"app.advisor.errors.serviceUnavailable": "مشاور سروس عارضي طور تي دستياب نه آهي. ٻڌي ڪوشش ڪريو."'],
  ['"app.advisor.errors.rateLimited": "Too many requests. Please wait a moment and try again."', '"app.advisor.errors.rateLimited": "بہت گهرن. ٻڌي ڪنھن ڪنھن کان پاڻ ٿڌي ڪوشش ڪريو."'],
  ['"app.advisor.errors.network": "Network error. Check your connection and try again."', '"app.advisor.errors.network": "نيٽورڪ خرابي. جوڑ چيڪ ڪريو ۽ ٻڌي ڪوشش ڪريو."'],
  ['"app.advisor.errors.generic": "Something went wrong. Please try again."', '"app.advisor.errors.generic": "ڪجهه خراب ٿيو. ٻڌي ڪوشش ڪريو."'],
  ['"app.advisor.aria.openSidebar": "Open conversations"', '"app.advisor.aria.openSidebar": "ڳالهابين کوليو"'],
  ['"app.advisor.aria.sendMessage": "Send message"', '"app.advisor.aria.sendMessage": "سنڊيheiten ڇڏيو"'],
  ['"app.advisor.aria.chatMessages": "Chat messages"', '"app.advisor.aria.chatMessages": "ڳالهابين سنڊيheiten"'],
];

let ok = 0, fail = 0;
for (const [from, to] of translations) {
  if (sd.includes(from)) {
    sd = sd.replace(from, to);
    ok++;
  } else {
    console.log('NOT FOUND:', from.substring(0, 65));
    fail++;
  }
}

fs.writeFileSync('catalog/sd.ts', sd);
console.log(`Advisor: ${ok} replaced, ${fail} not found.`);
