function normalizeLevel(L) {
  const stages = L.stages && L.stages.length ? L.stages : [ {
    name: L.name,
    method: L.method,
    brief: L.brief,
    goal: L.goal,
    hints: L.hints,
    onEnter: L.onEnter,
    render: L.render,
    check: L.check,
    onLeave: L.onLeave
  } ];
  return Object.assign({}, L, {
    stages: stages
  });
}

const $ = sel => document.querySelector(sel);

function el(tag, cls, text) {
  const e = document.createElement(tag);
  return cls && (e.className = cls), void 0 !== text && (e.textContent = text), e;
}

function closeDrawer() {
  document.body.classList.remove("drawer-open");
}

let current = {
  lvl: 0,
  stage: 0,
  timers: []
};

function buildG(lvl, stageIdx) {
  const S = lvl.stages[stageIdx];
  return G = {
    state: {},
    mem: Mem,
    stage: stageIdx,
    ls: LS,
    codec: Codec,
    panel: $("#legit-panel"),
    log: $("#level-log"),
    say(msg) {
      const d = el("div", "log-line", msg);
      this.log.appendChild(d), this.log.scrollTop = this.log.scrollHeight;
    },
    tick(fn, ms) {
      const t = setInterval(fn, ms);
      return current.timers.push(t), t;
    },
    win() {
      this._won || (this._won = !0, onWin());
    },
    afterChange() {
      refreshDynamic(), runCheck();
    }
  }, G.S = S, G;
}

function renderShell() {
  const side = $("#level-list");
  side.innerHTML = "", LEVELS.forEach((raw, i) => {
    const L = normalizeLevel(raw), p = Progress.load(), done = p.done.includes(i + 1), unlocked = i + 1 <= p.unlocked, btn = el("button", "lv-item" + (done ? " done" : "") + (unlocked ? "" : " locked") + (i === current.lvl ? " active" : ""));
    btn.innerHTML = '<span class="lv-num">' + (done ? "✓" : i + 1) + '</span><span class="lv-meta"><b>' + L.name + "</b><i>" + L.method + "</i></span>", 
    btn.onclick = () => {
      unlocked && goto(i, 0), closeDrawer();
    }, side.appendChild(btn);
  });
}

function goto(lvlIdx, stageIdx) {
  cleanupCurrent(), current = {
    lvl: lvlIdx,
    stage: stageIdx,
    timers: []
  };
  const L = normalizeLevel(LEVELS[lvlIdx]), S = L.stages[stageIdx];
  if (G && G.S && G.S.onLeave) try {
    G.S.onLeave(G);
  } catch (e) {
    console.warn(e);
  }
  buildG(L, stageIdx), Mem.clearScan(), $("#lv-title").textContent = "第 " + (lvlIdx + 1) + " 关 · " + L.name, 
  $("#lv-method").textContent = "手法：" + S.method, $("#lv-brief").textContent = S.brief || "", 
  $("#lv-goal").textContent = "目标：" + S.goal || "", $("#stage-bar").innerHTML = "", 
  L.stages.length > 1 && L.stages.forEach((st, si) => {
    const b = el("button", "stage-chip" + (si === stageIdx ? " active" : ""), si + 1 + ". " + (st.short || st.name));
    b.disabled = si > stageIdx, b.onclick = () => {
      si <= stageIdx && goto(lvlIdx, si);
    }, $("#stage-bar").appendChild(b);
  }), G.panel.innerHTML = "", G.log.innerHTML = "", $("#hint-box").innerHTML = "", 
  S.onEnter && S.onEnter(G), S.render && S.render(G, G.panel), renderShell(), refreshDynamic(), 
  runCheck();
}

function cleanupCurrent() {
  current.timers.forEach(t => clearInterval(t)), current.timers = [];
}

function refreshDynamic() {
  document.querySelectorAll("[data-bind]").forEach(node => {
    const key = node.getAttribute("data-bind");
    void 0 !== Mem.cells[key] ? node.textContent = Mem.cells[key].value : G && void 0 !== G.state[key] && (node.textContent = G.state[key]);
  }), document.querySelectorAll("[data-global]").forEach(node => {
    const key = node.getAttribute("data-global");
    void 0 !== window[key] && (node.textContent = String(window[key]));
  }), renderScannerList();
}

