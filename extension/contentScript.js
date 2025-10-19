// Neon Veil Content Script: Auto-analyze the current webpage and show a floating risk popup.

// We rely on NV_analyzeText from analyzer-shared.js for message analysis
function analyzeText(message) {
  // Extend results with page-heuristics (TLD, external links)
  const base = (globalThis.NV_analyzeText || ((m)=>({riskScore:0,classification:'SAFE',indicators:[],category:'Legitimate',confidence:60,processingTime:0.3})))(message);
  const indicators = base.indicators.slice();
  let riskScore = base.riskScore;
  try {
    const url = new URL(location.href);
    const tld = url.hostname.split('.').pop();
    const suspiciousTlds = ['xyz', 'top', 'click', 'live', 'loan', 'win', 'ru'];
    if (tld && suspiciousTlds.includes(tld)) {
      indicators.push(`Suspicious TLD .${tld}`);
      riskScore += 15;
    }
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const externalLinks = anchors.filter(a => {
      try {
        const u = new URL(a.href, location.href);
        return u.hostname !== url.hostname;
      } catch { return false; }
    });
    if (externalLinks.length > 20) {
      indicators.push('High number of external links');
      riskScore += 10;
    }
  } catch {}
  // Recompute classification by riskScore
  let classification = 'SAFE';
  if (riskScore >= 75) classification = 'CRITICAL';
  else if (riskScore >= 55) classification = 'DANGEROUS';
  else if (riskScore >= 30) classification = 'SUSPICIOUS';
  return {
    ...base,
    indicators,
    riskScore: Math.min(100, riskScore),
    classification,
    url: location.href,
    title: document.title
  };
}

function showCriticalModal(res) {
  const risk = res && typeof res.riskScore === 'number' ? res.riskScore : 0;
  if (risk < 55) return; // Only for HIGH
  const id = 'nv-critical-modal';
  if (document.getElementById(id)) return;
  const wrap = document.createElement('div');
  wrap.id = id;
  wrap.style.position = 'fixed';
  wrap.style.inset = '0';
  wrap.style.zIndex = '2147483647';
  wrap.innerHTML = '';
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,.55)';
  overlay.addEventListener('click', () => wrap.remove());
  const box = document.createElement('div');
  box.style.position = 'relative';
  box.style.margin = '10vh auto 0 auto';
  box.style.maxWidth = '520px';
  box.style.border = '1px solid rgba(248,113,113,.5)';
  box.style.borderRadius = '10px';
  box.style.background = 'linear-gradient(180deg, rgba(0,0,0,.85), rgba(127,29,29,.4))';
  box.style.color = '#fff';
  box.style.padding = '18px';
  box.style.boxShadow = '0 10px 40px rgba(0,0,0,.5)';
  const h = document.createElement('div');
  h.style.fontWeight = '800'; h.style.letterSpacing = '.04em'; h.style.marginBottom = '6px'; h.textContent = 'CRITICAL ALERT';
  const t = document.createElement('div'); t.style.fontFamily = 'monospace'; t.style.fontSize = '16px'; t.style.marginBottom = '6px'; t.textContent = `${res.classification} — ${res.riskScore}/100`;
  const m = document.createElement('div'); m.style.opacity = '.9'; m.style.fontSize = '13px'; m.style.marginBottom = '12px'; m.textContent = `${document.title}`;
  const row = document.createElement('div'); row.style.display = 'flex'; row.style.gap = '8px'; row.style.justifyContent = 'flex-end';
  const btnBack = document.createElement('button');
  btnBack.textContent = 'Dismiss';
  btnBack.style.padding = '6px 10px'; btnBack.style.borderRadius = '6px'; btnBack.style.border = '1px solid rgba(255,255,255,.4)'; btnBack.style.background = 'rgba(55,65,81,.6)'; btnBack.style.color = '#fff';
  btnBack.addEventListener('click', () => wrap.remove());
  const btnCopy = document.createElement('button');
  btnCopy.textContent = 'Copy Details';
  btnCopy.style.padding = '6px 10px'; btnCopy.style.borderRadius = '6px'; btnCopy.style.border = '1px solid rgba(255,255,255,.4)'; btnCopy.style.background = 'rgba(220,38,38,.8)'; btnCopy.style.color = '#fff';
  btnCopy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(`${res.classification} (${res.riskScore}/100) — ${location.href}`); } catch {}
  });
  row.appendChild(btnBack); row.appendChild(btnCopy);
  box.appendChild(h); box.appendChild(t); box.appendChild(m); box.appendChild(row);
  wrap.appendChild(overlay); wrap.appendChild(box);
  document.documentElement.appendChild(wrap);
}

