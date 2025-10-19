import React, { useEffect, useRef, useState } from 'react';

interface AlertDetail {
  level: 'warning' | 'danger' | 'info';
  title: string;
  message?: string;
  durationMs?: number;
}

export function VisualAlert() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<AlertDetail>({ level: 'info', title: '', message: '' });
  const timerRef = useRef<number | null>(null);
  const [showCriticalModal, setShowCriticalModal] = useState(false);

  useEffect(() => {
    function onAlert(e: Event) {
      const ce = e as CustomEvent<AlertDetail>;
      const d = ce.detail || { level: 'info', title: '', message: '' };
      setDetail(d);
      setOpen(true);
      setShowCriticalModal(d.level === 'danger');
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setOpen(false), d.durationMs ?? 6500);
    }
    window.addEventListener('nv:alert', onAlert as EventListener);
    return () => {
      window.removeEventListener('nv:alert', onAlert as EventListener);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  if (!open) return null;

  const colors = detail.level === 'danger'
    ? 'from-red-600/90 to-pink-600/90 border-red-400/60'
    : detail.level === 'warning'
    ? 'from-yellow-600/90 to-orange-600/90 border-yellow-400/60'
    : 'from-cyan-600/90 to-blue-600/90 border-cyan-400/60';

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-[9999] pointer-events-none`}>
        <div className={`mx-auto max-w-5xl m-3 pointer-events-auto angular-border-sm border ${colors} bg-gradient-to-r text-white shadow-2xl`}
             style={{ backdropFilter: 'blur(6px)' }}>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full animate-pulse"
                   style={{ background: detail.level === 'danger' ? '#f87171' : detail.level === 'warning' ? '#fbbf24' : '#67e8f9' }} />
              <div>
                <div className="font-semibold tracking-wide uppercase text-sm">{detail.title}</div>
                {detail.message && <div className="text-xs opacity-90">{detail.message}</div>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-xs text-white/90 hover:text-white underline" onClick={() => {
                try {
                  const text = `${detail.title}${detail.message ? ` — ${detail.message}` : ''}`;
                  navigator.clipboard.writeText(text);
                } catch {}
              }}>Copy Details</button>
              <button className="text-xs text-white/80 hover:text-white" onClick={() => setOpen(false)}>Dismiss</button>
            </div>
          </div>
        </div>
      </div>

      {showCriticalModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCriticalModal(false)} />
          <div className="relative mx-4 w-full max-w-md angular-border-sm border border-red-500/50 bg-gradient-to-b from-black/80 to-red-900/30 text-white shadow-2xl p-5" style={{ backdropFilter: 'blur(8px)' }}>
            <div className="text-red-300 font-semibold tracking-wide mb-1">CRITICAL ALERT</div>
            <div className="text-lg font-mono mb-2">{detail.title}</div>
            {detail.message && <div className="text-sm text-gray-200/90 mb-4">{detail.message}</div>}
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1.5 text-sm rounded-md bg-red-600/90 hover:bg-red-600 border border-red-400/50"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('nv:navigate', { detail: { tab: 'dashboard' } }));
                  setShowCriticalModal(false);
                }}>Go to Dashboard</button>
              <button className="px-3 py-1.5 text-sm rounded-md bg-gray-700/90 hover:bg-gray-700 border border-gray-500/50"
                onClick={() => setShowCriticalModal(false)}>Proceed Anyway</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
