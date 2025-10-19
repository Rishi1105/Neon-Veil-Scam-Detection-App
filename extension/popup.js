// Use shared analyzer from analyzer-shared.js
function analyzeText(message) {
  const fn = (globalThis.NV_analyzeText || ((m)=>({riskScore:0,classification:'SAFE',indicators:[],category:'Legitimate',confidence:60,processingTime:0.3})));
  return fn(message);
}

// Render blocklist manager
function drawBlocklist(map) {
  try {
    const el = document.getElementById('blocklist');
    if (!el) return;
    el.innerHTML = '';
    const entries = Object.entries(map || {}).sort((a,b)=> (b[1]?.ts||0) - (a[1]?.ts||0));
    if (entries.length === 0) {
      el.textContent = 'No flagged domains.';
      return;
    }
    entries.slice(0, 100).forEach(([host, info]) => {
      const row = document.createElement('div');
      row.style.display = 'flex'; row.style.justifyContent = 'space-between'; row.style.alignItems = 'center';
      row.style.gap = '6px'; row.style.margin = '6px 0';
      const left = document.createElement('div');
      left.style.fontSize = '12px'; left.style.color = '#d1d5db'; left.textContent = host;
      const btn = document.createElement('button');
      btn.textContent = 'Remove';
      btn.className = 'btn';
      btn.style.width = 'auto'; btn.style.padding = '4px 8px'; btn.style.fontSize = '12px';
      btn.style.background = 'linear-gradient(90deg,#ef4444,#f472b6)';
      btn.addEventListener('click', () => {
        chrome.storage.local.get(['nv_blocklist'], d => {
          const m = (d.nv_blocklist && typeof d.nv_blocklist === 'object') ? d.nv_blocklist : {};
          delete m[host];
          chrome.storage.local.set({ nv_blocklist: m }, () => drawBlocklist(m));
        });
      });
      row.appendChild(left); row.appendChild(btn);
      el.appendChild(row);
    });
  } catch {}
}