function showTopBanner(res) {
  const risk = res && typeof res.riskScore === 'number' ? res.riskScore : 0;
  const level = risk >= 55 ? 'danger' : risk >= 30 ? 'warning' : 'info';
  const id = 'nv-top-banner';
  let bar = document.getElementById(id);
  if (!bar) {
    bar = document.createElement('div');
    bar.id = id;
    bar.style.position = 'fixed';
    bar.style.top = '0';
    bar.style.left = '0';
    bar.style.right = '0';
    bar.style.zIndex = '2147483646';
    bar.style.padding = '10px 14px';
    bar.style.display = 'flex';
    bar.style.justifyContent = 'space-between';
    bar.style.alignItems = 'center';
    bar.style.fontFamily = 'Inter, system-ui, sans-serif';
    bar.style.fontSize = '13px';
    document.documentElement.appendChild(bar);
  }
  const bg = level === 'danger' ? 'linear-gradient(90deg,#7f1d1d,#9f1239)'
    : level === 'warning' ? 'linear-gradient(90deg,#92400e,#a16207)'
    : 'linear-gradient(90deg,#0e7490,#1d4ed8)';
  bar.style.background = bg;
  bar.style.color = '#fff';
  bar.style.borderBottom = '1px solid rgba(255,255,255,.25)';
  const band = risk >= 55 ? 'HIGH' : risk >= 30 ? 'MODERATE' : 'LOW';
  bar.innerHTML = '';
  const left = document.createElement('div');
  left.textContent = `Neon Veil Alert — ${res.classification} (${band}) · ${res.riskScore}/100`;
  const right = document.createElement('button');
  right.textContent = 'Dismiss';
  right.style.background = 'transparent';
  right.style.border = '1px solid rgba(255,255,255,.4)';
  right.style.color = '#fff';
  right.style.padding = '4px 8px';
  right.style.borderRadius = '4px';
  right.style.cursor = 'pointer';
  right.addEventListener('click', () => { bar && bar.remove(); });
  bar.appendChild(left); bar.appendChild(right);
  // Auto-dismiss low info alerts, keep danger longer
  const ms = risk >= 55 ? 10000 : risk >= 30 ? 8000 : 5000;
  setTimeout(() => { const b = document.getElementById(id); if (b) b.remove(); }, ms);
}

function ensurePopup() {
  let el = document.getElementById('nv-floating-risk');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'nv-floating-risk';
  el.style.position = 'fixed';
  el.style.zIndex = '2147483647';
  el.style.right = '12px';
  el.style.bottom = '12px';
  el.style.padding = '10px 12px';
  el.style.borderRadius = '10px';
  el.style.backdropFilter = 'blur(6px)';
  el.style.boxShadow = '0 4px 18px rgba(0,0,0,.45), 0 0 12px rgba(34,211,238,.35)';
  el.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif';
  el.style.fontSize = '12px';
  el.style.color = '#e5e7eb';
  el.style.background = 'linear-gradient(180deg, rgba(2,6,23,.9), rgba(2,6,23,.7))';
  el.style.border = '1px solid rgba(34,211,238,.35)';
  el.innerHTML = '<strong style="letter-spacing:.06em;color:#67e8f9;text-shadow:0 0 6px rgba(34,211,238,.6)">NEON VEIL</strong> <span id="nv-riskline" style="margin-left:8px"></span> <span id="nv-band" style="margin-left:6px;font-weight:700"></span> <button id="nv-close" style="margin-left:10px;background:transparent;border:0;color:#9ca3af;cursor:pointer">✕</button>';
  document.documentElement.appendChild(el);
  el.querySelector('#nv-close').addEventListener('click', () => el.remove());
  return el;
}

function setRiskLine(res) {
  const line = document.getElementById('nv-riskline');
  const bandEl = document.getElementById('nv-band');
  if (!line) return;
  const clsColor = {
    SAFE: '#34d399',
    SUSPICIOUS: '#fbbf24',
    DANGEROUS: '#f87171',
    CRITICAL: '#f472b6',
  }[res.classification] || '#e5e7eb';
  line.textContent = `Risk ${res.riskScore}/100 — ${res.classification}`;
  line.style.color = clsColor;
  line.style.textShadow = '0 0 6px rgba(255,255,255,.15)';
  if (bandEl) {
    const band = res.riskScore >= 55 ? 'HIGH' : res.riskScore >= 30 ? 'MODERATE' : 'LOW';
    bandEl.textContent = `(${band})`;
    bandEl.style.color = band === 'HIGH' ? '#f472b6' : band === 'MODERATE' ? '#fbbf24' : '#34d399';
    bandEl.style.textShadow = '0 0 6px rgba(255,255,255,.15)';
  }
}

