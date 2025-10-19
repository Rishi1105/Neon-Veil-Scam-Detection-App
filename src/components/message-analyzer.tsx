import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Scan, Brain, AlertTriangle, CheckCircle, XCircle, Zap, FileText, Globe, Clock } from 'lucide-react';
import { analyzeText, type AnalysisResult } from '../lib/analyzer';
import { toast } from 'sonner';

export function MessageAnalyzer() {
  const [message, setMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [recent, setRecent] = useState<AnalysisResult[]>([]);

  // Load recent analyses from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('nv_recent_analyses');
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  // Helper to persist recent analyses
  const saveRecent = (items: AnalysisResult[]) => {
    setRecent(items);
    try {
      localStorage.setItem('nv_recent_analyses', JSON.stringify(items.slice(0, 20)));
    } catch {}
  };

  const analyzeMessage = async () => {
    if (!message.trim()) return;

    setIsAnalyzing(true);
    setScanProgress(0);
    setResult(null);

    // Simulate AI analysis with progress
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    // Shared analysis logic
    setTimeout(() => {
      const res = analyzeText(message);
      setResult(res);

      // Prepend to recent and persist
      const updated = [res, ...recent].slice(0, 20);
      saveRecent(updated);

      // Update Today's Stats and Logs (App)
      try {
        const today = new Date();
        const key = `nv_app_stats_${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        const raw = localStorage.getItem(key);
        const stats = raw ? JSON.parse(raw) : { sitesAnalyzed: 0, scamsDetected: 0, warningsIssued: 0, logs: [] as any[] };
        stats.sitesAnalyzed += 1;
        if (res.classification === 'SUSPICIOUS' || res.classification === 'DANGEROUS' || res.classification === 'CRITICAL') stats.scamsDetected += 1;
        if (res.classification === 'DANGEROUS' || res.classification === 'CRITICAL') stats.warningsIssued += 1;
        // Try to link to an existing suspect automatically (for high risk)
        let suspectId: string | undefined;
        try {
          if (res.classification === 'DANGEROUS' || res.classification === 'CRITICAL') {
            const aliasFromMsg = (message.match(/[A-Za-z][A-Za-z0-9_-]{2,}/)?.[0]) || '';
            const suspectsRaw = localStorage.getItem('nv_suspects');
            if (aliasFromMsg && suspectsRaw) {
              const list = JSON.parse(suspectsRaw) as any[];
              const found = list.find(s => String(s.alias).toLowerCase() === aliasFromMsg.toLowerCase());
              if (found) suspectId = found.id;
            }
          }
        } catch {}

        stats.logs.unshift({
          ts: Date.now(),
          type: 'message',
          classification: res.classification,
          riskScore: res.riskScore,
          category: res.category,
          preview: message.slice(0, 140),
          suspectId: suspectId
        });
        stats.logs = stats.logs.slice(0, 100);
        localStorage.setItem(key, JSON.stringify(stats));
      } catch {}

      // Toast result band
      const band = res.riskScore >= 55 ? 'HIGH' : res.riskScore >= 30 ? 'MODERATE' : 'LOW';
      const title = `Message Risk: ${band}`;
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
        stats.logs.unshift({ ts: Date.now(), type: 'alert', level, source: 'message', title, message: desc });
        stats.logs = stats.logs.slice(0, 100);
        localStorage.setItem(key, JSON.stringify(stats));
      } catch {}

      clearInterval(progressInterval);
      setScanProgress(100);
      setIsAnalyzing(false);
    }, 1200);
  };

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
      default: return <Scan className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 p-6 min-h-screen data-grid">
      {/* Header */}
      <div className="mb-8">
        <h1 className="glitch neon-blue mb-2" data-text="MESSAGE ANALYZER">
          MESSAGE ANALYZER
        </h1>
        <p className="text-gray-400">Neural Pattern Recognition // Threat Assessment Matrix</p>
        <div className="flex items-center gap-2 mt-2">
          <Brain className="w-4 h-4 neon-blue pulse-neon" />
          <span className="neon-blue">AI NEURAL NETWORK ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm relative scan-lines">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 neon-blue neon-glow" />
              <h2 className="neon-blue">MESSAGE INPUT</h2>
            </div>
            
            <div className="space-y-4">
              <Textarea
                placeholder="Paste suspicious message content here for analysis..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[200px] bg-black/60 border-cyan-500/30 text-gray-100 placeholder-gray-500 focus:border-cyan-500/60"
              />
              
              <Button
                onClick={analyzeMessage}
                disabled={!message.trim() || isAnalyzing}
                className="w-full angular-border-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-0 neon-glow"
              >
                {isAnalyzing ? (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 animate-pulse" />
                    ANALYZING...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Scan className="w-4 h-4" />
                    INITIATE SCAN
                  </div>
                )}
              </Button>

              {isAnalyzing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Neural Processing</span>
                    <span className="neon-blue">{Math.round(scanProgress)}%</span>
                  </div>
                  <Progress value={scanProgress} className="h-2" />
                  <div className="text-xs text-center text-gray-500">
                    Analyzing patterns • Checking databases • Computing threat level
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Results Section */}
        <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm relative scan-lines">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 neon-green neon-glow" />
              <h2 className="neon-green">ANALYSIS RESULTS</h2>
            </div>

            {!result && !isAnalyzing && (
              <div className="text-center text-gray-400 py-12">
                <Scan className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Enter a message and initiate scan to view analysis results</p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {/* Threat Level */}
                <div className="angular-border-sm bg-black/60 p-4 border border-cyan-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-300">THREAT CLASSIFICATION</span>
                    <div className={`flex items-center gap-2 ${getClassificationColor(result.classification)}`}>
                      {getClassificationIcon(result.classification)}
                      <span className="font-mono">{result.classification}</span>
                      <span className="text-xs text-gray-400 ml-2">(
                        {result.riskScore >= 55 ? 'HIGH' : result.riskScore >= 30 ? 'MODERATE' : 'LOW'}
                      )</span>
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

                {/* Category & Confidence */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="angular-border-sm bg-black/60 p-4 border border-cyan-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 neon-blue" />
                      <span className="text-gray-300">CATEGORY</span>
                    </div>
                    <p className="neon-blue font-mono">{result.category}</p>
                  </div>
                  
                  <div className="angular-border-sm bg-black/60 p-4 border border-cyan-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 neon-green" />
                      <span className="text-gray-300">CONFIDENCE</span>
                    </div>
                    <p className="neon-green font-mono">{result.confidence}%</p>
                  </div>
                </div>

                {/* Indicators */}
                <div className="angular-border-sm bg-black/60 p-4 border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-300">DETECTION INDICATORS</span>
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

                {/* Processing Info */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Processed in {result.processingTime.toFixed(2)}s</span>
                  </div>
                  <span>Neural Network v2.1.4</span>
                </div>

                {/* Export */}
                <div className="flex justify-between gap-2 items-center">
                  <Button
                    variant="outline"
                    className="mt-3 angular-border-sm border-red-500/30 text-red-300"
                    onClick={() => {
                      if (!result) return;
                      try {
                        // Build suspect object and upsert into nv_suspects
                        const clsMap: Record<string, 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'> = {
                          SAFE: 'LOW',
                          SUSPICIOUS: 'MEDIUM',
                          DANGEROUS: 'HIGH',
                          CRITICAL: 'CRITICAL',
                        };
                        const aliasFromMsg = (message.match(/[A-Za-z][A-Za-z0-9_-]{2,}/)?.[0]) || 'Unknown Sender';
                        const suspect = {
                          id: `SP-${Date.now().toString().slice(-4)}-${Math.floor(Math.random()*900+100)}`,
                          alias: aliasFromMsg,
                          realName: 'Unknown',
                          riskLevel: clsMap[result.classification],
                          location: 'Unknown',
                          lastActive: 'just now',
                          threatScore: result.riskScore,
                          operationalMethods: result.indicators.slice(0, 5),
                          targets: [result.category],
                          financialDamage: 0,
                          casesLinked: 1,
                          status: (result.classification === 'DANGEROUS' || result.classification === 'CRITICAL') ? 'ACTIVE' : 'MONITORED',
                          communicationMethods: ['Unknown'],
                          knownAssociates: [] as string[],
                        };
                        const raw = localStorage.getItem('nv_suspects');
                        const list = raw ? JSON.parse(raw) as any[] : [];
                        // Try to find by alias; if exists, update
                        const idx = list.findIndex((s) => String(s.alias).toLowerCase() === aliasFromMsg.toLowerCase());
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
                        toast.success('Added to Suspects', { description: aliasFromMsg });
                      } catch (e) {
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
                      const blob = new Blob([JSON.stringify({ type: 'message', result }, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'neon-veil-message-report.json';
                      a.click();
                      URL.revokeObjectURL(url);
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

      {/* Recent Analyses */}
      <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm relative scan-lines">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-yellow-400 neon-glow" />
            <h2 className="text-yellow-400">RECENT ANALYSES</h2>
          </div>
          
          <div className="space-y-3 custom-scrollbar max-h-64 overflow-y-auto">
            {recent.length === 0 && (
              <div className="text-gray-400 text-sm">No recent analyses yet.</div>
            )}
            {recent.map((r, index) => (
              <div key={index} className="angular-border-sm bg-black/60 p-3 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">
                    {r.classification} - {r.category} ({r.riskScore}/100)
                  </span>
                  <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                    {r.confidence}% conf
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}