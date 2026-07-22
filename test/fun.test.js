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