function storeResult(res) {
  const key = 'nv_page_results';
  chrome.storage.local.get([key], data => {
    const map = data[key] && typeof data[key] === 'object' ? data[key] : {};
    map[res.url] = { ...res, ts: Date.now() };
    // Bound map size to ~30 entries
    const entries = Object.entries(map).sort((a,b) => b[1].ts - a[1].ts).slice(0, 30);
    const bounded = Object.fromEntries(entries);
    chrome.storage.local.set({ [key]: bounded });
  });
}

function sendToBackground(res) {
  try {
    chrome.runtime.sendMessage({ type: 'NV_PAGE_ANALYSIS', result: res });
  } catch {}
}

function getPageText() {
  return (document.body && document.body.innerText ? document.body.innerText : document.documentElement.innerText || '').slice(0, 40000);
}

function highlightPhrases() {
  const patterns = [
    /(urgent|act now)/gi,
    /(winner|congratulations)/gi,
    /(bitcoin|crypto|investment)/gi,
    /(prince|inheritance)/gi,
    /(verify|suspended|login)/gi,
    /(click here|download)/gi,
  ];

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
      const s = node.nodeValue.trim();
      if (s.length < 3) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach(textNode => {
    const parent = textNode.parentNode;
    if (!parent || (parent.closest && parent.closest('#nv-floating-risk'))) return;
    let html = textNode.nodeValue;
    let replaced = false;
    patterns.forEach(rx => {
      html = html.replace(rx, m => {
        replaced = true;
        return `<span class="nv-highlight" title="Suspicious phrase" style="background: rgba(251,191,36,.2); outline: 1px dashed rgba(251,191,36,.6); border-radius: 3px;">${m}</span>`;
      });
    });
    if (replaced) {
      const span = document.createElement('span');
      span.innerHTML = html;
      parent.replaceChild(span, textNode);
    }
  });
}

