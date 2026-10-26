/**
 * Utility — port delle funzioni utili di itaflix-tvos/src/utils.js
 */

/** true se la data è negli ultimi `days` giorni (badge "NUOVO"). */
export function isMoreThanDaysAhead(dateString, days = 5) {
  if (!dateString) return false;

  const inputDate = new Date(dateString);
  const currentDate = new Date();

  inputDate.setHours(0, 0, 0, 0);
  currentDate.setHours(0, 0, 0, 0);

  const diffInDays = (currentDate - inputDate) / (1000 * 60 * 60 * 24);
  return diffInDays >= 0 && diffInDays <= days;
}

/** `s01e05` come nell'app tvOS. */
export function prettifyEpisodeNum(season = 0, episode = 0) {
  const pad = (value) => `${10 ** 2}${value}`.slice(-2);
  return `s${pad(season)}e${pad(episode)}`;
}

export function formatRuntime(minutes) {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return `${hours}h ${rest ? `${rest}m` : ''}`.trim();
}

export function formatTime(seconds = 0) {
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function capitalize(word = '') {
  const text = String(word);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Rimuove i duplicati per id mantenendo l'ordine. */
export function uniqueById(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.sid)) return false;
    seen.add(item.sid);
    return true;
  });
}
