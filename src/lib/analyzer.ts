export type AnalysisClassification = 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS' | 'CRITICAL';

export interface AnalysisResult {
  riskScore: number;
  classification: AnalysisClassification;
  indicators: string[];
  category: string;
  confidence: number; // 0-100
  processingTime: number; // seconds
}

export function analyzeText(message: string): AnalysisResult {
  const start = performance.now();
  const indicators: string[] = [];
  const messageWords = message.toLowerCase();
  let riskScore = 0;
  let classification: AnalysisClassification = 'SAFE';
  let category = 'Unknown';

  if (messageWords.includes('urgent') || messageWords.includes('act now')) {
    indicators.push('Urgency manipulation detected');
    riskScore += 25;
  }
  if (messageWords.includes('winner') || messageWords.includes('congratulations')) {
    indicators.push('Prize/lottery scam pattern');
    riskScore += 30;
    category = 'Prize Scam';
  }
  if (messageWords.includes('bitcoin') || messageWords.includes('crypto') || messageWords.includes('investment')) {
    indicators.push('Crypto investment language');
    riskScore += 35;
    category = 'Crypto Scam';
  }
  if (messageWords.includes('prince') || messageWords.includes('inheritance')) {
    indicators.push('Advance fee fraud pattern');
    riskScore += 40;
    category = 'Advance Fee Fraud';
  }
  if (messageWords.includes('verify') || messageWords.includes('suspended')) {
    indicators.push('Account verification phishing');
    riskScore += 30;
    category = 'Phishing';
  }
  if (messageWords.includes('click here') || messageWords.includes('download')) {
    indicators.push('Suspicious link/download request');
    riskScore += 20;
  }
  if (/\b\d{16}\b/.test(message)) {
    indicators.push('Credit card number detected');
    riskScore += 50;
  }

  if (riskScore >= 70) classification = 'CRITICAL';
  else if (riskScore >= 50) classification = 'DANGEROUS';
  else if (riskScore >= 25) classification = 'SUSPICIOUS';
  else classification = 'SAFE';

  if (indicators.length === 0) {
    indicators.push('No suspicious patterns detected');
    category = 'Legitimate';
  }

  const processingTime = (performance.now() - start) / 1000;

  return {
    riskScore,
    classification,
    indicators,
    category,
    confidence: Math.min(95, 60 + indicators.length * 8),
    processingTime: Math.max(0.3, Math.min(3, processingTime)),
  };
}
