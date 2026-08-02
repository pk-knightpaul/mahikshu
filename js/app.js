/* ============================================================
   MAHIKSHU v3.0 — Core Application (Single File)
   PixelRAG key points + Glassmorphism UI + All features
   ============================================================ */

const state = {
  allData: [],
  filteredData: [],
  watchlist: JSON.parse(localStorage.getItem('mahikshu_watchlist') || '[]'),
  currentView: 'all',
  currentPlatform: null,
  currentSearch: '',
  currentTimeFilter: 'today',
  customDateFrom: null,
  customDateTo: null,
  currentSort: 'newest',
  theme: localStorage.getItem('mahikshu_theme') || 'dark',
  meta: null,
};

const SOURCES = ['binance', 'coingecko', 'dexscreener', 'news', 'defillama', 'fear_greed', 'snapshot'];

const PLATFORM_COLORS = {
  binance:    { color: '#f0b90b', bg: 'rgba(240,185,11,0.1)', border: 'rgba(240,185,11,0.2)' },
  coingecko:  { color: '#8dc647', bg: 'rgba(141,198,71,0.1)', border: 'rgba(141,198,71,0.2)' },
  dexscreener:{ color: '#4ecdc4', bg: 'rgba(78,205,196,0.1)', border: 'rgba(78,205,196,0.2)' },
  news:       { color: '#ff6b6b', bg: 'rgba(255,107,107,0.1)', border: 'rgba(255,107,107,0.2)' },
  defillama:  { color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)' },
  fear_greed: { color: '#f472b6', bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.2)' },
  snapshot:   { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
};

const PLATFORM_ICONS = {
  binance: '🟡', coingecko: '🦎', dexscreener: '🦄',
  news: '📰', defillama: '🦙', fear_greed: '😰', snapshot: '🗳️'
};

const PLATFORM_NAMES = {
  binance: 'Binance', coingecko: 'CoinGecko', dexscreener: 'DexScreener',
  news: 'News', defillama: 'DeFiLlama', fear_greed: 'Fear & Greed', snapshot: 'Snapshot'
};

/* ========== PIXELRAG-INSPIRED KEY POINT EXTRACTION ========== */
function extractKeyPoints(text, title) {
  if (!text) return [];
  const combined = title + ' ' + text;
  const sentences = combined.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  if (sentences.length === 0) return [];

  const scored = sentences.map(sentence => {
    let score = 0;
    const lower = sentence.toLowerCase();

    const numbers = sentence.match(/\b\d+(?:\.\d+)?(?:%|x|M|B|K|k)?\b/g);
    if (numbers) score += numbers.length * 3;

    if (sentence.match(/\$[\d,.]+[MBK]?/)) score += 4;

    const actions = ['launch','list','approve','announce','deploy','upgrade','hit','reach','surge','drop','rise','fall','add','remove','vote','pass','reject','integrate','partner'];
    actions.forEach(a => { if (lower.includes(a)) score += 2; });

    const cryptoTerms = ['bitcoin','ethereum','solana','btc','eth','sol','defi','nft','dao','etf','staking','apy','tvl','dex','cex'];
    cryptoTerms.forEach(t => { if (lower.includes(t)) score += 1.5; });

    if (sentence.match(/\b(?:today|yesterday|hour|day|week|month|202[4-9])\b/i)) score += 1;
    if (sentence.length > 180) score -= 1;
    if (sentence.length < 25) score -= 0.5;
    if (sentence.includes('|')) score += 1;

    return { text: sentence, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const selected = [];
  for (const item of scored) {
    if (selected.length >= 4) break;
    const isDup = selected.some(s => {
      const shared = s.text.split(' ').filter(w => item.text.toLowerCase().includes(w.toLowerCase()) && w.length > 4);
      return shared.length >= 3;
    });
    if (!isDup && item.score > 1) selected.push(item);
  }
  return selected.map(s => s.text);
}

/* ========== INIT ========== */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(state.theme);
  loadData();
  setupKeyboardShortcuts();
  loadLLMSettings();
});

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.key === 't' || e.key === 'T') && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') toggleTheme();
    if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      document.getElementById('search-input')?.focus();
    }
    if (e.key === 'Escape') { closeLLMModal(); closeSidebar(); }
  });
}

