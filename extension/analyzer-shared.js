// Shared analyzer used by popup and content script
// Exposes NV_analyzeText(message) on window/globalThis
(function(){
  function analyzeText(message){
    const start = performance.now();
    const indicators = [];
    const messageWords = String(message || '').toLowerCase();
    let riskScore = 0;
    let classification = 'SAFE';
    let category = 'Legitimate';

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
    if (messageWords.includes('verify') || messageWords.includes('suspended') || messageWords.includes('login')) {
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

    const processingTime = Math.max(0.3, Math.min(3, (performance.now() - start) / 1000));
    const confidence = Math.min(95, 60 + indicators.length * 8);
    return { riskScore, classification, indicators, category, confidence, processingTime };
  }

  // expose
  try { window.NV_analyzeText = analyzeText; } catch { globalThis.NV_analyzeText = analyzeText; }
})();
