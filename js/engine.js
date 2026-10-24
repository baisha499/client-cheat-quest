const Mem = {
  cells: {},
  snapshot: {},
  cand: new Set,
  _drift: null,
  _addr() {
    return "0x" + (4096 + Math.floor(61439 * Math.random())).toString(16).toUpperCase().padStart(4, "0");
  },
  define(defs) {
    clearInterval(this._drift), this._drift = null;
    this.cells = {}, defs.forEach(d => {
      this.cells[d.key] = {
        key: d.key,
        label: d.label,
        addr: this._addr(),
        value: d.value,
        orig: d.value,
        decoy: !!d.decoy,
        noise: !1,
        frozen: !1,
        frozenValue: d.value
      };
    }), this.clearScan();
  },
  plant() {
    this.define([ { key: "bd", label: "隐藏后门值", value: 0 } ]);
  },
  mirror(memKey, gname) {
    try { delete window[gname]; } catch (e) {}
    Object.defineProperty(window, gname, {
      configurable: !0,
      get() { return Mem.get(memKey); },
      set(v) { Mem.set(memKey, v); }
    });
  },
  loot(anchorKey, n = 20) {
    const anchor = this.cells[anchorKey];
    if (!anchor) return;
    for (let i = 0; i < n; i++) {
      const k = "nz_" + i + "_" + Math.floor(Math.random() * 1e6);
      this.cells[k] = {
        key: k, label: "杂乱值" + (i + 1), addr: this._addr(),
        value: anchor.value, orig: anchor.value,
        decoy: !1, noise: !0, frozen: !1, frozenValue: anchor.value
      };
    }
    clearInterval(this._drift);
    this._drift = setInterval(() => {
      for (const k in this.cells) {
        const c = this.cells[k];
        if (c.noise) c.value = c.orig + Math.floor(Math.random() * 9) - 4;
      }
    }, 900);
  },
  get(k) {
    return this.cells[k] ? this.cells[k].value : void 0;
  },
  set(k, v) {
    const c = this.cells[k];
    c && (c.value = v, c.decoy && setTimeout(() => {
      c.value = c.orig;
    }, 300));
  },
  freeze(k, on = !0) {
    const c = this.cells[k];
    c && (c.frozen = on, c.frozenValue = c.value);
  },
  applyFreezes() {
    for (const k in this.cells) {
      const c = this.cells[k];
      if (c.frozen) c.value = c.frozenValue;
      else if (c.noise) c.value = c.orig + Math.floor(Math.random() * 5) - 2;
    }
  },
  snapshotNow() {
    for (const k in this.cells) this.snapshot[k] = this.cells[k].value;
  },
  scanFirst(v) {
    this.snapshotNow(), this.cand = new Set;
    for (const k in this.cells) this.cells[k].value === v && this.cand.add(k);
  },
  scanNext(v) {
    const n = new Set;
    this.cand.forEach(k => {
      this.cells[k].value === v && n.add(k);
    }), this.cand = n, this.snapshotNow();
  },
  scanMode(mode) {
    const n = new Set;
    this.cand.forEach(k => {
      const c = this.cells[k], old = this.snapshot[k];
      let ok;
      ok = "inc" === mode ? c.value > old : "dec" === mode ? c.value < old : c.value === old, 
      ok && n.add(k);
    }), this.cand = n, this.snapshotNow();
  },
  scanAll() {
    this.snapshotNow(), this.cand = new Set(Object.keys(this.cells));
  },
  clearScan() {
    this.cand = new Set;
  },
  listCand() {
    return [ ...this.cand ].map(k => this.cells[k]);
  }
}, Progress = {
  KEY: "ccq_progress",
  load() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || {
        unlocked: 1,
        done: []
      };
    } catch (e) {
      return {
        unlocked: 1,
        done: []
      };
    }
  },
  save(p) {
    localStorage.setItem(this.KEY, JSON.stringify(p));
  }
};

let G = null;

function runConsole(src, outEl) {
  const log = (txt, cls) => {
    const div = document.createElement("div");
    div.className = "console-line " + (cls || ""), div.textContent = txt, outEl.appendChild(div), 
    outEl.scrollTop = outEl.scrollHeight;
  };
  log("> " + src, "cmd");
  try {
    const result = (0, eval)(src);
    void 0 !== result && log("← " + String(result), "ret");
  } catch (e) {
    log("✕ " + e.message, "err");
  }
  G && G.afterChange && G.afterChange();
}

const LS = {
  get: k => localStorage.getItem(k),
  set(k, v) {
    localStorage.setItem(k, v);
  },
  remove(k) {
    localStorage.removeItem(k);
  }
}, Codec = {
  b64enc: s => btoa(unescape(encodeURIComponent(s))),
  b64dec: s => decodeURIComponent(escape(atob(s.trim()))),
  xor(s, key) {
    let out = "";
    for (let i = 0; i < s.length; i++) out += String.fromCharCode(s.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    return out;
  },
  xorB64: (s, key) => Codec.b64enc(Codec.xor(s, key)),
  unxorB64: (str, key) => Codec.xor(Codec.b64dec(str), key)
}, codec = Codec;