/* ========== DATA LOADING ========== */
async function loadData() {
  showLoading(true);
  const loaded = [];

  for (const source of SOURCES) {
    const pill = document.querySelector(`.loading-pill[data-source="${source}"]`);
    try {
      const resp = await fetch(`data/${source}.json?t=${Date.now()}`);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        loaded.push(...data);
        pill?.classList.add('done');
      } else {
        pill?.classList.add('error');
      }
    } catch (err) {
      console.warn(`Failed to load ${source}:`, err);
      pill?.classList.add('error');
    }
  }

  try {
    const metaResp = await fetch(`data/meta.json?t=${Date.now()}`);
    state.meta = await metaResp.json();
  } catch (e) { state.meta = null; }

  if (loaded.length === 0) {
    loaded.push(...getDemoData());
    showToast('Using demo data. Run GitHub Actions for live data.', 'info');
  }

  state.allData = loaded.map(item => ({
    ...item,
    id: `${item.platform}-${item.title?.slice(0,30).replace(/\s+/g,'-').replace(/[^a-zA-Z0-9-]/g,'')}-${Math.random().toString(36).slice(2,6)}`,
    _timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
  }));

  applyFilters();
  updateStats();
  showLoading(false);
}

function getDemoData() {
  return [
    {"title":"Binance New Listing: BTC Innovation Zone","url":"https://www.binance.com/en/support/announcement","source":"Binance","type":"listing","timestamp":"2026-08-01T12:00:00+00:00","summary":"Binance announces new listing in Innovation Zone with BTC trading pairs. Spot and margin trading to open within 24 hours of listing.","platform":"binance"},
    {"title":"Binance Launchpool: ETH Staking Rewards","url":"https://www.binance.com/en/support/announcement","source":"Binance","type":"staking","timestamp":"2026-08-01T10:30:00+00:00","summary":"New ETH staking pool with up to 12% APY on Binance Launchpool. Users can stake BNB and FDUSD to farm ETH rewards over 30 days.","platform":"binance"},
    {"title":"Bitcoin (BTC)","url":"https://www.coingecko.com/en/coins/bitcoin","source":"CoinGecko","type":"trending","timestamp":"2026-08-01T14:00:00+00:00","summary":"Market cap rank #1. Price action shows consolidation above $67K with strong institutional inflows via spot ETFs.","platform":"coingecko"},
    {"title":"Ethereum (ETH)","url":"https://www.coingecko.com/en/coins/ethereum","source":"CoinGecko","type":"trending","timestamp":"2026-08-01T13:45:00+00:00","summary":"Market cap rank #2. Leading smart contract platform with DeFi dominance. Dencun upgrade reduces L2 fees by 90%.","platform":"coingecko"},
    {"title":"Solana (SOL)","url":"https://www.coingecko.com/en/coins/solana","source":"CoinGecko","type":"trending","timestamp":"2026-08-01T13:30:00+00:00","summary":"High-performance L1 with growing DeFi and NFT ecosystem. Network uptime at 99.9% with sub-second finality.","platform":"coingecko"},
    {"title":"BONK / SOL","url":"https://dexscreener.com/solana","source":"DexScreener","type":"dex_pair","timestamp":"2026-08-01T15:00:00+00:00","summary":"Price: $0.000012 | Volume 24h: $2.1M | Liquidity: $890K. Memecoin showing strong community momentum on Raydium.","platform":"dexscreener","chain":"solana","dex":"raydium"},
    {"title":"JUP / USDC","url":"https://dexscreener.com/solana","source":"DexScreener","type":"dex_pair","timestamp":"2026-08-01T14:30:00+00:00","summary":"Price: $0.85 | Volume 24h: $5.4M | Liquidity: $2.1M. Jupiter aggregator token with active governance participation.","platform":"dexscreener","chain":"solana","dex":"orca"},
    {"title":"Bitcoin ETF Inflows Hit Record $500M","url":"https://cointelegraph.com","source":"CoinTelegraph","type":"news","timestamp":"2026-08-01T16:00:00+00:00","summary":"Spot Bitcoin ETFs see largest single-day inflow since launch, signaling strong institutional demand and potential supply squeeze.","platform":"news"},
    {"title":"Ethereum Dencun Upgrade Goes Live","url":"https://coindesk.com","source":"CoinDesk","type":"news","timestamp":"2026-08-01T14:00:00+00:00","summary":"Dencun upgrade reduces L2 fees by 90% with proto-danksharding implementation. Arbitrum and Optimism fees drop to under $0.01.","platform":"news"},
    {"title":"USDC on Aave v3","url":"https://defillama.com/yields","source":"DeFiLlama","type":"yield","timestamp":"2026-08-01T15:00:00+00:00","summary":"APY: 8.45% | TVL: $420M | Chain: Ethereum. Stablecoin lending with competitive rates and deep liquidity.","platform":"defillama","apy":8.45,"tvl":420000000,"chain":"ethereum"},
    {"title":"Lido TVL Alert","url":"https://defillama.com/protocol/lido","source":"DeFiLlama","type":"tvl_alert","timestamp":"2026-08-01T14:00:00+00:00","summary":"TVL changed +12.3% in 24h | Current: $18.2B. Ethereum staking deposits surge ahead of network upgrade.","platform":"defillama","change_1d":12.3,"tvl":18200000000,"chain":"ethereum"},
    {"title":"Fear & Greed: Greed (72)","url":"https://alternative.me/crypto/fear-and-greed-index/","source":"Alternative.me","type":"sentiment","timestamp":"2026-08-01T16:00:00+00:00","summary":"Crypto Fear & Greed Index is Greed at 72/100. Market sentiment remains bullish but approaching overbought territory. Consider taking profits on short-term positions.","platform":"fear_greed","value":72,"label":"Greed"},
    {"title":"[Uniswap] Deploy v4 on Arbitrum","url":"https://snapshot.org","source":"Snapshot","type":"governance","timestamp":"2026-08-01T15:00:00+00:00","summary":"Governance vote by Uniswap. Choices: For, Against, Abstain. State: active. Proposal to deploy Uniswap v4 hooks on Arbitrum One.","platform":"snapshot","space":"Uniswap","state":"active"},
    {"title":"[Aave] Risk Parameter Updates","url":"https://snapshot.org","source":"Snapshot","type":"governance","timestamp":"2026-08-01T14:00:00+00:00","summary":"Governance vote by Aave. Choices: Yes, No. State: active. Update liquidation thresholds and borrow caps across 12 markets.","platform":"snapshot","space":"Aave","state":"active"},
  ];
}

