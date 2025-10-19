import React, { useState } from 'react';
import { Navigation } from './components/navigation';
import { Dashboard } from './components/dashboard';
import { MessageAnalyzer } from './components/message-analyzer';
import { SuspectProfile } from './components/suspect-profile';
import { IncidentMap } from './components/incident-map';
import { WebsiteAnalyzer } from './components/website-analyzer';
import { Toaster } from 'sonner';
import { VisualAlert } from './components/visual-alert';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'analyzer':
        return <MessageAnalyzer />;
      case 'website':
        return <WebsiteAnalyzer />;
      case 'suspects':
        return <SuspectProfile />;
      case 'incidents':
        return <IncidentMap />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="dark min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <VisualAlert />
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-magenta-500/5 pointer-events-none"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(0,255,255,0.1),transparent_50%)] pointer-events-none"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(255,0,255,0.1),transparent_50%)] pointer-events-none"></div>
      
      {/* Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* App Notifications */}
      <Toaster richColors theme="dark" position="top-right" />

      {/* Main Content */}
      <div className="ml-64 relative z-10">
        {renderActiveComponent()}
      </div>
    </div>
  );
}