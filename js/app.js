/**
 * app.js - Core UI, fetching, filtering, sorting, and rendering for Mahikshu
 */

import Storage from './storage.js';

// ============================================
// CONFIG
// ============================================
const DATA_FILES = ['binance.json', 'coingecko.json', 'dexscreener.json', 'news.json'];
const PLATFORM_LABELS = {
  binance: 'Binance',
  coingecko: 'CoinGecko',
  dexscreener: 'DexScreener',
  news: 'News'
};

const CONTENT_TYPE_LABELS = {
  listing: 'Listing',
  delisting: 'Delisting',
  launchpool: 'Launchpool',
  airdrop: 'Airdrop',
  trending: 'Trending',
  mover: 'Mover',
  new_pair: 'New Pair',
  news: 'News',
  listing_news: 'Listing News',
  security: 'Security',
  regulation: 'Regulation',
  announcement: 'Announcement'
};

const PLATFORM_ICONS = {
  binance: '⚡',
  coingecko: '🦎',
  dexscreener: '🔍',
  news: '📰'
};

// ============================================
// STATE
// ============================================
let allData = [];
let meta = null;
let currentFilters = {
  platform: 'all',
  timeRange: 'all',
  sort: 'newest'
};

// ============================================
// DOM REFERENCES
// ============================================
const els = {
  cardsGrid: document.getElementById('cards-grid'),
  loading: document.getElementById('loading'),
  emptyState: document.getElementById('empty-state'),
  filterPlatform: document.getElementById('filter-platform'),
  filterTime: document.getElementById('filter-time'),
  filterSort: document.getElementById('filter-sort'),
  lastUpdated: document.getElementById('last-updated'),
  countDisplay: document.getElementById('count-display'),
  darkModeToggle: document.getElementById('dark-mode-toggle'),
  aiSetupBtn: document.getElementById('ai-setup-btn'),
  modal: document.getElementById('ai-modal'),
  modalClose: document.getElementById('modal-close'),
  modalOverlay: document.getElementById('modal-overlay')
};

// ============================================
// INITIALIZATION
// ============================================
function init() {
  loadTheme();
  bindEvents();
  fetchAllData();
}

function bindEvents() {
  els.filterPlatform.addEventListener('change', (e) => {
    currentFilters.platform = e.target.value;
    render();
  });

  els.filterTime.addEventListener('change', (e) => {
    currentFilters.timeRange = e.target.value;
    render();
  });

  els.filterSort.addEventListener('change', (e) => {
    currentFilters.sort = e.target.value;
    render();
  });

  els.darkModeToggle.addEventListener('click', toggleTheme);

  els.aiSetupBtn.addEventListener('click', () => {
    els.modalOverlay.classList.add('active');
  });

  els.modalClose.addEventListener('click', closeModal);
  els.modalOverlay.addEventListener('click', (e) => {
    if (e.target === els.modalOverlay) closeModal();
  });

  // AI form
  const aiForm = document.getElementById('ai-form');
  if (aiForm) {
    aiForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const apiKey = document.getElementById('ai-api-key').value.trim();
      const provider = document.getElementById('ai-provider').value;
      if (apiKey) {
        Storage.session.set('mahikshu_ai_key', apiKey);
        Storage.session.set('mahikshu_ai_provider', provider);
        alert('✅ AI key saved to session storage. It will be cleared when you close the tab.');
        closeModal();
      }
    });
  }
}

function closeModal() {
  els.modalOverlay.classList.remove('active');
}

