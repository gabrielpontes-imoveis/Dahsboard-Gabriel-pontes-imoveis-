// ── Config ──────────────────────────────────────────────────────────────────
const CONFIG_KEY = 'gp_dashboard_config';

function loadConfig() {
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY)) || {}; }
  catch { return {}; }
}

function saveConfig() {
  const cfg = {
    yt: { key: document.getElementById('cfg-yt-key').value.trim(), channelId: document.getElementById('cfg-yt-channel').value.trim() },
    ig: { token: document.getElementById('cfg-ig-token').value.trim(), userId: document.getElementById('cfg-ig-user').value.trim() },
    tt: {
      followers: parseInt(document.getElementById('cfg-tt-followers').value) || 0,
      views: parseInt(document.getElementById('cfg-tt-views').value) || 0,
      likes: parseInt(document.getElementById('cfg-tt-likes').value) || 0
    }
  };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  closeSettings();
  refreshData();
}

function openSettings() {
  const cfg = loadConfig();
  if (cfg.yt) {
    document.getElementById('cfg-yt-key').value = cfg.yt.key || '';
    document.getElementById('cfg-yt-channel').value = cfg.yt.channelId || '';
  }
  if (cfg.ig) {
    document.getElementById('cfg-ig-token').value = cfg.ig.token || '';
    document.getElementById('cfg-ig-user').value = cfg.ig.userId || '';
  }
  if (cfg.tt) {
    document.getElementById('cfg-tt-followers').value = cfg.tt.followers || '';
    document.getElementById('cfg-tt-views').value = cfg.tt.views || '';
    document.getElementById('cfg-tt-likes').value = cfg.tt.likes || '';
  }
  document.getElementById('settings-modal').classList.add('active');
}

function closeSettings() {
  document.getElementById('settings-modal').classList.remove('active');
}

// Close modal clicking outside
document.getElementById('settings-modal').addEventListener('click', function(e) {
  if (e.target === this) closeSettings();
});

// ── Formatting ───────────────────────────────────────────────────────────────
function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0','') + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace('.0','') + 'K';
  return n?.toString() || '0';
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function trend(pct, el) {
  const up = pct >= 0;
  el.textContent = (up ? '▲ +' : '▼ ') + Math.abs(pct).toFixed(1) + '%';
  el.className = 'kpi-trend ' + (up ? 'up' : 'down');
}

// ── Demo Data ────────────────────────────────────────────────────────────────
function generateDemoData(days = 30) {
  const now = Date.now();
  const DAY = 86400000;

  function ramp(base, variance, count) {
    return Array.from({ length: count }, (_, i) => {
      const growth = 1 + (i / count) * 0.3;
      return Math.round(base * growth + (Math.random() - 0.4) * variance);
    });
  }

  const labels = Array.from({ length: days }, (_, i) =>
    new Date(now - (days - 1 - i) * DAY).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  );

  return {
    isDemo: true,
    period: days,
    labels,
    tiktok: {
      followers: 48700, followersGrowth: 5.2,
      views: ramp(3800, 1200, days), totalViews: 114000,
      likes: 8200, comments: 640, shares: 1900,
      engagement: 4.8,
      mini: ramp(3800, 800, 14)
    },
    youtube: {
      subscribers: 12400, subscribersGrowth: 3.1,
      views: ramp(1200, 500, days), totalViews: 38500,
      likes: 1850, comments: 290, watchTime: '1.2K h',
      videos: 78,
      engagement: 3.2,
      mini: ramp(1200, 400, 14)
    },
    instagram: {
      followers: 23900, followersGrowth: 2.8,
      reach: 41200, impressions: 87400,
      likes: 4100, comments: 510,
      posts: 24,
      engagement: 5.1,
      mini: ramp(2800, 600, 14)
    },
    content: [
      { title: 'Tour: Casarão com vista pra Gramado', platform: 'tiktok',    views: 187000, likes: 14200, comments: 890, date: '2025-04-14', thumb: '🏡' },
      { title: 'Vale dos Plattanos — O Bairro Parque',  platform: 'youtube',   views: 42000,  likes: 2100,  comments: 187, date: '2025-04-12', thumb: '🌲' },
      { title: 'Gramado em abril: por que comprar agora', platform: 'instagram', views: 38500, likes: 3200, comments: 214, date: '2025-04-11', thumb: '📊' },
      { title: 'Canela: investimento que valoriza 18% ao ano', platform: 'tiktok', views: 92000, likes: 7800, comments: 430, date: '2025-04-09', thumb: '💰' },
      { title: 'Checklist para comprar seu primeiro imóvel', platform: 'instagram', views: 29000, likes: 2700, comments: 165, date: '2025-04-08', thumb: '✅' },
      { title: 'Como financiar imóvel em Gramado — passo a passo', platform: 'youtube', views: 19800, likes: 980, comments: 94, date: '2025-04-07', thumb: '🏦' },
      { title: 'Reação ao aumento da taxa Selic 🤯', platform: 'tiktok', views: 213000, likes: 18400, comments: 1100, date: '2025-04-05', thumb: '📈' },
      { title: 'Imóvel vs Renda Fixa — qual rende mais?', platform: 'youtube', views: 33200, likes: 1600, comments: 210, date: '2025-04-03', thumb: '⚖️' },
    ]
  };
}

