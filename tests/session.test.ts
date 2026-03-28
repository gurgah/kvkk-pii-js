import { describe, it, expect } from 'vitest';
import { PiiDetector } from '../src/detector.js';

const detector = new PiiDetector();

describe('PiiSession', () => {
  describe('mask() / restore() tutarliligi', () => {
    it('ayni deger iki kez gecince ayni placeholder doner', () => {
      const text = 'TC1: 10000000146, TC2: 10000000146';
      const session = detector.createSession(text);
      const masked = session.mask();

      // Ayni deger icin ayni placeholder kullanilmali
      const placeholders = masked.match(/\[TC_KIMLIK_[a-z0-9]{3}\]/g);
      expect(placeholders).not.toBeNull();
      expect(placeholders!.length).toBe(2);
      expect(placeholders![0]).toBe(placeholders![1]);
    });

    it('farkli degerler farkli placeholder alir', () => {
      const text = 'TC1: 10000000146, TC2: 20000000046';
      const session = detector.createSession(text);
      const masked = session.mask();

      const placeholders = masked.match(/\[TC_KIMLIK_[a-z0-9]{3}\]/g);
      expect(placeholders).not.toBeNull();
      expect(placeholders!.length).toBe(2);
      expect(placeholders![0]).not.toBe(placeholders![1]);
    });

    it('restore() maskeli metni tam geri yukler', () => {
      const text = 'Ahmet, TC: 10000000146, tel: 0532 123 45 67';
      const session = detector.createSession(text);
      const masked = session.mask();

      expect(masked).not.toContain('10000000146');
      expect(masked).not.toContain('0532 123 45 67');

      const restored = session.restore(masked);
      expect(restored).toBe(text);
    });

    it('restore() placeholder olmayan metni degistirmez', () => {
      const text = 'Merhaba dunya, guzel gun.';
      const session = detector.createSession(text);
      const masked = session.mask();

      // Entity yok, mask degistirmemeli
      expect(masked).toBe(text);

      const restored = session.restore(masked);
      expect(restored).toBe(text);
    });
  });

  describe('tokenFormat ozellestirme', () => {
    it('__{type}_{id}__ formati calisir', () => {
      const text = 'TC: 10000000146';
      const session = detector.createSession(text, { tokenFormat: '__{type}_{id}__' });
      const masked = session.mask();

      expect(masked).toMatch(/__TC_KIMLIK_[a-z0-9]{3}__/);
      expect(masked).not.toContain('10000000146');
    });

    it('PII_{type}_{id} formati calisir', () => {
      const text = 'TC: 10000000146';
      const session = detector.createSession(text, { tokenFormat: 'PII_{type}_{id}' });
      const masked = session.mask();

      expect(masked).toMatch(/PII_TC_KIMLIK_[a-z0-9]{3}/);
      expect(masked).not.toContain('10000000146');
    });
  });

  describe('hata durumlari', () => {
    it('mask() farkli metinle cagrilinca hata firlatir', () => {
      const text = 'TC: 10000000146';
      const session = detector.createSession(text);

      expect(() => session.mask('Tamamen farkli bir metin')).toThrow();
    });
  });

  describe('birden fazla entity', () => {
    it('tum entity tipler maskelenir', () => {
      const text = 'TC: 10000000146, mail: ali@example.com, tel: 0532 123 45 67';
      const session = detector.createSession(text);
      const masked = session.mask();

      expect(masked).not.toContain('10000000146');
      expect(masked).not.toContain('ali@example.com');
      expect(masked).not.toContain('0532 123 45 67');
    });

    it('restore sonrasi orijinal metin elde edilir', () => {
      const text = 'TC: 10000000146, mail: ali@example.com, tel: 0532 123 45 67';
      const session = detector.createSession(text);
      const masked = session.mask();
      const restored = session.restore(masked);

      expect(restored).toBe(text);
    });
  });

  describe('uzun placeholder kisa olani bozmaz', () => {
    it('restore siralama dogru calisir', () => {
      const text = 'IBAN: TR330006100519786457841326, TC: 10000000146';
      const session = detector.createSession(text);
      const masked = session.mask();

      expect(masked).not.toContain('TR330006100519786457841326');
      expect(masked).not.toContain('10000000146');

      const restored = session.restore(masked);
      expect(restored).toBe(text);
    });
  });
});
