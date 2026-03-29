import { TcKimlikRecognizer } from '../recognizers/tc_kimlik.js';
import { VknRecognizer } from '../recognizers/vkn.js';
import { IbanRecognizer } from '../recognizers/iban.js';
import { TelefonRecognizer } from '../recognizers/telefon.js';
import { PlakaRecognizer } from '../recognizers/plaka.js';
import { KrediKartiRecognizer } from '../recognizers/kredi_karti.js';
import { EmailRecognizer } from '../recognizers/email.js';
import { IpRecognizer } from '../recognizers/ip.js';
import { PasaportRecognizer } from '../recognizers/pasaport.js';
import type { BaseRecognizer } from '../base.js';
import type { PiiEntity } from '../result.js';

export const DEFAULT_RECOGNIZERS: BaseRecognizer[] = [
  new TcKimlikRecognizer(),
  new KrediKartiRecognizer(), // önce — TC ile çakışmayı engelle
  new VknRecognizer(),
  new IbanRecognizer(),
  new TelefonRecognizer(),
  new PlakaRecognizer(),
  new EmailRecognizer(),
  new IpRecognizer(),
  new PasaportRecognizer(),
];

function overlaps(entity: PiiEntity, found: PiiEntity[]): boolean {
  return found.some(e => entity.start < e.end && entity.end > e.start);
}

export class RegexLayer {
  private readonly recognizers: BaseRecognizer[];

  constructor(options: {
    recognizers?: BaseRecognizer[];
    disable?: string[];
    before?: BaseRecognizer[];
    after?: BaseRecognizer[];
  } = {}) {
    let base = options.recognizers ?? [...DEFAULT_RECOGNIZERS];
    if (options.disable?.length) {
      const disabled = new Set(options.disable);
      base = base.filter(r => !disabled.has(r.entityType));
    }
    this.recognizers = [
      ...(options.before ?? []),
      ...base,
      ...(options.after ?? []),
    ];
  }

  analyze(text: string, alreadyFound: PiiEntity[] = []): PiiEntity[] {
    const results: PiiEntity[] = [];
    for (const recognizer of this.recognizers) {
      for (const entity of recognizer.find(text)) {
        if (!overlaps(entity, [...alreadyFound, ...results])) {
          results.push(entity);
        }
      }
    }
    return results;
  }
}
