import { BaseRecognizer } from '../base.js';
import type { PiiEntity } from '../result.js';

export class IpRecognizer extends BaseRecognizer {
  readonly entityType = 'IP_ADRESI';

  find(text: string): PiiEntity[] {
    const pattern = /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g;
    const results: PiiEntity[] = [];
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      results.push(this.entity(m[0], m.index, m.index + m[0].length));
    }
    return results;
  }
}