/* ========== FILTERING ========== */
function applyFilters() {
  let data = [...state.allData];
  if (state.currentPlatform) data = data.filter(d => d.platform === state.currentPlatform);
  if (state.currentView === 'watchlist') data = data.filter(d => state.watchlist.includes(d.id));
  else if (state.currentView === 'trending') data = data.filter(d => (Date.now() - d._timestamp) <= 86400000);

  if (state.currentSearch) {
    const q = state.currentSearch.toLowerCase();
    data = data.filter(d => (d.title||'').toLowerCase().includes(q) || (d.summary||'').toLowerCase().includes(q));
  }

  data = applyTimeFilter(data);

  if (state.currentSort === 'newest') data.sort((a,b) => b._timestamp - a._timestamp);
  else if (state.currentSort === 'oldest') data.sort((a,b) => a._timestamp - b._timestamp);
  else if (state.currentSort === 'source') data.sort((a,b) => (a.platform||'').localeCompare(b.platform||''));

  state.filteredData = data;
  renderCards();
  updateStats();
}

function applyTimeFilter(data) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);

  switch(state.currentTimeFilter) {
    case 'today': return data.filter(d => d._timestamp >= today);
    case 'yesterday': return data.filter(d => d._timestamp >= yesterday && d._timestamp < today);
    case 'last_hour': return data.filter(d => (now - d._timestamp) <= 3600000);
    case 'last_6h': return data.filter(d => (now - d._timestamp) <= 21600000);
    case 'last_24h': return data.filter(d => (now - d._timestamp) <= 86400000);
    case 'this_week': {
      const dow = today.getDay();
      const mon = new Date(today); mon.setDate(mon.getDate() - (dow===0?6:dow-1));
      return data.filter(d => d._timestamp >= mon);
    }
    case 'this_month': return data.filter(d => d._timestamp.getMonth()===today.getMonth() && d._timestamp.getFullYear()===today.getFullYear());
    case 'custom':
      if (state.customDateFrom && state.customDateTo) {
        const from = new Date(state.customDateFrom);
        const to = new Date(state.customDateTo); to.setHours(23,59,59,999);
        return data.filter(d => d._timestamp >= from && d._timestamp <= to);
      }
      return data;
    default: return data;
  }
}

function handleTimeFilter(value) {
  state.currentTimeFilter = value;
  const rangeEl = document.getElementById('custom-date-range');
  if (value === 'custom') rangeEl.classList.add('active');
  else { rangeEl.classList.remove('active'); applyFilters(); }
}