function bindScanner() {
  $("#btn-first").onclick = () => {
    const v = parseFloat($("#scan-input").value);
    Mem.scanFirst(v), G && G.say("首次扫描：得到 " + Mem.listCand().length + " 个结果"), renderScannerList();
  }, $("#btn-next").onclick = () => {
    const v = parseFloat($("#scan-input").value);
    Mem.scanNext(v), G && G.say("再次扫描：剩 " + Mem.listCand().length + " 个结果"), renderScannerList();
  }, $("#btn-inc").onclick = () => {
    Mem.scanMode("inc"), G && G.say("筛选：增加了 → " + Mem.listCand().length), renderScannerList();
  }, $("#btn-dec").onclick = () => {
    Mem.scanMode("dec"), G && G.say("筛选：减少了 → " + Mem.listCand().length), renderScannerList();
  }, $("#btn-same").onclick = () => {
    Mem.scanMode("same"), G && G.say("筛选：未变化 → " + Mem.listCand().length), renderScannerList();
  }, $("#btn-all").onclick = () => {
    Mem.scanAll(), G && G.say("未知初始值：列出全部单元"), renderScannerList();
  }, $("#btn-scan-clear").onclick = () => {
    Mem.clearScan(), renderScannerList();
  };
}

function renderScannerList() {
  const box = $("#scan-results");
  box.innerHTML = "", Mem.listCand().forEach(c => {
    const row = el("div", "scan-row");
    row.innerHTML = '<span class="addr">' + c.addr + '</span><span class="lbl">' + c.label + '</span><span class="val">' + c.value + (c.frozen ? " 🔒" : "") + "</span>";
    const edit = el("button", "mini", "改值");
    edit.onclick = () => {
      const nv = prompt("把 " + c.label + " 改成：", c.value);
      null !== nv && (Mem.set(c.key, isNaN(Number(nv)) ? nv : Number(nv)), G && G.afterChange());
    };
    const fr = el("button", "mini", c.frozen ? "解冻" : "冻结");
    fr.onclick = () => {
      Mem.freeze(c.key, !c.frozen), G && G.afterChange();
    };
    const act = el("span", "scan-act");
    act.appendChild(edit), act.appendChild(fr), row.appendChild(act), box.appendChild(row);
  });
}

function bindConsole() {
  $("#console-run").onclick = () => {
    const src = $("#console-input").value;
    src.trim() && (runConsole(src, $("#console-out")), $("#console-input").value = "");
  }, $("#console-input").addEventListener("keydown", e => {
    "Enter" === e.key && $("#console-run").click();
  }), $("#console-clear").onclick = () => {
    $("#console-out").innerHTML = "";
  };
}

function bindHints() {
  $("#btn-hint").onclick = () => {
    const hints = G.S.hints || [], box = $("#hint-box"), n = box.childElementCount;
    if (n < hints.length) {
      const d = el("div", "hint-item", "提示" + (n + 1) + "：" + hints[n]);
      box.appendChild(d);
    } else G.say("提示已给完，动手吧。");
  };
}

function runCheck() {
  if (!G || !G.S || !G.S.check) return;
  let ok = !1;
  try {
    ok = G.S.check(G);
  } catch (e) {
    return;
  }
  ok && G.win();
}

function onWin() {
  const p = Progress.load(), num = current.lvl + 1;
  p.done.includes(num) || p.done.push(num), p.unlocked = Math.max(p.unlocked, Math.min(num + 1, LEVELS.length)), 
  Progress.save(p);
  const L = normalizeLevel(LEVELS[current.lvl]), isLastStage = current.stage >= L.stages.length - 1, banner = $("#win-banner");
  banner.classList.add("show"), isLastStage ? current.lvl < LEVELS.length - 1 ? ($("#win-next").textContent = "下一关 →", 
  $("#win-next").onclick = () => {
    banner.classList.remove("show"), goto(current.lvl + 1, 0);
  }) : ($("#win-next").textContent = "已全部通关 🎉", $("#win-next").onclick = () => banner.classList.remove("show")) : ($("#win-next").textContent = "进入下一个小关 →", 
  $("#win-next").onclick = () => {
    banner.classList.remove("show"), goto(current.lvl, current.stage + 1);
  }), $("#win-retry").onclick = () => {
    banner.classList.remove("show");
  }, renderShell();
}

window.addEventListener("DOMContentLoaded", () => {
  bindScanner(), bindConsole(), bindHints();
  const menuBtn = $("#menu-btn"), mask = $("#drawer-mask");
  if (menuBtn) menuBtn.onclick = () => document.body.classList.toggle("drawer-open");
  if (mask) mask.onclick = closeDrawer;
  const rail = document.querySelector(".card-rail");
  if (rail) {
    const rb = el("button", "btn ghost reset-all", "↺ 一键重置全部进度");
    rb.onclick = () => {
      if (confirm("清空通关进度，并删除所有本关存档？此操作不可撤销。")) {
        [ "ccq_progress", "ccq_l5", "ccq_l9", "ccq_l12", "ccq_l18", "ccq_final" ].forEach(k => LS.remove(k));
        location.reload();
      }
    };
    rail.appendChild(rb);
  }
  const p = Progress.load(), start = Math.min(p.unlocked - 1, LEVELS.length - 1);
  goto(start < 0 ? 0 : start, 0);
});
