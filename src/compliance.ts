import type { PiiResult } from './result.js';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const MADDE6_TYPES = new Set([
  'SAGLIK_VERISI', 'DINI_INANC', 'SIYASI_GORUS', 'SENDIKA_UYELIGII', 'BIYOMETRIK_VERI'
]);

const RISK_MAP: Record<string, RiskLevel> = {
  TC_KIMLIK: 'CRITICAL',
  VKN: 'HIGH',
  IBAN_TR: 'HIGH',
  KREDI_KARTI: 'CRITICAL',
  SAGLIK_VERISI: 'CRITICAL',
  DINI_INANC: 'CRITICAL',
  SIYASI_GORUS: 'CRITICAL',
  SENDIKA_UYELIGII: 'CRITICAL',
  BIYOMETRIK_VERI: 'CRITICAL',
  KISI_ADI: 'MEDIUM',
  TELEFON_TR: 'MEDIUM',
  EMAIL: 'MEDIUM',
  IP_ADRESI: 'LOW',
  PLAKA_TR: 'LOW',
  PASAPORT_TR: 'HIGH',
};

const RISK_ORDER: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

export class ComplianceReport {
  readonly entityTypes: string[];
  readonly hasMadde6: boolean;
  readonly riskLevel: RiskLevel;

  constructor(result: PiiResult) {
    this.entityTypes = [...new Set(result.entities.map(e => e.entityType))];
    this.hasMadde6 = this.entityTypes.some(t => MADDE6_TYPES.has(t));
    this.riskLevel = this._calcRisk();
  }

  private _calcRisk(): RiskLevel {
    let max: RiskLevel = 'LOW';
    for (const t of this.entityTypes) {
      const r = RISK_MAP[t] ?? 'LOW';
      if (RISK_ORDER[r] > RISK_ORDER[max]) max = r;
    }
    return max;
  }

  summary(): string {
    if (this.entityTypes.length === 0) return 'No PII detected.';
    const lines = [`KVKK Compliance Report — overall risk: ${this.riskLevel}`];
    if (this.hasMadde6) lines.push('KVKK Article 6 (Special Category Data) detected!');
    for (const t of this.entityTypes) {
      lines.push(`  [${RISK_MAP[t] ?? 'LOW'}] ${t}`);
    }
    return lines.join('\n');
  }
}
