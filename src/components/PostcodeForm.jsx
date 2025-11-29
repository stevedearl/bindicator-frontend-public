import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { isValidUkPostcode, prettyPostcode } from '../lib/utils';

export default function PostcodeForm({
  onSubmit,
  loading,
  addresses = [],
  onSelectAddress,
  selectedUprn,
  addressError,
  fetchingAddresses = false,
  initialPostcode = '',
}) {
  const [input, setInput] = useState(initialPostcode);
  const [invalid, setInvalid] = useState(false);
  const [addressFilter, setAddressFilter] = useState('');
  const filterRef = useRef(null);
  const valid = isValidUkPostcode(input);

  useEffect(() => {
    setInput(initialPostcode || '');
  }, [initialPostcode]);

  useEffect(() => {
    if (addresses.length > 4 && filterRef.current) {
      filterRef.current.focus();
    }
  }, [addresses]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!valid) {
      setInvalid(true);
      setTimeout(() => setInvalid(false), 400);
      return;
    }
    onSubmit(prettyPostcode(input));
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      animate={invalid ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md flex flex-col items-stretch gap-3"
    >
      <label htmlFor="pc" className="sr-only">UK Postcode</label>
      <input
        id="pc"
        aria-label="UK Postcode"
        placeholder="E.g., SL6 1XX"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-base shadow-sm placeholder-gray-400 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 dark:placeholder-slate-300 dark:focus:border-blue-400 dark:focus:ring-blue-500/40"
      />
      <button
        type="submit"
        disabled={!valid || loading}
        className="rounded-xl bg-blue-600 px-5 py-3 text-white shadow-lg disabled:opacity-50 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        {fetchingAddresses ? 'Finding addresses…' : loading ? 'Fetching your bins…' : 'Find my address'}
      </button>

      <div className="text-xs text-gray-600 dark:text-gray-300 text-center leading-relaxed">
        <p>Disclaimer: Bindicator is a hobby project, and may make mistakes. Apologies if we get the day wrong and you're left spending more time with whiffy leftovers...</p>
        <p className="mt-1">We only use your details to query the council site.</p>
      </div>

      {(addressError || fetchingAddresses || (addresses && addresses.length > 0)) ? (
        <div className="mt-2 rounded-xl border border-blue-200 bg-white/90 p-4 text-sm text-slate-800 shadow-sm dark:border-blue-500/30 dark:bg-slate-900/70 dark:text-slate-100">
          {addressError && !fetchingAddresses ? (
            <p className="text-sm text-red-600 dark:text-red-300">{addressError.message || 'Could not fetch addresses for that postcode.'}</p>
          ) : fetchingAddresses ? (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <svg className="w-4 h-4 animate-spin text-blue-600 dark:text-sky-300" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>Retrieving addresses.</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-blue-700 dark:text-sky-300">Select your address.</p>
                {addresses.length > 4 ? (
                  <input
                    type="text"
                    ref={filterRef}
                    value={addressFilter}
                    onChange={(e) => setAddressFilter(e.target.value)}
                    placeholder="Quick search"
                    className="w-1/2 rounded-md border border-blue-200 bg-white px-2 py-1 text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 dark:placeholder-slate-400 dark:focus:ring-sky-400"
                  />
                ) : null}
              </div>
              <div className="mt-3 max-h-60 overflow-y-auto pr-1 flex flex-col gap-2">
                {(addresses || []).filter((addr) => {
                  if (!addressFilter.trim()) return true;
                  const q = addressFilter.trim().toLowerCase();
                  return (addr.address || '').toLowerCase().includes(q);
                }).map((addr) => (
                  <button
                    type="button"
                    key={addr.uprn}
                    onClick={() => onSelectAddress?.(addr)}
                    className={`mb-2 w-full rounded-lg border px-3 py-2 text-left text-sm shadow-sm transition ${addr.uprn === selectedUprn ? 'border-blue-500 bg-blue-50 text-blue-900 dark:border-blue-400/70 dark:bg-blue-500/20 dark:text-blue-100' : 'border-blue-200 bg-white/90 hover:bg-white dark:border-blue-500/30 dark:bg-slate-900 dark:hover:bg-slate-800'}`}
                  >
                    <span>{addr.address}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
    </motion.form>
  );
}
