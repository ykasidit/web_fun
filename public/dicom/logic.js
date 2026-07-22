// DICOM CD viewer logic. Pure, tested. All archive access goes through
// readRange(offset, length) -> Promise<Uint8Array>, so the browser uses
// File.slice and node tests use fs.read - the CD is never loaded whole.

// ---- ZIP (classic, not ZIP64 - DICOM CDs are < 4GB by definition) ----

export async function zipEntries(readRange, fileSize) {
  const tailLen = Math.min(fileSize, 128 * 1024);
  const tail = await readRange(fileSize - tailLen, tailLen);
  const dv = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a ZIP archive (no end-of-central-directory)');
  const count = dv.getUint16(eocd + 10, true);
  const cdSize = dv.getUint32(eocd + 12, true);
  const cdOff = dv.getUint32(eocd + 16, true);
  if (count === 0xffff || cdOff === 0xffffffff) throw new Error('ZIP64 archive - not supported yet (file over 4GB?)');
  const cd = await readRange(cdOff, cdSize);
  const cdv = new DataView(cd.buffer, cd.byteOffset, cd.byteLength);
  const dec = new TextDecoder();
  const out = [];
  let off = 0;
  for (let n = 0; n < count; n++) {
    if (cdv.getUint32(off, true) !== 0x02014b50) throw new Error('bad ZIP central directory');
    const method = cdv.getUint16(off + 10, true);
    const csize = cdv.getUint32(off + 20, true);
    const usize = cdv.getUint32(off + 24, true);
    const nameLen = cdv.getUint16(off + 28, true);
    const extraLen = cdv.getUint16(off + 30, true);
    const cmtLen = cdv.getUint16(off + 32, true);
    const lho = cdv.getUint32(off + 42, true);
    const name = dec.decode(cd.subarray(off + 46, off + 46 + nameLen));
    if (usize > 0) out.push({ name, method, csize, usize, lho });
    off += 46 + nameLen + extraLen + cmtLen;
  }
  return out;
}

// read one entry; headBytes limits BOTH the compressed read and the inflate -
// header scans touch only the first ~64KB of each slice
export async function zipData(readRange, entry, inflateRaw, headBytes) {
  const lh = await readRange(entry.lho, 30);
  const dv = new DataView(lh.buffer, lh.byteOffset, lh.byteLength);
  if (dv.getUint32(0, true) !== 0x04034b50) throw new Error('bad ZIP local header');
  const dataOff = entry.lho + 30 + dv.getUint16(26, true) + dv.getUint16(28, true);
  const want = headBytes ? Math.min(entry.csize, Math.max(headBytes * 2, 65536)) : entry.csize;
  const raw = await readRange(dataOff, want);
  if (entry.method === 0) return headBytes ? raw.subarray(0, headBytes) : raw;
  if (entry.method !== 8) throw new Error(`unsupported ZIP compression method ${entry.method}`);
  return inflateRaw(raw, headBytes);
}

// ---- DICOM helpers ----

// CD junk that is definitely not image data
export const JUNK_RE = /(^|\/)(autorun|viewer|readme|dicomdir$)|\.(exe|dll|bmp|png|jpg|ini|inf|hlp|html?|txt|xml|ico|pdf|css|js)$/i;

export function looksDicom(bytes) {
  return bytes.length > 132 && bytes[128] === 0x44 && bytes[129] === 0x49 && bytes[130] === 0x43 && bytes[131] === 0x4d;
}

// group scanned per-file metadata into sorted series
export function groupSeries(items) {
  const by = new Map();
  for (const it of items) {
    const k = it.seriesUID || 'unknown';
    if (!by.has(k)) by.set(k, { uid: k, num: it.seriesNum ?? 9999, desc: it.seriesDesc || '(no description)', modality: it.modality || '', instances: [] });
    by.get(k).instances.push(it);
  }
  const series = [...by.values()];
  for (const s of series) s.instances.sort((a, b) => (a.instance ?? 1e9) - (b.instance ?? 1e9) || a.name.localeCompare(b.name));
  series.sort((a, b) => a.num - b.num);
  return series;
}

// window/level presets, the ones every CT viewer ships
export const CT_PRESETS = [
  { label: 'Auto (from file)', wc: null, ww: null },
  { label: 'Soft tissue 40/400', wc: 40, ww: 400 },
  { label: 'Brain 40/80', wc: 40, ww: 80 },
  { label: 'Lung -600/1500', wc: -600, ww: 1500 },
  { label: 'Bone 300/1500', wc: 300, ww: 1500 },
];

// first number of a possibly multi-valued DICOM decimal string like "40\\80"
export function firstNum(s) {
  if (s == null || s === '') return null;
  const v = parseFloat(String(s).split('\\')[0]);
  return Number.isFinite(v) ? v : null;
}

// normalize a DICOMDIR Referenced File ID / zip path to one comparable key
export function normKey(name) { return name.replace(/\\/g, '/').replace(/^\//, '').toUpperCase(); }

// build per-image metadata from DICOMDIR directory records (pure).
// records: [{type:'SERIES'|'IMAGE'|..., seriesUID, seriesNum, modality, fid, instance}]
// resolve: (normKey) -> source item, or undefined if that file isn't present.
export function seriesFromDicomdirRecords(records, resolve) {
  const metas = []; let curS = null;
  for (const r of records) {
    if (r.type === 'SERIES') curS = r;
    else if (r.type === 'IMAGE' && curS && r.fid) {
      const item = resolve(normKey(r.fid));
      if (!item) continue;
      metas.push({ name: item.name, item, seriesUID: curS.seriesUID || 'unknown',
        seriesNum: curS.seriesNum, modality: curS.modality || '', seriesDesc: '', instance: r.instance });
    }
  }
  return metas;
}

// map stored pixel values to 0..255 through rescale + window
export function makeLut(slope, intercept, wc, ww, invert) {
  const w = Math.max(1, ww);
  const lo = wc - w / 2, hi = wc + w / 2;
  return (v) => {
    const m = v * slope + intercept;
    let y = m <= lo ? 0 : m >= hi ? 255 : Math.round(((m - lo) / w) * 255);
    return invert ? 255 - y : y;
  };
}
