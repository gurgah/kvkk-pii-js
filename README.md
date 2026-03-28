# kvkk-pii

[![npm](https://img.shields.io/npm/v/kvkk-pii)](https://www.npmjs.com/package/kvkk-pii)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![test](https://img.shields.io/badge/tests-38%2F38-brightgreen)]()
[![typescript](https://img.shields.io/badge/TypeScript-5%2B-blue)]()

**JavaScript/TypeScript için KVKK uyumlu Türkçe kişisel veri tespiti.**

Node.js, tarayıcı ve React'ta çalışır. Sıfır bağımlılık.

> Python versiyonu: [kvkk-pii (PyPI)](https://pypi.org/project/kvkk-pii/) — aynı API, aynı davranış.

---

## Kurulum

```bash
npm install kvkk-pii
```

Sıfır bağımlılık. Ağır ML modeli yok — sadece regex + checksum doğrulama.

---

## Hızlı başlangıç

```typescript
import { PiiDetector } from 'kvkk-pii';

const detector = new PiiDetector();

// Tespit
const result = detector.analyze('Ali Veli, TC: 10000000146, tel: 0532 123 45 67');
console.log(result.entities);
// [
//   { entityType: 'TC_KIMLIK', text: '10000000146', start: 15, end: 26, score: 1 },
//   { entityType: 'TELEFON_TR', text: '0532 123 45 67', start: 32, end: 46, score: 1 }
// ]

// Anonimleştirme
const masked = detector.anonymize('Ali Veli, TC: 10000000146');
// → 'Ali Veli, TC: [TC_KIMLIK]'

// KVKK uyum raporu
const rapor = detector.complianceReport('TC: 10000000146, IBAN: TR330006100519786457841326');
console.log(rapor.riskLevel);   // 'KRİTİK'
console.log(rapor.summary());
```

---

## LLM Proxy — kişisel veri AI'ya gitmesin

Yapay zeka API'larına gönderilen metinlerdeki kişisel verileri maskele, yanıt gelince geri yükle.

```typescript
import { PiiDetector } from 'kvkk-pii';

const detector = new PiiDetector();

const metin = 'Ahmet Yılmaz, 0532 123 45 67, siparişim nerede?';
const session = detector.createSession(metin);

const maskeli = session.mask();
// → '[TC_KIMLIK_x3k], [TELEFON_TR_b7f], siparişim nerede?'

const aiYanit = await openai.chat(maskeli); // AI maskeli metni görür

const temizYanit = session.restore(aiYanit);
// Orijinal veriler geri yüklendi
```

### Maskeleme formatını değiştirme

JSON, SQL veya XML içinde köşeli parantez sorun çıkarıyorsa:

```typescript
// JSON/SQL için güvenli — __TC_KIMLIK_a3f__
const session = detector.createSession(metin, { tokenFormat: '__{type}_{id}__' });

// XML için — PII_TC_KIMLIK_a3f
const session2 = detector.createSession(metin, { tokenFormat: 'PII_{type}_{id}' });
```

---

## Tespit Edilen Veri Türleri

| Tür | Açıklama | Doğrulama |
|-----|----------|-----------|
| `TC_KIMLIK` | TC kimlik numarası (11 hane) | Checksum |
| `VKN` | Vergi kimlik numarası (10 hane) | Checksum |
| `IBAN_TR` | TR IBAN numarası | Mod97 |
| `KREDI_KARTI` | Kredi/banka kartı | Luhn |
| `TELEFON_TR` | Türk telefon numarası (+90 5XX) | — |
| `EMAIL` | E-posta adresi | — |
| `IP_ADRESI` | IPv4 adresi | — |
| `PLAKA_TR` | Türk plaka numarası | — |
| `PASAPORT_TR` | Türk pasaport numarası | — |

---

## KVKK Uyum Raporu

```typescript
const rapor = detector.complianceReport(metin);

console.log(rapor.riskLevel);   // 'DÜŞÜK' | 'ORTA' | 'YÜKSEK' | 'KRİTİK'
console.log(rapor.hasMadde6);   // KVKK Madde 6 özel nitelikli veri var mı?
console.log(rapor.entityTypes); // ['TC_KIMLIK', 'TELEFON_TR']
console.log(rapor.summary());
// KVKK Uyum Raporu — genel risk: KRİTİK
//   [KRİTİK] TC_KIMLIK
//   [ORTA] TELEFON_TR
```

CI/CD pipeline'a entegre etmek için:

```typescript
// scripts/kvkk-check.ts
import { readFileSync } from 'fs';
import { glob } from 'glob';
import { PiiDetector } from 'kvkk-pii';

const detector = new PiiDetector();
let failed = false;

for (const path of glob.sync('tests/fixtures/**/*.txt')) {
  const text = readFileSync(path, 'utf-8');
  const rapor = detector.complianceReport(text);
  if (['YÜKSEK', 'KRİTİK'].includes(rapor.riskLevel)) {
    console.error(`[KVKK] ${path}: ${rapor.summary()}`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
```

---

## Özel recognizer

```typescript
import { BaseRecognizer, PiiDetector } from 'kvkk-pii';
import type { PiiEntity } from 'kvkk-pii';

class SicilNoRecognizer extends BaseRecognizer {
  readonly entityType = 'SICIL_NO';

  find(text: string): PiiEntity[] {
    const results: PiiEntity[] = [];
    const pattern = /\bSCL-\d{6}\b/g;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      results.push(this.entity(m[0], m.index, m.index + m[0].length));
    }
    return results;
  }
}

const detector = new PiiDetector({ recognizers: [new SicilNoRecognizer()] });
```

---

## ESM ve CJS desteği

```typescript
// ESM
import { PiiDetector } from 'kvkk-pii';

// CommonJS
const { PiiDetector } = require('kvkk-pii');
```

Tarayıcıda (Vite, webpack, esbuild) doğrudan çalışır — `dist/index.js` ESM bundle.

---

## Python ile ilişki

Bu paket, [kvkk-pii (PyPI)](https://pypi.org/project/kvkk-pii/) ile birebir aynı API'yi sunar:

| Python | JavaScript |
|--------|------------|
| `detector.analyze(text)` | `detector.analyze(text)` |
| `detector.anonymize(text)` | `detector.anonymize(text)` |
| `detector.create_session(text)` | `detector.createSession(text)` |
| `session.mask()` | `session.mask()` |
| `session.restore(text)` | `session.restore(text)` |
| `detector.compliance_report(text)` | `detector.complianceReport(text)` |

Test fixture'ları her iki pakette ortak tutulur — bir recognizer değişince her iki taraf birden kırmızıya döner.

---

## Lisans

MIT
