// PLiCy progress uses synchronous localStorage only. Other hosts keep Godot's
// existing persistence. Storage failure still retains scores for this page.
export const PROGRESS_STORAGE_KEY = 'nandemo-cannon.progress.v1';

function cleanJSON(value) {
  const scores = Object.create(null);
  try {
    const data = typeof value === 'string' ? JSON.parse(value) : null;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      for (const [stage, score] of Object.entries(data)) {
        if (/^[1-9][0-9]*$/.test(stage) && Number.isSafeInteger(Number(stage)) &&
            typeof score === 'number' && Number.isFinite(score) && score >= 0) {
          scores[stage] = score;
        }
      }
    }
  } catch { /* Corrupt storage starts with an empty score dictionary. */ }
  return JSON.stringify(scores);
}

export function installProgressStore(host = window) {
  if (host.NandemoProgress) return host.NandemoProgress;
  let enabled = false;
  try {
    const location = new URL(host.location.href);
    enabled = location.protocol === 'https:' && location.hostname === 'html5.plicy.net';
  } catch { /* No supported location means no persistence override. */ }
  let latest = '{}';
  if (enabled) {
    try { latest = cleanJSON(host.localStorage.getItem(PROGRESS_STORAGE_KEY)); }
    catch { /* Private mode or blocked storage: session memory remains usable. */ }
  }
  const api = {
    isLocalStorage() { return enabled; },
    loadJSON() { return latest; },
    saveJSON(value) {
      if (!enabled) return false;
      latest = cleanJSON(value);
      try {
        host.localStorage.setItem(PROGRESS_STORAGE_KEY, latest);
        return true;
      } catch { return false; }
    }
  };
  host.NandemoProgress = api;
  return api;
}