// ── API Calls ────────────────────────────────────────────────────────────────
async function fetchYouTube(key, channelId) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${key}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('YouTube API error');
  const d = await r.json();
  const s = d.items?.[0]?.statistics;
  return {
    subscribers: parseInt(s.subscriberCount || 0),
    totalViews: parseInt(s.viewCount || 0),
    videos: parseInt(s.videoCount || 0),
    handle: d.items?.[0]?.snippet?.title
  };
}

async function fetchInstagram(token, userId) {
  const url = `https://graph.instagram.com/${userId}?fields=followers_count,media_count,username&access_token=${token}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('Instagram API error');
  return await r.json();
}

// ── Charts ───────────────────────────────────────────────────────────────────
let charts = {};

Chart.defaults.color = '#8899aa';
Chart.defaults.font.family = "'Inter', sans-serif";

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

function initViewsChart(data) {
  destroyChart('views');
  const ctx = document.getElementById('viewsChart').getContext('2d');

  const gradTT = ctx.createLinearGradient(0, 0, 0, 260);
  gradTT.addColorStop(0, 'rgba(255,0,80,0.25)');
  gradTT.addColorStop(1, 'rgba(255,0,80,0)');

  const gradYT = ctx.createLinearGradient(0, 0, 0, 260);
  gradYT.addColorStop(0, 'rgba(255,0,0,0.2)');
  gradYT.addColorStop(1, 'rgba(255,0,0,0)');

  const gradIG = ctx.createLinearGradient(0, 0, 0, 260);
  gradIG.addColorStop(0, 'rgba(225,48,108,0.2)');
  gradIG.addColorStop(1, 'rgba(225,48,108,0)');

  charts['views'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        { label: 'TikTok',    data: data.tiktok.views,   borderColor: '#ff0050', backgroundColor: gradTT, tension: 0.4, pointRadius: 2, pointHoverRadius: 5, borderWidth: 2, fill: true },
        { label: 'YouTube',   data: data.youtube.views,  borderColor: '#ff0000', backgroundColor: gradYT, tension: 0.4, pointRadius: 2, pointHoverRadius: 5, borderWidth: 2, fill: true },
        { label: 'Instagram', data: data.instagram.mini, borderColor: '#e1306c', backgroundColor: gradIG, tension: 0.4, pointRadius: 2, pointHoverRadius: 5, borderWidth: 2, fill: true }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d1627',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.raw)} views` }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { maxTicksLimit: 8, font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { font: { size: 11 }, callback: v => fmt(v) } }
      }
    }
  });
}

function initDistributionChart(data) {
  destroyChart('dist');
  const ctx = document.getElementById('distributionChart').getContext('2d');
  const tt = data.tiktok.totalViews;
  const yt = data.youtube.totalViews;
  const ig = data.instagram.reach;
  const total = tt + yt + ig;
  document.getElementById('donut-total').textContent = fmt(total);

  charts['dist'] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['TikTok', 'YouTube', 'Instagram'],
      datasets: [{ data: [tt, yt, ig], backgroundColor: ['#ff0050','#ff0000','#e1306c'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d1627',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)} (${((ctx.raw/total)*100).toFixed(1)}%)`
          }
        }
      }
    }
  });
}

