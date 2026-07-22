import { test } from 'node:test';
import assert from 'node:assert/strict';

// ---------- doctor ----------
import { createDoctor, doctorReply, reflect, GREETING } from '../public/doctor/logic.js';

test('doctor: reflection swaps person', () => {
  assert.equal(reflect('i am sad about my job'), 'you are sad about your job');
});
test('doctor: keyword rules and reflected capture', () => {
  const s = createDoctor();
  assert.match(doctorReply('I am lonely', s), /you are lonely/i);
  assert.match(doctorReply('I dreamt of the sea', s), /dream/i);
  assert.match(doctorReply('goodbye', s), /secretary will send you a bill/);
});
test('doctor: fallbacks rotate, no immediate repeat', () => {
  const s = createDoctor();
  const a = doctorReply('xyzzy plugh', s);
  const b = doctorReply('xyzzy plugh', s);
  assert.notEqual(a, b);
});
test('doctor: greeting is the doctor.el text', () => {
  assert.match(GREETING, /I am the psychotherapist/);
  assert.match(GREETING, /type RET twice/);
});

// ---------- calc ----------
import { createCalc, pressDigit, enter, op, undo, render } from '../public/calc/logic.js';

function type(s, str) { for (const c of str) pressDigit(c, s); }
test('calc: RPN 3 RET 4 + = 7, trail records it', () => {
  const s = createCalc();
  type(s, '3'); enter(s); type(s, '4'); op('+', s);
  assert.deepEqual(s.stack, [7]);
  assert.match(s.trail.join('\n'), /\+ {4,}7/);
});
test('calc: RET on empty entry duplicates, TAB swaps', () => {
  const s = createCalc();
  type(s, '5'); enter(s); enter(s);
  assert.deepEqual(s.stack, [5, 5]);
  type(s, '2'); enter(s); op('TAB', s);
  assert.deepEqual(s.stack, [5, 2, 5]);
});
test('calc: unary ops and undo', () => {
  const s = createCalc();
  type(s, '9'); op('Q', s);
  assert.deepEqual(s.stack, [3]);
  assert.equal(undo(s), null);
  assert.deepEqual(s.stack, [9]);
  const s2 = createCalc();
  assert.match(undo(s2), /No further undo/);
});
test('calc: render looks like the *Calculator* buffer', () => {
  const s = createCalc();
  type(s, '3'); enter(s); type(s, '4'); enter(s);
  assert.equal(render(s), '2:  3\n1:  4\n    .');
});

// ---------- isearch ----------
import { createSearch, findAll, extend, repeat, echoLine } from '../public/isearch/logic.js';

test('isearch: smart case folding', () => {
  assert.equal(findAll('Foo foo FOO', 'foo').length, 3);
  assert.equal(findAll('Foo foo FOO', 'Foo').length, 1);
});
test('isearch: fail then repeat wraps like emacs', () => {
  const text = 'aba aba';
  const s = createSearch();
  const m = extend(s, text, 'aba');
  assert.equal(s.cur, 0);
  repeat(s, m, 1);
  assert.equal(s.cur, 4);
  repeat(s, m, 1);              // past last -> failing
  assert.equal(s.failing, true);
  assert.match(echoLine(s), /^Failing I-search: aba/);
  repeat(s, m, 1);              // repeat after fail -> wrap
  assert.equal(s.cur, 0);
  assert.equal(s.wrapped, true);
  assert.match(echoLine(s), /^Wrapped I-search: aba/);
});
test('isearch: backward prompt wording', () => {
  const s = createSearch();
  s.active = true; s.dir = -1; s.query = 'q';
  assert.equal(echoLine(s), 'I-search backward: q');
});

// ---------- hex ----------
import { parseHexBytes, parseBitString, searchBytes, searchBits, rowData, createEdit, setByte } from '../public/hex/logic.js';

