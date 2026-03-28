import { describe, it, expect } from 'vitest';
import { TcKimlikRecognizer } from '../src/recognizers/tc_kimlik.js';
import { VknRecognizer } from '../src/recognizers/vkn.js';
import { IbanRecognizer } from '../src/recognizers/iban.js';
import { KrediKartiRecognizer } from '../src/recognizers/kredi_karti.js';
import { TelefonRecognizer } from '../src/recognizers/telefon.js';
import { PlakaRecognizer } from '../src/recognizers/plaka.js';
import { EmailRecognizer } from '../src/recognizers/email.js';
import { IpRecognizer } from '../src/recognizers/ip.js';
import { PasaportRecognizer } from '../src/recognizers/pasaport.js';

// ─── TC Kimlik ──────────────────────────────────────────────────────────────

describe('TcKimlikRecognizer', () => {
  const r = new TcKimlikRecognizer();

  describe('gecerli degerler', () => {
    it('kompakt format', () => {
      const entities = r.find('TC: 10000000146');
      expect(entities.length).toBe(1);
      expect(entities[0].text).toBe('10000000146');
    });

    it('bosluklu format', () => {
      const entities = r.find('TC: 100 0000 0146');
      expect(entities.length).toBe(1);
    });

    it('tireli format', () => {
      const entities = r.find('TC: 100-0000-0146');
      expect(entities.length).toBe(1);
    });

    it('20000000046 gecerli', () => {
      expect(r.find('20000000046').length).toBe(1);
    });

    it('30000000182 gecerli', () => {
      expect(r.find('30000000182').length).toBe(1);
    });
  });

  describe('gecersiz degerler', () => {
    it('yanlis checksum', () => {
      expect(r.find('12345678901').length).toBe(0);
    });

    it('0 ile baslayan', () => {
      expect(r.find('00000000000').length).toBe(0);
    });

    it('10 hane', () => {
      expect(r.find('1234567890').length).toBe(0);
    });

    it('12 hane', () => {
      expect(r.find('123456789012').length).toBe(0);
    });
  });

  describe('pozisyon dogrulugu', () => {
    it('start ve end dogru', () => {
      const text = 'TC: 10000000146';
      const entities = r.find(text);
      expect(entities[0].start).toBe(4);
      expect(entities[0].end).toBe(15);
      expect(text.slice(entities[0].start, entities[0].end)).toBe('10000000146');
    });

    it('metin ortasinda pozisyon', () => {
      const text = 'Merhaba, TC no: 10000000146, iyi gunler';
      const entities = r.find(text);
      expect(entities.length).toBe(1);
      expect(text.slice(entities[0].start, entities[0].end)).toBe('10000000146');
    });
  });

  describe('birden fazla TC', () => {
    it('ayni metinde iki farkli TC bulunur', () => {
      const text = 'TC1: 10000000146, TC2: 20000000046';
      const entities = r.find(text);
      expect(entities.length).toBe(2);
      expect(entities.map(e => e.text)).toContain('10000000146');
      expect(entities.map(e => e.text)).toContain('20000000046');
    });
  });
});

// ─── VKN ────────────────────────────────────────────────────────────────────

describe('VknRecognizer', () => {
  const r = new VknRecognizer();

  describe('gecerli degerler', () => {
    it('1000000009 gecerli', () => {
      expect(r.find('VKN: 1000000009').length).toBe(1);
    });

    it('0100000003 gecerli', () => {
      expect(r.find('0100000003').length).toBe(1);
    });

    it('1000000011 gecerli', () => {
      expect(r.find('1000000011').length).toBe(1);
    });
  });

  describe('gecersiz degerler', () => {
    it('yanlis checksum reddedilir (1234567890)', () => {
      expect(r.find('1234567890').length).toBe(0);
    });

    it('yanlis checksum reddedilir (1000000010)', () => {
      expect(r.find('1000000010').length).toBe(0);
    });

    it('9 hane reddedilir', () => {
      expect(r.find('123456789').length).toBe(0);
    });

    it('11 hane reddedilir', () => {
      expect(r.find('12345678901').length).toBe(0);
    });
  });

  describe('10 hane ama gecersiz checksum', () => {
    it('reddedilir (5555555555)', () => {
      expect(r.find('5555555555').length).toBe(0);
    });
  });
});

