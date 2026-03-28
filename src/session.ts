import type { PiiEntity } from './result.js';
import type { PiiResult } from './result.js';

const DEFAULT_TOKEN_FORMAT = '[{type}_{id}]';

function shortId(): string {
  return Math.random().toString(36).slice(2, 5);
}

function makePlaceholder(format: string, entityType: string, id: string): string {
  return format.replace('{type}', entityType).replace('{id}', id);
}

export class PiiSession {
  private readonly result: PiiResult;
  private readonly tokenFormat: string;
  private readonly valueToPh: Map<string, string> = new Map();
  private readonly phToValue: Map<string, string> = new Map();

  constructor(result: PiiResult, tokenFormat = DEFAULT_TOKEN_FORMAT) {
    this.result = result;
    this.tokenFormat = tokenFormat;
  }

  private getOrCreate(entity: PiiEntity): string {
    const key = entity.text;
    if (this.valueToPh.has(key)) return this.valueToPh.get(key)!;

    let id = shortId();
    let ph = makePlaceholder(this.tokenFormat, entity.entityType, id);
    while (this.phToValue.has(ph)) {
      id = shortId();
      ph = makePlaceholder(this.tokenFormat, entity.entityType, id);
    }

    this.valueToPh.set(key, ph);
    this.phToValue.set(ph, key);
    return ph;
  }

  mask(text?: string): string {
    const source = text ?? this.result.text;
    if (text !== undefined && text !== this.result.text) {
      throw new Error('mask() orijinal metinle çağrılmalı. Farklı metin için yeni session oluştur.');
    }
    let result = source;
    const sorted = [...this.result.entities].sort((a, b) => b.start - a.start);
    for (const entity of sorted) {
      const ph = this.getOrCreate(entity);
      result = result.slice(0, entity.start) + ph + result.slice(entity.end);
    }
    return result;
  }

  restore(maskedText: string): string {
    let result = maskedText;
    const sorted = [...this.phToValue.entries()].sort((a, b) => b[0].length - a[0].length);
    for (const [ph, original] of sorted) {
      result = result.split(ph).join(original);
    }
    return result;
  }

  get mapping(): Record<string, string> {
    return Object.fromEntries(this.phToValue);
  }
}

export { DEFAULT_TOKEN_FORMAT };
