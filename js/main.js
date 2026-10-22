/* ============================================================
 * Client Cheat Quest - 主程序：关卡调度 / 扫描面板 / 控制台 / 判定
 * ============================================================ */

/* 把可能是单关、也可能带小关(stages)的关卡标准化 */
function normalizeLevel(L) {
  const stages = L.stages && L.stages.length
    ? L.stages
    : [{
      name: L.name, method: L.method, brief: L.brief, goal: L.goal,
      onEnter: L.onEnter, render: L.render, check: L.check, onLeave: L.onLeave,
    }];
  return Object.assign({}, L, { stages });
}

const $ = (sel) => document.querySelector(sel);
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

let current = { lvl: 0, stage: 0, timers: [] };

/* ---------- 构建运行时上下文 G ---------- */
function buildG(lvl, stageIdx) {
  const S = lvl.stages[stageIdx];
  G = {
    state: {},
    mem: Mem,
    stage: stageIdx,
    ls: LS,
    codec: Codec,
    panel: $('#legit-panel'),
    log: $('#level-log'),
    say(msg) {
      const d = el('div', 'log-line', msg);
      this.log.appendChild(d);
      this.log.scrollTop = this.log.scrollHeight;
    },
    tick(fn, ms) { const t = setInterval(fn, ms); current.timers.push(t); return t; },
    win() {
      if (this._won) return;
      this._won = true;
      onWin();
    },
    afterChange() { refreshDynamic(); runCheck(); },
  };
  G.S = S;
  return G;
}

/* ---------- 渲染外壳 ---------- */
function renderShell() {
  const side = $('#level-list');
  side.innerHTML = '';
  LEVELS.forEach((raw, i) => {
    const L = normalizeLevel(raw);
    const p = Progress.load();
    const done = p.done.includes(i + 1);
    const unlocked = (i + 1) <= p.unlocked;
    const btn = el('button', 'lv-item' + (done ? ' done' : '') + (!unlocked ? ' locked' : '') + (i === current.lvl ? ' active' : ''));
    btn.innerHTML =
      '<span class="lv-num">' + (done ? '✓' : (i + 1)) + '</span>' +
      '<span class="lv-meta"><b>' + L.name + '</b><i>' + L.method + '</i></span>';
    btn.onclick = () => { if (unlocked) goto(i, 0); };
    side.appendChild(btn);
  });
}

function goto(lvlIdx, stageIdx) {
  cleanupCurrent();
  current = { lvl: lvlIdx, stage: stageIdx, timers: [] };
  const raw = LEVELS[lvlIdx];
  const L = normalizeLevel(raw);
  const S = L.stages[stageIdx];

  // 离开旧关
  if (G && G.S && G.S.onLeave) { try { G.S.onLeave(G); } catch (e) { console.warn(e); } }

  buildG(L, stageIdx);
  Mem.clearScan();

  // 标题区
  $('#lv-title').textContent = '第 ' + (lvlIdx + 1) + ' 关 · ' + L.name;
  $('#lv-method').textContent = '手法：' + S.method;
  $('#lv-brief').textContent = S.brief || '';
  $('#lv-goal').textContent = '目标：' + S.goal || '';
  $('#stage-bar').innerHTML = '';
  if (L.stages.length > 1) {
    L.stages.forEach((st, si) => {
      const b = el('button', 'stage-chip' + (si === stageIdx ? ' active' : ''),
        (si + 1) + '. ' + (st.short || st.name));
      b.disabled = si > stageIdx;
      b.onclick = () => { if (si <= stageIdx) goto(lvlIdx, si); };
      $('#stage-bar').appendChild(b);
    });
  }

  // 清空并调用本关
  G.panel.innerHTML = '';
  G.log.innerHTML = '';
  $('#hint-box').innerHTML = '';
  if (S.onEnter) S.onEnter(G);
  if (S.render) S.render(G, G.panel);

  renderShell();
  refreshDynamic();
  runCheck();
}

function cleanupCurrent() {
  current.timers.forEach((t) => clearInterval(t));
  current.timers = [];
}

/* ---------- 动态数值刷新（合法面板里带 data-bind 的元素） ---------- */
function refreshDynamic() {
  document.querySelectorAll('[data-bind]').forEach((node) => {
    const key = node.getAttribute('data-bind');
    if (Mem.cells[key] !== undefined) node.textContent = Mem.cells[key].value;
    else if (G && G.state[key] !== undefined) node.textContent = G.state[key];
  });
  document.querySelectorAll('[data-global]').forEach((node) => {
    const key = node.getAttribute('data-global');
    if (window[key] !== undefined) node.textContent = String(window[key]);
  });
  renderScannerList();
}