function initEngagementChart(data) {
  destroyChart('eng');
  const ctx = document.getElementById('engagementChart').getContext('2d');
  charts['eng'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['TikTok', 'YouTube', 'Instagram'],
      datasets: [
        { label: 'Curtidas',       data: [data.tiktok.likes, data.youtube.likes, data.instagram.likes], backgroundColor: ['rgba(255,0,80,0.7)','rgba(255,0,0,0.7)','rgba(225,48,108,0.7)'], borderRadius: 6, borderSkipped: false },
        { label: 'Comentários',    data: [data.tiktok.comments, data.youtube.comments, data.instagram.comments], backgroundColor: ['rgba(255,107,157,0.5)','rgba(255,102,102,0.5)','rgba(240,98,146,0.5)'], borderRadius: 6, borderSkipped: false },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 10, usePointStyle: true, pointStyle: 'circle' } },
        tooltip: { backgroundColor: '#0d1627', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 10 }
      },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => fmt(v) } }
      }
    }
  });
}

function initMiniChart(id, data, color) {
  destroyChart(id);
  const ctx = document.getElementById(id).getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 55);
  grad.addColorStop(0, color + '40');
  grad.addColorStop(1, color + '00');

  charts[id] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({ length: data.length }, (_, i) => i),
      datasets: [{ data, borderColor: color, backgroundColor: grad, tension: 0.4, pointRadius: 0, borderWidth: 2, fill: true }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } }
    }
  });
}

// ── Dashboard Update ──────────────────────────────────────────────────────────
function updateDashboard(data) {
  // Last updated
  document.getElementById('last-updated').textContent =
    'Atualizado ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // KPIs
  const totalViews = data.tiktok.totalViews + data.youtube.totalViews + data.instagram.reach;
  const totalFollowers = data.tiktok.followers + data.youtube.subscribers + data.instagram.followers;
  const avgEngagement = ((data.tiktok.engagement + data.youtube.engagement + data.instagram.engagement) / 3).toFixed(1);
  const totalPosts = (data.instagram.posts || 0) + (data.youtube.videos ? 4 : 0);

  document.getElementById('kpi-views').textContent = fmt(totalViews);
  document.getElementById('kpi-followers').textContent = fmt(totalFollowers);
  document.getElementById('kpi-engagement').textContent = avgEngagement + '%';
  document.getElementById('kpi-posts').textContent = totalPosts;

  trend(12.3, document.getElementById('kpi-views-trend'));
  trend(3.8, document.getElementById('kpi-followers-trend'));
  trend(0.4, document.getElementById('kpi-engagement-trend'));
  document.getElementById('kpi-posts-trend').textContent = '↑ vs período anterior';
  document.getElementById('kpi-posts-trend').className = 'kpi-trend up';

  // Platform cards — TikTok
  document.getElementById('tt-followers').textContent = fmt(data.tiktok.followers);
  document.getElementById('tt-views').textContent = fmt(data.tiktok.totalViews);
  document.getElementById('tt-likes').textContent = fmt(data.tiktok.likes);
  document.getElementById('tt-engagement').textContent = data.tiktok.engagement + '%';

  // Platform cards — YouTube
  document.getElementById('yt-subscribers').textContent = fmt(data.youtube.subscribers);
  document.getElementById('yt-views').textContent = fmt(data.youtube.totalViews);
  document.getElementById('yt-videos').textContent = data.youtube.videos;
  document.getElementById('yt-watchtime').textContent = data.youtube.watchTime || '—';

  // Platform cards — Instagram
  document.getElementById('ig-followers').textContent = fmt(data.instagram.followers);
  document.getElementById('ig-reach').textContent = fmt(data.instagram.reach);
  document.getElementById('ig-impressions').textContent = fmt(data.instagram.impressions);
  document.getElementById('ig-posts').textContent = data.instagram.posts;

  // Charts
  initViewsChart(data);
  initDistributionChart(data);
  initEngagementChart(data);
  initMiniChart('ttMiniChart', data.tiktok.mini, '#ff0050');
  initMiniChart('ytMiniChart', data.youtube.mini, '#ff0000');
  initMiniChart('igMiniChart', data.instagram.mini || data.tiktok.mini.map(v => Math.round(v * 0.7)), '#e1306c');

  // Content table
  renderContentTable(data.content, 'all');

  // Demo banner
  document.getElementById('demo-banner').classList.toggle('hidden', !data.isDemo);
}

