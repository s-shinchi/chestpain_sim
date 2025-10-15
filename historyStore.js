const KEY = "chestpain_sim_history_v1";

export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecord(record) {
  const hist = loadHistory();
  hist.push({ ...record, timestamp: new Date().toISOString() });
  localStorage.setItem(KEY, JSON.stringify(hist));
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}