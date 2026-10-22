/* ============================================================
 * Client Cheat Quest - 引擎核心
 * 纯原生 JS，file:// 直接打开即可运行，无任何依赖。
 * 提供：伪内存表 / CE式扫描器 / 内置控制台 / 本地存档辅助
 * ============================================================ */

/* ---------------- 伪内存表（模拟 CE 看到的进程内存） ---------------- */
const Mem = {
  cells: {},        // key -> {key,label,addr,value,frozen,frozenValue}
  snapshot: {},     // 上一次扫描时的快照（用于 增加了/减少了/未变化）
  cand: new Set(),  // 当前候选地址集合

  /* 进入关卡时注册本关可见的内存单元，地址随机分配（模拟地址漂移） */
  define(defs) {
    this.cells = {};
    defs.forEach((d) => {
      const addr = '0x' + (0x1000 + Math.floor(Math.random() * 0xEFFF))
        .toString(16).toUpperCase().padStart(4, '0');
      this.cells[d.key] = {
        key: d.key, label: d.label, addr,
        value: d.value, orig: d.value, decoy: !!d.decoy,
        frozen: false, frozenValue: d.value,
      };
    });
    this.clearScan();
  },

  get(k) { return this.cells[k] ? this.cells[k].value : undefined; },
  set(k, v) {
    const c = this.cells[k];
    if (!c) return;
    c.value = v;
    // 假地址（诱饵）：改完自动回弹，用来教玩家分辨真假
    if (c.decoy) setTimeout(() => { c.value = c.orig; }, 300);
  },

  freeze(k, on = true) {
    const c = this.cells[k];
    if (!c) return;
    c.frozen = on;
    c.frozenValue = c.value;
  },

  /* 合法操作改动数值后调用，把所有“冻结”的单元恢复成冻结值 */
  applyFreezes() {
    for (const k in this.cells) {
      const c = this.cells[k];
      if (c.frozen) c.value = c.frozenValue;
    }
  },

  snapshotNow() {
    for (const k in this.cells) this.snapshot[k] = this.cells[k].value;
  },

  /* CE 扫描 */
  scanFirst(v) {
    this.snapshotNow();
    this.cand = new Set();
    for (const k in this.cells) if (this.cells[k].value === v) this.cand.add(k);
  },
  scanNext(v) {
    const n = new Set();
    this.cand.forEach((k) => { if (this.cells[k].value === v) n.add(k); });
    this.cand = n;
    this.snapshotNow();
  },
  scanMode(mode) {
    const n = new Set();
    this.cand.forEach((k) => {
      const c = this.cells[k], old = this.snapshot[k];
      let ok;
      if (mode === 'inc') ok = c.value > old;
      else if (mode === 'dec') ok = c.value < old;
      else ok = c.value === old; // 'same' / 'unchanged'
      if (ok) n.add(k);
    });
    this.cand = n;
    this.snapshotNow();
  },
  scanAll() {
    this.snapshotNow();
    this.cand = new Set(Object.keys(this.cells));
  },
  clearScan() { this.cand = new Set(); },
  listCand() { return [...this.cand].map((k) => this.cells[k]); },
};

/* ---------------- 全局进度（明文，单独存放） ---------------- */
const Progress = {
  KEY: 'ccq_progress',
  load() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || { unlocked: 1, done: [] }; }
    catch (e) { return { unlocked: 1, done: [] }; }
  },
  save(p) { localStorage.setItem(this.KEY, JSON.stringify(p)); },
};

/* ---------------- 每关运行时上下文 G ---------------- */
let G = null; // 当前关卡上下文，main.js 每关重置

/* 内置控制台：间接 eval 在全局作用域执行，window 变量可直接改 */
function runConsole(src, outEl) {
  const log = (txt, cls) => {
    const div = document.createElement('div');
    div.className = 'console-line ' + (cls || '');
    div.textContent = txt;
    outEl.appendChild(div);
    outEl.scrollTop = outEl.scrollHeight;
  };
  log('> ' + src, 'cmd');
  try {
    const result = (0, eval)(src); // 间接 eval = 全局作用域，可读写 window 变量
    if (result !== undefined) log('← ' + String(result), 'ret');
  } catch (e) {
    log('✕ ' + e.message, 'err');
  }
  // 执行后刷新界面数值与通关判定
  if (G && G.afterChange) G.afterChange();
}

/* 本地存档小工具（供存档关使用） */
const LS = {
  get(k) { return localStorage.getItem(k); },
  set(k, v) { localStorage.setItem(k, v); },
  remove(k) { localStorage.removeItem(k); },
};

/* 通用编码辅助（存档关用得到） */
const Codec = {
  b64enc(s) { return btoa(unescape(encodeURIComponent(s))); },
  b64dec(s) { return decodeURIComponent(escape(atob(s.trim()))); },
  xor(s, key) {
    let out = '';
    for (let i = 0; i < s.length; i++) {
      out += String.fromCharCode(s.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return out;
  },
  xorB64(s, key) { return Codec.b64enc(Codec.xor(s, key)); },
  unxorB64(str, key) { return Codec.xor(Codec.b64dec(str), key); },
};

/* 全局别名，供关卡脚本与内置控制台直接使用 */
const codec = Codec;
