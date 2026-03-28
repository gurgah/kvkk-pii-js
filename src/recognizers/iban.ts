import { BaseRecognizer } from '../base.js';
import type { PiiEntity } from '../result.js';

function mod97(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.split('').map(c => {
    const code = c.charCodeAt(0);
    return code >= 65 ? String(code - 55) : c;
  }).join('');
  let remainder = 0;
  for (const chunk of numeric.match(/.{1,9}/g) ?? []) {
    remainder = Number(String(remainder) + chunk) % 97;
  }
  return remainder === 1;
}

export class IbanRecognizer extends BaseRecognizer {
  readonly entityType = 'IBAN_TR';

  find(text: string): PiiEntity[] {
    // Sadece TR IBAN'larını yakala — 26 karakter: TR + 2 check digit + 22 rakam
    const pattern = /\b(TR\d{24})\b/g;
    const results: PiiEntity[] = [];
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      if (mod97(m[1])) {
        results.push(this.entity(m[1], m.index, m.index + m[1].length));
      }
    }
    return results;
  }
}
