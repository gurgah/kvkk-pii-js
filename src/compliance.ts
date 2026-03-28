import type { PiiResult } from './result.js';

type RiskLevel = 'DÜŞÜK' | 'ORTA' | 'YÜKSEK' | 'KRİTİK';

const MADDE6_TYPES = new Set([
  'SAGLIK_VERISI', 'DINI_INANC', 'SIYASI_GORUS', 'SENDIKA_UYELIGII', 'BIYOMETRIK_VERI'
]);

const RISK_MAP: Record<string, RiskLevel> = {
  TC_KIMLIK: 'KRİTİK',
  VKN: 'YÜKSEK',
  IBAN_TR: 'YÜKSEK',
  KREDI_KARTI: 'KRİTİK',
  SAGLIK_VERISI: 'KRİTİK',
  DINI_INANC: 'KRİTİK',
  SIYASI_GORUS: 'KRİTİK',
  SENDIKA_UYELIGII: 'KRİTİK',
  BIYOMETRIK_VERI: 'KRİTİK',
  KISI_ADI: 'ORTA',
  TELEFON_TR: 'ORTA',
  EMAIL: 'ORTA',
  IP_ADRESI: 'DÜŞÜK',
  PLAKA_TR: 'DÜŞÜK',
  PASAPORT_TR: 'YÜKSEK',
};

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
    const order: RiskLevel[] = ['DÜŞÜK', 'ORTA', 'YÜKSEK', 'KRİTİK'];
    let max: RiskLevel = 'DÜŞÜK';
    for (const t of this.entityTypes) {
      const r = RISK_MAP[t] ?? 'DÜŞÜK';
      if (order.indexOf(r) > order.indexOf(max)) max = r;
    }
    return max;
  }

  summary(): string {
    if (this.entityTypes.length === 0) return 'Kişisel veri tespit edilmedi.';
    const lines = [`KVKK Uyum Raporu — genel risk: ${this.riskLevel}`];
    if (this.hasMadde6) lines.push('KVKK Madde 6 (Özel Nitelikli Veri) tespit edildi!');
    for (const t of this.entityTypes) {
      lines.push(`  [${RISK_MAP[t] ?? 'DÜŞÜK'}] ${t}`);
    }
    return lines.join('\n');
  }
}
