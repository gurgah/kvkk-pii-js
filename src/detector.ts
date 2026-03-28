import { RegexLayer } from './layers/regex_layer.js';
import { PiiResult } from './result.js';
import { PiiSession, DEFAULT_TOKEN_FORMAT } from './session.js';
import { ComplianceReport } from './compliance.js';
import type { BaseRecognizer } from './base.js';
import type { PiiEntity } from './result.js';

type LayerSpec = 'regex' | 'ner' | 'gliner';

export interface PiiDetectorOptions {
  layers?: LayerSpec[];
  recognizers?: BaseRecognizer[];
}

export class PiiDetector {
  private readonly regexLayer: RegexLayer;
  private readonly layers: LayerSpec[];

  constructor(options: PiiDetectorOptions = {}) {
    this.layers = options.layers ?? ['regex'];
    this.regexLayer = new RegexLayer(options.recognizers);

    if (this.layers.includes('ner') || this.layers.includes('gliner')) {
      // NER/GLiNER katmanları için @huggingface/transformers gerekli
      // ESM ortamında dynamic import ile kontrol ediyoruz
      // Şimdilik sadece uyarı — ileride tam entegrasyon eklenecek
      console.warn(
        'NER/GLiNER katmanları henüz uygulanmadı. ' +
        'Şu an sadece regex katmanı aktif.'
      );
    }
  }

  analyze(text: string): PiiResult {
    const entities: PiiEntity[] = this.regexLayer.analyze(text);
    // NER ve GLiNER katmanları ileride burada eklenecek
    return new PiiResult(text, entities.sort((a, b) => a.start - b.start));
  }

  anonymize(text: string, placeholder?: string): string {
    return this.analyze(text).anonymize(placeholder);
  }

  complianceReport(text: string): ComplianceReport {
    return new ComplianceReport(this.analyze(text));
  }

  createSession(text: string, options: { tokenFormat?: string } = {}): PiiSession {
    const result = this.analyze(text);
    return new PiiSession(result, options.tokenFormat ?? DEFAULT_TOKEN_FORMAT);
  }
}
