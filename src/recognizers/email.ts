import { BaseRecognizer } from '../base.js';
import type { PiiEntity } from '../result.js';

export class EmailRecognizer extends BaseRecognizer {
  readonly entityType = 'EMAIL';

  find(text: string): PiiEntity[] {
    const pattern = /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g;
    const results: PiiEntity[] = [];
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      results.push(this.entity(m[0], m.index, m.index + m[0].length));
    }
    return results;
  }
}
