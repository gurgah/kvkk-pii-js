/**
 * Senaryo: Bir belgeyi KVKK açısından tara, uyum raporu üret.
 *
 * Hukuk firmaları, muhasebe büroları veya sağlık kuruluşları
 * işledikleri belgelerde hangi KVKK maddelerini ihlal ettiklerini
 * bu araçla tespit edebilir.
 *
 * Kurulum:
 *     npm install kvkk-pii
 *
 * Çalıştırma:
 *     npx tsx examples/kvkk_raporu.ts
 */
import { PiiDetector } from 'kvkk-pii';

const detector = new PiiDetector();

const ORNEK_BELGE = `
HASTA KABUL FORMU

Ad Soyad    : Fatma Kaya
TC Kimlik   : 10000000146
Telefon     : 0532 123 45 67
E-posta     : fatma.kaya@example.com
Adres       : Bağcılar Cad. No:12, İstanbul

Tanı        : Tip 2 diyabet, hipertansiyon
Sendika     : Türk Sağlık-Sen üyesi

Doktor      : Dr. Mehmet Demir
Kurum       : Özel Sağlık Hastanesi
`;

function raporOlustur(metin: string, jsonCikti = false): void {
  const sonuc = detector.analyze(metin);
  const rapor = detector.complianceReport(metin);

  if (jsonCikti) {
    const cikti = {
      entity_listesi: sonuc.entities.map(e => ({
        tur: e.entityType,
        metin: e.text,
        konum: `${e.start}-${e.end}`,
        skor: Math.round(e.score * 1000) / 1000,
      })),
      uyum_raporu: {
        entity_types: rapor.entityTypes,
        has_madde6: rapor.hasMadde6,
        risk_level: rapor.riskLevel,
      },
    };
    console.log(JSON.stringify(cikti, null, 2));
    return;
  }

  console.log('='.repeat(60));
  console.log('KVKK UYUM TARAMA RAPORU');
  console.log('='.repeat(60));

  console.log(`\nTespit edilen veri sayısı : ${sonuc.entities.length}`);
  console.log(`Genel risk seviyesi       : ${rapor.riskLevel}`);
  console.log(`Madde 6 ihlali            : ${rapor.hasMadde6 ? 'EVET' : 'Hayır'}`);

  console.log('\n--- Tespit Edilen Veriler ---');
  for (const e of sonuc.entities) {
    console.log(`  [${e.entityType.padEnd(20)}] ${JSON.stringify(e.text).padEnd(30)}`);
  }

  console.log('\n--- KVKK Madde Analizi ---');
  console.log(rapor.summary());

  console.log('\n--- Anonimleştirilmiş Belge ---');
  console.log(sonuc.anonymize());
}

// CLI argümanları
const args = process.argv.slice(2);
const jsonFlag = args.includes('--json');
const dosyaIdx = args.indexOf('--dosya');

if (dosyaIdx !== -1 && args[dosyaIdx + 1]) {
  const fs = await import('node:fs');
  const metin = fs.readFileSync(args[dosyaIdx + 1], 'utf-8');
  raporOlustur(metin, jsonFlag);
} else {
  console.log('(Örnek belge kullanılıyor — kendi dosyanız için: --dosya belge.txt)\n');
  raporOlustur(ORNEK_BELGE, jsonFlag);
}