function applyCustomDate() {
  state.customDateFrom = document.getElementById('date-from').value;
  state.customDateTo = document.getElementById('date-to').value;
  if (state.customDateFrom && state.customDateTo) {
    applyFilters();
    showToast(`Filtered from ${state.customDateFrom} to ${state.customDateTo}`, 'info');
  }
}

function handleSort(value) { state.currentSort = value; applyFilters(); }
function handleSearch(value) { state.currentSearch = value; applyFilters(); }

function filterByPlatform(platform) {
  state.currentPlatform = state.currentPlatform === platform ? null : platform;
  state.currentView = 'all';
  updateSidebarActive();
  applyFilters();
  document.getElementById('page-title').textContent = state.currentPlatform ? PLATFORM_NAMES[state.currentPlatform] + ' Opportunities' : 'All Opportunities';
}

function filterByView(view) {
  state.currentView = view;
  state.currentPlatform = null;
  updateSidebarActive();
  applyFilters();
  const titles = { all: 'All Opportunities', watchlist: 'My Watchlist', trending: 'Trending' };
  document.getElementById('page-title').textContent = titles[view] || 'All Opportunities';
}

function resetFilters() {
  state.currentPlatform = null; state.currentView = 'all'; state.currentSearch = '';
  state.currentTimeFilter = 'today'; state.customDateFrom = null; state.customDateTo = null;
  document.getElementById('search-input').value = '';
  document.getElementById('time-filter').value = 'today';
  document.getElementById('custom-date-range').classList.remove('active');
  updateSidebarActive(); applyFilters();
  document.getElementById('page-title').textContent = 'All Opportunities';
}

function updateSidebarActive() {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('active');
    if (el.dataset.view && el.dataset.view === state.currentView) el.classList.add('active');
    if (el.dataset.platform && el.dataset.platform === state.currentPlatform) el.classList.add('active');
  });
}

/* ========== RENDERING ========== */
function renderCards() {
  const grid = document.getElementById('cards-grid');
  const empty = document.getElementById('empty-state');
  if (state.filteredData.length === 0) { grid.innerHTML = ''; empty.style.display = 'flex'; return; }
  empty.style.display = 'none';
  grid.innerHTML = state.filteredData.map(item => renderCard(item)).join('');
}

function renderCard(item) {
  const colors = PLATFORM_COLORS[item.platform] || PLATFORM_COLORS.binance;
  const isStarred = state.watchlist.includes(item.id);
  const timeAgo = formatTimeAgo(item._timestamp);
  const keyPoints = extractKeyPoints(item.summary, item.title);

  return `
    <article class="opp-card" style="--platform-color:${colors.color};--platform-color-bg:${colors.bg};--platform-color-border:${colors.border};" data-id="${item.id}">
      <div class="card-header">
        <div class="card-meta">
          <span class="platform-badge" style="background:${colors.bg};color:${colors.color};border-color:${colors.border}">${PLATFORM_ICONS[item.platform]||'🔹'} ${PLATFORM_NAMES[item.platform]||item.platform}</span>
          <span class="type-badge">${item.type||'general'}</span>
          <span class="card-time">${timeAgo}</span>
        </div>
        <div class="card-actions">
          <button class="card-action-btn ${isStarred?'starred':''}" onclick="toggleStar('${item.id}')" title="${isStarred?'Remove from watchlist':'Add to watchlist'}" id="star-${item.id}">${isStarred?'★':'☆'}</button>
          <button class="card-action-btn" onclick="copyCard('${item.id}')" title="Copy to clipboard" id="copy-${item.id}">📋</button>
        </div>
      </div>
      <h3 class="card-title"><a href="${item.url||'#'}" target="_blank" rel="noopener">${escapeHtml(item.title||'Untitled')}</a></h3>
      <p class="card-summary">${escapeHtml(item.summary||'')}</p>
      ${keyPoints.length?`
        <div class="keypoints-toggle" onclick="toggleKeyPoints(this)"><span class="toggle-icon">▶</span><span>🔑 Key Points (${keyPoints.length})</span></div>
        <div class="keypoints-list">${keyPoints.map(kp=>`<div class="keypoint-item"><span class="keypoint-bullet"></span><span>${escapeHtml(kp)}</span></div>`).join('')}</div>
      `:''}
      <div class="card-footer">
        <div class="card-tags">
          ${item.chain?`<span class="card-tag">⛓️ ${item.chain}</span>`:''}
          ${item.dex?`<span class="card-tag">🏦 ${item.dex}</span>`:''}
          ${item.space?`<span class="card-tag">🏛️ ${item.space}</span>`:''}
          ${item.apy?`<span class="card-tag" style="color:var(--accent)">📈 ${item.apy}% APY</span>`:''}
          ${item.value?`<span class="card-tag" style="color:var(--danger)">📊 ${item.value}/100</span>`:''}
        </div>
        <a href="${item.url||'#'}" target="_blank" class="card-link" rel="noopener">Open →</a>
      </div>
    </article>`;
}

