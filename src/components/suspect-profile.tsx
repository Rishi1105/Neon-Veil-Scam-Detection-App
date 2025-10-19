import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar } from './ui/avatar';
import { Progress } from './ui/progress';
import { 
  User, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Activity,
  Phone,
  Mail,
  Globe,
  CreditCard,
  Eye,
  Target,
  Zap
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';

interface SuspectData {
  id: string;
  alias: string;
  realName?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: string;
  lastActive: string;
  threatScore: number;
  operationalMethods: string[];
  targets: string[];
  financialDamage: number;
  casesLinked: number;
  status: 'ACTIVE' | 'MONITORED' | 'APPREHENDED';
  communicationMethods: string[];
  knownAssociates: string[];
  activityLog?: { ts: number; action: string; note?: string }[];
}

export function SuspectProfile() {
  const [selectedSuspect, setSelectedSuspect] = useState<SuspectData | null>(null);
  const seed: SuspectData[] = [
    {
      id: 'SP-7749',
      alias: 'CyberPhantom',
      realName: 'Unknown',
      riskLevel: 'CRITICAL',
      location: 'Sector 12-Alpha',
      lastActive: '2 hours ago',
      threatScore: 94,
      operationalMethods: ['Phishing', 'Identity Theft', 'Crypto Fraud'],
      targets: ['Corporate Executives', 'Elderly Demographics', 'Crypto Investors'],
      financialDamage: 2340000,
      casesLinked: 47,
      status: 'ACTIVE',
      communicationMethods: ['Encrypted Messages', 'Voice Spoofing', 'Social Media'],
      knownAssociates: ['DigitalShadow', 'NeonGhost', 'ByteViper']
    },
    {
      id: 'SP-3321',
      alias: 'NeonGhost',
      realName: 'Marcus Chen',
      riskLevel: 'HIGH',
      location: 'Sector 8-Beta',
      lastActive: '1 day ago',
      threatScore: 78,
      operationalMethods: ['Romance Scams', 'Investment Fraud'],
      targets: ['Middle-aged Singles', 'New Investors'],
      financialDamage: 890000,
      casesLinked: 23,
      status: 'MONITORED',
      communicationMethods: ['Dating Apps', 'Email', 'SMS'],
      knownAssociates: ['CyberPhantom', 'LoveHunter']
    },
    {
      id: 'SP-5567',
      alias: 'ByteViper',
      realName: 'Unknown',
      riskLevel: 'MEDIUM',
      location: 'Sector 15-Gamma',
      lastActive: '3 days ago',
      threatScore: 61,
      operationalMethods: ['Tech Support Scams', 'Fake Antivirus'],
      targets: ['Senior Citizens', 'Non-tech Savvy Users'],
      financialDamage: 340000,
      casesLinked: 15,
      status: 'MONITORED',
      communicationMethods: ['Cold Calls', 'Pop-up Ads', 'Email'],
      knownAssociates: ['TechReaper', 'VirusKing']
    }
  ];

  const [suspects, setSuspects] = useState<SuspectData[]>(seed);
  const [linkedCases, setLinkedCases] = useState<any[]>([]);
  const [useWeekRange, setUseWeekRange] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<SuspectData>>({});
  const importRef = useRef<HTMLInputElement>(null);

  // Load suspects from localStorage and merge with seeds
  const loadSuspects = () => {
    try {
      const raw = localStorage.getItem('nv_suspects');
      if (raw) {
        const stored: SuspectData[] = JSON.parse(raw);
        // merge by id, prefer stored
        const byId = new Map<string, SuspectData>();
        [...seed, ...stored].forEach(s => byId.set(s.id, s));
        const list = Array.from(byId.values());
        setSuspects(list);
        if (!selectedSuspect && list.length > 0) setSelectedSuspect(list[0]);
        return;
      }
    } catch {}
    setSuspects(seed);
    if (!selectedSuspect) setSelectedSuspect(seed[0]);
  };

  useEffect(() => {
    loadSuspects();
    // Refresh when user focuses the tab (after new leads are added elsewhere)
    const onFocus = () => loadSuspects();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Load logs for selected suspect (today or last 7 days)
  useEffect(() => {
    try {
      if (!selectedSuspect) { setLinkedCases([]); return; }
      const collectKeys = (days:number) => {
        const keys:string[] = [];
        const d = new Date();
        for (let i=0;i<days;i++){
          const dt = new Date(d); dt.setDate(d.getDate()-i);
          keys.push(`nv_app_stats_${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`);
        }
        return keys;
      };
      const keys = useWeekRange ? collectKeys(7) : collectKeys(1);
      const allLogs:any[] = [];
      keys.forEach(k => {
        const raw = localStorage.getItem(k);
        if (raw) {
          const stats = JSON.parse(raw);
          if (Array.isArray(stats.logs)) allLogs.push(...stats.logs);
        }
      });
      const filtered = allLogs.filter(l => l?.suspectId === selectedSuspect.id);
      setLinkedCases(filtered);
    } catch { setLinkedCases([]); }
  }, [selectedSuspect, useWeekRange]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
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
      case 'MONITORED': return 'text-yellow-400';
      case 'APPREHENDED': return 'neon-green';
      default: return 'text-gray-400';
    }
  };

  // helpers to persist and import/export suspects
  const saveSuspects = (list: SuspectData[]) => {
    localStorage.setItem('nv_suspects', JSON.stringify(list.slice(0, 500)));
    setSuspects(list);
  };

  const exportSuspects = () => {
    try {
      const payload = { exportedAt: Date.now(), suspects };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'neon-veil-suspects.json'; a.click(); URL.revokeObjectURL(url);
    } catch {}
  };

  const importSuspects = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const incoming: SuspectData[] = Array.isArray(json) ? json : (Array.isArray(json?.suspects) ? json.suspects : []);
      if (!incoming.length) return;
      const byId = new Map<string, SuspectData>();
      [...suspects, ...incoming].forEach(s => byId.set(s.id, s));
      const list = Array.from(byId.values());
      saveSuspects(list);
      if (selectedSuspect) {
        const found = list.find(s=>s.id===selectedSuspect.id);
        if (found) setSelectedSuspect(found);
      }
    } catch {}
  };

  return (
    <div className="space-y-6 p-6 min-h-screen data-grid">
      {/* Header */}
      <div className="mb-8">
        <h1 className="glitch neon-blue mb-2" data-text="SUSPECT PROFILES">
          SUSPECT PROFILES
        </h1>
        <p className="text-gray-400">Criminal Database // Neural Behavioral Analysis</p>
        <div className="flex items-center gap-2 mt-2">
          <Target className="w-4 h-4 neon-magenta pulse-neon" />
          <span className="neon-magenta">HIGH-VALUE TARGETS IDENTIFIED</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Suspect List */}
        <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm relative scan-lines">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-6 h-6 neon-blue neon-glow" />
              <h2 className="neon-blue">SUSPECT DATABASE</h2>
            </div>
            <div className="flex gap-2 mb-3">
              <Button variant="outline" className="angular-border-sm border-cyan-500/40 text-cyan-300 text-xs" onClick={exportSuspects}>Export</Button>
              <Button variant="outline" className="angular-border-sm border-cyan-500/40 text-cyan-300 text-xs" onClick={() => importRef.current?.click()}>Import</Button>
              <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={e=>{ const f=e.target.files?.[0]; if (f) importSuspects(f); e.currentTarget.value=''; }} />
            </div>

            <div className="space-y-3 custom-scrollbar max-h-96 overflow-y-auto">
              {suspects.map((suspect) => (
                <div
                  key={suspect.id}
                  onClick={() => setSelectedSuspect(suspect)}
                  className={`angular-border-sm bg-black/60 p-4 border cursor-pointer transition-all duration-300 ${
                    selectedSuspect?.id === suspect.id 
                      ? 'border-cyan-500/60 bg-cyan-500/10' 
                      : 'border-cyan-500/30 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 border-2 border-cyan-500/50">
                        <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      </Avatar>
                      <div>
                        <p className="neon-blue font-mono text-sm">{suspect.alias}</p>
                        <p className="text-xs text-gray-400">{suspect.id}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${getRiskColor(suspect.riskLevel)} border-current text-xs`}>
                      {suspect.riskLevel}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{suspect.location}</span>
                    <span>{suspect.lastActive}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Detailed Profile */}
        <div className="lg:col-span-2 space-y-6">
          {selectedSuspect && (
            <>
              {/* Header Card */}
              <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm relative scan-lines">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16 border-2 border-cyan-500/50">
                        <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                          <User className="w-8 h-8 text-white" />
                        </div>
                      </Avatar>
                      <div>
                        <h2 className="neon-blue text-2xl font-mono">{selectedSuspect.alias}</h2>
                        <p className="text-gray-400 mb-1">{selectedSuspect.realName || 'Identity Unknown'}</p>
                        <p className="text-sm text-gray-500 font-mono">{selectedSuspect.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={`${getRiskColor(selectedSuspect.riskLevel)} border-current mb-2`}>
                        {selectedSuspect.riskLevel} RISK
                      </Badge>
                      <div className={`flex items-center gap-2 ${getStatusColor(selectedSuspect.status)}`}>
                        <Activity className="w-4 h-4" />
                        <span className="font-mono">{selectedSuspect.status}</span>
                      </div>
                      <div className="mt-3">
                        <Button variant="outline" className="angular-border-sm border-cyan-500/40 text-cyan-300 text-xs"
                          onClick={() => { setEditDraft(selectedSuspect); setEditOpen(true); }}>
                          Edit Suspect
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-1">THREAT SCORE</p>
                      <p className={`${getRiskColor(selectedSuspect.riskLevel)} font-mono text-xl`}>
                        {selectedSuspect.threatScore}
                      </p>
                      <Progress value={selectedSuspect.threatScore} className="h-1 mt-2" />
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-1">CASES LINKED</p>
                      <p className="neon-blue font-mono text-xl">{linkedCases.length || selectedSuspect.casesLinked}</p>
                      <div className="text-[10px] text-gray-500 mt-1 cursor-pointer underline" onClick={() => setUseWeekRange(v=>!v)}>
                        {useWeekRange ? 'Showing last 7 days' : 'Showing today only'} — click to toggle
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-1">DAMAGE (USD)</p>
                      <p className="neon-magenta font-mono text-xl">${(selectedSuspect.financialDamage / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-1">LAST ACTIVE</p>
                      <p className="text-yellow-400 font-mono">{selectedSuspect.lastActive}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Detailed Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm relative scan-lines">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="w-6 h-6 text-red-400 neon-glow" />
                      <h3 className="text-red-400">OPERATIONAL METHODS</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedSuspect.operationalMethods.map((method, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span className="text-gray-300">{method}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm relative scan-lines">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Target className="w-6 h-6 text-yellow-400 neon-glow" />
                      <h3 className="text-yellow-400">PRIMARY TARGETS</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedSuspect.targets.map((target, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-yellow-400" />
                          <span className="text-gray-300">{target}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm relative scan-lines">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Phone className="w-6 h-6 neon-blue neon-glow" />
                      <h3 className="neon-blue">COMMUNICATION</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedSuspect.communicationMethods.map((method, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Zap className="w-4 h-4 neon-blue" />
                          <span className="text-gray-300">{method}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm relative scan-lines">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <User className="w-6 h-6 neon-green neon-glow" />
                      <h3 className="neon-green">KNOWN ASSOCIATES</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedSuspect.knownAssociates.map((associate, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full pulse-neon"></div>
                          <span className="text-gray-300 font-mono">{associate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Linked Cases */}
              <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm relative scan-lines">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Eye className="w-6 h-6 neon-blue neon-glow" />
                    <h3 className="neon-blue">LINKED CASES ({useWeekRange ? 'LAST 7 DAYS' : 'TODAY'})</h3>
                  </div>
                  <div className="space-y-2 custom-scrollbar max-h-96 overflow-y-auto">
                    {linkedCases.length === 0 && (
                      <div className="text-gray-400 text-sm">No linked cases today.</div>
                    )}
                    {linkedCases.map((c:any, idx:number) => (
                      <div key={idx} className="angular-border-sm bg-black/60 p-3 border border-cyan-500/20">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">{c.type === 'message' ? 'Message' : 'Website'}</span>
                          <span className="text-gray-500">{new Date(c.ts).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-gray-400 text-xs mt-1">{c.classification} • {c.riskScore}/100 • {c.category}</div>
                        {c.preview && <div className="text-gray-500 text-xs mt-1 truncate">{c.preview}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button className="angular-border-sm bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border-0 neon-glow flex-1"
                  onClick={() => {
                    if (!selectedSuspect) return;
                    try {
                      const raw = localStorage.getItem('nv_suspects');
                      const list: SuspectData[] = raw ? JSON.parse(raw) : [];
                      const idx = list.findIndex(s=>s.id===selectedSuspect.id);
                      if (idx>=0) {
                        const s = { ...list[idx] } as SuspectData;
                        s.status = 'ACTIVE';
                        s.activityLog = [{ ts: Date.now(), action: 'ESCALATE THREAT' }, ...(s.activityLog || [])].slice(0,200);
                        list[idx] = s; saveSuspects(list); setSelectedSuspect(s);
                      }
                    } catch {}
                  }}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  ESCALATE THREAT
                </Button>
                <Button className="angular-border-sm bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 border-0 neon-glow flex-1"
                  onClick={() => {
                    if (!selectedSuspect) return;
                    try {
                      const raw = localStorage.getItem('nv_suspects');
                      const list: SuspectData[] = raw ? JSON.parse(raw) : [];
                      const idx = list.findIndex(s=>s.id===selectedSuspect.id);
                      if (idx>=0) {
                        const s = { ...list[idx] } as SuspectData;
                        s.status = 'MONITORED';
                        s.activityLog = [{ ts: Date.now(), action: 'MONITOR ACTIVITY' }, ...(s.activityLog || [])].slice(0,200);
                        list[idx] = s; saveSuspects(list); setSelectedSuspect(s);
                      }
                    } catch {}
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  MONITOR ACTIVITY
                </Button>
                <Button className="angular-border-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-0 neon-glow flex-1"
                  onClick={() => {
                    if (!selectedSuspect) return;
                    try {
                      const raw = localStorage.getItem('nv_suspects');
                      const list: SuspectData[] = raw ? JSON.parse(raw) : [];
                      const idx = list.findIndex(s=>s.id===selectedSuspect.id);
                      if (idx>=0) {
                        const s = { ...list[idx] } as SuspectData;
                        s.activityLog = [{ ts: Date.now(), action: 'DEPLOY COUNTERMEASURES' }, ...(s.activityLog || [])].slice(0,200);
                        list[idx] = s; saveSuspects(list); setSelectedSuspect(s);
                      }
                    } catch {}
                  }}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  DEPLOY COUNTERMEASURES
                </Button>
              </div>

              {/* Activity Log */}
              <Card className="angular-border holographic border-2 bg-black/40 backdrop-blur-sm relative scan-lines">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Activity className="w-6 h-6 neon-green neon-glow" />
                    <h3 className="neon-green">ACTIVITY LOG</h3>
                  </div>
                  <div className="space-y-2 custom-scrollbar max-h-64 overflow-y-auto">
                    {(!selectedSuspect?.activityLog || selectedSuspect.activityLog.length === 0) && (
                      <div className="text-gray-400 text-sm">No activity yet for this suspect.</div>
                    )}
                    {(selectedSuspect?.activityLog || []).map((a, idx) => (
                      <div key={idx} className="angular-border-sm bg-black/60 p-3 border border-cyan-500/20">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">{a.action}</span>
                          <span className="text-gray-500">{new Date(a.ts).toLocaleTimeString()}</span>
                        </div>
                        {a.note && <div className="text-gray-500 text-xs mt-1">{a.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </>)}
        </div>
      </div>
      {/* Edit Suspect Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Suspect</DialogTitle>
          </DialogHeader>
          {editDraft && (
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Alias</div>
                  <input className="w-full rounded-md bg-black/60 border border-cyan-500/30 px-2 py-1 text-sm"
                    value={editDraft.alias || ''}
                    onChange={e=>setEditDraft({...editDraft, alias: e.target.value})} />
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Risk Level</div>
                  <select className="w-full rounded-md bg-black/60 border border-cyan-500/30 px-2 py-1 text-sm"
                    value={editDraft.riskLevel || 'LOW'}
                    onChange={e=>setEditDraft({...editDraft, riskLevel: e.target.value as any})}>
                    <option>LOW</option>
                    <option>MEDIUM</option>
                    <option>HIGH</option>
                    <option>CRITICAL</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Status</div>
                  <select className="w-full rounded-md bg-black/60 border border-cyan-500/30 px-2 py-1 text-sm"
                    value={editDraft.status || 'MONITORED'}
                    onChange={e=>setEditDraft({...editDraft, status: e.target.value as any})}>
                    <option>ACTIVE</option>
                    <option>MONITORED</option>
                    <option>APPREHENDED</option>
                  </select>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Threat Score</div>
                  <input type="number" className="w-full rounded-md bg-black/60 border border-cyan-500/30 px-2 py-1 text-sm"
                    value={editDraft.threatScore ?? 0}
                    onChange={e=>setEditDraft({...editDraft, threatScore: Math.max(0, Math.min(100, Number(e.target.value)||0))})} />
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Targets (comma separated)</div>
                <input className="w-full rounded-md bg-black/60 border border-cyan-500/30 px-2 py-1 text-sm"
                  value={(editDraft.targets || []).join(', ')}
                  onChange={e=>setEditDraft({...editDraft, targets: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Known Associates (comma separated)</div>
                <input className="w-full rounded-md bg-black/60 border border-cyan-500/30 px-2 py-1 text-sm"
                  value={(editDraft.knownAssociates || []).join(', ')}
                  onChange={e=>setEditDraft({...editDraft, knownAssociates: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
              </div>
          </div>)}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={()=>setEditOpen(false)}>Cancel</Button>
            <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 border-0"
              onClick={()=>{
                try {
                  if (!selectedSuspect) return setEditOpen(false);
                  const raw = localStorage.getItem('nv_suspects');
                  const list = raw ? JSON.parse(raw) as any[] : [];
                  const idx = list.findIndex(s=>s.id===selectedSuspect.id);
                  const merged = { ...selectedSuspect, ...editDraft } as SuspectData;
                  if (idx>=0) list[idx]=merged; else list.unshift(merged);
                  localStorage.setItem('nv_suspects', JSON.stringify(list.slice(0,200)));
                  setSelectedSuspect(merged);
                  loadSuspects();
                } catch {}
                setEditOpen(false);
              }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}