/* ---------- CE 扫描面板 ---------- */
function bindScanner() {
  $('#btn-first').onclick = () => {
    const v = parseFloat($('#scan-input').value);
    Mem.scanFirst(v);
    G && G.say('首次扫描：得到 ' + Mem.listCand().length + ' 个结果');
    renderScannerList();
  };
  $('#btn-next').onclick = () => {
    const v = parseFloat($('#scan-input').value);
    Mem.scanNext(v);
    G && G.say('再次扫描：剩 ' + Mem.listCand().length + ' 个结果');
    renderScannerList();
  };
  $('#btn-inc').onclick = () => { Mem.scanMode('inc'); G && G.say('筛选：增加了 → ' + Mem.listCand().length); renderScannerList(); };
  $('#btn-dec').onclick = () => { Mem.scanMode('dec'); G && G.say('筛选：减少了 → ' + Mem.listCand().length); renderScannerList(); };
  $('#btn-same').onclick = () => { Mem.scanMode('same'); G && G.say('筛选：未变化 → ' + Mem.listCand().length); renderScannerList(); };
  $('#btn-all').onclick = () => { Mem.scanAll(); G && G.say('未知初始值：列出全部单元'); renderScannerList(); };
  $('#btn-scan-clear').onclick = () => { Mem.clearScan(); renderScannerList(); };
}

function renderScannerList() {
  const box = $('#scan-results');
  box.innerHTML = '';
  Mem.listCand().forEach((c) => {
    const row = el('div', 'scan-row');
    row.innerHTML =
      '<span class="addr">' + c.addr + '</span>' +
      '<span class="lbl">' + c.label + '</span>' +
      '<span class="val">' + c.value + (c.frozen ? ' 🔒' : '') + '</span>';
    const edit = el('button', 'mini', '改值');
    edit.onclick = () => {
      const nv = prompt('把 ' + c.label + ' 改成：', c.value);
      if (nv === null) return;
      Mem.set(c.key, isNaN(Number(nv)) ? nv : Number(nv));
      G && G.afterChange();
    };
    const fr = el('button', 'mini', c.frozen ? '解冻' : '冻结');
    fr.onclick = () => { Mem.freeze(c.key, !c.frozen); G && G.afterChange(); };
    row.appendChild(edit);
    row.appendChild(fr);
    box.appendChild(row);
  });
}

/* ---------- 内置控制台 ---------- */
function bindConsole() {
  $('#console-run').onclick = () => {
    const src = $('#console-input').value;
    if (!src.trim()) return;
    runConsole(src, $('#console-out'));
    $('#console-input').value = '';
  };
  $('#console-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('#console-run').click();
  });
  $('#console-clear').onclick = () => { $('#console-out').innerHTML = ''; };
}

/* ---------- 提示系统 ---------- */
function bindHints() {
  $('#btn-hint').onclick = () => {
    const S = G.S;
    const hints = S.hints || [];
    const box = $('#hint-box');
    const n = box.childElementCount;
    if (n < hints.length) {
      const d = el('div', 'hint-item', '提示' + (n + 1) + '：' + hints[n]);
      box.appendChild(d);
    } else {
      G.say('提示已给完，动手吧。');
    }
  };
}

/* ---------- 通关判定 ---------- */
function runCheck() {
  if (!G || !G.S || !G.S.check) return;
  let ok = false;
  try { ok = G.S.check(G); } catch (e) { return; }
  if (ok) G.win();
}

function onWin() {
  const p = Progress.load();
  const num = current.lvl + 1;
  if (!p.done.includes(num)) p.done.push(num);
  p.unlocked = Math.max(p.unlocked, Math.min(num + 1, LEVELS.length));
  Progress.save(p);

  const L = normalizeLevel(LEVELS[current.lvl]);
  const isLastStage = current.stage >= L.stages.length - 1;

  const banner = $('#win-banner');
  banner.classList.add('show');
  if (!isLastStage) {
    $('#win-next').textContent = '进入下一个小关 →';
    $('#win-next').onclick = () => { banner.classList.remove('show'); goto(current.lvl, current.stage + 1); };
  } else if (current.lvl < LEVELS.length - 1) {
    $('#win-next').textContent = '下一关 →';
    $('#win-next').onclick = () => { banner.classList.remove('show'); goto(current.lvl + 1, 0); };
  } else {
    $('#win-next').textContent = '已全部通关 🎉';
    $('#win-next').onclick = () => banner.classList.remove('show');
  }
  $('#win-retry').onclick = () => { banner.classList.remove('show'); };
  renderShell();
}

/* ---------- 启动 ---------- */
window.addEventListener('DOMContentLoaded', () => {
  bindScanner();
  bindConsole();
  bindHints();
  const p = Progress.load();
  const start = Math.min(p.unlocked - 1, LEVELS.length - 1);
  goto(start < 0 ? 0 : start, 0);
});
