import { describe, it, expect } from 'vitest';
import { PiiDetector } from '../src/detector.js';
import { BaseRecognizer } from '../src/base.js';
import type { PiiEntity } from '../src/result.js';

const detector = new PiiDetector();

// ─── analyze() ──────────────────────────────────────────────────────────────

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
    const r = detector.analyze('Merhaba dunya');
    expect(r.entities.length).toBe(0);
  });

  it('bos metin — entity yok', () => {
    const r = detector.analyze('');
    expect(r.entities.length).toBe(0);
  });

  it('sadece bosluk — entity yok', () => {
    const r = detector.analyze('     ');
    expect(r.entities.length).toBe(0);
  });

  it('ayni metinde birden fazla entity — hepsi bulunur', () => {
    const r = detector.analyze('TC: 10000000146, mail: ali@example.com, tel: 0532 123 45 67');
    expect(r.has('TC_KIMLIK')).toBe(true);
    expect(r.has('EMAIL')).toBe(true);
    expect(r.has('TELEFON_TR')).toBe(true);
    expect(r.entities.length).toBeGreaterThanOrEqual(3);
  });

  it('entity pozisyonlari dogru (start/end)', () => {
    const text = 'TC: 10000000146';
    const r = detector.analyze(text);
    const entity = r.entities.find(e => e.entityType === 'TC_KIMLIK');
    expect(entity).toBeDefined();
    expect(text.slice(entity!.start, entity!.end)).toBe('10000000146');
  });

  it('Turkce karakter iceren metin bozulmuyor', () => {
    const text = 'Sirket: ali@ornek.com, musteri sayisi cok';
    const r = detector.analyze(text);
    expect(r.has('EMAIL')).toBe(true);
    const entity = r.entities.find(e => e.entityType === 'EMAIL');
    expect(entity!.text).toBe('ali@ornek.com');
  });

  it('Turkce ozel karakterlerle e-posta', () => {
    const text = 'Iletisim icin: test@firma.com.tr adresine yazin';
    const r = detector.analyze(text);
    expect(r.has('EMAIL')).toBe(true);
  });

  it('cok uzun metin (1000+ karakter) — dogruluk', () => {
    const padding = 'Bu bir test cumlesdir. '.repeat(50); // ~1100 karakter
    const text = `${padding}TC: 10000000146 ${padding}`;
    const r = detector.analyze(text);
    expect(r.has('TC_KIMLIK')).toBe(true);
    expect(r.entities.length).toBe(1);
    expect(r.entities[0].text).toBe('10000000146');
  });

  it('IP adresi bulur', () => {
    const r = detector.analyze('Sunucu: 192.168.1.1');
    expect(r.has('IP_ADRESI')).toBe(true);
  });

  it('plaka bulur', () => {
    const r = detector.analyze('Arac plakasi: 34 ABC 123');
    expect(r.has('PLAKA_TR')).toBe(true);
  });

  it('pasaport bulur', () => {
    const r = detector.analyze('Pasaport no: A12345678');
    expect(r.has('PASAPORT_TR')).toBe(true);
  });

  it('kredi karti bulur', () => {
    const r = detector.analyze('Kart: 4532015112830366');
    expect(r.has('KREDI_KARTI')).toBe(true);
  });
});

// ─── anonymize() ────────────────────────────────────────────────────────────

describe('PiiDetector.anonymize()', () => {
  it('TC kimligini maskeler', () => {
    const out = detector.anonymize('TC: 10000000146');
    expect(out).toContain('[TC_KIMLIK]');
    expect(out).not.toContain('10000000146');
  });

  it('varsayilan placeholder formati [ENTITY_TYPE]', () => {
    const out = detector.anonymize('Mail: ali@example.com');
    expect(out).toContain('[EMAIL]');
    expect(out).not.toContain('ali@example.com');
  });

  it('ozel placeholder: ***', () => {
    const out = detector.anonymize('TC: 10000000146', '***');
    expect(out).toContain('***');
    expect(out).not.toContain('10000000146');
    expect(out).not.toContain('[TC_KIMLIK]');
  });

  it('birden fazla entity maskelenir', () => {
    const out = detector.anonymize('TC: 10000000146, mail: ali@example.com');
    expect(out).not.toContain('10000000146');
    expect(out).not.toContain('ali@example.com');
  });

  it('entity olmayan metin degismez', () => {
    const text = 'Merhaba, nasilsiniz?';
    const out = detector.anonymize(text);
    expect(out).toBe(text);
  });

  it('bos metin degismez', () => {
    expect(detector.anonymize('')).toBe('');
  });
});

