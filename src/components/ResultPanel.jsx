import { motion, AnimatePresence } from 'framer-motion';
import BinCard from './BinCard.jsx';
import Button from './ui/Button.jsx';
import InfoCallout from './ui/InfoCallout.jsx';

function glanceBiasForIndex(index, length) {
  if (length <= 1) return 'both';
  if (index === 0) return 'right';
  if (index === length - 1) return 'left';
  return 'both';
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function ResultPanel({
  result,
  searchedPostcode,
  selectedAddress,
  selectedUprn,
  onRefresh,
  onChangePostcode,
  onSetDefault,
  onUnsetDefault,
  isDefaultProperty,
  isRefreshing = false,
  statusInfo,
}) {
  const { postcode, source, fetchedAt, last_updated: lastUpdated } = result || {};
  const displayPostcode =
    (postcode && String(postcode).trim()) || (searchedPostcode && String(searchedPostcode).trim()) || '';
  const displayAddress = selectedAddress && selectedAddress.trim() ? selectedAddress : null;
  const hasUprn = !!(result?.uprn || selectedUprn);
  const collections =
    Array.isArray(result?.collections) && result.collections.length
      ? result.collections
      : Array.isArray(result?.upcoming)
        ? result.upcoming.map((item) => ({ date: item.date, bins: item.bins }))
        : [];
  const displayKey = (result?.uprn || displayPostcode || 'default').trim() || 'default';
  const updatedAt = lastUpdated || fetchedAt;

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          key="result"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="rounded-xl bg-white/70 backdrop-blur-md shadow-xl p-5 md:p-6 w-full max-w-md"
        >
          <div className="flex flex-col gap-2">
            {displayAddress ? (
              <p className="text-sm font-semibold text-gray-700 dark:text-sky-100">{displayAddress}</p>
            ) : null}
            <div className="flex flex-nowrap gap-2 md:gap-3 justify-end items-center text-sm" role="group" aria-label="Result actions">
              <Button
                onClick={onRefresh}
                variant="primary"
                compact
                className="whitespace-nowrap"
                title="Refresh bin results for this property"
              >
                Refresh
              </Button>
              <Button
                onClick={onChangePostcode}
                variant="secondary"
                compact
                className="whitespace-nowrap"
                title="Pick a different property"
              >
                Change Address
              </Button>
              <Button
                onClick={isDefaultProperty ? onUnsetDefault : onSetDefault}
                variant="secondary"
                aria-pressed={isDefaultProperty}
                compact
                className={
                  isDefaultProperty
                    ? 'border-green-500 text-green-800 bg-green-50 hover:bg-green-100 dark:border-emerald-400 dark:text-emerald-50 dark:bg-emerald-900/40'
                    : ''
                }
                disabled={!hasUprn}
                title={
                  isDefaultProperty
                    ? 'Unset this property so it is no longer used by default on future visits.'
                    : 'Set this property as your default so it loads automatically next time.'
                }
              >
                {isDefaultProperty ? 'Unset Default' : 'Set Default'}
              </Button>
              {isRefreshing ? (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-300" aria-live="polite">
                  <svg className="animate-spin w-3 h-3 text-blue-600 dark:text-sky-300" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  <span>Refreshing…</span>
                </div>
              ) : null}
            </div>
          </div>

          {collections.length > 0 ? (
            <div className="mt-3 flex flex-col gap-3 md:gap-3 items-center justify-center">
              <h2 className="text-sm font-semibold tracking-wider text-blue-600 uppercase">Upcoming bin collections</h2>
              <div className="weeks-container flex flex-col gap-3 md:gap-3 items-center justify-center w-full">
                {collections.map((item, idx) => (
                  <div
                    key={`${item.date}-${idx}`}
                    className="week-card w-full md:w-3/4 lg:w-2/3 flex flex-col rounded-2xl border border-gray-200 dark:border-slate-700/60 bg-white dark:bg-[#0b1325]/70 shadow-sm hover:shadow-lg dark:hover:shadow-blue-500/10 transition-shadow p-4"
                  >
                    <div className="date-header text-center text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
                      <div className="date-main">{formatDate(item.date)}</div>
                    </div>
                    <div className="bins-row">
                      {item.bins?.map((b, binIdx) => (
                        <BinCard
                          key={`${b}-${binIdx}`}
                          color={b}
                          compact
                          active
                          glanceBias={glanceBiasForIndex(binIdx, item.bins.length)}
                          verticalBias="down"
                          groupId={`${displayKey}-shared`}
                          laneId="upcoming-list"
                          position={binIdx}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            result?.noCollections || !collections.length ? (
              <div className="mt-6 w-full flex items-center justify-center">
                <InfoCallout title="No collections scheduled">for this postcode.</InfoCallout>
              </div>
            ) : null
          )}

          <div className="mt-4 text-xs text-gray-500">Source: {source} - Updated {updatedAt ? new Date(updatedAt).toLocaleString() : 'n/a'}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