function runAnalysis() {
  const text = getPageText();
  let res = analyzeText(text);

  // Check blocklist to enforce extra warning and risk bump
  try {
    const host = location.hostname;
    chrome.storage.local.get(['nv_blocklist', 'nv_settings'], data => {
      const flagged = data.nv_blocklist && data.nv_blocklist[host];
      const settings = data.nv_settings || {};
      const sensitivity = Math.max(50, Math.min(150, Number(settings.sensitivity) || 100));
      // Apply sensitivity scaling (50%..150%)
      res.riskScore = Math.max(0, Math.min(100, Math.round(res.riskScore * (sensitivity / 100))));
      if (flagged) {
        res = { ...res, classification: 'CRITICAL', riskScore: Math.max(res.riskScore, 90) };
      }
      const popup = ensurePopup();
      if (flagged) {
        popup.style.border = '1px solid rgba(244,114,182,.6)';
        popup.style.boxShadow = '0 4px 18px rgba(0,0,0,.45), 0 0 14px rgba(244,114,182,.5)';
      }
      setRiskLine(res);
      // Visual alert banner on page
      try {
        showTopBanner(res);
        // Mirror alert entry into daily logs
        try {
          const d = new Date();
          const dayKey = `nv_ext_stats_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          const level = res.riskScore >= 55 ? 'danger' : res.riskScore >= 30 ? 'warning' : 'info';
          chrome.storage.local.get([dayKey], data2 => {
            const st = data2[dayKey] && typeof data2[dayKey] === 'object' ? data2[dayKey] : { sitesAnalyzed: 0, scamsDetected: 0, warningsIssued: 0, logs: [] };
            st.logs.unshift({ ts: Date.now(), type: 'alert', level, source: 'page', title: `Page Risk ${res.riskScore}/100`, message: `${res.classification} — ${document.title}` });
            st.logs = st.logs.slice(0, 200);
            chrome.storage.local.set({ [dayKey]: st }, () => {
              try { chrome.runtime.sendMessage({ type: 'NV_STATS_UPDATED' }); } catch {}
            });
          });
        } catch {}
      } catch {}
      storeResult(res);
      sendToBackground(res);

      // Update Today's Stats (extension)
      try {
        const d = new Date();
        const dayKey = `nv_ext_stats_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        chrome.storage.local.get([dayKey], data2 => {
          const st = data2[dayKey] && typeof data2[dayKey] === 'object' ? data2[dayKey] : { sitesAnalyzed: 0, scamsDetected: 0, warningsIssued: 0, logs: [] };
          st.sitesAnalyzed += 1;
          if (res.classification === 'SUSPICIOUS' || res.classification === 'DANGEROUS' || res.classification === 'CRITICAL') st.scamsDetected += 1;
          if (res.classification === 'DANGEROUS' || res.classification === 'CRITICAL') st.warningsIssued += 1;
          st.logs.unshift({ ts: Date.now(), type: 'page', url: location.href, title: document.title, classification: res.classification, riskScore: res.riskScore, category: res.category });
          st.logs = st.logs.slice(0, 200);
          chrome.storage.local.set({ [dayKey]: st }, () => {
            try { chrome.runtime.sendMessage({ type: 'NV_STATS_UPDATED' }); } catch {}
          });
        });
      } catch {}

      // Inline highlights controlled by settings (default on)
      if (settings.inlineHighlights !== false) {
        highlightPhrases();
      }
    });
  } catch {
    const popup = ensurePopup();
    setRiskLine(res);
    try { 
      showTopBanner(res);
      // Mirror alert entry into daily logs
      try {
        const d = new Date();
        const dayKey = `nv_ext_stats_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const level = res.riskScore >= 55 ? 'danger' : res.riskScore >= 30 ? 'warning' : 'info';
        chrome.storage.local.get([dayKey], data2 => {
          const st = data2[dayKey] && typeof data2[dayKey] === 'object' ? data2[dayKey] : { sitesAnalyzed: 0, scamsDetected: 0, warningsIssued: 0, logs: [] };
          st.logs.unshift({ ts: Date.now(), type: 'alert', level, source: 'page', title: `Page Risk ${res.riskScore}/100`, message: `${res.classification} — ${document.title}` });
          st.logs = st.logs.slice(0, 200);
          chrome.storage.local.set({ [dayKey]: st }, () => {
            try { chrome.runtime.sendMessage({ type: 'NV_STATS_UPDATED' }); } catch {}
          });
        });
      } catch {}
    } catch {}
    storeResult(res);
    sendToBackground(res);
    // Stats update in fallback path as well
    try {
      const d = new Date();
      const dayKey = `nv_ext_stats_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      chrome.storage.local.get([dayKey], data2 => {
        const st = data2[dayKey] && typeof data2[dayKey] === 'object' ? data2[dayKey] : { sitesAnalyzed: 0, scamsDetected: 0, warningsIssued: 0, logs: [] };
        st.sitesAnalyzed += 1;
        if (res.classification === 'SUSPICIOUS' || res.classification === 'DANGEROUS' || res.classification === 'CRITICAL') st.scamsDetected += 1;
        if (res.classification === 'DANGEROUS' || res.classification === 'CRITICAL') st.warningsIssued += 1;
        st.logs.unshift({ ts: Date.now(), type: 'page', url: location.href, title: document.title, classification: res.classification, riskScore: res.riskScore, category: res.category });
        st.logs = st.logs.slice(0, 200);
        chrome.storage.local.set({ [dayKey]: st }, () => {
          try { chrome.runtime.sendMessage({ type: 'NV_STATS_UPDATED' }); } catch {}
        });
      });
    } catch {}
    // Default to highlight on if settings not available
    highlightPhrases();
  }
}

// Initial run
runAnalysis();

// Support manual re-scan from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'NV_PING') {
    try { sendResponse({ ok: true }); } catch {}
    return true;
  }
  if (msg && msg.type === 'NV_RESCAN_PAGE') {
    runAnalysis();
    return true;
  }
  if (msg && msg.type === 'NV_BLOCKLIST_CHANGED') {
    // Re-run to reflect flagged/unflagged state
    runAnalysis();
    return true;
  }
});

// Bridge for in-app integration (web page -> content script)
try {
  window.addEventListener('message', (e) => {
    const d = e && e.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'NV_PING_APP') {
      // Let the app know the extension is present on this page
      window.postMessage({ type: 'NV_PONG_APP' }, '*');
    }
    if (d.type === 'NV_ANALYZE_CURRENT') {
      runAnalysis();
    }
  });
} catch {}

