import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Globe, Link as LinkIcon, Zap, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { analyzeText, type AnalysisResult } from '../lib/analyzer';
import { toast } from 'sonner';

export function WebsiteAnalyzer() {
  const [url, setUrl] = useState('');
  const [html, setHtml] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'CRITICAL': return 'neon-magenta';
      case 'DANGEROUS': return 'text-red-400';
      case 'SUSPICIOUS': return 'text-yellow-400';
      case 'SAFE': return 'neon-green';
      default: return 'text-gray-400';
    }
  };

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'CRITICAL': return <XCircle className="w-5 h-5" />;
      case 'DANGEROUS': return <AlertTriangle className="w-5 h-5" />;
      case 'SUSPICIOUS': return <AlertTriangle className="w-5 h-5" />;
      case 'SAFE': return <CheckCircle className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  const fetchAndAnalyze = async () => {
    setError(null);
    setResult(null);
    setIsAnalyzing(true);
    setScanProgress(0);

    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) { clearInterval(progressInterval); return 100; }
        return prev + Math.random() * 12;
      });
    }, 180);

    try {
      let textToAnalyze = html.trim();
      if (!textToAnalyze) {
        if (!url.trim()) {
          setError('Enter a URL or paste HTML to analyze.');
          return;
        }
        // Fetch page as text (CORS may block some sites in dev; for demo use CORS-friendly pages)
        const resp = await fetch(url, { mode: 'cors' });
        const contentType = resp.headers.get('content-type') || '';
        if (!resp.ok || !contentType.includes('text')) {
          throw new Error('Failed to fetch page or unsupported content type');
        }
        const htmlText = await resp.text();
        // Extract visible text roughly
        const tmp = document.createElement('div');
        tmp.innerHTML = htmlText;
        textToAnalyze = tmp.innerText.slice(0, 50000);
      }

      const res = analyzeText(textToAnalyze);
      setResult(res);
      // Toast risk band
      const band = res.riskScore >= 55 ? 'HIGH' : res.riskScore >= 30 ? 'MODERATE' : 'LOW';
      const title = `Website Risk: ${band}`;
      const desc = `${res.classification} • ${res.riskScore}/100 • ${res.category}`;
      if (res.riskScore >= 55) toast.error(title, { description: desc });
      else if (res.riskScore >= 30) toast.warning(title, { description: desc });
      else toast.success(title, { description: desc });

      // Visual alert banner
      try {
        const level = res.riskScore >= 55 ? 'danger' : res.riskScore >= 30 ? 'warning' : 'info';
        window.dispatchEvent(new CustomEvent('nv:alert', { detail: { level, title, message: desc, durationMs: 7000 } }));
      } catch {}

      // Also log the alert event
      try {
        const today = new Date();
        const key = `nv_app_stats_${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        const raw = localStorage.getItem(key);
        const stats = raw ? JSON.parse(raw) : { sitesAnalyzed: 0, scamsDetected: 0, warningsIssued: 0, logs: [] as any[] };
        const level = res.riskScore >= 55 ? 'danger' : res.riskScore >= 30 ? 'warning' : 'info';
        stats.logs.unshift({ ts: Date.now(), type: 'alert', level, source: 'website', title, message: desc });
        stats.logs = stats.logs.slice(0, 100);
        localStorage.setItem(key, JSON.stringify(stats));
      } catch {}

      // Update Today's Stats and Logs (App)
      try {
        const today = new Date();
        const key = `nv_app_stats_${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        const raw = localStorage.getItem(key);
        const stats = raw ? JSON.parse(raw) : { sitesAnalyzed: 0, scamsDetected: 0, warningsIssued: 0, logs: [] as any[] };
        stats.sitesAnalyzed += 1;
        if (res.classification === 'SUSPICIOUS' || res.classification === 'DANGEROUS' || res.classification === 'CRITICAL') stats.scamsDetected += 1;
        if (res.classification === 'DANGEROUS' || res.classification === 'CRITICAL') stats.warningsIssued += 1;
        // Try to link to an existing suspect automatically for dangerous/critical pages
        let suspectId: string | undefined;
        try {
          if (res.classification === 'DANGEROUS' || res.classification === 'CRITICAL') {
            const host = (() => { try { return new URL(url).hostname.replace(/^www\./,''); } catch { return ''; } })();
            const suspectsRaw = localStorage.getItem('nv_suspects');
            if (host && suspectsRaw) {
              const list = JSON.parse(suspectsRaw) as any[];
              const found = list.find(s => String(s.alias).toLowerCase() === host.toLowerCase());
              if (found) suspectId = found.id;
            }
          }
        } catch {}

        stats.logs.unshift({
          ts: Date.now(),
          type: 'website',
          classification: res.classification,
          riskScore: res.riskScore,
          category: res.category,
          preview: url ? String(url).slice(0, 140) : 'HTML Paste',
          suspectId
        });
        stats.logs = stats.logs.slice(0, 100);
        localStorage.setItem(key, JSON.stringify(stats));
      } catch {}
    } catch (e: any) {
      setError(e?.message || 'Failed to analyze website');
    } finally {
      clearInterval(progressInterval);
      setScanProgress(100);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 p-6 min-h-screen data-grid">
      <div className="mb-8">
        <h1 className="glitch neon-blue mb-2" data-text="WEBSITE ANALYZER">
          WEBSITE ANALYZER
        </h1>
        <p className="text-gray-400">Analyze a website by URL or pasted HTML to estimate scam risk.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm relative scan-lines">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <LinkIcon className="w-6 h-6 neon-blue neon-glow" />
              <h2 className="neon-blue">INPUT</h2>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="https://example.com" value={url} onChange={e => setUrl(e.target.value)} />
                <Button onClick={fetchAndAnalyze} disabled={isAnalyzing} className="angular-border-sm bg-gradient-to-r from-cyan-600 to-blue-600 border-0 neon-glow">
                  {isAnalyzing ? (<span className="flex items-center gap-2"><Zap className="w-4 h-4 animate-pulse"/>SCANNING</span>) : 'SCAN URL'}
                </Button>
              </div>
              <div className="text-xs text-gray-500">Or paste HTML below and click Analyze HTML.</div>
              <Textarea placeholder="Paste HTML here..." value={html} onChange={e => setHtml(e.target.value)} className="min-h-[160px] bg-black/60 border-cyan-500/30 text-gray-100 placeholder-gray-500 focus:border-cyan-500/60" />
              <Button onClick={fetchAndAnalyze} disabled={isAnalyzing} variant="outline" className="angular-border-sm border-cyan-500/40 text-cyan-300">
                Analyze HTML
              </Button>

              {isAnalyzing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Processing</span>
                    <span className="neon-blue">{Math.round(scanProgress)}%</span>
                  </div>
                  <Progress value={scanProgress} className="h-2" />
                </div>
              )}

              {error && (<div className="text-sm text-red-400">{error}</div>)}
            </div>
          </div>
        </Card>

        {/* Results */}
        <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm relative scan-lines">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 neon-green neon-glow" />
              <h2 className="neon-green">RESULTS</h2>
            </div>

            {!result && !isAnalyzing && (
              <div className="text-center text-gray-400 py-12">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Enter a URL or paste HTML and start scan</p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                <div className="angular-border-sm bg-black/60 p-4 border border-cyan-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-300">THREAT CLASSIFICATION</span>
                    <div className={`flex items-center gap-2 ${getClassificationColor(result.classification)}`}>
                      {getClassificationIcon(result.classification)}
                      <span className="font-mono">{result.classification}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Risk Score</span>
                      <span className={getClassificationColor(result.classification)}>{result.riskScore}/100</span>
                    </div>
                    <Progress value={result.riskScore} className="h-2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="angular-border-sm bg-black/60 p-4 border border-cyan-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 neon-green" />
                      <span className="text-gray-300">CONFIDENCE</span>
                    </div>
                    <p className="neon-green font-mono">{result.confidence}%</p>
                  </div>

                  <div className="angular-border-sm bg-black/60 p-4 border border-cyan-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 neon-blue" />
                      <span className="text-gray-300">TIME</span>
                    </div>
                    <p className="neon-blue font-mono">{result.processingTime.toFixed(2)}s</p>
                  </div>
                </div>

                <div className="angular-border-sm bg-black/60 p-4 border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-300">INDICATORS</span>
                  </div>
                  <div className="space-y-2">
                    {result.indicators.map((indicator, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
                        <span className="text-gray-300">{indicator}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Export & Suspects */}
                <div className="flex justify-between gap-2 items-center">
                  <Button
                    variant="outline"
                    className="mt-3 angular-border-sm border-red-500/30 text-red-300"
                    onClick={() => {
                      if (!result) return;
                      try {
                        const clsMap: Record<string, 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'> = {
                          SAFE: 'LOW', SUSPICIOUS: 'MEDIUM', DANGEROUS: 'HIGH', CRITICAL: 'CRITICAL',
                        };
                        const aliasFromUrl = (() => {
                          try { return new URL(url).hostname.replace(/^www\./,''); } catch { return 'Unknown Site'; }
                        })();
                        const suspect = {
                          id: `SP-${Date.now().toString().slice(-4)}-${Math.floor(Math.random()*900+100)}`,
                          alias: aliasFromUrl,
                          realName: 'Unknown',
                          riskLevel: clsMap[result.classification],
                          location: aliasFromUrl,
                          lastActive: 'just now',
                          threatScore: result.riskScore,
                          operationalMethods: result.indicators.slice(0, 5),
                          targets: [result.category],
                          financialDamage: 0,
                          casesLinked: 1,
                          status: (result.classification === 'DANGEROUS' || result.classification === 'CRITICAL') ? 'ACTIVE' : 'MONITORED',
                          communicationMethods: ['Web'],
                          knownAssociates: [] as string[],
                        };
                        const raw = localStorage.getItem('nv_suspects');
                        const list = raw ? JSON.parse(raw) as any[] : [];
                        const idx = list.findIndex((s:any) => String(s.alias).toLowerCase() === String(aliasFromUrl).toLowerCase());
                        if (idx >= 0) {
                          const cur = list[idx];
                          cur.riskLevel = suspect.riskLevel;
                          cur.threatScore = Math.max(cur.threatScore || 0, suspect.threatScore);
                          cur.lastActive = suspect.lastActive;
                          cur.casesLinked = (cur.casesLinked || 0) + 1;
                          cur.targets = Array.from(new Set([...(cur.targets||[]), ...suspect.targets]));
                          cur.operationalMethods = Array.from(new Set([...(cur.operationalMethods||[]), ...suspect.operationalMethods]));
                          cur.communicationMethods = Array.from(new Set([...(cur.communicationMethods||[]), ...suspect.communicationMethods]));
                          list[idx] = cur;
                        } else {
                          list.unshift(suspect);
                        }
                        localStorage.setItem('nv_suspects', JSON.stringify(list.slice(0, 200)));
                        // Tag latest log with this suspect id
                        try {
                          const today = new Date();
                          const key = `nv_app_stats_${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
                          const rawStats = localStorage.getItem(key);
                          if (rawStats) {
                            const stats = JSON.parse(rawStats);
                            if (Array.isArray(stats.logs) && stats.logs.length > 0) {
                              stats.logs[0].suspectId = (idx >= 0 ? list[idx].id : suspect.id);
                              localStorage.setItem(key, JSON.stringify(stats));
                            }
                          }
                        } catch {}
                        toast.success('Added to Suspects', { description: aliasFromUrl });
                      } catch {
                        toast.error('Failed to add suspect');
                      }
                    }}
                  >
                    Add to Suspects
                  </Button>
                  <Button
                    variant="outline"
                    className="mt-3 angular-border-sm border-cyan-500/40 text-cyan-300"
                    onClick={() => {
                      if (!result) return;
                      const blob = new Blob([JSON.stringify({ type: 'website', result }, null, 2)], { type: 'application/json' });
                      const urlObj = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = urlObj;
                      a.download = 'neon-veil-website-report.json';
                      a.click();
                      URL.revokeObjectURL(urlObj);
                    }}
                  >
                    Export JSON
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
