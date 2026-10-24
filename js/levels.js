function savePanel(G, cfg) {
  const wrap = el("div", "save-box"), ta = el("textarea", "save-raw");
  ta.rows = 3;
  const refresh = () => {
    ta.value = LS.get(cfg.key) || "";
  };
  refresh();
  const row = el("div", "row"), imp = el("button", "btn", "把下方内容写回存档");
  imp.onclick = () => {
    LS.set(cfg.key, ta.value.trim()), G.say("已写回，等待校验。"), G.afterChange();
  };
  const regen = el("button", "btn ghost", "合法重新生成存档");
  return regen.onclick = () => {
    LS.set(cfg.key, cfg.regen()), refresh(), G.afterChange();
  }, row.append(imp, regen), wrap.append(ta, row), {
    wrap: wrap,
    refresh: refresh,
    ta: ta
  };
}

const LEVELS = [ {
  name: "源码里的钥匙",
  method: "读源码找后门",
  brief: "一扇木门锁着，要输入 4 位数字密码。界面上没有任何提示，开发者却把密码写进了页面注释里。这是你学会的第一招：查看网页源代码。",
  goal: "输入正确密码打开木门。",
  onEnter(G) {
    window.backdoor = () => { G.state.open = !0, G.afterChange(); };
  },
  render(G, p) {
    p.insertAdjacentHTML("beforeend", "\x3c!-- 后门密码：1337（右键→查看网页源代码，或 F12→Elements 里搜“密码”） --\x3e");
    const inp = el("input", "text-input");
    inp.placeholder = "4 位密码";
    const btn = el("button", "btn", "开门");
    btn.onclick = () => {
      "1337" === inp.value.trim() && (G.state.open = !0), G.afterChange();
    }, p.append(inp, btn);
  },
  check: G => !0 === G.state.open,
  hints: [ "密码不在画面上，去看 HTML 源代码（右键 → 查看网页源代码 / F12 → Elements）。", "在源码里搜索“密码”两个字，留意 HTML 注释。", "注释里写着一串数字，按它输入即可开门。" ]
}, {
  name: "控制台里的钱包",
  method: "控制台改 JS 变量",
  brief: "商店卖一把 1000 金币的钥匙，你只有 50 金币。合法打工一次只给 1 金币，攒到天亮也不够。打开内置控制台（或 F12 Console），直接改全局变量 gold。",
  goal: "把金币凑到 1000 并买下钥匙。",
  onEnter(G) {
    Mem.define([ { key: "gold", label: "金币", value: 50 } ]);
    Mem.loot("gold", 8), Mem.mirror("gold", "gold"), G.state.bought = !1;
  },
  render(G, p) {
    p.append(el("div", "status", "当前金币："));
    const g = el("span", "", "");
    g.setAttribute("data-bind", "gold"), p.lastChild.appendChild(g);
    const work = el("button", "btn ghost", "打工 +1 金币");
    work.onclick = () => {
      Mem.set("gold", Mem.get("gold") + 1), Mem.applyFreezes(), G.afterChange();
    };
    const buy = el("button", "btn", "购买钥匙（1000）");
    buy.onclick = () => {
      Mem.get("gold") >= 1e3 && (G.state.bought = !0), G.afterChange();
    }, p.append(work, buy);
  },
  check: G => !0 === G.state.bought,
  hints: [ "打开内置控制台，找到那个表示金币的全局变量。", "把金币改到购买所需金额以上。", "改完再点“购买钥匙”。" ]
}, {
  name: "找到你的血量",
  method: "CE式扫描·固定值",
  stages: [ {
    short: "练习：固定值扫描",
    method: "CE式扫描·固定值",
    brief: "练习小关：屏幕上有一个数字，点“变化”它会 +5。用右侧扫描器：先扫当前值，变化后再扫新值，候选会越缩越少，最后只剩它。",
    goal: "把练习数字改成 999。",
    onEnter(G) {
      Mem.define([ { key: "a", label: "练习数字", value: 123 } ]);
      Mem.loot("a", 8), Mem.mirror("a", "a");
    },
    render(G, p) {
      p.append(el("div", "status", "练习数字："));
      const s = el("span", "");
      s.setAttribute("data-bind", "a"), p.lastChild.appendChild(s);
      const b = el("button", "btn ghost", "变化 +5");
      b.onclick = () => {
        Mem.set("a", Mem.get("a") + 5), Mem.applyFreezes(), G.afterChange();
      }, p.append(b);
    },
    check: G => Mem.get("a") >= 999,
    hints: [ "在扫描器输入当前数字，点“首次扫描”。", "点一次“变化”，输入新数字点“再次扫描”。", "只剩一个结果后，点“改值”改成 999。" ]
  }, {
    short: "实战：怪物反击",
    method: "CE式扫描·固定值",
    brief: "实战：你 HP=100，怪物反击一下变成 87。用固定值扫描定位 HP 地址，改成 999，再点“继续战斗”就能活下来。",
    goal: "把 HP 改成 999 并继续战斗。",
    onEnter(G) {
      Mem.define([ { key: "hp", label: "玩家血量 HP", value: 100 } ]);
      Mem.loot("hp", 8);
      Mem.mirror("hp", "hp"), G.state.alive = !1;
    },
    render(G, p) {
      p.append(el("div", "status", "HP："));
      const s = el("span", "");
      s.setAttribute("data-bind", "hp"), p.lastChild.appendChild(s);
      const atk = el("button", "btn ghost", "攻击怪物（会被反击 -13）");
      atk.onclick = () => {
        Mem.set("hp", Mem.get("hp") - 13), Mem.applyFreezes(), G.afterChange();
      };
      const go = el("button", "btn", "继续战斗");
      go.onclick = () => {
        Mem.get("hp") >= 999 && (G.state.alive = !0), G.afterChange();
      }, p.append(atk, go);
    },
    check: G => !0 === G.state.alive,
    hints: [ "先扫 100，被反击后扫 87。", "定位到 HP 后改成 999。", "再点“继续战斗”。" ]
  } ]
}, {
  name: "会变动的金币",
  method: "CE式扫描·动态值",
  brief: "金币一直在变（打工 +7，购物 -3），不能只扫一次。CE 的思路：先扫当前值，让它变动，再扫新值，反复几次锁定唯一地址，改成 1000。",
  goal: "把金币改到 1000。",
  onEnter(G) {
    Mem.define([ { key: "gold", label: "金币", value: 20 } ]);
    Mem.loot("gold", 8);
    Mem.mirror("gold", "gold");
  },
  render(G, p) {
    p.append(el("div", "status", "金币："));
    const s = el("span", "");
    s.setAttribute("data-bind", "gold"), p.lastChild.appendChild(s);
    const work = el("button", "btn ghost", "打工 +7");
    work.onclick = () => {
      Mem.set("gold", Mem.get("gold") + 7), Mem.applyFreezes(), G.afterChange();
    };
    const shop = el("button", "btn ghost", "购物 -3");
    shop.onclick = () => {
      Mem.set("gold", Mem.get("gold") - 3), Mem.applyFreezes(), G.afterChange();
    }, p.append(work, shop);
  },
  check: G => Mem.get("gold") >= 1e3,
  hints: [ "先扫当前金币数，点一次打工，再扫新金币数。", "重复“变动→再扫描”直到只剩一个结果。", "把它改成 1000。" ]
}, {
  name: "明文存档",
  method: "篡改 localStorage（明文）",
  brief: "游戏把进度写在浏览器本地存档里，而且是明文 JSON：coins 只有 5，需要 50。合法做任务每次 +1。直接在存档框里把 coins 改成 50，写回即可。",
  goal: "让 coins ≥ 50 并领取奖励。",
  onEnter(G) {
    Mem.define([ { key: "coins", label: "松果数", value: 5 } ]);
    Mem.mirror("coins", "coins");
    LS.set("ccq_l5", JSON.stringify({
      coins: 5,
      need: 50,
      task: "收集松果"
    }));
  },
  render(G, p) {
    const panel = savePanel(G, {
      key: "ccq_l5",
      regen: () => JSON.stringify({ coins: 5, need: 50, task: "收集松果" })
    }), task = el("button", "btn ghost", "合法做任务 +1");
    task.onclick = () => {
      const o = JSON.parse(LS.get("ccq_l5"));
      o.coins += 1, Mem.set("coins", Mem.get("coins") + 1), LS.set("ccq_l5", JSON.stringify(o)), panel.refresh(), G.afterChange();
    };
    const claim = el("button", "btn", "领取奖励");
    claim.onclick = () => {
      const o = JSON.parse(LS.get("ccq_l5"));
      if (o.coins >= o.need || Mem.get("coins") >= o.need) G.state.ok = !0;
      G.afterChange();
    }, p.append(panel.wrap, task, claim);
  },
  check: G => !0 === G.state.ok,
  hints: [ "存档是明文 JSON，找到表示松果数的字段。", "把它改到需求值以上，点“写回存档”。", "再点“领取奖励”。" ]
}, {
  name: "冻结你的血条",
  method: "CE式扫描·冻结数值",
  stages: [ {
    short: "练习：认识冻结",
    method: "CE式扫描·冻结",
    brief: "练习小关：数字每秒 -2。扫到它，点“冻结”，它就再也不会掉了。这就是 CE 的锁值。",
    goal: "冻结练习数字让它不再下降。",
    onEnter(G) {
      Mem.define([ { key: "x", label: "练习数字", value: 50 } ]);
      Mem.loot("x", 6), Mem.mirror("x", "x");
      G.tick(() => {
        Mem.set("x", Mem.get("x") - 2), Mem.applyFreezes(), G.afterChange();
      }, 1e3);
    },
    render(G, p) {
      p.append(el("div", "status", "数字（每秒 -2）："));
      const s = el("span", "");
      s.setAttribute("data-bind", "x"), p.lastChild.appendChild(s);
    },
    check: G => Mem.get("x") >= 50 && Mem.cells.x.frozen,
    hints: [ "先扫 50，等它掉一点再扫新值锁定。", "在结果行点“冻结”。", "冻结后数字会一直保持 50。" ]
  }, {
    short: "实战：撑过毒伤",
    method: "CE式扫描·冻结",
    brief: "实战：你中毒了，每秒掉 8 血，要撑过 10 秒。合法吃药也来不及。扫到 HP，冻结在 100，稳稳撑过去。",
    goal: "冻结 HP 并撑满 10 秒。",
    onEnter(G) {
      Mem.define([ { key: "hp", label: "HP", value: 100 } ]);
      Mem.loot("hp", 8), Mem.mirror("hp", "hp");
      G.state.ticks = 0, G.tick(() => {
        Mem.set("hp", Mem.get("hp") - 8), Mem.applyFreezes(), G.state.ticks += 1, G.afterChange();
      }, 1e3);
    },
    render(G, p) {
      p.append(el("div", "status", "HP："));
      const s = el("span", "");
      s.setAttribute("data-bind", "hp"), p.lastChild.appendChild(s), p.append(el("div", "status", "已撑过："));
      const t = el("span", "");
      t.setAttribute("data-bind", "ticks"), p.lastChild.appendChild(t), p.append(el("span", "", " 秒 / 10"));
    },
    check: G => G.state.ticks >= 10,
    hints: [ "扫 HP，让它掉血后再扫，锁定地址。", "点“冻结”把它锁在 100。", "然后等 10 秒即可。" ]
  } ]
}, {
  name: "藏起来的调试函数",
  method: "控制台调用隐藏函数",
  brief: "开发者留了一个调试函数 debug.unlock()，但界面上没有按钮。它挂在全局对象 debug 上，直接在控制台调用就能通关。",
  goal: "调用 debug.unlock()。",
  onEnter(G) {
    window.debug = {
      unlock() {
        G.state.pass = !0, G.afterChange();
      }
    }, window.masterOpen = !1, G.state.pass = !1;
  },
  render(G, p) {
    p.append(el("div", "status", "大门紧闭，界面上没有任何按钮……"));
  },
  check: G => !0 === G.state.pass || window.masterOpen === !0,
  hints: [ "全局挂着一个 debug 对象，里面藏着解锁用的方法。", "在控制台调用这个解锁方法。", "调用后大门会自动打开。" ]
}, {
  name: "注释里的暗号",
  method: "读源码·找暗号",
  brief: "一道能量门要输入暗号。暗号藏在本关的 HTML 注释里，和第1关一样去源码里找，但这次是字母数字混合。",
  goal: "输入正确暗号。",
  onEnter(G) {
    G.state.ok = !1;
  },
  render(G, p) {
    p.insertAdjacentHTML("beforeend", "\x3c!-- dev note: 应急后门暗号 = H4CK，别写进文档 --\x3e");
    const inp = el("input", "text-input");
    inp.placeholder = "暗号";
    const btn = el("button", "btn", "提交");
    btn.onclick = () => {
      "H4CK" === inp.value.trim() && (G.state.ok = !0), G.afterChange();
    }, p.append(inp, btn);
  },
  check: G => !0 === G.state.ok,
  hints: [ "看本关注入页面的 HTML 注释。", "在注释里搜“暗号 / dev note”。", "注释里给了一串字母数字组合，把它提交即可。" ]
}, {
  name: "Base64 存档",
  method: "篡改存档·Base64 编码",
  brief: "存档不再是明文，而是 Base64 编码（一串字母数字+/=）。先解码看内容，把 exp 改成 30，再编码写回。控制台可用 codec.b64dec / codec.b64enc。",
  goal: "解码改 exp 到 30 再编码写回。",
  onEnter(G) {
    window.exp = 2;
    LS.set("ccq_l9", Codec.b64enc(JSON.stringify({
      exp: 2,
      need: 30
    })));
  },
  render(G, p) {
    const panel = savePanel(G, {
      key: "ccq_l9",
      regen: () => Codec.b64enc(JSON.stringify({
        exp: 2,
        need: 30
      }))
    }), claim = el("button", "btn", "领取升级");
    claim.onclick = () => {
      const o = JSON.parse(Codec.b64dec(LS.get("ccq_l9")));
      (o.exp >= o.need || window.exp >= o.need) && (G.state.ok = !0), G.afterChange();
    }, p.append(panel.wrap, claim);
  },
  check: G => !0 === G.state.ok,
  hints: [ "先把这串 Base64 解码成 JSON，看清里面的字段。", "把经验值改到需求值以上，再重新编码。", "把编码结果粘进存档框写回并领取。" ]
}, {
  name: "不知道数值怎么扫",
  method: "CE式扫描·未知初始值",
  stages: [ {
    short: "练习：增加了/减少了",
    method: "CE·未知初始值",
    brief: "练习小关：你不知道这个数字是多少。先点“全部列出”，点一次“+3”，再点“增加了”，反复缩小范围。",
    goal: "锁定练习数字并改成 999。",
    onEnter(G) {
      Mem.define([ { key: "e", label: "经验值(未知)", value: 11 } ]);
      Mem.loot("e", 8), Mem.mirror("e", "e");
    },
    render(G, p) {
      p.append(el("div", "status", "经验值：（不显示具体数字）"));
      const b = el("button", "btn ghost", "打怪 +3 经验");
      b.onclick = () => {
        Mem.set("e", Mem.get("e") + 3), Mem.applyFreezes(), G.afterChange();
      }, p.append(b);
    },
    check: G => Mem.get("e") >= 999,
    hints: [ "不知道初值就点“全部列出”。", "打一次怪，点“增加了”筛选。", "重复直到唯一，改成 999。" ]
  }, {
    short: "实战：刷经验升级",
    method: "CE·未知初始值",
    brief: "实战：经验值不显示，打怪每次 +3，需要 100 升级。用“全部列出→增加了”反复定位，改成 100。",
    goal: "经验值达到 100 升级。",
    onEnter(G) {
      Mem.define([ { key: "exp", label: "经验值", value: 7 } ]);
      Mem.loot("exp", 8), Mem.mirror("exp", "exp");
      G.state.up = !1;
    },
    render(G, p) {
      p.append(el("div", "status", "经验值：隐藏"));
      const b = el("button", "btn ghost", "打怪 +3");
      b.onclick = () => {
        Mem.set("exp", Mem.get("exp") + 3), Mem.applyFreezes(), G.afterChange();
      };
      const lv = el("button", "btn", "升级");
      lv.onclick = () => {
        Mem.get("exp") >= 100 && (G.state.up = !0), G.afterChange();
      }, p.append(b, lv);
    },
    check: G => !0 === G.state.up,
    hints: [ "点“全部列出”，打一次怪，点“增加了”。", "多打几次、多筛几次，只剩一个。", "改成 100 再点升级。" ]
  } ]
}, {
  name: "被拒绝的按钮",
  method: "控制台·Hook 判定函数",
  brief: "提交按钮调用 canPass()，它写死返回 false，所以永远点不过。在控制台把 window.canPass 覆盖成返回 true，再点按钮。",
  goal: "让 canPass() 返回 true 并提交。",
  onEnter(G) {
    window.canPass = () => !1, window.forcePass = !1, G.state.done = !1;
  },
  render(G, p) {
    const btn = el("button", "btn", "提交申请");
    btn.onclick = () => {
      (window.canPass() || window.forcePass) && (G.state.done = !0), G.afterChange();
    }, p.append(btn, el("div", "status", "（按钮内部调用 canPass()，当前恒为 false）"));
  },
  check: G => !0 === G.state.done,
  hints: [ "按钮调用一个叫 canPass 的全局判定函数，它现在一律返回不通过。", "在控制台把这个函数改成总是返回通过。", "再点提交。" ]
}, {
  name: "异或加密存档",
  method: "篡改存档·XOR",
  brief: '存档是 Base64 + XOR 异或（密钥 ccq）。用 codec.unxorB64(存档, "ccq") 解出 JSON，把 atk 改到 99，再 codec.xorB64(改后的JSON, "ccq") 写回。',
  goal: "解开异或、改 atk=99 并写回。",
  onEnter(G) {
    window.atk = 3;
    LS.set("ccq_l12", Codec.xorB64(JSON.stringify({
      atk: 3,
      need: 99
    }), "ccq"));
  },
  render(G, p) {
    const panel = savePanel(G, {
      key: "ccq_l12",
      regen: () => Codec.xorB64(JSON.stringify({
        atk: 3,
        need: 99
      }), "ccq")
    }), fight = el("button", "btn", "挑战 Boss");
    fight.onclick = () => {
      const o = JSON.parse(Codec.unxorB64(LS.get("ccq_l12"), "ccq"));
      (o.atk >= o.need || window.atk >= o.need) && (G.state.ok = !0), G.afterChange();
    }, p.append(panel.wrap, fight);
  },
  check: G => !0 === G.state.ok,
  hints: [ "先用异或加 Base64 的逆向把存档解成 JSON。", "把攻击力改到需求值以上，再重新异或编码。", "写回后点挑战 Boss。" ]
}, {
  name: "真假地址陷阱",
  method: "CE·辨别真假地址",
  brief: "扫描出来好几个像 HP 的地址，但假地址改完会自动回弹。哪个改完稳住、不掉回去，哪个才是真的。把真 HP 改成 999。",
  goal: "找到真 HP 并改成 999。",
  onEnter(G) {
    Mem.define([ {
      key: "hp_real",
      label: "玩家血量 HP",
      value: 100
    }, {
      key: "d1",
      label: "HP(缓存)",
      value: 100,
      decoy: !0
    }, {
      key: "d2",
      label: "HP(备份)",
      value: 100,
      decoy: !0
    }, {
      key: "d3",
      label: "临时值",
      value: 100,
      decoy: !0
    } ]);
    Mem.mirror("hp_real", "hp");
  },
  render(G, p) {
    p.append(el("div", "status", "扫描会得到 4 个结果，注意观察：假的改完会自己弹回 100。"));
    const go = el("button", "btn", "确认血量 999");
    go.onclick = () => {
      Mem.get("hp_real") >= 999 && (G.state.ok = !0), G.afterChange();
    }, p.append(go);
  },
  check: G => !0 === G.state.ok,
  hints: [ "逐个改，观察哪个不会回弹。", "假地址改完约 0.3 秒自动变回 100。", "稳住的那个改成 999，再点确认。" ]
}, {
  name: "改名后的开关",
  method: "读源码·轻度混淆",
  brief: "关键开关被改了变量名（_0x2f.a），代码还在页面里，只是看不懂。读懂它：把 a 置为 true，再点激活。",
  goal: "把隐藏开关打开。",
  onEnter(G) {
    window._0x2f = { a: !1 }, window.masterOn = !1, G.state.active = !1;
  },
  render(G, p) {
    const btn = el("button", "btn", "尝试激活核心");
    btn.onclick = () => {
      (!0 === window._0x2f.a || window.masterOn) && (G.state.active = !0), G.afterChange();
    }, p.append(btn);
  },
  check: G => !0 === G.state.active,
  hints: [ "源码里有个被改了名的布尔开关对象，先找到它。", "把里面的开关字段置为开启状态。", "再点激活核心。" ]
}, {
  name: "藏在深处的锁",
  method: "控制台·改嵌套对象",
  brief: "任务锁在 player.quests[0].locked 这个深层对象里，不是一个扁平变量。顺着结构找到它，把 locked 改成 false。",
  goal: "解锁任务并领取。",
  onEnter(G) {
    window.player = {
      name: "勇者",
      quests: [ {
        title: "屠龙",
        locked: !0
      } ]
    }, window.forceUnlock = !1, G.state.ok = !1;
  },
  render(G, p) {
    const btn = el("button", "btn", "领取任务");
    btn.onclick = () => {
      (!window.player.quests[0].locked || window.forceUnlock) && (G.state.ok = !0), G.afterChange();
    }, p.append(btn, el("div", "status", "player.quests[0].locked 当前为 true"));
  },
  check: G => !0 === G.state.ok,
  hints: [ "锁藏在 player 这个对象的任务列表里，顺着层级往下找。", "把那把 locked 锁改成未锁定。", "再点领取任务。" ]
}, {
  name: "客户端说了算",
  method: "绕过客户端校验",
  brief: "通关校验完全在客户端：verify() 检查 score≥1000，而 score 锁死在 10。既然校验函数在本地，直接覆盖它，或伪造通过标志。",
  goal: "骗过 verify() 并提交。",
  onEnter(G) {
    window.score = 10, window.verify = () => window.score >= 1e3, window.forcePass = !1, G.state.ok = !1;
  },
  render(G, p) {
    const btn = el("button", "btn", "提交成绩");
    btn.onclick = () => {
      (window.verify() || window.forcePass) && (G.state.ok = !0), G.afterChange();
    }, p.append(btn, el("div", "status", "score=10，verify() 检查 score>=1000"));
  },
  check: G => !0 === G.state.ok,
  hints: [ "分数改不动也没关系，卡点在校验函数上。", "在控制台把校验函数改成总是通过。", "再点提交成绩。" ]
}, {
  name: "会搬家的地址",
  method: "CE·地址漂移/重新扫描",
  stages: [ {
    short: "练习：重新扫描",
    method: "CE·地址漂移",
    brief: "练习小关：每次“重置”后地址都会重新随机分配，上次扫到的结果作废，需要重新扫。体会这一点。",
    goal: "重置后重新扫到 x 并改成 888。",
    onEnter(G) {
      Mem.define([ { key: "x", label: "数值", value: 40 } ]);
      Mem.mirror("x", "x");
    },
    render(G, p) {
      p.append(el("div", "status", "数值："));
      const s = el("span", "");
      s.setAttribute("data-bind", "x"), p.lastChild.appendChild(s);
      const rst = el("button", "btn ghost", "重置（地址重新分配）");
      rst.onclick = () => {
        Mem.define([ {
          key: "x",
          label: "数值",
          value: 40
        } ]), G.afterChange();
      }, p.append(rst);
    },
    check: G => Mem.get("x") >= 888,
    hints: [ "重置后旧候选全部失效，要重新扫。", "重新扫 40，再改值。" ]
  }, {
    short: "实战：改两个值",
    method: "CE·地址漂移",
    brief: "实战：要同时把 a、b 都改到 50，但每次开始地址都漂移。重新扫描当前这一轮，两个都改够再提交。",
    goal: "本轮把 a≥50 且 b≥50。",
    onEnter(G) {
      Mem.define([ { key: "a", label: "力量", value: 12 }, { key: "b", label: "敏捷", value: 15 } ]);
      Mem.loot("a", 6), Mem.loot("b", 6);
      Mem.mirror("a", "a"), Mem.mirror("b", "b");
      G.state.ok = !1;
    },
    render(G, p) {
      p.append(el("div", "status", "力量 a、敏捷 b，每轮地址随机。"));
      const rst = el("button", "btn ghost", "刷新（重新分配地址）");
      rst.onclick = () => {
        Mem.define([ {
          key: "a",
          label: "力量",
          value: 12
        }, {
          key: "b",
          label: "敏捷",
          value: 15
        } ]), G.afterChange();
      };
      const go = el("button", "btn", "提交属性");
      go.onclick = () => {
        Mem.get("a") >= 50 && Mem.get("b") >= 50 && (G.state.ok = !0), G.afterChange();
      }, p.append(rst, go);
    },
    check: G => !0 === G.state.ok,
    hints: [ "两个值都要在当前这一轮扫到并改。", "先扫力量 12 锁定，再扫敏捷 15。", "都改成 50 再提交。" ]
  } ]
}, {
  name: "带校验和的加密存档",
  method: "篡改存档·编码+XOR+CRC",
  brief: "存档 = Base64(XOR(JSON))，且 JSON 里带一个 crc 校验和（把各字符编码相加 mod 256）。只改数值不改 crc 会被拒；要改完重算 crc 再写回。",
  goal: "改 atk=150 并正确重算 crc。",
  onEnter(G) {
    const build = atk => {
      const obj = {
        atk: atk,
        need: 150
      }, s = JSON.stringify(obj);
      let crc = 0;
      for (const ch of s) crc = (crc + ch.charCodeAt(0)) % 256;
      return obj.crc = crc, Codec.xorB64(JSON.stringify(obj), "ccq");
    };
    LS.set("ccq_l18", build(5)), G._build = build;
  },
  render(G, p) {
    const panel = savePanel(G, {
      key: "ccq_l18",
      regen: () => G._build(5)
    }), fight = el("button", "btn", "挑战最终守卫");
    fight.onclick = () => {
      try {
        const o = JSON.parse(Codec.unxorB64(LS.get("ccq_l18"), "ccq"));
        let crc = 0;
        const noCrc = JSON.stringify({
          atk: o.atk,
          need: o.need
        });
        for (const ch of noCrc) crc = (crc + ch.charCodeAt(0)) % 256;
        crc === o.crc && o.atk >= o.need ? G.state.ok = !0 : G.say("校验和不符或攻击力不足，存档被拒绝。");
      } catch (e) {
        G.say("存档损坏，被拒绝。");
      }
      G.afterChange();
    }, p.append(panel.wrap, fight);
  },
  check: G => !0 === G.state.ok,
  hints: [ "先 unxorB64 解出 JSON，看清 crc 怎么算。", "改 atk 后，按“各字符编码相加 mod256”重算 crc。", "重新 xorB64 写回再挑战。" ]
}, {
  name: "读懂那团乱码",
  method: "反混淆·再 Hook",
  brief: "通关判定函数被包进一个 IIFE 里、变量被打乱，表面返回 false。先在控制台读懂/直接替换它，让它返回 true，再提交。",
  goal: "让判定通过并提交。",
  onEnter(G) {
    window._chk = function() {
      const _0x1 = [ !1, "deny" ];
      return function() {
        return !0 === _0x1[0];
      };
    }(), window.forceOk = !1, G.state.ok = !1;
  },
  render(G, p) {
    p.insertAdjacentHTML("beforeend", "\x3c!-- _chk 是判定函数，内部 _0x1[0] 恒为 false --\x3e");
    const btn = el("button", "btn", "提交（最终判定）");
    btn.onclick = () => {
      (window._chk() || window.forceOk) && (G.state.ok = !0), G.afterChange();
    }, p.append(btn);
  },
  check: G => !0 === G.state.ok,
  hints: [ "判定函数虽被包了一层，但它仍是可以覆盖的全局函数。", "把它改成总是返回通过。", "再点提交。" ]
}, {
  name: "终局·三合一",
  method: "综合：CE + 存档 + 绕过校验",
  stages: [ {
    short: "第一步：CE 改攻击",
    method: "CE改值",
    brief: "终局第一步：用 CE 扫描把攻击力 atk 改到 200。",
    onEnter(G) {
      Mem.define([ { key: "atk", label: "攻击力", value: 20 } ]);
      Mem.loot("atk", 8), Mem.mirror("atk", "atk");
    },
    render(G, p) {
      p.append(el("div", "status", "攻击力："));
      const s = el("span", "");
      s.setAttribute("data-bind", "atk"), p.lastChild.appendChild(s);
      const w = el("button", "btn ghost", "训练 +10");
      w.onclick = () => {
        Mem.set("atk", Mem.get("atk") + 10), Mem.applyFreezes(), G.afterChange();
      }, p.append(w);
    },
    check: G => Mem.get("atk") >= 200,
    hints: [ "扫当前攻击力，训练后再扫，锁定改到 200。" ]
  }, {
    short: "第二步：改存档解锁",
    method: "篡改存档",
    brief: "终局第二步：门钥匙锁在明文存档 ccq_final 里，key 为 false，改成 true。",
    onEnter(G) {
      window.key = !1;
      LS.set("ccq_final", JSON.stringify({
        key: !1,
        badge: "none"
      }));
    },
    render(G, p) {
      const panel = savePanel(G, {
        key: "ccq_final",
        regen: () => JSON.stringify({
          key: !1,
          badge: "none"
        })
      });
      p.append(panel.wrap);
    },
    check: G => !0 === JSON.parse(LS.get("ccq_final")).key || window.key === !0,
    hints: [ "把存档里 key 改成 true 写回。" ]
  }, {
    short: "第三步：绕过守门",
    method: "绕过客户端校验",
    brief: "终局第三步：守门函数 guard() 恒 false，覆盖它，敲响终局之钟。",
    onEnter(G) {
      window.guard = () => !1, window.forceOpen = !1, G.state.done = !1;
    },
    render(G, p) {
      const btn = el("button", "btn", "敲响终局之钟");
      btn.onclick = () => {
        (window.guard() || window.forceOpen) && (G.state.done = !0), G.afterChange();
      }, p.append(btn);
    },
    check: G => !0 === G.state.done,
    hints: [ "把守门函数改成总是放行，再敲终局之钟。" ]
  } ]
} ];
