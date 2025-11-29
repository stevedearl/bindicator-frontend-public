import { motion, AnimatePresence } from 'framer-motion';
import BinCard from './BinCard.jsx';
import Button from './ui/Button.jsx';
import InfoCallout from './ui/InfoCallout.jsx';
import HolidayBanner from './HolidayBanner.jsx';

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

function shortWeekday(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  } catch {
    return null;
  }
}

function weekdayName(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  } catch {
    return null;
  }
}

function isChristmasWindow(iso) {
  if (!iso) return false;
  const d = new Date(iso + 'T00:00:00');
  const month = d.getMonth(); // 0-based
  const day = d.getDate();
  return (month === 11 && day >= 20) || (month === 0 && day <= 5);
}

function originalWeekdayFor(item) {
  const raw = item?.originalDate || item?.original_date;
  return weekdayName(raw);
}

function shortWeekdayFromItem(item) {
  const raw = item?.originalDate || item?.original_date;
  const short = shortWeekday(raw);
  if (short) return short;
  const longName = weekdayName(raw);
  return longName ? longName.slice(0, 3) : null;
}

function shortDateLabel(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso + 'T00:00:00');
    const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
    const day = d.toLocaleDateString(undefined, { day: 'numeric' });
    const month = d.toLocaleDateString(undefined, { month: 'short' });
    return `${weekday} ${day} ${month}`;
  } catch {
    return null;
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
  holidayActive = false,
  statusInfo,
}) {
  const { bins, postcode, source, fetchedAt, upcoming } = result || {};
  const displayPostcode =
    (postcode && String(postcode).trim()) || (searchedPostcode && String(searchedPostcode).trim()) || '';
  const displayAddress = selectedAddress && selectedAddress.trim() ? selectedAddress : null;
  const hasUprn = !!(result?.uprn || selectedUprn);

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

          {(() => {
            const items = Array.isArray(upcoming) ? upcoming.slice(0, 2) : [];
            const thisWeek = items[0];
            const nextWeek = items[1];
            const anyHoliday = (thisWeek?.holiday === true) || (nextWeek?.holiday === true) || result?.holidayActive;
            if (!anyHoliday) return null;
            const bannerText = result?.holidayBanner || '?? Holiday bin-collection changes this week';
            const primaryDate = (thisWeek && thisWeek.holiday && thisWeek.date) || (nextWeek && nextWeek.holiday && nextWeek.date);
            const christmas = primaryDate ? isChristmasWindow(primaryDate) : false;
            return (
              <HolidayBanner
                message={bannerText}
                isChristmas={christmas}
                className="global-holiday-banner global-desktop-holiday-banner"
              />
            );
          })()}

          {result?.noCollections || (!upcoming?.length && (!bins || bins.length === 0)) ? (
            <div className="mt-6 w-full flex items-center justify-center">
              <InfoCallout title="No collections scheduled">for this postcode.</InfoCallout>
            </div>
          ) : null}

          {Array.isArray(upcoming) && upcoming.length > 0 ? (
            (() => {
              const items = upcoming.slice(0, 2);
              const thisWeek = items[0];
              const nextWeek = items[1];

              // Treat a week as "shifted" if it has an explicit original date,
              // OR if the holiday flag is true, OR if the date is in holidayAppliedDates.
              const appliedDates = Array.isArray(result?.holidayAppliedDates)
                ? new Set(result.holidayAppliedDates)
                : new Set();

              function isShifted(item) {
                if (!item) return false;
                const hasOriginal = !!item.originalDate || !!item.original_date;
                if (hasOriginal) return true;
                if (item.holiday === true) return true;
                if (item.date && appliedDates.has(item.date)) return true;
                return false;
              }

              const thisWeekShifted = isShifted(thisWeek);
              const nextWeekShifted = isShifted(nextWeek);

              const thisWeekOriginalShort = thisWeekShifted ? shortWeekdayFromItem(thisWeek) : null;
              const nextWeekOriginalShort = nextWeekShifted ? shortWeekdayFromItem(nextWeek) : null;
              return (
                <div className="weeks-container mt-3 flex flex-col gap-3 md:gap-3 items-center justify-center">
                  {thisWeek && (
                    <div className={`week-card w-full md:w-3/4 lg:w-2/3 flex flex-col rounded-2xl border border-gray-200 dark:border-slate-700/60 bg-white dark:bg-[#0b1325]/70 shadow-sm hover:shadow-lg dark:hover:shadow-blue-500/10 transition-shadow p-4 ${holidayActive ? 'holiday-card' : ''}`}>
                      <h3 className="section-title text-center text-blue-700 dark:text-sky-300 font-semibold text-xs uppercase tracking-[0.3em] mb-1">
                        This week {thisWeekShifted ? <span className="sparkle">✨</span> : null}
                      </h3>
                      <div className="date-header text-center text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
                        <div className={`date-main ${thisWeekShifted ? 'date-main-shifted' : ''}`}>
                          {formatDate(thisWeek.date)}
                        </div>
                        {thisWeekShifted && thisWeekOriginalShort ? (
                          <div className="shift-inline-note">
                            (Shifted from {shortDateLabel(thisWeek.originalDate || thisWeek.original_date) || thisWeekOriginalShort})
                          </div>
                        ) : null}
                      </div>
                      <div className="bins-row">
                        {thisWeek.bins?.map((b, idx) => (
                          <BinCard
                            key={`${b}-${idx}`}
                            color={b}
                            compact
                            active
                            glanceBias={glanceBiasForIndex(idx, thisWeek.bins.length)}
                            verticalBias="down"
                            groupId={`${displayPostcode}-shared`}
                            laneId="this-week"
                            position={idx}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {nextWeek && (
                    <div className={`week-card w-full md:w-3/4 lg:w-2/3 flex flex-col rounded-2xl border border-gray-200 dark:border-slate-700/60 bg-white dark:bg-[#0b1325]/70 shadow-sm hover:shadow-lg dark:hover:shadow-blue-500/10 transition-shadow p-4 ${holidayActive ? 'holiday-card' : ''}`}>
                      <h3 className="section-title text-center text-green-700 dark:text-green-300 font-semibold text-xs uppercase tracking-[0.3em] mb-1">
                        Next week {nextWeekShifted ? <span className="sparkle">✨</span> : null}
                      </h3>
                      <div className="date-header text-center text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
                        <div className={`date-main ${nextWeekShifted ? 'date-main-shifted' : ''}`}>
                          {formatDate(nextWeek.date)}
                        </div>
                        {nextWeekShifted && nextWeekOriginalShort ? (
                          <div className="shift-inline-note">
                            (Shifted from {shortDateLabel(nextWeek.originalDate || nextWeek.original_date) || nextWeekOriginalShort})
                          </div>
                        ) : null}
                      </div>
                      <div className="bins-row">
                        {nextWeek.bins?.map((b, idx) => (
                          <BinCard
                            key={`${b}-${idx}`}
                            color={b}
                            compact
                            glanceBias={glanceBiasForIndex(idx, nextWeek.bins.length)}
                            verticalBias="up"
                            groupId={`${displayPostcode}-shared`}
                            laneId="next-week"
                            position={idx}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            bins?.length > 0 && (
              <div className="mt-5 flex flex-col md:flex-row gap-6 items-stretch justify-center">
                <div className="flex-1 flex flex-col justify-between rounded-2xl border border-gray-200 bg-white/90 shadow-sm p-4 md:p-5">
                  <h3 className="text-center text-blue-700 font-semibold text-lg mb-3">Upcoming collection</h3>
                      <div className="bins-row mt-1">
                        {bins.map((b, idx) => (
                          <BinCard
                            key={`${b}-${idx}`}
                            color={b}
                            glanceBias={glanceBiasForIndex(idx, bins.length)}
                            groupId={`${displayPostcode}-shared`}
                            laneId="single-row"
                            position={idx}
                          />
                        ))}
                      </div>
                    </div>
              </div>
            )
          )}

          <div className="mt-4 text-xs text-gray-500">Source: {source} - Updated {new Date(fetchedAt).toLocaleString()}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
