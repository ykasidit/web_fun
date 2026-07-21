// ClearEvo hex viewer/editor logic. Pure, tested.

// "DE AD be-ef, 0x01" -> Uint8Array or null on bad input
export function parseHexBytes(str) {
  const clean = str.replace(/0x/gi, '').replace(/[\s,;:-]/g, '');
  if (!clean.length || clean.length % 2 || /[^0-9a-f]/i.test(clean)) return null;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}

// "10110011..." (spaces ok) -> {bits: '0101...'} or null
export function parseBitString(str) {
  const clean = str.replace(/\s/g, '');
  if (!clean.length || /[^01]/.test(clean)) return null;
  return clean;
}

// forward byte search with wrap; returns index or -1
export function searchBytes(hay, needle, from = 0) {
  if (!needle.length || needle.length > hay.length) return -1;
  const scan = (start, end) => {
    outer: for (let i = start; i <= end - needle.length; i++) {
      for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
      return i;
    }
    return -1;
  };
  const r = scan(from, hay.length);
  return r !== -1 ? r : scan(0, Math.min(hay.length, from + needle.length - 1 + needle.length));
}

// bless-style bit-sequence search: find a bit pattern at ANY bit offset,
// not just byte-aligned. Returns {byte, bit} of the first match at/after
// byte `from`, or null. bits = string of '0'/'1'.
export function searchBits(hay, bits, from = 0) {
  const n = bits.length;
  if (!n || n > hay.length * 8) return null;
  const want = bits.split('').map((c) => c === '1' ? 1 : 0);
  const bitAt = (pos) => (hay[pos >> 3] >> (7 - (pos & 7))) & 1;
  const total = hay.length * 8;
  const startBit = from * 8;
  const tryFrom = (s0, s1) => {
    outer: for (let s = s0; s <= s1 - n; s++) {
      for (let k = 0; k < n; k++) if (bitAt(s + k) !== want[k]) continue outer;
      return { byte: s >> 3, bit: s & 7 };
    }
    return null;
  };
  return tryFrom(startBit, total) ?? (from > 0 ? tryFrom(0, Math.min(total, startBit + n)) : null);
}

export function toHex(b) { return b.toString(16).toUpperCase().padStart(2, '0'); }
export function toAscii(b) { return b >= 32 && b < 127 ? String.fromCharCode(b) : '.'; }
export function offsetHex(n, w = 8) { return n.toString(16).toUpperCase().padStart(w, '0'); }

// render one row: {off, hex: [..16 strings], ascii: '...'}
export function rowData(bytes, rowStart, width = 16) {
  const hex = [], ascii = [];
  for (let i = rowStart; i < Math.min(rowStart + width, bytes.length); i++) {
    hex.push(toHex(bytes[i]));
    ascii.push(toAscii(bytes[i]));
  }
  return { off: offsetHex(rowStart), hex, ascii: ascii.join('') };
}

// edit model: tracks modified offsets for highlighting + dirty state
export function createEdit(bytes) {
  return { bytes, modified: new Set() };
}
export function setByte(ed, offset, value) {
  if (offset < 0 || offset >= ed.bytes.length) return false;
  if (ed.bytes[offset] === value) return true;
  ed.bytes[offset] = value;
  ed.modified.add(offset);
  return true;
}