// ============================================
// THEME
// ============================================
function loadTheme() {
  const saved = Storage.get('mahikshu_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved === 'dark' || (!saved && prefersDark);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  Storage.set('mahikshu_theme', newTheme);
  updateThemeIcon(!isDark);
}

function updateThemeIcon(isDark) {
  els.darkModeToggle.innerHTML = isDark ? '☀️' : '🌙';
  els.darkModeToggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
}

// ============================================
// DATA FETCHING
// ============================================
async function fetchAllData() {
  showLoading();

  try {
    const requests = DATA_FILES.map(file =>
      fetch(`data/${file}?t=${Date.now()}`)
        .then(r => r.ok ? r.json() : [])
        .catch(() => [])
    );

    const results = await Promise.all(requests);
    allData = results.flat().filter(item => item && item.id);

    // Fetch meta
    try {
      const metaResp = await fetch(`data/meta.json?t=${Date.now()}`);
      meta = metaResp.ok ? await metaResp.json() : null;
    } catch {
      meta = null;
    }

    updateStatus();
    render();
  } catch (err) {
    console.error('Failed to fetch data:', err);
    showEmpty('Failed to load data', 'Please check your connection and try again.');
  }
}

// ============================================
// FILTERING & SORTING
// ============================================
function getFilteredData() {
  let data = [...allData];

  // Platform filter
  if (currentFilters.platform !== 'all') {
    data = data.filter(item => item.platform === currentFilters.platform);
  }

  // Time range filter
  if (currentFilters.timeRange !== 'all') {
    const now = new Date();
    const ranges = {
      now: 5 * 60 * 1000,        // 5 minutes
      today: 24 * 60 * 60 * 1000, // 24 hours
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };
    const cutoff = now.getTime() - (ranges[currentFilters.timeRange] || Infinity);
    data = data.filter(item => {
      const itemTime = new Date(item.published_at).getTime();
      return itemTime >= cutoff;
    });
  }

  // Sort
  if (currentFilters.sort === 'newest') {
    data.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  } else if (currentFilters.sort === 'engagement') {
    data.sort((a, b) => (b.engagement || 0) - (a.engagement || 0));
  }

  return data;
}

// ============================================
// RENDERING
// ============================================
function render() {
  const filtered = getFilteredData();
  updateCount(filtered.length);

  if (filtered.length === 0) {
    showEmpty('No opportunities found', 'Try adjusting your filters to see more results.');
    return;
  }

  els.loading.style.display = 'none';
  els.emptyState.style.display = 'none';
  els.cardsGrid.style.display = 'grid';

  els.cardsGrid.innerHTML = filtered.map(item => renderCard(item)).join('');
}

function renderCard(item) {
  const platform = item.platform || 'news';
  const contentType = item.content_type || 'news';
  const timeAgo = formatTimeAgo(item.published_at);
  const platformLabel = PLATFORM_LABELS[platform] || platform;
  const typeLabel = CONTENT_TYPE_LABELS[contentType] || contentType;
  const icon = PLATFORM_ICONS[platform] || '📄';
  const tags = (item.tags || []).slice(0, 4).map(t => `<span class="tag">#${t}</span>`).join('');

  return `
    <article class="card" data-platform="${platform}">
      <div class="card-header">
        <div class="card-badges">
          <span class="badge badge-platform">${icon} ${platformLabel}</span>
          <span class="badge badge-type">${typeLabel}</span>
        </div>
      </div>
      <h3 class="card-title">${escapeHtml(item.title)}</h3>
      <div class="card-meta">
        <span class="card-time">🕐 ${timeAgo}</span>
      </div>
      <p class="card-summary">${escapeHtml(item.summary || '')}</p>
      <div class="card-footer">
        <div class="card-tags">${tags}</div>
        <a href="${escapeHtml(item.url || '#')}" target="_blank" rel="noopener noreferrer" class="card-link">
          View Source →
        </a>
      </div>
    </article>
  `;
}

// ============================================
// UTILITIES
// ============================================
function formatTimeAgo(isoString) {
  if (!isoString) return 'Unknown';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function updateStatus() {
  if (meta && meta.last_updated) {
    const time = formatTimeAgo(meta.last_updated);
    els.lastUpdated.textContent = `Last updated: ${time}`;
  } else {
    els.lastUpdated.textContent = 'Last updated: Unknown';
  }
}

function updateCount(count) {
  els.countDisplay.textContent = `${count} opportunity${count !== 1 ? 'ies' : 'y'} found`;
}

function showLoading() {
  els.cardsGrid.style.display = 'none';
  els.emptyState.style.display = 'none';
  els.loading.style.display = 'flex';
}

function showEmpty(title, desc) {
  els.cardsGrid.style.display = 'none';
  els.loading.style.display = 'none';
  els.emptyState.style.display = 'flex';
  els.emptyState.querySelector('.empty-title').textContent = title;
  els.emptyState.querySelector('.empty-desc').textContent = desc;
}

// ============================================
// BOOT
// ============================================
document.addEventListener('DOMContentLoaded', init);
