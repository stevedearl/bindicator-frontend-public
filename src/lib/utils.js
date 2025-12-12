export function normalizePostcode(input) {
  return (input || '').toUpperCase().replace(/\s+/g, '');
}

export function prettyPostcode(input) {
  const s = normalizePostcode(input);
  if (!s) return '';
  return s.length > 3 ? `${s.slice(0, -3)} ${s.slice(-3)}` : s;
}

export function isValidUkPostcode(input) {
  const s = normalizePostcode(input);
  if (!s) return false;
  const re = /^((?:[A-Z]{1,2}\d{1,2}[A-Z]?)|(?!QVX)[A-Z]{1,2}\d[A-Z])([0-9][ABD-HJLN-UW-Z]{2})$/;
  return re.test(s);
}

export function isTodayISO(isoDate) {
  if (!isoDate) return false;
  try {
    const d = new Date(`${isoDate}T00:00:00Z`);
    const now = new Date();
    return d.getUTCFullYear() === now.getUTCFullYear() &&
      d.getUTCMonth() === now.getUTCMonth() &&
      d.getUTCDate() === now.getUTCDate();
  } catch { return false; }
}

