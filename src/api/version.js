export async function fetchBackendVersion() {
  try {
    const base = import.meta.env.VITE_API_BASE || '';
    const res = await fetch(`${String(base).replace(/\/$/, '')}/api/version`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[Bindicator] Failed to load backend version:', err);
    return { service: 'Bindicator API', version: 'unknown', build: '-', environment: 'offline' };
  }
}

