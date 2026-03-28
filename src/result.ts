export interface PiiEntity {
  entityType: string;
  text: string;
  start: number;
  end: number;
  score: number;
}

export class PiiResult {
  text: string;
  entities: PiiEntity[];

  constructor(text: string, entities: PiiEntity[] = []) {
    this.text = text;
    this.entities = entities;
  }

  has(entityType: string): boolean {
    return this.entities.some(e => e.entityType === entityType);
  }

  anonymize(placeholder?: string): string {
    let result = this.text;
    const sorted = [...this.entities].sort((a, b) => b.start - a.start);
    for (const entity of sorted) {
      const ph = placeholder ?? `[${entity.entityType}]`;
      result = result.slice(0, entity.start) + ph + result.slice(entity.end);
    }
    return result;
  }
}
