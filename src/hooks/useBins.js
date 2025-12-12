import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet } from '../lib/api';
import { isTodayISO } from '../lib/utils';

const LS_KEY = 'bindicator:lastResult';

export function useBins({ uprn, requestId = 0 } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  // load cached for today for this uprn
  useEffect(() => {
    if (!uprn) return;
    const raw = localStorage.getItem(`${LS_KEY}:${uprn}`);
    if (!raw) return;
    try {
      const cached = JSON.parse(raw);
      const firstDate = cached?.data?.collections?.[0]?.date;
      if (firstDate && isTodayISO(firstDate)) setData(cached.data);
    } catch {}
  }, [uprn]);

  const fetchBins = useCallback(async (refresh = false) => {
    if (!uprn) return;
    abortRef.current?.abort?.();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      let res;
      const qp = `/api/bins?uprn=${encodeURIComponent(uprn)}${refresh ? '&refresh=true' : ''}`;
      res = await apiGet(qp, { signal: ctrl.signal });
      setData(res);
      try { localStorage.setItem(`${LS_KEY}:${uprn}`, JSON.stringify({ ts: Date.now(), data: res })); } catch {}
    } catch (e) {
      // Ignore aborts; keep the current data on screen.
      if (e?.name === 'AbortError') return;
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [uprn]);

  const refresh = useCallback(() => fetchBins(true), [fetchBins]);

  const lastFetchKeyRef = useRef(null);

  useEffect(() => {
    if (!uprn) {
      setData(null);
      lastFetchKeyRef.current = null;
      return;
    }

    const key = `${uprn || ''}|${requestId}`;
    const needsUpgrade = data && !Array.isArray(data.collections);
    if (!data || needsUpgrade || lastFetchKeyRef.current !== key) {
      lastFetchKeyRef.current = key;
      fetchBins(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uprn, requestId, data, fetchBins]);

  const clear = useCallback(() => {
    abortRef.current?.abort?.();
    setError(null);
    setLoading(false);
    setData(null);
  }, []);

  return { data, loading, error, refresh, clear };
}