function toggleKeyPoints(el) {
  el.classList.toggle('open');
  const list = el.nextElementSibling;
  if (list) list.classList.toggle('open');
}

function formatTimeAgo(date) {
  const diff = Date.now() - date;
  const s = Math.floor(diff/1000), m = Math.floor(s/60), h = Math.floor(m/60), d = Math.floor(h/24);
  if (s<60) return 'just now';
  if (m<60) return `${m}m ago`;
  if (h<24) return `${h}h ago`;
  if (d<7) return `${d}d ago`;
  return date.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ========== INTERACTIONS ========== */
function toggleStar(id) {
  const idx = state.watchlist.indexOf(id);
  if (idx>-1) { state.watchlist.splice(idx,1); showToast('Removed from watchlist','info'); }
  else { state.watchlist.push(id); showToast('Added to watchlist','success'); }
  localStorage.setItem('mahikshu_watchlist', JSON.stringify(state.watchlist));
  applyFilters();
}

function copyCard(id) {
  const item = state.allData.find(d=>d.id===id);
  if (!item) return;
  const keyPoints = extractKeyPoints(item.summary, item.title);
  const text = `📌 ${item.title}\n\n🔑 Key Points:\n${keyPoints.map(kp=>`• ${kp}`).join('\n')}\n\n📝 Summary:\n${item.summary}\n\n🔗 ${item.url}\n\n— via Mahikshu v3.0`;
  navigator.clipboard.writeText(text).then(()=>{
    const btn = document.getElementById(`copy-${id}`);
    if (btn) { btn.classList.add('copied'); btn.textContent='✓'; setTimeout(()=>{btn.classList.remove('copied');btn.textContent='📋';},2000); }
    showToast('Copied to clipboard!','success');
  }).catch(()=>showToast('Failed to copy','error'));
}

/* ========== STATS ========== */
function updateStats() {
  document.getElementById('stat-total').textContent = state.filteredData.length;
  document.getElementById('stat-watchlist').textContent = state.watchlist.length;
  document.getElementById('watchlist-count').textContent = state.watchlist.length;
  const lu = state.meta?.last_update;
  document.getElementById('stat-last-update').textContent = lu ? formatTimeAgo(new Date(lu)) : '—';
  document.getElementById('stat-sources').textContent = new Set(state.filteredData.map(d=>d.platform)).size;
}

/* ========== THEME ========== */
function toggleTheme() {
  state.theme = state.theme==='dark'?'light':'dark';
  applyTheme(state.theme);
  localStorage.setItem('mahikshu_theme', state.theme);
  showToast(`Switched to ${state.theme} mode`, 'info');
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme==='dark'?'🌙':'☀️';
}

/* ========== SIDEBAR ========== */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

/* ========== LOADING ========== */
function showLoading(show) {
  const el = document.getElementById('loading-overlay');
  if (show) {
    el.classList.add('open');
    document.querySelectorAll('.loading-pill').forEach(p=>p.classList.remove('done','error'));
  } else el.classList.remove('open');
}

/* ========== REFRESH ========== */
function refreshData() { showToast('Refreshing data...','info'); loadData(); }

/* ========== EXPORT ========== */
function exportCSV() {
  if (!state.filteredData.length) { showToast('No data to export','error'); return; }
  const headers = ['Title','Source','Type','Platform','Summary','URL','Timestamp'];
  const rows = state.filteredData.map(d=>[
    `"${(d.title||'').replace(/"/g,'\"')}"`, d.source||'', d.type||'', d.platform||'',
    `"${(d.summary||'').replace(/"/g,'\"')}"`, d.url||'', d.timestamp||''
  ]);
  const csv = [headers.join(','), ...rows.map(r=>r.join(','))].join('\n');
  downloadFile(csv, 'mahikshu-opportunities.csv', 'text/csv');
  showToast('CSV exported!','success');
}

function exportMD() {
  if (!state.filteredData.length) { showToast('No data to export','error'); return; }
  const lines = [`# Mahikshu Opportunities Report`,`Generated: ${new Date().toLocaleString()}`,`Total: ${state.filteredData.length} opportunities`,'','---',''];
  state.filteredData.forEach(d=>{
    lines.push(`## ${d.title||'Untitled'}`);
    lines.push(`**Source:** ${d.source||'Unknown'} | **Type:** ${d.type||'general'} | **Platform:** ${d.platform||'unknown'}`);
    lines.push('', d.summary||'');
    const kps = extractKeyPoints(d.summary, d.title);
    if (kps.length) { lines.push('','**Key Points:**'); kps.forEach(kp=>lines.push(`- ${kp}`)); }
    lines.push('',`[Open →](${d.url||'#'})`,'','---','');
  });
  downloadFile(lines.join('\n'), 'mahikshu-opportunities.md', 'text/markdown');
  showToast('Markdown exported!','success');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ========== AI MODAL ========== */
function openLLMModal() { document.getElementById('llm-modal').classList.add('open'); }
function closeLLMModal() { document.getElementById('llm-modal').classList.remove('open'); }
function closeModal(e) { if (e.target===e.currentTarget) closeLLMModal(); }

function loadLLMSettings() {
  const saved = localStorage.getItem('mahikshu_llm');
  if (!saved) return;
  try {
    const cfg = JSON.parse(saved);
    document.getElementById('llm-provider').value = cfg.provider||'openai';
    document.getElementById('llm-key').value = cfg.key||'';
    document.getElementById('llm-prompt').value = cfg.prompt||document.getElementById('llm-prompt').value;
  } catch(e){}
}

function saveLLMSettings() {
  const cfg = {
    provider: document.getElementById('llm-provider').value,
    key: document.getElementById('llm-key').value,
    prompt: document.getElementById('llm-prompt').value,
  };
  localStorage.setItem('mahikshu_llm', JSON.stringify(cfg));
  showToast('Settings saved locally','success');
}

async function generateAI() {
  const provider = document.getElementById('llm-provider').value;
  const key = document.getElementById('llm-key').value;
  const promptTemplate = document.getElementById('llm-prompt').value;
  const output = document.getElementById('llm-output');
  if (!key) { showToast('Please enter an API key','error'); return; }

  const item = state.filteredData[0] || {title:'Crypto Market Update', summary:'General market analysis'};
  const prompt = promptTemplate.replace(/{title}/g, item.title).replace(/{summary}/g, item.summary);
  output.value = 'Generating...';

  try {
    let result = '';
    if (provider==='openai') {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST', headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},
        body: JSON.stringify({model:'gpt-3.5-turbo',messages:[{role:'user',content:prompt}],max_tokens:300})
      });
      const data = await resp.json();
      result = data.choices?.[0]?.message?.content||'No response';
    } else if (provider==='anthropic') {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'x-api-key':key,'Content-Type':'application/json','anthropic-version':'2023-06-01'},
        body: JSON.stringify({model:'claude-3-haiku-20240307',max_tokens:300,messages:[{role:'user',content:prompt}]})
      });
      const data = await resp.json();
      result = data.content?.[0]?.text||'No response';
    } else if (provider==='google') {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({contents:[{parts:[{text:prompt}]}]})
      });
      const data = await resp.json();
      result = data.candidates?.[0]?.content?.parts?.[0]?.text||'No response';
    } else if (provider==='groq') {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST', headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},
        body: JSON.stringify({model:'llama3-8b-8192',messages:[{role:'user',content:prompt}],max_tokens:300})
      });
      const data = await resp.json();
      result = data.choices?.[0]?.message?.content||'No response';
    } else if (provider==='huggingface') {
      const resp = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
        method:'POST', headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},
        body: JSON.stringify({inputs: prompt, parameters: {max_new_tokens: 300}})
      });
      const data = await resp.json();
      result = Array.isArray(data) ? data[0].generated_text : data.generated_text || 'No response';
    } else if (provider==='openrouter') {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method:'POST', headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json','HTTP-Referer':window.location.href},
        body: JSON.stringify({model:'openai/gpt-3.5-turbo',messages:[{role:'user',content:prompt}],max_tokens:300})
      });
      const data = await resp.json();
      result = data.choices?.[0]?.message?.content||'No response';
    }
    output.value = result;
    showToast('Content generated!','success');
  } catch(err) {
    output.value = `Error: ${err.message}`;
    showToast('Generation failed','error');
  }
}

/* ========== TOAST ========== */
function showToast(message, type) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(()=>{ toast.classList.add('toast-exit'); setTimeout(()=>toast.remove(),300); },3000);
}
