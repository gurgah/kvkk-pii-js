# kvkk-pii

[![npm](https://img.shields.io/npm/v/kvkk-pii)](https://www.npmjs.com/package/kvkk-pii)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![typescript](https://img.shields.io/badge/TypeScript-5%2B-blue)]()

**JavaScript/TypeScript için KVKK uyumlu Türkçe kişisel veri tespiti, maskeleme ve uyum kontrolü — tek paket.**

```bash
npm install kvkk-pii
```

---

Şirketinizde yapay zeka kullanılıyor. Destek ekibi müşteri mesajlarını ChatGPT'ye yapıştırıyor. Backend servisi API'ye tam metni gönderiyor. React uygulaması form verilerini doğrudan iletişim katmanına aktarıyor.

Bu metinlerin içinde ne var?

**TC kimlik numarası. IBAN. Telefon numarası. Kişi adları.**

Bunların tamamı — yani PII (Personally Identifiable Information / kişisel tanımlanabilir bilgi) — o anda OpenAI, Google veya başka bir şirketin sunucusuna gidiyor. Çoğu zaman kimse farkında bile değil.

Bu bir KVKK ihlali. Ve son kullanıcı değil, veriyi işleyen şirket sorumlu.

---

### İki yönlü koruma — veri hiç dışarı çıkmaz

`kvkk-pii` yapay zeka entegrasyonlarında **iki yönlü çalışır:**

```
  Kullanıcı metni
        │
        ▼
┌───────────────────┐
│     kvkk-pii      │
│  ① Veri tespiti   │  TC, IBAN, telefon...
│  ② Maskeleme      │  → [TC_KIMLIK_a3f], [TELEFON_TR_x7k]
└────────┬──────────┘
         │  maskeli metin (kişisel veri yok)
         ▼
  ┌─────────────┐
  │  ChatGPT /  │
  │  Claude /   │
  │   LLM API   │
  └──────┬──────┘
         │  AI yanıtı (token'larla)
         ▼
┌───────────────────┐
│     kvkk-pii      │
│  ③ Sızıntı        │  gerçek veri sızdı mı?
│     kontrolü      │
│  ④ Geri yükleme   │  [TC_KIMLIK_a3f] → 10000000146
└────────┬──────────┘
         │
         ▼
  Kullanıcıya yanıt
  (orijinal verilerle)
```

Yapay zeka modeli hiçbir zaman gerçek kişisel veriyi görmez.

```typescript
import { PiiDetector } from 'kvkk-pii';

const detector = new PiiDetector();
const session = detector.createSession('Ahmet Yılmaz (TC: 10000000146) iade talebini ilet.');

const masked = session.mask();
// → '[KISI_ADI_x3k] (TC: [TC_KIMLIK_a3f]) iade talebini ilet.'

const aiYanit = await openai.chat(masked); // AI maskeli metni görür

const output = session.restore(aiYanit);   // orijinal veriler geri yüklendi
```

---

### KVKK uyum (compliance) raporu

Sadece maskeleme değil — işlenen verinin **hangi KVKK maddesini ilgilendirdiğini**, risk seviyesini ve yasal öneriyi de raporlar.

```typescript
const rapor = detector.complianceReport(metin);
console.log(rapor.summary());
// KVKK Uyum Raporu — genel risk: KRİTİK
//   [KRİTİK] TC_KIMLIK
//   [ORTA] TELEFON_TR
```

---

`npm install kvkk-pii`

---

## Katmanlar — ne seçmeli?

**Varsayılan: sadece regex — sıfır bağımlılık.**

| Katman | Seçim | Boyut | Ne tespit eder | Ne zaman gerekli |
|--------|-------|-------|----------------|-----------------|
| **Regex** | varsayılan | 0 MB | TC, IBAN, VKN, telefon, e-posta, plaka... | Her zaman — yapılandırılmış veri |
| **NER** | `"ner"` | ~450 MB | Kişi adı, kurum, konum | E-posta, chat, müşteri mesajı — serbest metin |
| **GLiNER** | `"gliner"` | ~180 MB | Sağlık, din, siyasi görüş, sendika, biyometri | KVKK Madde 6 uyumu |

```typescript
new PiiDetector()                                          // sadece regex (varsayılan)
new PiiDetector({ layers: ['regex', 'ner'] })             // + isim/kurum/konum
new PiiDetector({ layers: ['regex', 'gliner'] })          // + Madde 6, NER olmadan
new PiiDetector({ layers: ['regex', 'ner', 'gliner'] })   // tam sistem
```

NER ve GLiNER katmanları Node.js ortamında `@huggingface/transformers` ile çalışır — model ilk kullanımda otomatik indirilir, cache'lenir.

**Conflict olur mu? Hayır.** Her katman, önceki katmanların bulduğu span'leri atlar — aynı metin parçası hiçbir zaman iki kez işaretlenmez.

---

## Hangi kurulum bana göre?

| Durum | Kurulum | Kod |
|-------|---------|-----|
| Form/veritabanı tarama, log temizleme | `npm install kvkk-pii` | `new PiiDetector()` |
| E-posta, chat, müşteri mesajı | + `@huggingface/transformers` | `new PiiDetector({ layers: ['regex', 'ner'] })` |
| Sağlık, HR, hukuk belgesi (Madde 6) | + `@huggingface/transformers` | `new PiiDetector({ layers: ['regex', 'ner', 'gliner'] })` |
| Sadece tarayıcı / React | `npm install kvkk-pii` | `new PiiDetector()` (regex yeterli) |
| Node.js API servisi | + `@huggingface/transformers` | tüm katmanlar |

---

## Kurulum

```bash
npm install kvkk-pii                            # sadece regex (bağımlılık yok)
npm install kvkk-pii @huggingface/transformers  # + NER + GLiNER (Node.js)
```

---

## Gerçek Senaryolar

### Senaryo 1 — Destek ekibi müşteri mesajını AI ile yanıtlıyor

**Problem:** Müşteri hizmetleri ekibi gelen mesajları ChatGPT'ye yapıştırarak yanıt taslağı oluşturuyor. Mesajların içinde isim, telefon, TC kimlik numarası var. Bunların tamamı OpenAI sunucularına gidiyor — şirket habersiz.

**Çözüm:** Mesaj AI'ya gitmeden önce kişisel veriler maskelenir, AI maskeli metinle çalışır, yanıt kullanıcıya geri verilmeden orijinal veriler restore edilir.

```typescript
import { PiiDetector } from 'kvkk-pii';

const detector = new PiiDetector({ layers: ['regex', 'ner'] });

const mesaj = 'Ahmet Yılmaz, 0532 123 45 67, siparişim nerede?';
const session = detector.createSession(mesaj);
const maskeli = session.mask();
// → '[KISI_ADI_x3k], [TELEFON_TR_b7f], siparişim nerede?'

const aiYaniti = await openaiCagri(maskeli);
// AI yanıtlar: 'Merhaba [KISI_ADI_x3k], [TELEFON_TR_b7f] numaranıza
//               SMS gönderdik, siparişiniz kargoya verildi.'

const temizYanit = session.restore(aiYaniti);
// → 'Merhaba Ahmet Yılmaz, 0532 123 45 67 numaranıza
//    SMS gönderdik, siparişiniz kargoya verildi.'
```

---

### Senaryo 2 — Finansal e-posta özetleme

**Problem:** Muhasebe ve hukuk ekipleri IBAN, kişi adı ve tutar içeren e-postaları AI ile özetletiyor. Bu e-postalar şirket içi gizli finansal veri içeriyor — üçüncü taraf bir AI'a gönderilmesi hem KVKK hem ticari sır ihlali.

**Çözüm:** E-posta AI'ya gitmeden önce otomatik maskelenir. Özet gelince hassas veriler geri yüklenir.

```typescript
const eposta = `
Sayın Fatma Kaya,
TR330006100519786457841326 no'lu hesabınıza
42.500 TL ödeme yapılacaktır. İmzalı teyit bekliyoruz.
`;

const session = detector.createSession(eposta);
const maskeli = session.mask();
// → 'Sayın [KISI_ADI_k2m],\n[IBAN_TR_p9r] no'lu hesabınıza...'

const ozet = await aiOzet(maskeli);
const temizOzet = session.restore(ozet);
// → 'Fatma Kaya'nın hesabına 42.500 TL ödeme yapılacak, teyit bekleniyor.'
//   (IBAN ve isim AI'ya hiç gitmedi, özette geri yüklendi)
```

---

### Senaryo 3 — Log anonimleştirme

**Problem:** Uygulama logları hata ayıklama için değerli ama içinde kullanıcı telefonu, e-postası, IP adresi var. Bu loglar Datadog, Elastic veya S3'e gönderiliyor — yani kişisel veri üçüncü taraflara akıyor. KVKK bu durumu açıkça ihlal sayar.

**Çözüm:** Logger'a tek satır filtre eklenir. Tüm loglar servise gitmeden önce otomatik temizlenir.

```typescript
import { PiiDetector } from 'kvkk-pii';

const detector = new PiiDetector();

// Winston / Pino / custom logger ile
const kvkkFormat = (message: string) => detector.anonymize(message);

logger.info(kvkkFormat('Kullanıcı 0532 123 45 67 ile giriş yaptı'));
// → 'Kullanıcı [TELEFON_TR] ile giriş yaptı'

logger.warn(kvkkFormat('Hata: ali@example.com, IP: 192.168.1.1'));
// → 'Hata: [EMAIL], IP: [IP_ADRESI]'
```

---

### Senaryo 4 — React formunda gerçek zamanlı tarama

**Problem:** Kullanıcı destek formu dolduruyor. Gönderilmeden önce TC kimlik veya IBAN gibi hassas veri girip girmediği bilinmiyor. Bu veriler backend'e ve oradan AI servisine ulaşıyor.

**Çözüm:** Form submit öncesi `kvkk-pii` ile tara. Hassas veri varsa kullanıcıyı uyar veya otomatik maskele.

```typescript
// React — form gönderilmeden önce tarama
import { PiiDetector } from 'kvkk-pii';

const detector = new PiiDetector(); // tarayıcıda sıfır bağımlılık, anında yükle

function DestekFormu() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const metin = mesajRef.current.value;
    const result = detector.analyze(metin);

    if (result.entities.length > 0) {
      const tipler = result.entities.map(e => e.entityType).join(', ');
      alert(`Dikkat: Mesajınızda kişisel veri tespit edildi (${tipler}). Göndermeden önce kontrol edin.`);
      return;
    }

    gondermestek(metin);
  };

  // ...
}
```

---

### Senaryo 5 — Express/Fastify API middleware

**Problem:** Büyük bir ekipte her servisin ayrı ayrı PII kontrolü yapması zor. Merkezi bir middleware olsa tüm istekler oradan geçebilir.

**Çözüm:** API katmanına tek middleware ekle. Tüm request body'leri otomatik taranır veya maskelenir.

```typescript
import express from 'express';
import { PiiDetector } from 'kvkk-pii';

const app = express();
const detector = new PiiDetector({ layers: ['regex', 'ner'] });

// PII içeren body'leri loglamadan önce maskele
app.use((req, _res, next) => {
  if (req.body?.message) {
    req.body.safeMessage = detector.anonymize(req.body.message);
  }
  next();
});

// Ya da tarama servisi olarak sun
app.post('/api/tarama', (req, res) => {
  const { metin } = req.body;
  const result = detector.analyze(metin);
  const rapor = detector.complianceReport(metin);

  res.json({
    piiVar: result.entities.length > 0,
    tipler: result.entities.map(e => e.entityType),
    riskLevel: rapor.riskLevel,
    anonim: result.anonymize(),
  });
});
```

---

### Senaryo 6 — CI/CD pipeline'ında KVKK uyum kontrolü

**Problem:** Staging veya üretim ortamına deploy edilecek kod, kullanıcı verisi içeren test fixture'ları veya seed dosyaları barındırabilir. Bunlar fark edilmeden repoya giriyor.

**Çözüm:** KVKK uyum kontrolünü CI adımına ekle. `riskLevel === 'KRİTİK'` içeren bir dosya commit'e girerse pipeline otomatik olarak durur.

```typescript
// scripts/kvkk-check.ts — CI adımı olarak çalıştırılır
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

GitHub Actions entegrasyonu:

```yaml
# .github/workflows/kvkk.yml
name: KVKK Uyum Kontrolü

on: [push, pull_request]

jobs:
  kvkk-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx tsx scripts/kvkk-check.ts
```

Gerçek TC kimlik veya IBAN içeren bir dosya commit'e girerse pipeline derleme aşamasında durur — production'a ulaşmadan önce.

---

## Tespit Edilen Veri Türleri

### Katman 1 — Regex + Checksum (sıfır bağımlılık)

| Tür | Açıklama | Doğrulama |
|-----|----------|-----------|
| `TC_KIMLIK` | TC kimlik numarası (11 hane) | Checksum |
| `VKN` | Vergi kimlik numarası (10 hane) | Checksum |
| `IBAN_TR` | TR IBAN numarası | Mod97 |
| `KREDI_KARTI` | Kredi/banka kartı numarası | Luhn |
| `TELEFON_TR` | Türk telefon numaraları | — |
| `EMAIL` | E-posta adresi | — |
| `IP_ADRESI` | IPv4 adresi | — |
| `PLAKA_TR` | Türk plaka numarası | — |
| `PASAPORT_TR` | Türk pasaport numarası | — |

### Katman 2 — NER (`@huggingface/transformers` gerekli, Node.js)

Model: `akdeniz27/xlm-roberta-base-turkish-ner` — %94.92 F1

| Tür | Açıklama |
|-----|----------|
| `KISI_ADI` | Kişi adı |
| `KONUM` | Şehir, ilçe, ülke |
| `KURUM` | Şirket, kurum adı |

### Katman 3 — KVKK Madde 6 (`@huggingface/transformers` gerekli, Node.js)

Model: `urchade/gliner_multi-v2.1` — sıfır atışlı, 100+ dil

| Tür | Açıklama |
|-----|----------|
| `SAGLIK_VERISI` | Sağlık ve tıbbi veri |
| `DINI_INANC` | Din, mezhep bilgisi |
| `SIYASI_GORUS` | Siyasi görüş |
| `SENDIKA_UYELIGII` | Sendika üyeliği |
| `BIYOMETRIK_VERI` | Biyometrik / genetik veri |

---

## Diğer Özellikler

### Maskeleme token formatını değiştirme

Varsayılan format `[TC_KIMLIK_a3f]` şeklindedir. JSON, SQL veya XML içinde köşeli parantez sorun çıkarıyorsa:

```typescript
const metin = 'Ali Veli, TC: 10000000146, tel: 0532 123 45 67';

// JSON/SQL için güvenli — __TC_KIMLIK_a3f__
const session = detector.createSession(metin, { tokenFormat: '__{type}_{id}__' });

// XML için — PII_TC_KIMLIK_a3f
const session2 = detector.createSession(metin, { tokenFormat: 'PII_{type}_{id}' });

// Özel format — <<TC_KIMLIK_a3f>>
const session3 = detector.createSession(metin, { tokenFormat: '<<{type}_{id}>>' });

const masked = session.mask();
// → '__KISI_ADI_x7k__, TC: __TC_KIMLIK_a3f__, tel: __TELEFON_TR_b2c__'
```

`{type}` entity tipini, `{id}` 3 karakterli benzersiz kimliği temsil eder. Restore her zaman çalışır — format ne olursa olsun.

---

### Recognizer'ları devre dışı bırakma

```typescript
// EMAIL ve IP tespitini kapat
const detector = new PiiDetector({ disable: ['EMAIL', 'IP_ADRESI'] });
const result = detector.analyze('ali@ornek.com, 192.168.1.1, TC: 10000000146');
// Sadece TC_KIMLIK bulunur
```

### Özel recognizer — before / after

Varsayılan recognizer listesini koruyarak önüne (`before`) veya arkasına (`after`) özel recognizer ekle:

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

// Varsayılan recognizer'ların önünde çalışır
const d1 = new PiiDetector({ before: [new SicilNoRecognizer()] });

// Varsayılan recognizer'ların arkasında çalışır
const d2 = new PiiDetector({ after: [new SicilNoRecognizer()] });

// disable + after birlikte
const d3 = new PiiDetector({ disable: ['EMAIL'], after: [new SicilNoRecognizer()] });
```

> `recognizers` parametresi varsayılan listeyi tamamen değiştirir.
> `before`/`after` ise varsayılan listeyi koruyarak etrafına ekler.

---

## Python versiyonu ile ilişki

Bu paket, [kvkk-pii (PyPI)](https://pypi.org/project/kvkk-pii/) ile birebir aynı API'yi sunar:

| Python | JavaScript |
|--------|------------|
| `detector.analyze(text)` | `detector.analyze(text)` |
| `detector.anonymize(text)` | `detector.anonymize(text)` |
| `detector.create_session(text)` | `detector.createSession(text)` |
| `session.mask()` | `session.mask()` |
| `session.restore(text)` | `session.restore(text)` |
| `detector.compliance_report(text)` | `detector.complianceReport(text)` |

Test fixture'ları (`tests/fixtures/*.json`) her iki pakette ortak tutulur — bir recognizer değişince her iki taraf birden kırmızıya döner.

---

## Gereksinimler

- Node.js 18+ veya modern tarayıcı
- Temel kurulum: sıfır bağımlılık
- NER/GLiNER: `@huggingface/transformers` (Node.js only)

---

## Lisans

MIT