test('hex: parseHexBytes accepts separators, rejects junk', () => {
  assert.deepEqual([...parseHexBytes('DE AD-be,ef')], [0xde, 0xad, 0xbe, 0xef]);
  assert.deepEqual([...parseHexBytes('0x01 0x02')], [1, 2]);
  assert.equal(parseHexBytes('xyz'), null);
  assert.equal(parseHexBytes('abc'), null); // odd length
});
test('hex: searchBytes finds and wraps', () => {
  const hay = new Uint8Array([1, 2, 3, 4, 1, 2, 3]);
  const needle = new Uint8Array([2, 3]);
  assert.equal(searchBytes(hay, needle, 0), 1);
  assert.equal(searchBytes(hay, needle, 2), 5);
  assert.equal(searchBytes(hay, needle, 6), 1); // wrap
});
test('hex: searchBits matches across octet boundaries', () => {
  // 0x0F 0xF0 = 00001111 11110000 -> 11111111 starts at bit 4 of byte 0
  const hay = new Uint8Array([0x0f, 0xf0]);
  const r = searchBits(hay, parseBitString('1111 1111'));
  assert.deepEqual(r, { byte: 0, bit: 4 });
  // byte-aligned still works
  assert.deepEqual(searchBits(new Uint8Array([0xff]), '11111111'), { byte: 0, bit: 0 });
  assert.equal(searchBits(new Uint8Array([0x00, 0x00]), '11111111'), null);
});
test('hex: edit model tracks modifications', () => {
  const ed = createEdit(new Uint8Array([0, 0, 0]));
  assert.equal(setByte(ed, 1, 0xab), true);
  assert.equal(ed.bytes[1], 0xab);
  assert.deepEqual([...ed.modified], [1]);
  assert.equal(setByte(ed, 99, 1), false);
});
test('hex: rowData formats a row', () => {
  const r = rowData(new Uint8Array([0x41, 0x00, 0x7f]), 0);
  assert.deepEqual(r.hex, ['41', '00', '7F']);
  assert.equal(r.ascii, 'A..');
  assert.equal(r.off, '00000000');
});
import { parseNumber, numFits, autoNumType, numToBytes, bitsToNumber } from '../public/hex/logic.js';
test('hex: number search parse/type/encode', () => {
  assert.equal(parseNumber('0x1F4'), 500n);
  assert.equal(parseNumber('-42'), -42n);
  assert.equal(parseNumber('12a'), null);
  assert.equal(autoNumType(200n), 'u8');
  assert.equal(autoNumType(-1n), 'i8');
  assert.equal(autoNumType(70000n), 'u32');
  assert.equal(autoNumType(1n << 64n), null);
  assert.equal(numFits(256n, 'u8'), false);
  assert.equal(numFits(-1n, 'u16'), false);
  assert.deepEqual([...numToBytes(500n, 'u16', true)], [0xF4, 0x01]);
  assert.deepEqual([...numToBytes(500n, 'u16', false)], [0x01, 0xF4]);
  assert.deepEqual([...numToBytes(-2n, 'i16', false)], [0xFF, 0xFE]);
  assert.equal(bitsToNumber('101100111'), 359n);
});

// ---------- geo ----------
import { sizeCheck as geoSize, buildArgs as geoArgs, outName as geoOut, shpHint } from '../public/geo/logic.js';
test('geo: size check, args, names', () => {
  assert.equal(geoSize(1048576), null);
  assert.ok(geoSize(150 * 1048576).warn);
  assert.match(geoSize(400 * 1048576), /limit/);
  assert.deepEqual(geoArgs('GPX', ' EPSG:4326 '), ['-f', 'GPX', '-t_srs', 'EPSG:4326']);
  assert.deepEqual(geoArgs('KML', ''), ['-f', 'KML']);
  assert.equal(geoOut('track.shp', 'geojson'), 'track.geojson');
  assert.match(shpHint(['a.SHP']), /dbf/);
  assert.equal(shpHint(['a.shp', 'a.dbf']), null);
});

