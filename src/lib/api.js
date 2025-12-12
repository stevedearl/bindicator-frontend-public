const RAW_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_BASE = String(RAW_BASE).replace(/\/$/, '');

export async function apiGet(path, { signal } = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    if (res.status === 428) {
      try {
        await res.json();
      } catch {}
      const e = new Error('HOUSE_REQUIRED');
      e.status = 428;
      e.code = 'HOUSE_REQUIRED';
      throw e;
    }
    let msg = `Request failed: ${res.status}`;
    try {
      const err = await res.json();
      msg = err.hint ? `${err.error}. ${err.hint}` : (err.error || msg);
    } catch {}
    const e = new Error(msg);
    e.status = res.status;
    throw e;
  }
  return res.json();
}
