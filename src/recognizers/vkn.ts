import { BaseRecognizer } from '../base.js';
import type { PiiEntity } from '../result.js';

function checkVkn(digits: string): boolean {
  if (digits.length !== 10) return false;
  const d = digits.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const tmp = (d[i] + (9 - i)) % 10;
    const val = tmp === 0 ? 9 : (tmp * Math.pow(2, 9 - i)) % 9 || 9;
    sum += val;
  }
  return d[9] === sum % 10;
}

export class VknRecognizer extends BaseRecognizer {
  readonly entityType = 'VKN';

  find(text: string): PiiEntity[] {
    const pattern = /\b(\d{10})\b/g;
    const results: PiiEntity[] = [];
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      if (checkVkn(m[1])) {
        results.push(this.entity(m[1], m.index, m.index + m[1].length));
      }
    }
    return results;
  }
}
