const STORAGE_KEY = 'bindicatorDefaultUPRN';

const EMPTY = { uprn: null, address: null, postcode: null };

function parseSaved(raw) {
  if (!raw) return { ...EMPTY };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const uprn = parsed.uprn || parsed.Uprn || parsed.id;
      return {
        uprn: uprn ? String(uprn) : null,
        address: parsed.address || null,
        postcode: parsed.postcode || parsed.postCode || null,
      };
    }
  } catch {
    // fall through
  }
  // Backwards compatibility: legacy string stored as the UPRN value.
  return { uprn: String(raw), address: null, postcode: null };
}

function readRaw() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getSavedProperty() {
  try {
    return parseSaved(readRaw());
  } catch {
    return { ...EMPTY };
  }
}

export function getSavedUPRN() {
  return getSavedProperty().uprn;
}

export function saveProperty({ uprn, address = null, postcode = null } = {}) {
  if (!uprn) return null;
  const payload = { uprn: String(uprn), address: address || null, postcode: postcode || null };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
  } catch {
    // Ignore write errors (e.g., privacy mode)
  }
  return payload;
}

export function saveUPRN(uprn, address = null, postcode = null) {
  return saveProperty({ uprn, address, postcode });
}

export function clearSavedUPRN() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore
  }
}
