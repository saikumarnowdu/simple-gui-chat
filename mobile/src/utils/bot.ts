/** Local fallback bot replies when server bot is unavailable. */
export function localBotReply(text: string): string {
  const lower = text.toLowerCase().trim();
  if (lower === '/help' || lower.includes('help')) {
    return 'Local bot ready. Commands: /help · /joke · /time · /ping';
  }
  if (lower === '/joke' || lower.includes('joke')) {
    return 'I am not lazy — I am on energy-saving mode.';
  }
  if (lower === '/time') {
    return `Local time ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (lower === '/ping') {
    return 'pong (local)';
  }
  return `Bot received: "${text.slice(0, 100)}"`;
}

export const BOT_USER_ID = 'bot';
export const BOT_DISPLAY_NAME = 'ChatBot';
