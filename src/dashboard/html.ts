// ============================================================================
// agentic-test — Dashboard HTML (Self-contained, zero dependencies)
// ============================================================================

export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>🤖 agentic-test Dashboard</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --bg: #0a0a1a; --surface: rgba(255,255,255,0.04); --surface-hover: rgba(255,255,255,0.08);
    --border: rgba(255,255,255,0.08); --text: #e4e4e7; --text-dim: #71717a;
    --green: #22c55e; --red: #ef4444; --yellow: #eab308; --blue: #3b82f6;
    --cyan: #06b6d4; --purple: #a855f7;
    --gradient: linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #0a0a1a 100%);
  }
  body { font-family: 'Inter', sans-serif; background: var(--gradient); color: var(--text); min-height: 100vh; }

  .container { max-width: 1280px; margin: 0 auto; padding: 24px; }

  header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
  header h1 { font-size: 24px; font-weight: 700; }
  header h1 span { background: linear-gradient(135deg, var(--cyan), var(--purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .badge { font-size: 11px; padding: 4px 10px; border-radius: 12px; background: var(--surface); border: 1px solid var(--border); color: var(--text-dim); }
  .live-dot { width: 8px; height: 8px; background: var(--green); border-radius: 50%; display: inline-block; margin-right: 6px; animation: pulse 2s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    padding: 20px; backdrop-filter: blur(20px); transition: all 0.3s;
  }
  .card:hover { background: var(--surface-hover); transform: translateY(-2px); }
  .card-label { font-size: 12px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .card-value { font-size: 28px; font-weight: 700; }
  .card-sub { font-size: 12px; color: var(--text-dim); margin-top: 4px; }
  .green { color: var(--green); } .red { color: var(--red); } .blue { color: var(--blue); } .yellow { color: var(--yellow); } .cyan { color: var(--cyan); }

  .chart-section { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; margin-bottom: 32px; backdrop-filter: blur(20px); }
  .chart-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
  canvas { width: 100% !important; height: 200px !important; }

  .suites-section { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; backdrop-filter: blur(20px); }
  .suite-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border); cursor: pointer; transition: all 0.2s; }
  .suite-header:hover { padding-left: 8px; }
  .suite-name { font-weight: 600; font-size: 15px; }
  .suite-stats { display: flex; gap: 12px; font-size: 13px; }

  .test-row { padding: 10px 0 10px 24px; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 13px; display: none; }
  .test-row.visible { display: flex; justify-content: space-between; align-items: center; }
  .test-name { display: flex; align-items: center; gap: 8px; }
  .test-meta { display: flex; gap: 16px; color: var(--text-dim); font-size: 12px; }
  .icon-pass { color: var(--green); } .icon-fail { color: var(--red); } .icon-skip { color: var(--yellow); }

  .assertion-detail { padding: 6px 0 6px 48px; font-size: 12px; color: var(--text-dim); display: none; }
  .assertion-detail.visible { display: block; }
  .assertion-fail { color: var(--red); }

  .empty { text-align: center; padding: 80px 20px; color: var(--text-dim); }
  .empty h2 { font-size: 48px; margin-bottom: 16px; }
  .empty p { font-size: 16px; }

  .refresh-info { text-align: center; padding: 16px; color: var(--text-dim); font-size: 12px; margin-top: 16px; }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>🤖 <span>agentic-test</span></h1>
    <div><span class="live-dot"></span><span class="badge">Dashboard v2.0</span></div>
  </header>
  <div id="app"></div>
  <div class="refresh-info">Auto-refreshes every 30s • <span id="last-updated"></span></div>
</div>
<script>
async function loadData() {
  try {
    const res = await fetch('/api/results');
    return await res.json();
  } catch { return []; }
}

function render(history) {
  const app = document.getElementById('app');
  if (!history || history.length === 0) {
    app.innerHTML = '<div class="empty"><h2>📭</h2><p>No test results yet.<br>Run tests with <code>agentic-test run --save</code></p></div>';
    return;
  }

  const latest = history[history.length - 1];
  const totalRuns = history.length;
  const avgPassRate = history.reduce((s, r) => s + (r.passed / Math.max(r.totalTests, 1)), 0) / totalRuns;
  const totalTokens = history.reduce((s, r) => s + (r.totalTokens || 0), 0);
  const avgDuration = history.reduce((s, r) => s + r.duration, 0) / totalRuns;

  let html = '<div class="cards">';
  html += card('Total Tests', latest.totalTests, '', 'cyan');
  html += card('Pass Rate', (avgPassRate * 100).toFixed(1) + '%', totalRuns + ' runs', avgPassRate >= 0.8 ? 'green' : 'red');
  html += card('Passed', latest.passed, latest.failed + ' failed', 'green');
  html += card('Failed', latest.failed, latest.skipped + ' skipped', latest.failed > 0 ? 'red' : 'green');
  html += card('Duration', (latest.duration / 1000).toFixed(2) + 's', 'avg: ' + (avgDuration / 1000).toFixed(2) + 's', 'blue');
  html += card('Tokens', totalTokens.toLocaleString(), 'across all runs', 'yellow');
  html += '</div>';

  // Trend chart
  html += '<div class="chart-section"><div class="chart-title">📈 Pass Rate Trend (Last ' + Math.min(history.length, 20) + ' Runs)</div>';
  html += '<canvas id="chart"></canvas></div>';

  // Latest run suites
  html += '<div class="suites-section"><div class="chart-title">🧪 Latest Run — ' + (latest.savedAt ? new Date(latest.savedAt).toLocaleString() : 'now') + '</div>';
  if (latest.suites) {
    latest.suites.forEach((suite, si) => {
      const sp = suite.tests.filter(t => t.status === 'passed').length;
      const sf = suite.tests.filter(t => t.status === 'failed' || t.status === 'error').length;
      html += '<div class="suite-header" onclick="toggleSuite(' + si + ')">';
      html += '<span class="suite-name">' + (sf > 0 ? '🔴' : '🟢') + ' ' + esc(suite.name) + '</span>';
      html += '<span class="suite-stats"><span class="green">' + sp + ' ✓</span><span class="red">' + sf + ' ✗</span><span class="text-dim">' + (suite.duration/1000).toFixed(2) + 's</span></span>';
      html += '</div>';
      suite.tests.forEach((test, ti) => {
        const icon = test.status === 'passed' ? '✓' : test.status === 'skipped' ? '○' : '✗';
        const cls = test.status === 'passed' ? 'icon-pass' : test.status === 'skipped' ? 'icon-skip' : 'icon-fail';
        html += '<div class="test-row suite-' + si + '" onclick="toggleAssertions(' + si + ',' + ti + ')">';
        html += '<span class="test-name"><span class="' + cls + '">' + icon + '</span> ' + esc(test.name) + '</span>';
        html += '<span class="test-meta"><span>' + Math.round(test.duration) + 'ms</span><span>' + test.tokens + ' tok</span><span>' + test.toolCallCount + ' tools</span></span>';
        html += '</div>';
        if (test.assertions) {
          test.assertions.forEach(a => {
            const ac = a.passed ? '' : ' assertion-fail';
            html += '<div class="assertion-detail detail-' + si + '-' + ti + ac + '">' + (a.passed ? '✓' : '✗') + ' ' + esc(a.name) + ': ' + esc(a.message) + '</div>';
          });
        }
      });
    });
  }
  html += '</div>';

  app.innerHTML = html;
  document.getElementById('last-updated').textContent = 'Updated: ' + new Date().toLocaleTimeString();

  // Draw chart
  setTimeout(() => drawChart(history), 100);
}

function card(label, value, sub, color) {
  return '<div class="card"><div class="card-label">' + label + '</div><div class="card-value ' + color + '">' + value + '</div><div class="card-sub">' + sub + '</div></div>';
}

function esc(s) { return String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function toggleSuite(si) {
  document.querySelectorAll('.suite-' + si).forEach(el => el.classList.toggle('visible'));
}
function toggleAssertions(si, ti) {
  document.querySelectorAll('.detail-' + si + '-' + ti).forEach(el => el.classList.toggle('visible'));
}

function drawChart(history) {
  const canvas = document.getElementById('chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width - 48;
  canvas.height = 200;

  const data = history.slice(-20);
  const w = canvas.width, h = canvas.height;
  const pad = { top: 20, right: 20, bottom: 30, left: 50 };
  const pw = w - pad.left - pad.right, ph = h - pad.top - pad.bottom;

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (ph / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(((4 - i) * 25) + '%', pad.left - 8, y + 4);
  }

  if (data.length < 2) return;

  // Pass rate line
  const gradient = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
  gradient.addColorStop(0, 'rgba(34,197,94,0.3)');
  gradient.addColorStop(1, 'rgba(34,197,94,0)');

  ctx.beginPath();
  data.forEach((r, i) => {
    const x = pad.left + (i / (data.length - 1)) * pw;
    const rate = r.totalTests > 0 ? r.passed / r.totalTests : 0;
    const y = pad.top + ph - (rate * ph);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#22c55e';  ctx.lineWidth = 2.5; ctx.stroke();

  // Fill under
  const lastX = pad.left + pw;
  ctx.lineTo(lastX, pad.top + ph);
  ctx.lineTo(pad.left, pad.top + ph);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Dots
  data.forEach((r, i) => {
    const x = pad.left + (i / (data.length - 1)) * pw;
    const rate = r.totalTests > 0 ? r.passed / r.totalTests : 0;
    const y = pad.top + ph - (rate * ph);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = rate >= 0.8 ? '#22c55e' : '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#0a0a1a'; ctx.lineWidth = 2; ctx.stroke();
  });

  // Failed tests line (red)
  ctx.beginPath();
  const maxFailed = Math.max(...data.map(r => r.failed), 1);
  data.forEach((r, i) => {
    const x = pad.left + (i / (data.length - 1)) * pw;
    const y = pad.top + ph - ((r.failed / maxFailed) * ph * 0.5);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = 'rgba(239,68,68,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.stroke();
  ctx.setLineDash([]);
}

// Initial load + auto-refresh
loadData().then(render);
setInterval(() => loadData().then(render), 30000);
</script>
</body>
</html>`;
