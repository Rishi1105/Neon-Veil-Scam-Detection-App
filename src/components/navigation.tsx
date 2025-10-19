import React from 'react';
import { Button } from './ui/button';
import { 
  LayoutDashboard, 
  FileSearch, 
  User, 
  MapPin, 
  Shield, 
  Activity,
  Settings,
  Power
} from 'lucide-react';
import { Globe } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'analyzer', label: 'ANALYZER', icon: FileSearch },
    { id: 'website', label: 'WEBSITE', icon: Globe },
    { id: 'suspects', label: 'SUSPECTS', icon: User },
    { id: 'incidents', label: 'INCIDENTS', icon: MapPin },
  ];

  return (
    <div className="w-64 bg-black/60 backdrop-blur-sm border-r border-cyan-500/30 h-screen fixed left-0 top-0 z-50 scan-lines">
      {/* Header */}
      <div className="p-6 border-b border-cyan-500/30">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 neon-blue neon-glow" />
          <div>
            <h1 className="neon-blue font-mono">NEON VEIL</h1>
            <p className="text-xs text-gray-400">v2.1.4</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className="w-2 h-2 bg-green-400 rounded-full pulse-neon"></div>
          <span className="text-xs neon-green">NEURAL NET ACTIVE</span>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              variant="ghost"
              className={`w-full justify-start angular-border-sm transition-all duration-300 ${
                isActive
                  ? 'bg-cyan-500/20 border-cyan-400 neon-glow text-cyan-400'
                  : 'border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/10 text-gray-300 hover:text-cyan-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-3" />
              <span className="font-mono text-sm">{item.label}</span>
            </Button>
          );
        })}
      </div>

      {/* System Status */}
      <div className="absolute bottom-20 left-4 right-4">
        <div className="angular-border-sm bg-black/40 border border-cyan-500/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 neon-green" />
            <span className="text-xs neon-green">SYSTEM STATUS</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">CPU Load</span>
              <span className="neon-blue">23%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Memory</span>
              <span className="neon-blue">67%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Network</span>
              <span className="neon-green">OPTIMAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-4 left-4 right-4 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start border-cyan-500/20 hover:border-cyan-500/40 text-gray-400 hover:text-gray-300"
        >
          <Settings className="w-4 h-4 mr-3" />
          <span className="font-mono text-xs">SETTINGS</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start border-red-500/20 hover:border-red-500/40 text-gray-400 hover:text-red-400"
        >
          <Power className="w-4 h-4 mr-3" />
          <span className="font-mono text-xs">SHUTDOWN</span>
        </Button>
      </div>
    </div>
  );
}