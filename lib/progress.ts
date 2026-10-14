// remembers where you stopped in each video. lives in localStorage, nothing leaves the browser.

export type progress_entry = {
  pos: number; // seconds watched
  len: number; // video length in seconds
  at: number; // when last watched (ms)
  name: string;
  folder: string;
};

const STORE = "adfree_progress_v1";
const DONE_AT = 0.92; // past 92% counts as watched (end credits etc)

type store_like = Pick<Storage, "getItem" | "setItem">;

function store(): store_like | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // private mode etc
  }
}

export function load_all(s: store_like | null = store()): Record<string, progress_entry> {
  if (!s) return {};
  try {
    return JSON.parse(s.getItem(STORE) || "{}");
  } catch {
    return {};
  }
}

export function save_pos(key: string, entry: Omit<progress_entry, "at">, s: store_like | null = store()) {
  if (!s) return;
  const all = load_all(s);
  all[key] = { ...entry, at: Date.now() };
  try {
    s.setItem(STORE, JSON.stringify(all));
  } catch {
    // storage full, not a big deal
  }
}

export function is_done(p?: progress_entry) {
  return !!p && p.len > 0 && p.pos / p.len >= DONE_AT;
}

export function pct(p?: progress_entry) {
  if (!p || !p.len) return 0;
  return Math.min(100, Math.round((100 * p.pos) / p.len));
}

// where to start: last spot, but not if it was basically finished
export function start_at(p?: progress_entry) {
  if (!p || is_done(p) || p.pos < 5) return 0;
  return Math.max(0, p.pos - 3); // go back 3 sec so you remember where you were
}

export function recent(all: Record<string, progress_entry>, n = 6) {
  return Object.entries(all)
    .filter(([, p]) => !is_done(p) && p.pos >= 5)
    .sort((a, b) => b[1].at - a[1].at)
    .slice(0, n);
}