// ---------- qr ----------
import { wifiEscape, wifiPayload, buildPayload, capacityCheck } from '../public/qr/logic.js';
test('qr: payloads and capacity', () => {
  assert.equal(wifiEscape('a;b:c"d\\e,f'), 'a\\;b\\:c\\"d\\\\e\\,f');
  assert.equal(wifiPayload('MyNet', 'p;w', 'WPA', false), 'WIFI:T:WPA;S:MyNet;P:p\\;w;;');
  assert.equal(wifiPayload('Open', '', 'nopass', true), 'WIFI:T:nopass;S:Open;H:true;;');
  assert.match(buildPayload('vcard', { name: 'A B', phone: '1', email: 'a@b.c', org: '' }), /BEGIN:VCARD[\s\S]*TEL:1/);
  assert.equal(buildPayload('tel', { text: ' 123 ' }), 'tel:123');
  assert.equal(capacityCheck('x'.repeat(100), 'M'), null);
  assert.match(capacityCheck('x'.repeat(3000), 'M'), /max/);
});

// ---------- audio ----------
import { sizeCheck as auSize, buildArgs as auArgs, outName as auOut, OUT_FORMATS as AU } from '../public/audio/logic.js';
test('audio: size check, args, names', () => {
  assert.equal(auSize(1048576), null);
  assert.ok(auSize(200 * 1048576).warn);
  assert.match(auSize(600 * 1048576), /limited/);
  assert.match(auSize(300 * 1048576, 1), /working memory/);
  const mp3 = AU.find((f) => f.ext === 'mp3');
  assert.deepEqual(auArgs('in.mp4', mp3, 'out.mp3'), ['-i', 'in.mp4', '-vn', '-c:a', 'libmp3lame', '-q:a', '2', 'out.mp3']);
  assert.equal(auOut('video.mp4', 'mp3'), 'video.mp3');
  assert.equal(auOut('song.mp3', 'mp3'), 'song_converted.mp3');
});

import { kmzExtractKml } from '../public/geo/logic.js';
import zlib from 'node:zlib';
function makeZip(entries) { // [{name, data(Buffer), method}]
  const parts = [], cd = [];
  let off = 0;
  for (const e of entries) {
    const stored = e.method === 8 ? zlib.deflateRawSync(e.data) : e.data;
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(e.method, 8);
    lh.writeUInt32LE(stored.length, 18); lh.writeUInt32LE(e.data.length, 22);
    lh.writeUInt16LE(e.name.length, 26);
    parts.push(lh, Buffer.from(e.name), stored);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(e.method, 10);
    c.writeUInt32LE(stored.length, 20); c.writeUInt32LE(e.data.length, 24);
    c.writeUInt16LE(e.name.length, 28); c.writeUInt32LE(off, 42);
    cd.push(Buffer.concat([c, Buffer.from(e.name)]));
    off += 30 + e.name.length + stored.length;
  }
  const cdBuf = Buffer.concat(cd);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12); eocd.writeUInt32LE(off, 16);
  return new Uint8Array(Buffer.concat([...parts.flat(), cdBuf, eocd]));
}
const nodeInflate = async (u8) => new Uint8Array(zlib.inflateRawSync(u8));
test('geo: kmz extraction, stored and deflated', async () => {
  const kml = Buffer.from('<kml>hello</kml>');
  const zStored = makeZip([{ name: 'img.png', data: Buffer.from('x'), method: 0 }, { name: 'doc.kml', data: kml, method: 0 }]);
  assert.equal(Buffer.from(await kmzExtractKml(zStored, nodeInflate)).toString(), '<kml>hello</kml>');
  const zDeflate = makeZip([{ name: 'doc.KML', data: kml, method: 8 }]);
  assert.equal(Buffer.from(await kmzExtractKml(zDeflate, nodeInflate)).toString(), '<kml>hello</kml>');
  await assert.rejects(() => kmzExtractKml(new Uint8Array([1, 2, 3]), nodeInflate), /not a valid/);
  await assert.rejects(() => kmzExtractKml(makeZip([{ name: 'a.txt', data: kml, method: 0 }]), nodeInflate), /no \.kml/);
});
