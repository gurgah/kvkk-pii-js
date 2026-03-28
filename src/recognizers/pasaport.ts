import { BaseRecognizer } from '../base.js';
import type { PiiEntity } from '../result.js';

export class PasaportRecognizer extends BaseRecognizer {
  readonly entityType = 'PASAPORT_TR';

  find(text: string): PiiEntity[] {
    const pattern = /\b[A-Z]\d{8}\b/g;
    const results: PiiEntity[] = [];
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      results.push(this.entity(m[0], m.index, m.index + m[0].length));
    }
    return results;
  }
}