// ─── PiiSession (temel) ────────────────────────────────────────────────────

describe('PiiSession (temel)', () => {
  it('mask ve restore calisir', () => {
    const metin = 'Ahmet, TC: 10000000146';
    const session = detector.createSession(metin);
    const masked = session.mask();
    expect(masked).not.toContain('10000000146');
    const restored = session.restore(masked);
    expect(restored).toContain('10000000146');
  });

  it('tokenFormat ozellestirme', () => {
    const metin = 'TC: 10000000146';
    const session = detector.createSession(metin, { tokenFormat: '__{type}_{id}__' });
    const masked = session.mask();
    expect(masked).toMatch(/__TC_KIMLIK_[a-z0-9]{3}__/);
  });
});

// ─── ComplianceReport (temel) ───────────────────────────────────────────────

describe('ComplianceReport (temel)', () => {
  it('TC kimlik CRITICAL risk', () => {
    const r = detector.complianceReport('TC: 10000000146');
    expect(r.riskLevel).toBe('CRITICAL');
  });

  it('temiz metin — risk yok', () => {
    const r = detector.complianceReport('Merhaba');
    expect(r.entityTypes.length).toBe(0);
  });
});

// ─── disable + before/after ─────────────────────────────────────────────────

describe('disable + before/after', () => {
  it('EMAIL disable edilince bulunamaz', () => {
    const d = new PiiDetector({ disable: ['EMAIL'] });
    const r = d.analyze('ali@ornek.com ve TC: 10000000146');
    expect(r.has('EMAIL')).toBe(false);
    expect(r.has('TC_KIMLIK')).toBe(true);
  });

  it('birden fazla disable', () => {
    const d = new PiiDetector({ disable: ['EMAIL', 'IP_ADRESI'] });
    const r = d.analyze('ali@ornek.com ve 192.168.1.1');
    expect(r.has('EMAIL')).toBe(false);
    expect(r.has('IP_ADRESI')).toBe(false);
  });

  it('before recognizer once calisir', () => {
    class SicilNo extends BaseRecognizer {
      readonly entityType = 'SICIL_NO';
      find(text: string) {
        const results: PiiEntity[] = [];
        const p = /\bSCL-\d{6}\b/g;
        let m: RegExpExecArray | null;
        while ((m = p.exec(text)) !== null)
          results.push(this.entity(m[0], m.index, m.index + m[0].length));
        return results;
      }
    }
    const d = new PiiDetector({ before: [new SicilNo()] });
    const r = d.analyze('SCL-004521 ve ali@ornek.com');
    expect(r.has('SICIL_NO')).toBe(true);
    expect(r.has('EMAIL')).toBe(true);
  });

  it('after recognizer sonda calisir', () => {
    class SicilNo extends BaseRecognizer {
      readonly entityType = 'SICIL_NO';
      find(text: string) {
        const results: PiiEntity[] = [];
        const p = /\bSCL-\d{6}\b/g;
        let m: RegExpExecArray | null;
        while ((m = p.exec(text)) !== null)
          results.push(this.entity(m[0], m.index, m.index + m[0].length));
        return results;
      }
    }
    const d = new PiiDetector({ after: [new SicilNo()] });
    const r = d.analyze('SCL-004521 ve TC: 10000000146');
    expect(r.has('SICIL_NO')).toBe(true);
    expect(r.has('TC_KIMLIK')).toBe(true);
  });

  it('disable + after birlikte', () => {
    class SicilNo extends BaseRecognizer {
      readonly entityType = 'SICIL_NO';
      find(text: string) {
        const results: PiiEntity[] = [];
        const p = /\bSCL-\d{6}\b/g;
        let m: RegExpExecArray | null;
        while ((m = p.exec(text)) !== null)
          results.push(this.entity(m[0], m.index, m.index + m[0].length));
        return results;
      }
    }
    const d = new PiiDetector({ disable: ['EMAIL'], after: [new SicilNo()] });
    const r = d.analyze('ali@ornek.com, SCL-004521');
    expect(r.has('EMAIL')).toBe(false);
    expect(r.has('SICIL_NO')).toBe(true);
  });
});
