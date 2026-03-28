import { BaseRecognizer } from '../base.js';
import type { PiiEntity } from '../result.js';

export class TelefonRecognizer extends BaseRecognizer {
  readonly entityType = 'TELEFON_TR';

  find(text: string): PiiEntity[] {
    const pattern = /(?:\+90|0090|0)\s?5\d{2}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g;
    const results: PiiEntity[] = [];
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      results.push(this.entity(m[0], m.index, m.index + m[0].length));
    }
    return results;
  }
}