// ─── IBAN ───────────────────────────────────────────────────────────────────

describe('IbanRecognizer', () => {
  const r = new IbanRecognizer();

  describe('gecerli degerler', () => {
    it('TR330006100519786457841326 gecerli', () => {
      const entities = r.find('IBAN: TR330006100519786457841326');
      expect(entities.length).toBe(1);
      expect(entities[0].entityType).toBe('IBAN_TR');
    });

    it('TR270001200934007955524992 gecerli', () => {
      expect(r.find('TR270001200934007955524992').length).toBe(1);
    });
  });

  describe('gecersiz degerler', () => {
    it('yanlis mod97 reddedilir', () => {
      expect(r.find('TR330006100519786457841327').length).toBe(0);
    });

    it('kisa IBAN reddedilir', () => {
      expect(r.find('TR33000610051978645784132').length).toBe(0);
    });

    it('TR olmayan IBAN reddedilir (DE)', () => {
      expect(r.find('DE89370400440532013000').length).toBe(0);
    });
  });
});

// ─── Kredi Karti ────────────────────────────────────────────────────────────

describe('KrediKartiRecognizer', () => {
  const r = new KrediKartiRecognizer();

  describe('gecerli degerler', () => {
    it('Visa (kompakt)', () => {
      const entities = r.find('Kart: 4532015112830366');
      expect(entities.length).toBe(1);
      expect(entities[0].entityType).toBe('KREDI_KARTI');
    });

    it('Mastercard', () => {
      expect(r.find('5425233430109903').length).toBe(1);
    });

    it('Amex (15 hane)', () => {
      expect(r.find('378282246310005').length).toBe(1);
    });

    it('bosluklu format', () => {
      const entities = r.find('4532 0151 1283 0366');
      expect(entities.length).toBe(1);
    });
  });

  describe('gecersiz degerler', () => {
    it('yanlis Luhn reddedilir', () => {
      expect(r.find('4532015112830367').length).toBe(0);
    });

    it('yanlis rakamlar reddedilir', () => {
      expect(r.find('1234567890123456').length).toBe(0);
    });

    it('12 hane reddedilir', () => {
      expect(r.find('453201511283').length).toBe(0);
    });
  });
});

// ─── Telefon ────────────────────────────────────────────────────────────────

describe('TelefonRecognizer', () => {
  const r = new TelefonRecognizer();

  describe('gecerli formatlar', () => {
    it('+90 532 123 45 67', () => {
      expect(r.find('+90 532 123 45 67').length).toBe(1);
    });

    it('05321234567 (kompakt)', () => {
      expect(r.find('05321234567').length).toBe(1);
    });

    it('0 532 123 45 67 (bosluklu)', () => {
      expect(r.find('0 532 123 45 67').length).toBe(1);
    });

    it('+905321234567 (uluslararasi kompakt)', () => {
      expect(r.find('+905321234567').length).toBe(1);
    });

    it('0532 123 45 67 (basinda 0)', () => {
      expect(r.find('0532 123 45 67').length).toBe(1);
    });
  });

  describe('gecersiz degerler', () => {
    it('sabit hat 0212 reddedilir', () => {
      expect(r.find('0212 123 45 67').length).toBe(0);
    });

    it('yanlis operator +90 432 reddedilir', () => {
      expect(r.find('+90 432 123 45 67').length).toBe(0);
    });
  });
});

// ─── Plaka ──────────────────────────────────────────────────────────────────

