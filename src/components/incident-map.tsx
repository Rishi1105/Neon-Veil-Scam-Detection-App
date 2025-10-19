import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  MapPin, 
  Zap, 
  AlertTriangle, 
  Activity, 
  Filter,
  Target,
  Globe,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react';

interface IncidentData {
  id: string;
  type: 'Phishing' | 'Identity Theft' | 'Crypto Scam' | 'Romance Scam' | 'Tech Support';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: { x: number; y: number; sector: string };
  timestamp: string;
  status: 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED';
  victims: number;
  financialLoss: number;
}

export function IncidentMap() {
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<IncidentData | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [animatingIncidents, setAnimatingIncidents] = useState<Set<string>>(new Set());

  // Deterministic hash to place incidents on the grid
  const hashToPercent = (s: string, salt = 0) => {
    let h = 2166136261 + salt;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    const n = Math.abs(h >>> 0) % 100;
    return Math.min(95, Math.max(5, n));
  };

  const mapClassificationToSeverity = (classification?: string): IncidentData['severity'] => {
    switch (classification) {
      case 'CRITICAL': return 'CRITICAL';
      case 'DANGEROUS': return 'HIGH';
      case 'SUSPICIOUS': return 'MEDIUM';
      case 'SAFE': return 'LOW';
      default: return 'LOW';
    }
  };

  const mapSeverityToLoss = (sev: IncidentData['severity']) => {
    switch (sev) {
      case 'CRITICAL': return 600000;
      case 'HIGH': return 150000;
      case 'MEDIUM': return 25000;
      default: return 5000;
    }
  };

  const buildIncidentsFromLogs = (): IncidentData[] => {
    try {
      const today = new Date();
      const key = `nv_app_stats_${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      const raw = localStorage.getItem(key);
      const stats = raw ? JSON.parse(raw) : { logs: [] };
      const logs: any[] = Array.isArray(stats.logs) ? stats.logs : [];
      const list: IncidentData[] = logs
        .filter(l => l && (l.type === 'message' || l.type === 'website'))
        .slice(0, 100)
        .map((l, idx) => {
          const severity = mapClassificationToSeverity(l.classification);
          const status: IncidentData['status'] = (l.classification === 'DANGEROUS' || l.classification === 'CRITICAL')
            ? 'ACTIVE'
            : (l.classification === 'SUSPICIOUS' ? 'INVESTIGATING' : 'RESOLVED');
          const base = l.type === 'website' ? (l.preview || l.url || '') : (l.preview || 'message');
          const x = hashToPercent(String(base), 13 + idx);
          const y = hashToPercent(String(base), 97 + idx);
          const sector = ['Sector ALPHA','Sector BETA','Sector GAMMA','Sector DELTA'][hashToPercent(String(base)) % 4];
          return {
            id: `INC-${String(idx+1).padStart(3,'0')}`,
            type: (l.type === 'website' ? 'Phishing' : 'Identity Theft') as IncidentData['type'],
            severity,
            location: { x, y, sector },
            timestamp: new Date(l.ts || Date.now()).toLocaleString(),
            status,
            victims: l.type === 'website' ? 2 + (hashToPercent(String(base)) % 4) : 1,
            financialLoss: mapSeverityToLoss(severity),
          };
        });
      return list;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    // initial load from logs
    setIncidents(buildIncidentsFromLogs());

    // Refresh on focus
    const onFocus = () => setIncidents(buildIncidentsFromLogs());
    window.addEventListener('focus', onFocus);

    // Light animation timer that targets current ACTIVE incidents
    const animTimer = setInterval(() => {
      const activeIncidents = incidents.filter(i => i.status === 'ACTIVE');
      if (activeIncidents.length > 0) {
        const randomIncident = activeIncidents[Math.floor(Math.random() * activeIncidents.length)];
        setAnimatingIncidents(prev => new Set([...prev, randomIncident.id]));
        setTimeout(() => {
          setAnimatingIncidents(prev => { const s = new Set(prev); s.delete(randomIncident.id); return s; });
        }, 2000);
      }
    }, 4000);

    // Periodic data refresh
    const dataTimer = setInterval(() => setIncidents(buildIncidentsFromLogs()), 10000);

    return () => { clearInterval(animTimer); clearInterval(dataTimer); window.removeEventListener('focus', onFocus); };
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '#ff00ff';
      case 'HIGH': return '#ff4444';
      case 'MEDIUM': return '#ffaa00';
      case 'LOW': return '#39ff14';
      default: return '#666666';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Phishing': return '🎣';
      case 'Identity Theft': return '👤';
      case 'Crypto Scam': return '₿';
      case 'Romance Scam': return '💔';
      case 'Tech Support': return '🔧';
      default: return '⚠️';
    }
  };

  const filteredIncidents = filter === 'ALL' 
    ? incidents 
    : incidents.filter(incident => incident.severity === filter || incident.status === filter);

  return (
    <div className="space-y-6 p-6 min-h-screen data-grid">
      {/* Header */}
      <div className="mb-8">
        <h1 className="glitch neon-blue mb-2" data-text="INCIDENT MAP">
          INCIDENT MAP
        </h1>
        <p className="text-gray-400">Geo-Spatial Threat Analysis // Real-Time Monitoring</p>
        <div className="flex items-center gap-2 mt-2">
          <Globe className="w-4 h-4 neon-green pulse-neon" />
          <span className="neon-green">GLOBAL SURVEILLANCE ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Visualization */}
        <div className="lg:col-span-2">
          <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm relative scan-lines h-[600px]">
            <div className="p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 neon-blue neon-glow" />
                  <h2 className="neon-blue">NEURAL CITY GRID</h2>
                </div>
                <div className="flex gap-2">
                  {['ALL', 'CRITICAL', 'HIGH', 'ACTIVE'].map((filterOption) => (
                    <Button
                      key={filterOption}
                      onClick={() => setFilter(filterOption)}
                      variant={filter === filterOption ? 'default' : 'outline'}
                      size="sm"
                      className={`angular-border-sm text-xs ${
                        filter === filterOption 
                          ? 'bg-cyan-600 border-cyan-400 neon-glow' 
                          : 'border-cyan-500/30 hover:border-cyan-500/50'
                      }`}
                    >
                      {filterOption}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Map Container */}
              <div className="relative w-full h-full bg-black/60 border border-cyan-500/30 angular-border-sm">
                {/* Grid Lines */}
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00ffff" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {/* Sector Labels */}
                <div className="absolute top-4 left-4 space-y-1">
                  {['ALPHA', 'BETA', 'GAMMA', 'DELTA'].map((sector, index) => (
                    <div key={sector} className="text-xs neon-blue opacity-60">
                      SECTOR {sector}
                    </div>
                  ))}
                </div>

                {/* Incident Markers */}
                {filteredIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                      animatingIncidents.has(incident.id) ? 'animate-pulse scale-125' : ''
                    }`}
                    style={{
                      left: `${incident.location.x}%`,
                      top: `${incident.location.y}%`,
                    }}
                    onClick={() => setSelectedIncident(incident)}
                  >
                    <div
                      className="w-4 h-4 rounded-full border-2 relative"
                      style={{
                        backgroundColor: getSeverityColor(incident.severity),
                        borderColor: getSeverityColor(incident.severity),
                        boxShadow: `0 0 10px ${getSeverityColor(incident.severity)}`,
                      }}
                    >
                      {incident.status === 'ACTIVE' && (
                        <div
                          className="absolute -inset-2 rounded-full animate-ping opacity-30"
                          style={{ backgroundColor: getSeverityColor(incident.severity) }}
                        />
                      )}
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/90 border border-cyan-500/50 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity z-10">
                      <div className="neon-blue">{incident.id}</div>
                      <div className="text-gray-300">{incident.type}</div>
                      <div className="text-gray-400">{incident.location.sector}</div>
                    </div>
                  </div>
                ))}

                {/* Scanning Lines */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute animate-pulse" style={{ top: '20%' }} />
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute animate-pulse" style={{ top: '60%', animationDelay: '1s' }} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Incident Details & Stats */}
        <div className="space-y-6">
          {/* Selected Incident Details */}
          <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm relative scan-lines">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 neon-magenta neon-glow" />
                <h2 className="neon-magenta">INCIDENT DETAILS</h2>
              </div>

              {selectedIncident ? (
                <div className="space-y-4">
                  <div className="angular-border-sm bg-black/60 p-4 border border-cyan-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="neon-blue font-mono">{selectedIncident.id}</span>
                      <Badge 
                        variant="outline" 
                        className="border-current"
                        style={{ color: getSeverityColor(selectedIncident.severity) }}
                      >
                        {selectedIncident.severity}
                      </Badge>
                    </div>
                    <div className="text-gray-300 mb-1">{selectedIncident.type}</div>
                    <div className="text-sm text-gray-400">{selectedIncident.location.sector}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="angular-border-sm bg-black/60 p-3 border border-cyan-500/30 text-center">
                      <Users className="w-4 h-4 mx-auto mb-1 text-yellow-400" />
                      <div className="text-yellow-400 font-mono">{selectedIncident.victims}</div>
                      <div className="text-xs text-gray-400">VICTIMS</div>
                    </div>
                    <div className="angular-border-sm bg-black/60 p-3 border border-cyan-500/30 text-center">
                      <TrendingUp className="w-4 h-4 mx-auto mb-1 neon-magenta" />
                      <div className="neon-magenta font-mono">${(selectedIncident.financialLoss / 1000).toFixed(0)}K</div>
                      <div className="text-xs text-gray-400">LOSS</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Status:</span>
                      <span className={selectedIncident.status === 'ACTIVE' ? 'neon-magenta' : selectedIncident.status === 'INVESTIGATING' ? 'text-yellow-400' : 'neon-green'}>
                        {selectedIncident.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Timestamp:</span>
                      <span className="text-gray-300 font-mono">{selectedIncident.timestamp}</span>
                    </div>
                  </div>

                  <Button className="w-full angular-border-sm bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border-0 neon-glow">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    DEPLOY RESPONSE TEAM
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Select an incident on the map</p>
                  <p className="text-sm">to view detailed information</p>
                </div>
              )}
            </div>
          </Card>

          {/* Live Statistics */}
          <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm relative scan-lines">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-6 h-6 neon-green neon-glow" />
                <h2 className="neon-green">LIVE STATISTICS</h2>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Active Incidents</span>
                  <span className="neon-magenta font-mono">
                    {incidents.filter(i => i.status === 'ACTIVE').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Under Investigation</span>
                  <span className="text-yellow-400 font-mono">
                    {incidents.filter(i => i.status === 'INVESTIGATING').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Resolved Today</span>
                  <span className="neon-green font-mono">
                    {incidents.filter(i => i.status === 'RESOLVED').length}
                  </span>
                </div>
                <div className="border-t border-cyan-500/30 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Financial Impact</span>
                    <span className="neon-blue font-mono">
                      ${(incidents.reduce((sum, i) => sum + i.financialLoss, 0) / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Threat Levels */}
          <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm relative scan-lines">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-yellow-400 neon-glow" />
                <h2 className="text-yellow-400">THREAT DISTRIBUTION</h2>
              </div>

              <div className="space-y-3">
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => {
                  const count = incidents.filter(i => i.severity === severity).length;
                  const percentage = (count / incidents.length) * 100;
                  return (
                    <div key={severity} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: getSeverityColor(severity) }}>{severity}</span>
                        <span className="text-gray-400">{count} incidents</span>
                      </div>
                      <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: getSeverityColor(severity),
                            boxShadow: `0 0 4px ${getSeverityColor(severity)}`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}