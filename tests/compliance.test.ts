import { describe, it, expect } from 'vitest';
import { ComplianceReport } from '../src/compliance.js';
import { PiiResult } from '../src/result.js';
import { PiiDetector } from '../src/detector.js';
import type { PiiEntity } from '../src/result.js';

const detector = new PiiDetector();

// Yardimci: sahte entity olusturucu
function fakeEntity(entityType: string, text = 'test', start = 0): PiiEntity {
  return { entityType, text, start, end: start + text.length, score: 1.0 };
}

// ─── hasMadde6 ──────────────────────────────────────────────────────────────

describe('ComplianceReport.hasMadde6', () => {
  it('SAGLIK_VERISI → hasMadde6 true', () => {
    const result = new PiiResult('test', [fakeEntity('SAGLIK_VERISI')]);
    const report = new ComplianceReport(result);
    expect(report.hasMadde6).toBe(true);
  });

  it('DINI_INANC → hasMadde6 true', () => {
    const result = new PiiResult('test', [fakeEntity('DINI_INANC')]);
    const report = new ComplianceReport(result);
    expect(report.hasMadde6).toBe(true);
  });

  it('SIYASI_GORUS → hasMadde6 true', () => {
    const result = new PiiResult('test', [fakeEntity('SIYASI_GORUS')]);
    const report = new ComplianceReport(result);
    expect(report.hasMadde6).toBe(true);
  });

  it('SENDIKA_UYELIGII → hasMadde6 true', () => {
    const result = new PiiResult('test', [fakeEntity('SENDIKA_UYELIGII')]);
    const report = new ComplianceReport(result);
    expect(report.hasMadde6).toBe(true);
  });

  it('BIYOMETRIK_VERI → hasMadde6 true', () => {
    const result = new PiiResult('test', [fakeEntity('BIYOMETRIK_VERI')]);
    const report = new ComplianceReport(result);
    expect(report.hasMadde6).toBe(true);
  });

  it('normal PII (TC_KIMLIK) → hasMadde6 false', () => {
    const r = detector.complianceReport('TC: 10000000146');
    expect(r.hasMadde6).toBe(false);
  });

  it('normal PII (TELEFON_TR) → hasMadde6 false', () => {
    const r = detector.complianceReport('Tel: 0532 123 45 67');
    expect(r.hasMadde6).toBe(false);
  });

  it('normal PII (EMAIL) → hasMadde6 false', () => {
    const r = detector.complianceReport('Mail: ali@example.com');
    expect(r.hasMadde6).toBe(false);
  });
});

// ─── Risk seviyeleri ────────────────────────────────────────────────────────

describe('ComplianceReport risk seviyeleri', () => {
  it('TC_KIMLIK → CRITICAL', () => {
    const result = new PiiResult('t', [fakeEntity('TC_KIMLIK')]);
    expect(new ComplianceReport(result).riskLevel).toBe('CRITICAL');
  });

  it('KREDI_KARTI → CRITICAL', () => {
    const result = new PiiResult('t', [fakeEntity('KREDI_KARTI')]);
    expect(new ComplianceReport(result).riskLevel).toBe('CRITICAL');
  });

  it('IBAN_TR → HIGH', () => {
    const result = new PiiResult('t', [fakeEntity('IBAN_TR')]);
    expect(new ComplianceReport(result).riskLevel).toBe('HIGH');
  });

  it('VKN → HIGH', () => {
    const result = new PiiResult('t', [fakeEntity('VKN')]);
    expect(new ComplianceReport(result).riskLevel).toBe('HIGH');
  });

  it('PASAPORT_TR → HIGH', () => {
    const result = new PiiResult('t', [fakeEntity('PASAPORT_TR')]);
    expect(new ComplianceReport(result).riskLevel).toBe('HIGH');
  });

  it('EMAIL → MEDIUM', () => {
    const result = new PiiResult('t', [fakeEntity('EMAIL')]);
    expect(new ComplianceReport(result).riskLevel).toBe('MEDIUM');
  });

  it('TELEFON_TR → MEDIUM', () => {
    const result = new PiiResult('t', [fakeEntity('TELEFON_TR')]);
    expect(new ComplianceReport(result).riskLevel).toBe('MEDIUM');
  });

  it('IP_ADRESI → LOW', () => {
    const result = new PiiResult('t', [fakeEntity('IP_ADRESI')]);
    expect(new ComplianceReport(result).riskLevel).toBe('LOW');
  });

  it('PLAKA_TR → LOW', () => {
    const result = new PiiResult('t', [fakeEntity('PLAKA_TR')]);
    expect(new ComplianceReport(result).riskLevel).toBe('LOW');
  });

  it('karisik entity — en yuksek risk alinir', () => {
    const result = new PiiResult('t', [
      fakeEntity('IP_ADRESI'),   // LOW
      fakeEntity('EMAIL'),       // MEDIUM
      fakeEntity('TC_KIMLIK'),   // CRITICAL
    ]);
    expect(new ComplianceReport(result).riskLevel).toBe('CRITICAL');
  });
});

// ─── summary() ──────────────────────────────────────────────────────────────

describe('ComplianceReport.summary()', () => {
  it('bos metinde "No PII detected."', () => {
    const result = new PiiResult('Merhaba', []);
    const report = new ComplianceReport(result);
    expect(report.summary()).toBe('No PII detected.');
  });

  it('entity listesi iceriyor', () => {
    const result = new PiiResult('t', [
      fakeEntity('TC_KIMLIK'),
      fakeEntity('EMAIL'),
    ]);
    const report = new ComplianceReport(result);
    const s = report.summary();
    expect(s).toContain('TC_KIMLIK');
    expect(s).toContain('EMAIL');
    expect(s).toContain('CRITICAL');
  });

  it('Madde 6 uyarisi iceriyor', () => {
    const result = new PiiResult('t', [fakeEntity('SAGLIK_VERISI')]);
    const report = new ComplianceReport(result);
    expect(report.summary()).toContain('Article 6');
  });
});

// ─── entityTypes duplicate kontrolu ─────────────────────────────────────────

describe('ComplianceReport.entityTypes duplicate', () => {
  it('ayni type 2 kez gecse 1 kez listelenir', () => {
    const result = new PiiResult('t', [
      fakeEntity('TC_KIMLIK', 'val1', 0),
      fakeEntity('TC_KIMLIK', 'val2', 10),
    ]);
    const report = new ComplianceReport(result);
    const tcCount = report.entityTypes.filter(t => t === 'TC_KIMLIK').length;
    expect(tcCount).toBe(1);
  });

  it('farkli tipler dogru listelenir', () => {
    const result = new PiiResult('t', [
      fakeEntity('TC_KIMLIK'),
      fakeEntity('EMAIL'),
      fakeEntity('TC_KIMLIK'),
      fakeEntity('EMAIL'),
      fakeEntity('IP_ADRESI'),
    ]);
    const report = new ComplianceReport(result);
    expect(report.entityTypes.length).toBe(3);
    expect(report.entityTypes).toContain('TC_KIMLIK');
    expect(report.entityTypes).toContain('EMAIL');
    expect(report.entityTypes).toContain('IP_ADRESI');
  });
});
