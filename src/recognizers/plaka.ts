import { BaseRecognizer } from '../base.js';
import type { PiiEntity } from '../result.js';

export class PlakaRecognizer extends BaseRecognizer {
  readonly entityType = 'PLAKA_TR';

  find(text: string): PiiEntity[] {
    const pattern = /\b(0[1-9]|[1-7]\d|8[01])\s?([A-Z]{1,3})\s?(\d{2,4})\b/g;
    const results: PiiEntity[] = [];
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      results.push(this.entity(m[0], m.index, m.index + m[0].length));
    }
    return results;
  }
}