function buildWeekHtml(days) {
  const style = `
    <style>
      body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;color:#111827}
      h1{font-size:20px;margin:0 0 4px;font-weight:800}
      h2{font-size:16px;margin:18px 0 6px;font-weight:800}
      .sub{color:#6b7280;margin:0 0 14px}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #d1d5db;padding:6px 8px;font-size:12px}
      th{background:#f3f4f6;text-align:left}
      .stats{margin:10px 0 14px;display:flex;gap:12px}
      .chip{border:1px solid #d1d5db;border-radius:8px;padding:6px 10px;background:#f9fafb}
      .day{page-break-inside:avoid}
    </style>`;
  const body = days.map(d => {
    const rows = (Array.isArray(d.stats.logs) ? d.stats.logs : []).map(l => {
      const t = new Date(l.ts).toLocaleString();
      if (l.type === 'alert') return `<tr><td>${t}</td><td>ALERT</td><td>${(l.level||'').toUpperCase()}</td><td>${l.title||''}</td><td>${l.message||''}</td></tr>`;
      return `<tr><td>${t}</td><td>${l.type}</td><td>${l.classification||''}</td><td>${l.category||''}</td><td>${l.riskScore!=null?l.riskScore+'/100':''}</td></tr>`;
    }).join('');
    return `<div class="day">
      <h2>${d.day}</h2>
      <div class="stats">
        <div class="chip">Sites: <strong>${d.stats.sitesAnalyzed||0}</strong></div>
        <div class="chip">Scams: <strong>${d.stats.scamsDetected||0}</strong></div>
        <div class="chip">Warnings: <strong>${d.stats.warningsIssued||0}</strong></div>
      </div>
      <table><thead><tr><th>Time</th><th>Type</th><th>Status/Level</th><th>Title/Category</th><th>Score/Message</th></tr></thead><tbody>${rows||''}</tbody></table>
    </div>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8">${style}<title>Neon Veil — Weekly Logs</title></head><body>
    <h1>Neon Veil — Weekly Logs</h1>
    <div class="sub">Generated ${new Date().toLocaleString()}</div>
    ${body}
  </body></html>`;
}

function exportWeekPdf() {
  const keys = lastNDaysKeys(7);
  chrome.storage.local.get(keys, data => {
    const days = keys.map(k => ({ day: k, stats: data[k] || { sitesAnalyzed:0, scamsDetected:0, warningsIssued:0, logs:[] } }));
    const html = buildWeekHtml(days);
    const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const w = window.open(blobUrl);
    if (!w) return;
    setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 500);
  });
}

function exportWeekDoc() {
  const keys = lastNDaysKeys(7);
  chrome.storage.local.get(keys, data => {
    const days = keys.map(k => ({ day: k, stats: data[k] || { sitesAnalyzed:0, scamsDetected:0, warningsIssued:0, logs:[] } }));
    const html = buildWeekHtml(days);
    const blob = new Blob([`\ufeff` + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'neon-veil-week-logs.doc'; a.click(); URL.revokeObjectURL(url);
  });
}

function buildLogsHtml(st, title = "Neon Veil — Today's Logs") {
  const rows = (Array.isArray(st.logs) ? st.logs : []).map(l => {
    const t = new Date(l.ts).toLocaleString();
    if (l.type === 'alert') {
      return `<tr><td>${t}</td><td>ALERT</td><td>${(l.level||'').toUpperCase()}</td><td>${l.title||''}</td><td>${l.message||''}</td></tr>`;
    } else {
      return `<tr><td>${t}</td><td>${l.type}</td><td>${l.classification||''}</td><td>${l.category||''}</td><td>${l.riskScore!=null?l.riskScore+'/100':''}</td></tr>`;
    }
  }).join('');
  const style = `
    <style>
      body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;color:#111827}
      h1{font-size:20px;margin:0 0 4px;font-weight:800}
      .sub{color:#6b7280;margin:0 0 14px}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #d1d5db;padding:6px 8px;font-size:12px}
      th{background:#f3f4f6;text-align:left}
      .stats{margin:10px 0 14px;display:flex;gap:12px}
      .chip{border:1px solid #d1d5db;border-radius:8px;padding:6px 10px;background:#f9fafb}
    </style>`;
  return `<!doctype html><html><head><meta charset="utf-8">${style}<title>${title}</title></head><body>
    <h1>${title}</h1>
    <div class="sub">Generated ${new Date().toLocaleString()}</div>
    <div class="stats">
      <div class="chip">Sites Analyzed: <strong>${st.sitesAnalyzed||0}</strong></div>
      <div class="chip">Scams Detected: <strong>${st.scamsDetected||0}</strong></div>
      <div class="chip">Warnings Issued: <strong>${st.warningsIssued||0}</strong></div>
    </div>
    <table>
      <thead><tr><th>Time</th><th>Type</th><th>Status/Level</th><th>Title/Category</th><th>Score/Message</th></tr></thead>
      <tbody>${rows||''}</tbody>
    </table>
  </body></html>`;
}

function exportLogsPdf() {
  const key = dayKey();
  chrome.storage.local.get([key], data => {
    const st = data[key] && typeof data[key] === 'object' ? data[key] : { sitesAnalyzed:0, scamsDetected:0, warningsIssued:0, logs:[] };
    const html = buildLogsHtml(st, `Neon Veil — ${key} Logs`);
    const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const w = window.open(blobUrl);
    if (!w) return;
    setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 500);
  });
}

function exportLogsDoc() {
  const key = dayKey();
  chrome.storage.local.get([key], data => {
    const st = data[key] && typeof data[key] === 'object' ? data[key] : { sitesAnalyzed:0, scamsDetected:0, warningsIssued:0, logs:[] };
    const html = buildLogsHtml(st, `Neon Veil — ${key} Logs`);
    const blob = new Blob([`\ufeff` + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'neon-veil-logs.doc'; a.click(); URL.revokeObjectURL(url);
  });
}

function renderResults(res) {
  const results = document.getElementById('results');
  const cls = document.getElementById('cls');
  const category = document.getElementById('category');
  const confidence = document.getElementById('confidence');
  const indicators = document.getElementById('indicators');
  const time = document.getElementById('time');

  cls.textContent = `${res.classification} — ${res.riskScore}/100`;
  cls.className = `classification ${res.classification}`;
  category.textContent = res.category;
  confidence.textContent = `${res.confidence}%`;
  indicators.innerHTML = '';
  res.indicators.forEach(i => {
    const row = document.createElement('div');
    const dot = document.createElement('span');
    dot.className = 'dot';
    row.appendChild(dot);
    const span = document.createElement('span');
    span.textContent = i;
    row.appendChild(span);
    indicators.appendChild(row);
  });

  // Load blocklist
  chrome.storage.local.get(['nv_blocklist'], data => {
    drawBlocklist(data.nv_blocklist || {});
  });
  time.textContent = `Processed in ${res.processingTime.toFixed(2)}s`;
  results.style.display = 'block';
}

function pushRecent(res) {
  chrome.storage.local.get(['nv_recent_ext'], data => {
    const items = Array.isArray(data.nv_recent_ext) ? data.nv_recent_ext : [];
    const updated = [res, ...items].slice(0, 20);
    chrome.storage.local.set({ nv_recent_ext: updated });
    drawRecent(updated);
  });
}

function lastNDaysKeys(n) {
  const keys = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const dt = new Date(d);
    dt.setDate(d.getDate() - i);
    const key = `nv_ext_stats_${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    keys.push(key);
  }
  return keys;
}

function loadWeekTotals() {
  const keys = lastNDaysKeys(7);
  chrome.storage.local.get(keys, data => {
    let sites = 0, scams = 0, warnings = 0;
    keys.forEach(k => {
      const v = data[k];
      if (v && typeof v === 'object') {
        sites += v.sitesAnalyzed || 0;
        scams += v.scamsDetected || 0;
        warnings += v.warningsIssued || 0;
      }
    });
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val); };
    set('weekSites', sites);
    set('weekScams', scams);
    set('weekWarnings', warnings);
  });
}

function dayKey() {
  const d = new Date();
  return `nv_ext_stats_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function loadTodayStats() {
  const key = dayKey();
  chrome.storage.local.get([key], data => {
    const st = data[key] && typeof data[key] === 'object' ? data[key] : { sitesAnalyzed: 0, scamsDetected: 0, warningsIssued: 0, logs: [] };
    const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v); };
    s('statSites', st.sitesAnalyzed);
    s('statScams', st.scamsDetected);
    s('statWarnings', st.warningsIssued);

    // Render today's logs
    const logsEl = document.getElementById('todayLogs');
    const alertsOnlyCb = document.getElementById('alertsOnly');
    if (logsEl) {
      logsEl.innerHTML = '';
      const list = Array.isArray(st.logs) ? st.logs : [];
      const filtered = alertsOnlyCb && alertsOnlyCb.checked ? list.filter(l=>l && l.type==='alert') : list;
      if (filtered.length === 0) {
        logsEl.textContent = 'No logs yet for today.';
      } else {
        filtered.slice(0, 50).forEach(l => {
          const row = document.createElement('div');
          row.style.margin = '6px 0';
          row.className = 'card';
          const t = new Date(l.ts).toLocaleTimeString();
          if (l.type === 'alert') {
            row.textContent = `${t} • ALERT • ${String(l.level||'').toUpperCase()} • ${l.title}${l.message?` — ${l.message}`:''}`;
          } else {
            row.textContent = `${t} • ${l.type} • ${l.classification} • ${l.riskScore}/100 • ${l.category}`;
          }
          logsEl.appendChild(row);
        });
      }
    }
  });
}

function drawRecent(list) {
  const container = document.getElementById('recent');
  container.innerHTML = '';
  if (!list || list.length === 0) {
    container.textContent = 'No recent analyses yet.';
    return;
  }
  list.forEach(r => {
    const div = document.createElement('div');
    div.style.margin = '6px 0';
    div.textContent = `${r.classification} - ${r.category} (${r.riskScore}/100)`;
    container.appendChild(div);
  });
}

function setCurrentRiskRow(res) {
  const currentTitle = document.getElementById('currentTitle');
  const currentRisk = document.getElementById('currentRisk');
  if (!res) {
    currentTitle.textContent = 'No analysis yet';
    currentRisk.textContent = '';
    return;
  }
  currentTitle.textContent = res.title || 'Current Page';
  const band = res.riskScore >= 55 ? 'HIGH' : res.riskScore >= 30 ? 'MODERATE' : 'LOW';
  currentRisk.textContent = `Risk ${res.riskScore}/100 — ${res.classification} (${band})`;
  const color = {
    SAFE: '#34d399',
    SUSPICIOUS: '#fbbf24',
    DANGEROUS: '#f87171',
    CRITICAL: '#f472b6',
  }[res.classification] || '#e5e7eb';
  currentRisk.style.color = color;
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs && tabs[0];
}

async function loadCurrentPageStatus() {
  const tab = await getActiveTab();
  const currentTitle = document.getElementById('currentTitle');
  const currentRisk = document.getElementById('currentRisk');
  if (!tab) {
    if (currentTitle) currentTitle.textContent = 'No active tab';
    if (currentRisk) currentRisk.textContent = '';
    return;
  }
  const messageable = canMessageTab(tab);
  if (!messageable) {
    if (currentTitle) currentTitle.textContent = 'Unsupported page (chrome://, store, or PDF)';
    if (currentRisk) currentRisk.textContent = 'Open an http/https page and click RESCAN';
    return;
  }
  const url = tab.url;
  chrome.storage.local.get(['nv_page_results'], async data => {
    const map = data.nv_page_results || {};
    const res = map[url];
    if (res) {
      setCurrentRiskRow(res);
    } else {
      if (currentTitle) currentTitle.textContent = 'Requesting analysis…';
      if (currentRisk) currentRisk.textContent = '';
      const ok = await ensureContentScript(tab);
      if (ok) sendMessageSafe(tab, { type: 'NV_RESCAN_PAGE' });
      // After a short delay, try to read again
      setTimeout(() => loadCurrentPageStatus(), 1800);
    }
  });
}

function canMessageTab(tab) {
  try {
    return !!tab && typeof tab.url === 'string' && /^https?:/i.test(tab.url) && tab.id != null;
  } catch { return false; }
}

function sendMessageSafe(tab, msg) {
  if (!canMessageTab(tab)) return;
  try {
    chrome.tabs.sendMessage(tab.id, msg, () => { void chrome.runtime.lastError; });
  } catch {}
}

async function ensureContentScript(tab) {
  return new Promise(resolve => {
    if (!canMessageTab(tab)) return resolve(false);
    // Ping the content script
    try {
      chrome.tabs.sendMessage(tab.id, { type: 'NV_PING' }, async () => {
        const err = chrome.runtime.lastError;
        if (!err) return resolve(true);
        // Not present: try to inject
        try {
          await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['analyzer-shared.js'] });
          await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['contentScript.js'] });
          // Give it a tick
          setTimeout(() => resolve(true), 150);
        } catch {
          resolve(false);
        }
      });
    } catch {
      resolve(false);
    }
  });
}

