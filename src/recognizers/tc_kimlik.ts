import { BaseRecognizer } from '../base.js';
import type { PiiEntity } from '../result.js';

function luhnTC(digits: string): boolean {
  if (digits.length !== 11) return false;
  if (digits[0] === '0') return false;
  const d = digits.split('').map(Number);
  const d10 = (7 * (d[0]+d[2]+d[4]+d[6]+d[8]) - (d[1]+d[3]+d[5]+d[7])) % 10;
  if (d10 < 0 ? d10 + 10 : d10 !== d[9]) return false;
  const d11 = (d[0]+d[1]+d[2]+d[3]+d[4]+d[5]+d[6]+d[7]+d[8]+d[9]) % 10;
  return d11 === d[10];
}

export class TcKimlikRecognizer extends BaseRecognizer {
  readonly entityType = 'TC_KIMLIK';

  find(text: string): PiiEntity[] {
    // kompakt, boşluklu veya tireli format
    const pattern = /\b([0-9][0-9 -]{9,13}[0-9])\b/g;
    const results: PiiEntity[] = [];
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      const raw = m[1];
      const digits = raw.replace(/[ -]/g, '');
      if (digits.length === 11 && luhnTC(digits)) {
        results.push(this.entity(raw, m.index, m.index + raw.length));
      }
    }
    return results;
  }
}
