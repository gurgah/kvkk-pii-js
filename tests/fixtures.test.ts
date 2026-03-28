import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TcKimlikRecognizer } from '../src/recognizers/tc_kimlik.js';
import { IbanRecognizer } from '../src/recognizers/iban.js';
import { TelefonRecognizer } from '../src/recognizers/telefon.js';
import { PlakaRecognizer } from '../src/recognizers/plaka.js';
import { VknRecognizer } from '../src/recognizers/vkn.js';
import { KrediKartiRecognizer } from '../src/recognizers/kredi_karti.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadFixture(name: string): { valid: string[]; invalid: string[] } {
  const p = join(__dirname, 'fixtures', `${name}.json`);
  return JSON.parse(readFileSync(p, 'utf-8'));
}

describe('TC Kimlik — shared fixtures', () => {
  const r = new TcKimlikRecognizer();
  const { valid, invalid } = loadFixture('tc_kimlik');

  it.each(valid)('geçerli: %s', (tc) => {
    expect(r.find(tc).length).toBeGreaterThan(0);
  });

  it.each(invalid)('geçersiz: %s', (tc) => {
    expect(r.find(tc).length).toBe(0);
  });
});

describe('IBAN — shared fixtures', () => {
  const r = new IbanRecognizer();
  const { valid, invalid } = loadFixture('iban');

  it.each(valid)('geçerli: %s', (iban) => {
    expect(r.find(iban).length).toBeGreaterThan(0);
  });

  it.each(invalid)('geçersiz: %s', (iban) => {
    expect(r.find(iban).length).toBe(0);
  });
});

describe('Telefon — shared fixtures', () => {
  const r = new TelefonRecognizer();
  const { valid } = loadFixture('telefon');

  it.each(valid)('geçerli: %s', (tel) => {
    expect(r.find(tel).length).toBeGreaterThan(0);
  });
});

describe('Plaka — shared fixtures', () => {
  const r = new PlakaRecognizer();
  const { valid } = loadFixture('plaka');

  it.each(valid)('geçerli: %s', (plaka) => {
    expect(r.find(plaka).length).toBeGreaterThan(0);
  });
});

describe('Kredi Kartı — shared fixtures', () => {
  const r = new KrediKartiRecognizer();
  const { valid, invalid } = loadFixture('kredi_karti');

  it.each(valid)('geçerli: %s', (kk) => {
    expect(r.find(kk).length).toBeGreaterThan(0);
  });

  it.each(invalid)('geçersiz: %s', (kk) => {
    expect(r.find(kk).length).toBe(0);
  });
});
