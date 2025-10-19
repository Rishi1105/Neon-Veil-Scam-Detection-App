chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'neonVeilAnalyze',
    title: 'Analyze with Neon Veil',
    contexts: ['selection']
  });
  chrome.action.setBadgeBackgroundColor({ color: '#111827' });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'neonVeilAnalyze' && info.selectionText) {
    chrome.storage.local.set({ nv_last_selection: info.selectionText.slice(0, 5000) });
  }
});

function badgeColorByClass(cls) {
  switch (cls) {
    case 'CRITICAL': return '#f472b6';
    case 'DANGEROUS': return '#ef4444';
    case 'SUSPICIOUS': return '#f59e0b';
    case 'SAFE':
    default:
      return '#10b981';
  }
}

function setBadge(tabId, result) {
  const text = String(Math.min(99, Math.max(0, Math.round(result.riskScore))));
  chrome.action.setBadgeText({ tabId, text });
  chrome.action.setBadgeBackgroundColor({ tabId, color: badgeColorByClass(result.classification) });
  chrome.action.setTitle({ tabId, title: `Neon Veil: ${result.classification} (${result.riskScore}/100)` });
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg && msg.type === 'NV_PAGE_ANALYSIS' && sender.tab && sender.tab.id != null) {
    setBadge(sender.tab.id, msg.result);
  }
});

// Clear badge on navigation start to avoid stale values
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ tabId, text: '' });
    chrome.action.setTitle({ tabId, title: 'Neon Veil' });
  }
});
