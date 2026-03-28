import type { PiiEntity } from './result.js';

export abstract class BaseRecognizer {
  abstract readonly entityType: string;

  abstract find(text: string): PiiEntity[];

  protected entity(
    text: string,
    start: number,
    end: number,
    score = 1.0
  ): PiiEntity {
    return { entityType: this.entityType, text, start, end, score };
  }
}
