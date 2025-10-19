import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { AlertTriangle, Shield, Zap, Eye, Activity, Users, TrendingUp, Clock } from 'lucide-react';

interface ThreatData {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: string;
  timestamp: string;
  status: 'ACTIVE' | 'CONTAINED' | 'RESOLVED';
}

export function Dashboard() {
  const [threats, setThreats] = useState<ThreatData[]>([]);
  const [stats, setStats] = useState({
    threatsDetected: 1247,
    activeThreats: 23,
    containedThreats: 45,
    systemIntegrity: 94
  });
  const [todayStats, setTodayStats] = useState({ sitesAnalyzed: 0, scamsDetected: 0, warningsIssued: 0, logs: [] as any[] });
  const [weekTotals, setWeekTotals] = useState({ sites: 0, scams: 0, warnings: 0 });
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [extDetected, setExtDetected] = useState(false);

  useEffect(() => {
    // Mock real-time data updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        threatsDetected: prev.threatsDetected + Math.floor(Math.random() * 3),
        activeThreats: Math.max(0, prev.activeThreats + (Math.random() > 0.7 ? 1 : -1)),
        systemIntegrity: Math.max(85, Math.min(100, prev.systemIntegrity + (Math.random() - 0.5) * 2))
      }));
    }, 3000);

    // Mock threat data
    setThreats([
      { id: 'TH-001', type: 'Phishing', severity: 'HIGH', location: 'Sector 7-G', timestamp: '14:23:07', status: 'ACTIVE' },
      { id: 'TH-002', type: 'Identity Theft', severity: 'CRITICAL', location: 'Sector 12-A', timestamp: '14:20:15', status: 'ACTIVE' },
      { id: 'TH-003', type: 'Crypto Scam', severity: 'MEDIUM', location: 'Sector 5-B', timestamp: '14:18:32', status: 'CONTAINED' },
      { id: 'TH-004', type: 'Romance Scam', severity: 'HIGH', location: 'Sector 9-D', timestamp: '14:15:41', status: 'ACTIVE' },
      { id: 'TH-005', type: 'Tech Support', severity: 'LOW', location: 'Sector 3-C', timestamp: '14:12:28', status: 'RESOLVED' }
    ]);

    return () => clearInterval(interval);
  }, []);

  // Load Today's Stats from localStorage
  useEffect(() => {
    try {
      const today = new Date();
      const key = `nv_app_stats_${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      const raw = localStorage.getItem(key);
      if (raw) setTodayStats(JSON.parse(raw));
    } catch {}
  }, []);

  // Compute last 7 days totals
  useEffect(() => {
    try {
      let sites = 0, scams = 0, warnings = 0;
      const d = new Date();
      for (let i = 0; i < 7; i++) {
        const dt = new Date(d);
        dt.setDate(d.getDate() - i);
        const k = `nv_app_stats_${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
        const raw = localStorage.getItem(k);
        if (raw) {
          const st = JSON.parse(raw);
          sites += st?.sitesAnalyzed || 0;
          scams += st?.scamsDetected || 0;
          warnings += st?.warningsIssued || 0;
        }
      }
      setWeekTotals({ sites, scams, warnings });
    } catch {}
  }, [todayStats]);

  // Detect extension presence on the active page via content script bridge
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      try {
        if (e && e.data && (e.data as any).type === 'NV_PONG_APP') {
          setExtDetected(true);
        }
      } catch {}
    };
    window.addEventListener('message', onMsg as any);
    try { window.postMessage({ type: 'NV_PING_APP' }, '*'); } catch {}
    const timer = setInterval(() => { try { window.postMessage({ type: 'NV_PING_APP' }, '*'); } catch {} }, 10000);
    return () => { window.removeEventListener('message', onMsg as any); clearInterval(timer); };
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'neon-magenta';
      case 'HIGH': return 'text-red-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'LOW': return 'neon-green';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'neon-magenta';
      case 'CONTAINED': return 'text-yellow-400';
      case 'RESOLVED': return 'neon-green';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6 p-6 min-h-screen data-grid">
      {/* Header */}
      <div className="mb-8">
        <h1 className="glitch neon-blue mb-2" data-text="NEON VEIL">
          NEON VEIL
        </h1>
        <p className="text-gray-400">Scam Detection Matrix // Neural Network Active</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 bg-green-400 rounded-full pulse-neon"></div>
          <span className="neon-green">SYSTEM OPERATIONAL</span>
        </div>

      {/* Today's Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm p-6 relative scan-lines">
            <h3 className="text-gray-200 mb-4">Today's Statistics</h3>
            <div className="space-y-3">
              <div className="angular-border-sm bg-black/60 p-3 border border-cyan-500/20">
                <div className="text-2xl neon-blue font-bold">{todayStats.sitesAnalyzed}</div>
                <div className="text-gray-400 text-sm">Sites Analyzed</div>
              </div>
              <div className="angular-border-sm bg-black/60 p-3 border border-cyan-500/20">
                <div className="text-2xl neon-blue font-bold">{todayStats.scamsDetected}</div>
                <div className="text-gray-400 text-sm">Scams Detected</div>
              </div>
              <div className="angular-border-sm bg-black/60 p-3 border border-cyan-500/20">
                <div className="text-2xl neon-blue font-bold">{todayStats.warningsIssued}</div>
                <div className="text-gray-400 text-sm">Warnings Issued</div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                className="w-full btn angular-border-sm bg-gradient-to-r from-cyan-600 to-blue-600 border-0 neon-glow py-2 text-sm"
                onClick={() => {
                  const msg = [
                    'Analyze Current Site via the Neon Veil extension:',
                    '',
                    '1) Open the extension popup and click "Analyze Current Site"',
                    '   — or —',
                    '2) Use the keyboard shortcut: Alt+Shift+A',
                    '',
                    'Tip: You can customize shortcuts at chrome://extensions/shortcuts',
                  ].join('\n');
                  try { alert(msg); } catch { /* no-op */ }
                }}
              >
                Analyze Current Site (Extension)
              </button>
              <div className="text-xs mt-1">
                {extDetected ? (
                  <span className="neon-green">Extension detected on active page</span>
                ) : (
                  <span className="text-gray-400">Extension not detected. Open the extension popup on the page or press Alt+Shift+A.</span>
                )}
              </div>
              <button
                className={`w-full btn angular-border-sm py-2 text-sm ${extDetected ? 'border-0 bg-gradient-to-r from-green-600 to-emerald-600 neon-glow' : 'border border-cyan-500/30 text-cyan-300'}`}
                disabled={!extDetected}
                onClick={() => { try { window.postMessage({ type: 'NV_ANALYZE_CURRENT' }, '*'); } catch {} }}
              >
                Trigger Analysis Now
              </button>
              <button
                className="w-full btn angular-border-sm border border-cyan-500/30 text-cyan-300 py-2 text-sm"
                onClick={() => {
                  try {
                    const today = new Date();
                    const key = `nv_app_stats_${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
                    const raw = localStorage.getItem(key);
                    setTodayStats(raw ? JSON.parse(raw) : { sitesAnalyzed: 0, scamsDetected: 0, warningsIssued: 0, logs: [] });
                  } catch {}
                }}
              >
                View Logs
              </button>
              <button
                className="w-full btn angular-border-sm border border-red-500/20 text-red-400 py-2 text-sm"
                onClick={() => {
                  try {
                    const today = new Date();
                    const key = `nv_app_stats_${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
                    const empty = { sitesAnalyzed: 0, scamsDetected: 0, warningsIssued: 0, logs: [] as any[] };
                    localStorage.setItem(key, JSON.stringify(empty));
                    setTodayStats(empty);
                  } catch {}
                }}
              >
                Reset Today
              </button>
              <button className="w-full btn angular-border-sm border border-cyan-500/30 text-cyan-300 py-2 text-sm">
                Settings
              </button>

              {/* Weekly Totals */}
              <div className="angular-border-sm bg-black/60 p-3 border border-cyan-500/20 mt-2">
                <div className="text-gray-400 text-sm mb-2">Weekly Totals</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-cyan-300 font-bold">{weekTotals.sites}</div>
                    <div className="text-gray-500 text-xs">Sites</div>
                  </div>
                  <div>
                    <div className="text-cyan-300 font-bold">{weekTotals.scams}</div>
                    <div className="text-gray-500 text-xs">Scams</div>
                  </div>
                  <div>
                    <div className="text-cyan-300 font-bold">{weekTotals.warnings}</div>
                    <div className="text-gray-500 text-xs">Warnings</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    className="flex-1 btn angular-border-sm border border-cyan-500/30 text-cyan-300 py-2 text-sm"
                    onClick={() => {
                      try {
                        const today = new Date();
                        const k = `nv_app_stats_${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
                        const payload = { day: k, stats: JSON.parse(localStorage.getItem(k) || '{"sitesAnalyzed":0,"scamsDetected":0,"warningsIssued":0,"logs":[]}') };
                        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'neon-veil-app-today.json'; a.click(); URL.revokeObjectURL(url);
                      } catch {}
                    }}
                  >Export Today</button>
                  <button
                    className="flex-1 btn angular-border-sm border border-cyan-500/30 text-cyan-300 py-2 text-sm"
                    onClick={() => {
                      try {
                        const d = new Date();
                        const days: any[] = [];
                        for (let i = 0; i < 7; i++) {
                          const dt = new Date(d); dt.setDate(d.getDate() - i);
                          const k = `nv_app_stats_${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
                          const st = JSON.parse(localStorage.getItem(k) || '{"sitesAnalyzed":0,"scamsDetected":0,"warningsIssued":0,"logs":[]}');
                          days.push({ day: k, stats: st });
                        }
                        const blob = new Blob([JSON.stringify({ range: 'last7days', days }, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'neon-veil-app-week.json'; a.click(); URL.revokeObjectURL(url);
                      } catch {}
                    }}
                  >Export Week</button>
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div className="md:col-span-3">
          <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm p-6 relative scan-lines">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="neon-blue">Today's Logs</h3>
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                <input type="checkbox" className="accent-cyan-400" checked={alertsOnly} onChange={e=>setAlertsOnly(e.target.checked)} />
                Alerts Only
              </label>
            </div>
            <div className="space-y-3 custom-scrollbar max-h-96 overflow-y-auto">
              {(!todayStats.logs || todayStats.logs.length === 0) && (
                <div className="text-gray-400 text-sm">No logs yet for today.</div>
              )}
              {(todayStats.logs || []).filter((l:any)=>!alertsOnly || l.type==='alert').map((log:any, idx:number) => (
                <div key={idx} className="angular-border-sm bg-black/60 p-3 border border-cyan-500/20">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{log.type === 'message' ? 'Message' : log.type === 'website' ? 'Website' : 'Alert'}</span>
                    <span className="text-gray-500">{new Date(log.ts).toLocaleTimeString()}</span>
                  </div>
                  {log.type==='alert' ? (
                    <div className="text-gray-400 text-xs mt-1">{log.level?.toUpperCase()} • {log.title}{log.message ? ` — ${log.message}`: ''}</div>
                  ) : (
                    <div className="text-gray-400 text-xs mt-1">{log.classification} • {log.riskScore}/100 • {log.category}</div>
                  )}
                  {log.preview && <div className="text-gray-500 text-xs mt-1 truncate">{log.preview}</div>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm p-6 relative scan-lines">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 mb-1">THREATS DETECTED</p>
              <p className="neon-blue">{stats.threatsDetected.toLocaleString()}</p>
            </div>
            <Shield className="w-8 h-8 neon-blue neon-glow" />
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 neon-green" />
              <span className="neon-green">+12% from last cycle</span>
            </div>
          </div>
        </Card>

        <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm p-6 relative scan-lines">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 mb-1">ACTIVE THREATS</p>
              <p className="neon-magenta pulse-neon">{stats.activeThreats}</p>
            </div>
            <AlertTriangle className="w-8 h-8 neon-magenta neon-glow" />
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-400" />
              <span className="text-red-400">Requires attention</span>
            </div>
          </div>
        </Card>

        <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm p-6 relative scan-lines">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 mb-1">CONTAINED</p>
              <p className="text-yellow-400">{stats.containedThreats}</p>
            </div>
            <Eye className="w-8 h-8 text-yellow-400 neon-glow" />
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400">Under monitoring</span>
            </div>
          </div>
        </Card>

        <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm p-6 relative scan-lines">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 mb-1">SYSTEM INTEGRITY</p>
              <p className="neon-green">{stats.systemIntegrity}%</p>
            </div>
            <Zap className="w-8 h-8 neon-green neon-glow" />
          </div>
          <div className="mt-4">
            <Progress value={stats.systemIntegrity} className="h-2" />
          </div>
        </Card>
      </div>

      {/* Active Threats */}
      <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm relative scan-lines">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 neon-magenta neon-glow" />
            <h2 className="neon-magenta">ACTIVE THREAT MATRIX</h2>
          </div>
          
          <div className="space-y-4 custom-scrollbar max-h-96 overflow-y-auto">
            {threats.map((threat) => (
              <div
                key={threat.id}
                className="angular-border-sm bg-black/60 p-4 border border-cyan-500/30 hover:border-cyan-500/60 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`${getSeverityColor(threat.severity)} border-current`}>
                      {threat.severity}
                    </Badge>
                    <span className="neon-blue">{threat.id}</span>
                    <span className="text-gray-300">{threat.type}</span>
                  </div>
                  <Badge variant="outline" className={`${getStatusColor(threat.status)} border-current`}>
                    {threat.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{threat.location}</span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{threat.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Network Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm p-6 relative scan-lines">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 neon-blue neon-glow" />
            <h3 className="neon-blue">NETWORK NODES</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Primary Scanner</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full pulse-neon"></div>
                <span className="neon-green">ONLINE</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Backup Systems</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full pulse-neon"></div>
                <span className="neon-green">READY</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">AI Neural Net</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full pulse-neon"></div>
                <span className="neon-blue">LEARNING</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm p-6 relative scan-lines">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 neon-green neon-glow" />
            <h3 className="neon-green">DETECTION RATE</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Phishing</span>
                <span className="neon-green">97.2%</span>
              </div>
              <Progress value={97.2} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Identity Theft</span>
                <span className="neon-green">94.8%</span>
              </div>
              <Progress value={94.8} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Crypto Scams</span>
                <span className="neon-green">89.3%</span>
              </div>
              <Progress value={89.3} className="h-2" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}