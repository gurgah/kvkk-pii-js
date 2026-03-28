import { BaseRecognizer } from '../base.js';
import type { PiiEntity } from '../result.js';

function luhn(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export class KrediKartiRecognizer extends BaseRecognizer {
  readonly entityType = 'KREDI_KARTI';

  find(text: string): PiiEntity[] {
    // 16 haneli kartlar (Visa, MC): 4+4+4+4 veya kesintisiz
    // 15 haneli kartlar (AmEx): 4+6+5 veya kesintisiz
    // Genel: ayraçlı veya kesintisiz 13-19 hane
    const patterns = [
      /\b(\d{4}[\s\-]\d{4}[\s\-]\d{4}[\s\-]\d{1,7})\b/g,   // 4-4-4-N ayraçlı
      /\b(\d{4}[\s\-]\d{6}[\s\-]\d{5})\b/g,                 // 4-6-5 ayraçlı (AmEx)
      /\b(\d{13,19})\b/g,                                     // kesintisiz
    ];
    const results: PiiEntity[] = [];
    for (const pattern of patterns) {
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(text)) !== null) {
        const digits = m[1].replace(/[\s\-]/g, '');
        if (digits.length >= 13 && digits.length <= 19 && luhn(digits)) {
          // Zaten bulunan bir aralıkla çakışma kontrolü
          const start = m.index;
          const end = m.index + m[1].length;
          const overlap = results.some(r => start < r.end && end > r.start);
          if (!overlap) {
            results.push(this.entity(m[1], start, end));
          }
        }
      }
    }
    return results;
  }
}