// ── Content Table ─────────────────────────────────────────────────────────────
let allContent = [];
let activeFilter = 'all';

function renderContentTable(items, filter) {
  allContent = items;
  activeFilter = filter;
  const filtered = filter === 'all' ? items : items.filter(i => i.platform === filter);
  const maxViews = Math.max(...filtered.map(i => i.views));

  const tbody = document.getElementById('content-table-body');
  tbody.innerHTML = filtered.map(item => {
    const eng = ((item.likes + item.comments) / item.views * 100).toFixed(1);
    const pct = Math.round((item.views / maxViews) * 100);
    const platformLabel = { tiktok: '🎵 TikTok', youtube: '▶️ YouTube', instagram: '📸 Instagram' }[item.platform];
    return `
      <tr>
        <td>
          <div class="content-title">
            <div class="content-thumbnail">${item.thumb}</div>
            <div>
              <div class="content-name" title="${item.title}">${item.title}</div>
              <div class="content-date">${fmtDate(item.date)}</div>
            </div>
          </div>
        </td>
        <td><span class="platform-pill ${item.platform}">${platformLabel}</span></td>
        <td>
          <div class="bar-cell">
            <span class="metric-value">${fmt(item.views)}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          </div>
        </td>
        <td><span class="metric-value">${fmt(item.likes)}</span></td>
        <td><span class="metric-value">${item.comments}</span></td>
        <td><span class="metric-value" style="color:var(--success)">${eng}%</span></td>
        <td style="color:var(--text-secondary)">${fmtDate(item.date)}</td>
      </tr>`;
  }).join('');
}

function filterContent(filter, btn) {
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderContentTable(allContent, filter);
}

// ── Period & Refresh ──────────────────────────────────────────────────────────
function changePeriod(days) {
  refreshData(parseInt(days));
}

async function refreshData(days) {
  const period = days || parseInt(document.getElementById('period-select').value) || 30;
  const cfg = loadConfig();
  let data = generateDemoData(period);

  // Try YouTube
  if (cfg.yt?.key && cfg.yt?.channelId) {
    try {
      const yt = await fetchYouTube(cfg.yt.key, cfg.yt.channelId);
      data.youtube = { ...data.youtube, ...yt };
      data.isDemo = false;
      document.getElementById('yt-handle').textContent = yt.handle || 'Gabriel Pontes';
      document.getElementById('status-label-youtube').textContent = 'Conectado';
      document.getElementById('yt-status-pill').textContent = 'Conectado';
      document.getElementById('yt-status-pill').classList.add('connected');
    } catch(e) { console.warn('YouTube API error:', e); }
  }

  // Try Instagram
  if (cfg.ig?.token && cfg.ig?.userId) {
    try {
      const ig = await fetchInstagram(cfg.ig.token, cfg.ig.userId);
      if (ig.followers_count) {
        data.instagram.followers = ig.followers_count;
        data.instagram.posts = ig.media_count || data.instagram.posts;
        data.isDemo = false;
        document.getElementById('ig-handle').textContent = '@' + (ig.username || 'gabrielpontes_imoveis');
        document.getElementById('status-label-instagram').textContent = 'Conectado';
        document.getElementById('ig-status-pill').textContent = 'Conectado';
        document.getElementById('ig-status-pill').classList.add('connected');
      }
    } catch(e) { console.warn('Instagram API error:', e); }
  }

  // TikTok manual
  if (cfg.tt?.followers) {
    data.tiktok.followers = cfg.tt.followers;
    if (cfg.tt.views) data.tiktok.totalViews = cfg.tt.views;
    if (cfg.tt.likes) data.tiktok.likes = cfg.tt.likes;
    data.isDemo = false;
    document.getElementById('status-label-tiktok').textContent = 'Manual';
    document.getElementById('tt-status-pill').textContent = 'Manual';
    document.getElementById('tt-status-pill').classList.add('connected');
  }

  updateDashboard(data);
}

function setPage(page, el) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  const titles = {
    overview: 'Visão Geral', content: 'Meu Conteúdo',
    platforms: 'Plataformas', growth: 'Crescimento', engagement: 'Engajamento'
  };
  document.getElementById('page-title').textContent = titles[page] || 'Dashboard';
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => refreshData(30));