describe('PlakaRecognizer', () => {
  const r = new PlakaRecognizer();

  describe('gecerli plakalar', () => {
    it('34 ABC 123', () => {
      expect(r.find('34 ABC 123').length).toBe(1);
    });

    it('06 A 1234', () => {
      expect(r.find('06 A 1234').length).toBe(1);
    });

    it('34ABC123 (bitisik)', () => {
      expect(r.find('34ABC123').length).toBe(1);
    });

    it('06A1234 (bitisik)', () => {
      expect(r.find('06A1234').length).toBe(1);
    });
  });

  describe('gecersiz plakalar', () => {
    it('00 il kodu yok', () => {
      expect(r.find('00 ABC 123').length).toBe(0);
    });

    it('82 il kodu yok', () => {
      expect(r.find('82 ABC 123').length).toBe(0);
    });

    it('99 il kodu yok', () => {
      expect(r.find('99 ABC 123').length).toBe(0);
    });
  });
});

// ─── Email ──────────────────────────────────────────────────────────────────

describe('EmailRecognizer', () => {
  const r = new EmailRecognizer();

  describe('gecerli e-postalar', () => {
    it('ali@example.com', () => {
      const entities = r.find('ali@example.com');
      expect(entities.length).toBe(1);
      expect(entities[0].entityType).toBe('EMAIL');
    });

    it('ali.veli+test@sub.domain.com', () => {
      expect(r.find('ali.veli+test@sub.domain.com').length).toBe(1);
    });
  });

  describe('gecersiz e-postalar', () => {
    it('ali@ reddedilir', () => {
      expect(r.find('ali@').length).toBe(0);
    });

    it('@example.com reddedilir', () => {
      expect(r.find('@example.com').length).toBe(0);
    });
  });
});

// ─── IP Adresi ──────────────────────────────────────────────────────────────

describe('IpRecognizer', () => {
  const r = new IpRecognizer();

  describe('gecerli IP adresleri', () => {
    it('192.168.1.1', () => {
      const entities = r.find('IP: 192.168.1.1');
      expect(entities.length).toBe(1);
      expect(entities[0].entityType).toBe('IP_ADRESI');
    });

    it('0.0.0.0', () => {
      expect(r.find('0.0.0.0').length).toBe(1);
    });

    it('255.255.255.255', () => {
      expect(r.find('255.255.255.255').length).toBe(1);
    });
  });

  describe('gecersiz IP adresleri', () => {
    it('256.1.1.1 reddedilir', () => {
      expect(r.find('256.1.1.1').length).toBe(0);
    });

    it('192.168.1 (eksik oktet) reddedilir', () => {
      expect(r.find('192.168.1').length).toBe(0);
    });
  });
});

// ─── Pasaport ───────────────────────────────────────────────────────────────

describe('PasaportRecognizer', () => {
  const r = new PasaportRecognizer();

  describe('gecerli pasaport', () => {
    it('A12345678 gecerli', () => {
      const entities = r.find('Pasaport: A12345678');
      expect(entities.length).toBe(1);
      expect(entities[0].entityType).toBe('PASAPORT_TR');
      expect(entities[0].text).toBe('A12345678');
    });
  });

  describe('gecersiz pasaport', () => {
    it('AB1234567 (2 harf) reddedilir', () => {
      // AB1234567 icinde B12345670 gibi bir alt pattern match edebilir mi kontrol
      // Pattern: /\b[A-Z]\d{8}\b/ -- AB1234567 9 karakter ama 2harf+7rakam, match etmemeli
      const entities = r.find('AB1234567');
      // AB1234567: A harfinden sonra B var, B harfi rakam degil -> ilk harf eslesmez
      // Ama B1234567 diye 8 hane var (7 rakam)? Hayir, B12345670 degil. B1234567 = 1 harf + 7 rakam.
      // Pattern [A-Z]\d{8} -> 1 harf + 8 rakam. AB1234567 = A + B1234567 (B rakam degil) = match yok.
      expect(entities.length).toBe(0);
    });

    it('A1234567 (7 rakam) reddedilir', () => {
      expect(r.find('A1234567').length).toBe(0);
    });
  });
});