function getHost(u) {
  try { return new URL(u).hostname; } catch { return null; }
}

async function updateFlagButton() {
  const tab = await getActiveTab();
  if (!tab) return;
  const host = getHost(tab.url);
  const btn = document.getElementById('flagBtn');
  if (!host || !btn) return;
  chrome.storage.local.get(['nv_blocklist'], data => {
    const blocked = data.nv_blocklist && data.nv_blocklist[host];
    btn.textContent = blocked ? 'UNFLAG' : 'FLAG';
  });
}

async function toggleFlagCurrent() {
  const tab = await getActiveTab();
  if (!tab) return;
  const host = getHost(tab.url);
  if (!host) return;
  chrome.storage.local.get(['nv_blocklist'], data => {
    const map = (data.nv_blocklist && typeof data.nv_blocklist === 'object') ? data.nv_blocklist : {};
    if (map[host]) delete map[host]; else map[host] = { ts: Date.now() };
    chrome.storage.local.set({ nv_blocklist: map }, () => {
      updateFlagButton();
      // Ask the content script to re-run to reflect blocklist changes
      if (tab.id != null) chrome.tabs.sendMessage(tab.id, { type: 'NV_BLOCKLIST_CHANGED' });
    });
  });
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('input');
  const scanBtn = document.getElementById('scanBtn');
  const rescanBtn = document.getElementById('rescanBtn');
  const flagBtn = document.getElementById('flagBtn');
  const exportPageBtn = document.getElementById('exportPageBtn');
  const exportMsgBtn = document.getElementById('exportMsgBtn');
  const toggleHighlights = document.getElementById('toggleHighlights');
  const sensitivity = document.getElementById('sensitivity');
  const analyzeNowBtn = document.getElementById('analyzeNowBtn');
  const viewLogsBtn = document.getElementById('viewLogsBtn');
  const gotoSettingsBtn = document.getElementById('gotoSettingsBtn');
  const resetTodayBtn = document.getElementById('resetTodayBtn');
  const exportTodayBtn = document.getElementById('exportTodayBtn');
  const exportWeekBtn = document.getElementById('exportWeekBtn');
  const alertsOnlyCb = document.getElementById('alertsOnly');
  if (alertsOnlyCb) alertsOnlyCb.addEventListener('change', () => loadTodayStats());
  const exportLogsPdfBtn = document.getElementById('exportLogsPdfBtn');
  const exportLogsDocBtn = document.getElementById('exportLogsDocBtn');
  if (exportLogsPdfBtn) exportLogsPdfBtn.addEventListener('click', exportLogsPdf);
  if (exportLogsDocBtn) exportLogsDocBtn.addEventListener('click', exportLogsDoc);
  const exportWeekPdfBtn = document.getElementById('exportWeekPdfBtn');
  const exportWeekDocBtn = document.getElementById('exportWeekDocBtn');
  if (exportWeekPdfBtn) exportWeekPdfBtn.addEventListener('click', exportWeekPdf);
  if (exportWeekDocBtn) exportWeekDocBtn.addEventListener('click', exportWeekDoc);

  // Load any text captured from the context-menu selection
  chrome.storage.local.get(['nv_last_selection', 'nv_recent_ext'], data => {
    if (data.nv_last_selection) {
      input.value = data.nv_last_selection;
      // clear it after loading to avoid confusion later
      chrome.storage.local.remove('nv_last_selection');
    }
    if (Array.isArray(data.nv_recent_ext)) {
      drawRecent(data.nv_recent_ext);
    }
  });

  // Load current page status
  loadCurrentPageStatus();
  updateFlagButton();
  loadTodayStats();
  loadWeekTotals();

  // Load settings
  chrome.storage.local.get(['nv_settings', 'nv_last_msg_result'], data => {
    const s = data.nv_settings || {};
    toggleHighlights.checked = s.inlineHighlights !== false; // default true
    sensitivity.value = s.sensitivity || 100;
    // Restore last message results if present
    if (data.nv_last_msg_result) {
      renderResults(data.nv_last_msg_result);
    }
  });

  scanBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) return;
    const res = analyzeText(text);
    renderResults(res);
    pushRecent(res);
    chrome.storage.local.set({ nv_last_msg_result: res });

    // Increment today's stats after message scan
    try {
      const key = dayKey();
      chrome.storage.local.get([key], data => {
        const st = data[key] && typeof data[key] === 'object' ? data[key] : { sitesAnalyzed: 0, scamsDetected: 0, warningsIssued: 0, logs: [] };
        st.sitesAnalyzed += 1;
        if (res.classification === 'SUSPICIOUS' || res.classification === 'DANGEROUS' || res.classification === 'CRITICAL') st.scamsDetected += 1;
        if (res.classification === 'DANGEROUS' || res.classification === 'CRITICAL') st.warningsIssued += 1;
        st.logs.unshift({ ts: Date.now(), type: 'message', classification: res.classification, riskScore: res.riskScore, category: res.category, preview: text.slice(0, 140) });
        // Mirror alert entry
        const level = res.riskScore >= 55 ? 'danger' : res.riskScore >= 30 ? 'warning' : 'info';
        st.logs.unshift({ ts: Date.now(), type: 'alert', level, source: 'message', title: `Message Risk ${res.riskScore}/100`, message: res.classification });
        st.logs = st.logs.slice(0, 200);
        chrome.storage.local.set({ [key]: st }, () => loadTodayStats());
      });
    } catch {}
  });

  rescanBtn.addEventListener('click', async () => {
    const tab = await getActiveTab();
    if (!canMessageTab(tab)) return;
    const ok = await ensureContentScript(tab);
    if (ok) sendMessageSafe(tab, { type: 'NV_RESCAN_PAGE' });
  });

  flagBtn.addEventListener('click', () => {
    toggleFlagCurrent();
  });

  // Persist settings
  toggleHighlights.addEventListener('change', async () => {
    const tab = await getActiveTab();
    chrome.storage.local.get(['nv_settings'], data => {
      const s = data.nv_settings || {};
      s.inlineHighlights = toggleHighlights.checked;
      chrome.storage.local.set({ nv_settings: s }, () => {
        sendMessageSafe(tab, { type: 'NV_RESCAN_PAGE' });
      });
    });
  });

  sensitivity.addEventListener('input', async () => {
    const tab = await getActiveTab();
    chrome.storage.local.get(['nv_settings'], data => {
      const s = data.nv_settings || {};
      s.sensitivity = Number(sensitivity.value);
      chrome.storage.local.set({ nv_settings: s }, () => {
        sendMessageSafe(tab, { type: 'NV_RESCAN_PAGE' });
      });
    });
  });

  // Export current page report
  exportPageBtn.addEventListener('click', async () => {
    const tab = await getActiveTab();
    if (!tab) return;
    chrome.storage.local.get(['nv_page_results'], data => {
      const map = data.nv_page_results || {};
      const res = map[tab.url];
      if (!res) return;
      const blob = new Blob([JSON.stringify({ type: 'page', url: tab.url, result: res }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'neon-veil-page-report.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  // Export last message analysis
  exportMsgBtn.addEventListener('click', () => {
    chrome.storage.local.get(['nv_last_msg_result'], data => {
      const res = data.nv_last_msg_result;
      if (!res) return;
      const blob = new Blob([JSON.stringify({ type: 'message', result: res }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'neon-veil-message-report.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  // Analyze current site button -> Rescan
  analyzeNowBtn.addEventListener('click', async () => {
    const tab = await getActiveTab();
    if (!canMessageTab(tab)) return;
    const ok = await ensureContentScript(tab);
    if (ok) sendMessageSafe(tab, { type: 'NV_RESCAN_PAGE' });
  });

  // View logs button -> scroll to RECENT section
  viewLogsBtn.addEventListener('click', () => {
    const el = document.getElementById('recent');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Settings button -> scroll to SETTINGS section
  gotoSettingsBtn.addEventListener('click', () => {
    const input = document.getElementById('toggleHighlights');
    if (input) input.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Reset Today button
  resetTodayBtn.addEventListener('click', () => {
    const key = dayKey();
    const empty = { sitesAnalyzed: 0, scamsDetected: 0, warningsIssued: 0, logs: [] };
    chrome.storage.local.set({ [key]: empty }, () => { loadTodayStats(); loadWeekTotals(); });
  });

  // Export Today
  exportTodayBtn.addEventListener('click', () => {
    const key = dayKey();
    chrome.storage.local.get([key], data => {
      const payload = { day: key, stats: data[key] || { sitesAnalyzed:0, scamsDetected:0, warningsIssued:0, logs:[] } };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'neon-veil-ext-today.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  // Export Week
  exportWeekBtn.addEventListener('click', () => {
    const keys = lastNDaysKeys(7);
    chrome.storage.local.get(keys, data => {
      const payload = keys.map(k => ({ day: k, stats: data[k] || { sitesAnalyzed:0, scamsDetected:0, warningsIssued:0, logs:[] } }));
      const blob = new Blob([JSON.stringify({ range: 'last7days', days: payload }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'neon-veil-ext-week.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  });
});

// Live update when page analysis completes
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg && msg.type === 'NV_PAGE_ANALYSIS') {
    loadCurrentPageStatus();
    updateFlagButton();
    loadTodayStats();
    loadWeekTotals();
  }
  if (msg && msg.type === 'NV_STATS_UPDATED') {
    loadTodayStats();
    loadWeekTotals();
  }
});
