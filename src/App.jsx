import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PostcodeForm from './components/PostcodeForm.jsx';
import ResultPanel from './components/ResultPanel.jsx';
import { useBins } from './hooks/useBins.js';
import { useTheme } from './hooks/useTheme.js';
import BlueBinIcon from './components/icons/BlueBinIcon.jsx';
import Footer from './components/Footer.jsx';
import { apiGet } from './lib/api.js';
import { clearSavedUPRN, getSavedProperty, saveUPRN } from './utils/addressMemory.js';

const LAST_SESSION_KEY = 'bindicator:lastSession';
const LAST_RESULT_PREFIX = 'bindicator:lastResult';

function safeSavedProperty() {
  try {
    const saved = getSavedProperty();
    if (saved?.uprn) return saved;
  } catch {
    // ignore
  }
  return null;
}

function initialSession() {
  const saved = safeSavedProperty();
  if (saved?.uprn) return saved;
  return readLastSession();
}

function readCachedResult(uprn) {
  if (!uprn) return null;
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(`${LAST_RESULT_PREFIX}:${uprn}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.data) return parsed.data;
    return parsed || null;
  } catch {
    return null;
  }
}

function readLastSession() {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(LAST_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.uprn) {
      return {
        uprn: String(parsed.uprn),
        address: parsed.address || '',
        postcode: parsed.postcode || '',
      };
    }
  } catch {
    // ignore
  }
  return null;
}

function writeLastSession(payload) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(payload));
    }
  } catch {
    // ignore
  }
}

function clearLastSession() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LAST_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

export default function App() {
  const initial = initialSession();
  const [postcode, setPostcode] = useState(initial?.postcode || '');
  const [selectedUprn, setSelectedUprn] = useState(initial?.uprn || null);
  const [selectedAddress, setSelectedAddress] = useState(initial?.address || '');
  const [addressOptions, setAddressOptions] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState(null);
  const [searchNonce, setSearchNonce] = useState(0);
  const { data, loading, error, refresh, clear } = useBins({ uprn: selectedUprn, requestId: searchNonce });
  const { isDark, toggleTheme } = useTheme();
  const [showStartupDelayNotice, setShowStartupDelayNotice] = useState(false);
  const initialSavedPropertyRef = useRef(safeSavedProperty());
  const [savedProperty, setSavedProperty] = useState(() => initialSavedPropertyRef.current || initial || { uprn: null, address: null, postcode: null });
  const [needsAddressHydration, setNeedsAddressHydration] = useState(() => !!(initial?.uprn && !initial?.address));
  const restoredLastSessionRef = useRef(false);
  const [initializing, setInitializing] = useState(() => !!initial?.uprn);
  const [prefillResult, setPrefillResult] = useState(() => (initial?.uprn ? readCachedResult(initial.uprn) : null));

  useEffect(() => {
    if (!selectedUprn && initialSavedPropertyRef.current?.uprn) {
      handleSelectAddress({
        uprn: initialSavedPropertyRef.current.uprn,
        address: initialSavedPropertyRef.current.address || '',
        postcode: initialSavedPropertyRef.current.postcode || '',
      });
      restoredLastSessionRef.current = true;
      return;
    }

    // Fallback: restore last session search so pull-to-refresh keeps you on results.
    if (!restoredLastSessionRef.current) {
      const last = readLastSession();
      if (last?.uprn) {
        restoredLastSessionRef.current = true;
        handleSelectAddress(last);
      }
    }
  }, []);

  function handleChangePostcode() {
    clear();
    setPostcode('');
    setSelectedUprn(null);
    setSelectedAddress('');
    clearLastSession();
    setNeedsAddressHydration(false);
    setAddressOptions([]);
    setAddressError(null);
    setAddressLoading(false);
    setSearchNonce((n) => n + 1); // reset form inputs
  }

  function handlePostcodeSubmit(nextPostcode) {
    clear();
    setSelectedUprn(null);
    setSelectedAddress('');
    setAddressOptions([]);
    setPostcode(nextPostcode);
    setAddressError(null);
    if (!nextPostcode) return;
    setAddressLoading(true);
    const url = `/api/addresses?postcode=${encodeURIComponent(nextPostcode)}`;
    apiGet(url)
      .then((results) => {
        const list = results || [];
        setAddressOptions(list);
        if (!list.length) {
          setAddressError(new Error('No addresses found for that postcode.'));
        }
        if (list.length === 1) {
          setSelectedUprn(list[0].uprn);
          setSelectedAddress(list[0].address);
        }
      })
      .catch((err) => {
        setAddressOptions([]);
        setAddressError(err);
      })
      .finally(() => setAddressLoading(false));
  }

  function handleSelectAddress(address) {
    if (!address?.uprn) return;
    setSelectedUprn(address.uprn);
    setSelectedAddress(address.address || '');
    if (address.postcode) {
      setPostcode(address.postcode);
    }
    setNeedsAddressHydration(!address.address);
    setSearchNonce((n) => n + 1);
  }

  useEffect(() => {
    if (!needsAddressHydration || !selectedUprn || !data?.postcode) return;
    let cancelled = false;
    const url = `/api/addresses?postcode=${encodeURIComponent(data.postcode)}`;
    apiGet(url)
      .then((results) => {
        if (cancelled || !Array.isArray(results)) return;
        const match = results.find((item) => String(item.uprn) === String(selectedUprn));
        if (match?.address) {
          setSelectedAddress(match.address);
          if (savedProperty?.uprn && String(savedProperty.uprn) === String(selectedUprn)) {
            const updated = saveUPRN(selectedUprn, match.address, data.postcode);
            if (updated) setSavedProperty(updated);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setNeedsAddressHydration(false);
      });
    return () => {
      cancelled = true;
    };
  }, [data?.postcode, needsAddressHydration, savedProperty?.uprn, selectedUprn]);

  function handleSetDefaultProperty() {
    if (!selectedUprn) return;
    const updated = saveUPRN(selectedUprn, selectedAddress || '', data?.postcode || postcode || null);
    if (updated) {
      setSavedProperty(updated);
    }
  }

  function handleUnsetDefaultProperty() {
    clearSavedUPRN();
    setSavedProperty({ uprn: null, address: null, postcode: null });
    clearLastSession();
  }

  // Persist last session so mobile pull-to-refresh reload keeps the results visible.
  useEffect(() => {
    if (!selectedUprn) {
      clearLastSession();
      return;
    }
    const matchesDefault = savedProperty?.uprn && String(savedProperty.uprn) === String(selectedUprn);
    if (matchesDefault) {
      const payload = {
        uprn: selectedUprn,
        address: selectedAddress || '',
        postcode: data?.postcode || postcode || '',
      };
      writeLastSession(payload);
    } else {
      clearLastSession();
    }
  }, [selectedUprn, selectedAddress, data?.postcode, postcode, savedProperty?.uprn]);

  useEffect(() => {
    if (!selectedUprn) {
      setPrefillResult(null);
      return;
    }
    const cached = readCachedResult(selectedUprn);
    if (cached) setPrefillResult(cached);
  }, [selectedUprn]);

  useEffect(() => {
    if (data) setPrefillResult(data);
  }, [data]);

  useEffect(() => {
    if (!initializing) return;
    if (data || error || !selectedUprn) {
      setInitializing(false);
    }
  }, [initializing, data, error, selectedUprn]);

  useEffect(() => {
    if (!loading && !addressLoading) {
      setShowStartupDelayNotice(false);
      return;
    }

    const timeout = setTimeout(() => {
      setShowStartupDelayNotice(true);
    }, 15000);

    return () => clearTimeout(timeout);
  }, [loading, addressLoading]);

  function friendlyError(err) {
    if (!err) return '';
    const status = err.status;
    if (status === 404) return 'Postcode not found. Please enter another address.';
    if (status === 502 || status === 503 || status === 500) return 'Could not reach the council service. Please try again shortly.';
    return err.message || 'Something went wrong.';
  }

  const isDefaultProperty = !!(savedProperty?.uprn && selectedUprn && String(savedProperty.uprn) === String(selectedUprn));

  return (
    <div className="app-root relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-green-50 dark:bg-gradient-to-b dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] transition-colors px-5 pb-6 pt-8 md:pt-5">
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="fixed top-3 right-3 md:top-5 md:right-5 z-10 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 shadow rounded-full p-2 hover:scale-110 transition transform ring-1 ring-black/10 dark:ring-white/10"
      >
        {isDark ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-400">
            <path d="M12 2a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm9-7a1 1 0 0 1-1 1h-2a1 1 0 1 1 0-2h2a1 1 0 0 1 1 1ZM7 12a1 1 0 0 1-1 1H4a1 1 0 1 1 0-2h2a1 1 0 0 1 1 1Zm10.95 6.364a1 1 0 0 1-1.414 0l-1.414-1.414a1 1 0 1 1 1.414-1.414l1.414 1.414a1 1 0 0 1 0 1.414Zm-9.9-9.9a1 1 0 0 1-1.414 0L4.222 7.05A1 1 0 1 1 5.636 5.636l1.414 1.414a1 1 0 0 1 0 1.414Zm9.9 0a1 1 0 0 1 0-1.414L18.95 5.636A1 1 0 0 1 20.364 7.05l-1.414 1.414a1 1 0 0 1-1.414 0Zm-9.9 9.9a1 1 0 0 1 0-1.414l1.414-1.414a1 1 0 1 1 1.414 1.414L7.05 20.364a1 1 0 0 1-1.414 0Z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-500">
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79Z" />
          </svg>
        )}
      </button>
      <header className="mb-5 text-center flex flex-col items-center gap-1">
        <div className="flex items-center justify-center gap-2 md:flex-col md:gap-1">
          <motion.div whileHover={{ rotate: 10, scale: 1.08 }} transition={{ type: 'spring', stiffness: 150 }}>
            <BlueBinIcon className="w-10 h-10" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold text-blue-700 dark:text-sky-300 leading-tight">Bindicator</h1>
        </div>
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-tight">because rubbish timing matters.</p>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Check which bins go out next in RBWM</p>
      </header>

      <AnimatePresence mode="wait">
        {!data && !prefillResult && !selectedUprn ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="w-full flex items-center justify-center"
          >
            <PostcodeForm
              onSubmit={handlePostcodeSubmit}
              loading={loading}
              addresses={addressOptions}
              onSelectAddress={handleSelectAddress}
              selectedUprn={selectedUprn}
              addressError={addressError}
              fetchingAddresses={addressLoading}
              initialPostcode={postcode}
            />
          </motion.div>
        ) : (
          <motion.div
            key={`result-${data?.fetchedAt || prefillResult?.fetchedAt || 'pending'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="w-full flex items-center justify-center"
          >
            <ResultPanel
              result={data || prefillResult}
              searchedPostcode={postcode}
              selectedAddress={selectedAddress}
              selectedUprn={selectedUprn}
              onRefresh={refresh}
              onChangePostcode={handleChangePostcode}
              onSetDefault={handleSetDefaultProperty}
              onUnsetDefault={handleUnsetDefaultProperty}
              isDefaultProperty={isDefaultProperty}
              isRefreshing={loading && !!prefillResult}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-gray-600 dark:text-gray-300 flex items-center gap-2 text-sm">
          <svg className="animate-spin w-4 h-4 text-blue-600 dark:text-sky-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span>{loading ? 'Fetching your bins...' : 'Retrieving addresses...'}</span>
        </motion.div>
      )}

      <AnimatePresence>
        {showStartupDelayNotice && !data && (loading || addressLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mt-5 flex items-center gap-3 rounded-xl border border-blue-200 bg-white/80 px-4 py-3 text-sm text-blue-800 shadow-sm dark:border-blue-500/40 dark:bg-slate-800/80 dark:text-sky-200"
            role="status"
            aria-live="polite"
          >
            <svg className="h-5 w-5 animate-spin text-blue-500 dark:text-sky-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-70" fill="currentColor" d="M12 2a10 10 0 00-9.95 9h4a6 6 0 015.95-5V2z"></path>
            </svg>
            <span>
              Our servers are waking up (we use free cloud resources). This can take up to a minute — thanks for your patience!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {(function () {
        const msg = friendlyError(error);
        return msg ? (
          <div className="mt-4 rounded-md bg-red-50 text-red-700 border border-red-200 px-3 py-2 text-sm" role="alert">
            {msg}
          </div>
        ) : null;
      })()}

      <Footer />
    </div>
  );
}
