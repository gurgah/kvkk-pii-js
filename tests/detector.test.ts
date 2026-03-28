import { describe, it, expect } from 'vitest';
import { PiiDetector } from '../src/detector.js';

const detector = new PiiDetector();

describe('PiiDetector.analyze()', () => {
  it('TC kimlik bulur', () => {
    const r = detector.analyze('TC: 10000000146');
    expect(r.has('TC_KIMLIK')).toBe(true);
  });

  it('e-posta bulur', () => {
    const r = detector.analyze('Mail: ali@example.com');
    expect(r.has('EMAIL')).toBe(true);
  });

  it('telefon bulur', () => {
    const r = detector.analyze('Tel: 0532 123 45 67');
    expect(r.has('TELEFON_TR')).toBe(true);
  });

  it('IBAN bulur', () => {
    const r = detector.analyze('IBAN: TR330006100519786457841326');
    expect(r.has('IBAN_TR')).toBe(true);
  });

  it('temiz metinde entity yok', () => {
    const r = detector.analyze('Merhaba dünya');
    expect(r.entities.length).toBe(0);
  });
});

describe('PiiDetector.anonymize()', () => {
  it('TC kimliği maskeler', () => {
    const out = detector.anonymize('TC: 10000000146');
    expect(out).toContain('[TC_KIMLIK]');
    expect(out).not.toContain('10000000146');
  });
});

describe('PiiSession', () => {
  it('mask ve restore çalışır', () => {
    const metin = 'Ahmet, TC: 10000000146';
    const session = detector.createSession(metin);
    const masked = session.mask();
    expect(masked).not.toContain('10000000146');
    const restored = session.restore(masked);
    expect(restored).toContain('10000000146');
  });

  it('tokenFormat özelleştirme', () => {
    const metin = 'TC: 10000000146';
    const session = detector.createSession(metin, { tokenFormat: '__{type}_{id}__' });
    const masked = session.mask();
    expect(masked).toMatch(/__TC_KIMLIK_[a-z0-9]{3}__/);
  });
});

describe('ComplianceReport', () => {
  it('TC kimlik KRİTİK risk', () => {
    const r = detector.complianceReport('TC: 10000000146');
    expect(r.riskLevel).toBe('KRİTİK');
  });

  it('temiz metin — risk yok', () => {
    const r = detector.complianceReport('Merhaba');
    expect(r.entityTypes.length).toBe(0);
  });
});
