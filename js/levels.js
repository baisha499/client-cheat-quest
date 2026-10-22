/* ============================================================
 * Client Cheat Quest - 20 关
 * 每关：合法路径走不通，必须用对应手法改客户端才能过。
 * 带 stages 的关 = 先练习小关，再实战小关。
 * ============================================================ */

/* 存档关通用面板：显示原始存档、写回、合法重新生成 */
function savePanel(G, cfg) {
  const wrap = el('div', 'save-box');
  const ta = el('textarea', 'save-raw');
  ta.rows = 3;
  const refresh = () => { ta.value = LS.get(cfg.key) || ''; };
  refresh();
  const row = el('div', 'row');
  const imp = el('button', 'btn', '把下方内容写回存档');
  imp.onclick = () => { LS.set(cfg.key, ta.value.trim()); G.say('已写回，等待校验。'); G.afterChange(); };
  const regen = el('button', 'btn ghost', '合法重新生成存档');
  regen.onclick = () => { LS.set(cfg.key, cfg.regen()); refresh(); G.afterChange(); };
  row.append(imp, regen);
  wrap.append(ta, row);
  return { wrap, refresh, ta };
}

const LEVELS = [

/* ============ 第1关 读源码（纯教学，不需要任何工具） ============ */
{
  name: '源码里的钥匙', method: '读源码找后门',
  brief: '一扇木门锁着，要输入 4 位数字密码。界面上没有任何提示，开发者却把密码写进了页面注释里。这是你学会的第一招：查看网页源代码。',
  goal: '输入正确密码打开木门。',
  render(G, p) {
    p.insertAdjacentHTML('beforeend',
      '<!-- 后门密码：1337（右键→查看网页源代码，或 F12→Elements 里搜“密码”） -->');
    const inp = el('input', 'text-input');
    inp.placeholder = '4 位密码';
    const btn = el('button', 'btn', '开门');
    btn.onclick = () => { if (inp.value.trim() === '1337') G.state.open = true; G.afterChange(); };
    p.append(inp, btn);
  },
  check(G) { return G.state.open === true; },
  hints: ['密码不在画面上，去看 HTML 源代码（右键 → 查看网页源代码）。', '在源码里搜索“密码”两个字。', '密码就是 1337。'],
},

/* ============ 第2关 控制台改全局变量 ============ */
{
  name: '控制台里的钱包', method: '控制台改 JS 变量',
  brief: '商店卖一把 1000 金币的钥匙，你只有 50 金币。合法打工一次只给 1 金币，攒到天亮也不够。打开内置控制台（或 F12 Console），直接改全局变量 gold。',
  goal: '把金币凑到 1000 并买下钥匙。',
  onEnter(G) { window.gold = 50; G.state.bought = false; },
  render(G, p) {
    p.append(el('div', 'status', '当前金币：'));
    const g = el('span', '', ''); g.setAttribute('data-global', 'gold');
    p.lastChild.appendChild(g);
    const work = el('button', 'btn ghost', '打工 +1 金币');
    work.onclick = () => { window.gold += 1; G.afterChange(); };
    const buy = el('button', 'btn', '购买钥匙（1000）');
    buy.onclick = () => { if (window.gold >= 1000) G.state.bought = true; G.afterChange(); };
    p.append(work, buy);
  },
  check(G) { return G.state.bought === true; },
  hints: ['打开内置控制台，全局变量名就叫 gold。', '在控制台输入 gold = 1000 回车。', '改完再点“购买钥匙”。'],
},

/* ============ 第3关 CE 固定值扫描（练习小关 + 实战） ============ */
{
  name: '找到你的血量', method: 'CE式扫描·固定值',
  stages: [
    {
      short: '练习：固定值扫描', method: 'CE式扫描·固定值',
      brief: '练习小关：屏幕上有一个数字，点“变化”它会 +5。用右侧扫描器：先扫当前值，变化后再扫新值，候选会越缩越少，最后只剩它。',
      goal: '把练习数字改成 999。',
      onEnter(G) { Mem.define([{ key: 'a', label: '练习数字', value: 123 }]); },
      render(G, p) {
        p.append(el('div', 'status', '练习数字：'));
        const s = el('span', ''); s.setAttribute('data-bind', 'a');
        p.lastChild.appendChild(s);
        const b = el('button', 'btn ghost', '变化 +5');
        b.onclick = () => { Mem.set('a', Mem.get('a') + 5); Mem.applyFreezes(); G.afterChange(); };
        p.append(b);
      },
      check(G) { return Mem.get('a') >= 999; },
      hints: ['在扫描器输入当前数字，点“首次扫描”。', '点一次“变化”，输入新数字点“再次扫描”。', '只剩一个结果后，点“改值”改成 999。'],
    },
    {
      short: '实战：怪物反击', method: 'CE式扫描·固定值',
      brief: '实战：你 HP=100，怪物反击一下变成 87。用固定值扫描定位 HP 地址，改成 999，再点“继续战斗”就能活下来。',
      goal: '把 HP 改成 999 并继续战斗。',
      onEnter(G) { Mem.define([{ key: 'hp', label: '玩家血量 HP', value: 100 }]); G.state.alive = false; },
      render(G, p) {
        p.append(el('div', 'status', 'HP：'));
        const s = el('span', ''); s.setAttribute('data-bind', 'hp');
        p.lastChild.appendChild(s);
        const atk = el('button', 'btn ghost', '攻击怪物（会被反击 -13）');
        atk.onclick = () => { Mem.set('hp', Mem.get('hp') - 13); Mem.applyFreezes(); G.afterChange(); };
        const go = el('button', 'btn', '继续战斗');
        go.onclick = () => { if (Mem.get('hp') >= 999) G.state.alive = true; G.afterChange(); };
        p.append(atk, go);
      },
      check(G) { return G.state.alive === true; },
      hints: ['先扫 100，被反击后扫 87。', '定位到 HP 后改成 999。', '再点“继续战斗”。'],
    },
  ],
},

/* ============ 第4关 CE 动态数值扫描 ============ */
{
  name: '会变动的金币', method: 'CE式扫描·动态值',
  brief: '金币一直在变（打工 +7，购物 -3），不能只扫一次。CE 的思路：先扫当前值，让它变动，再扫新值，反复几次锁定唯一地址，改成 1000。',
  goal: '把金币改到 1000。',
  onEnter(G) { Mem.define([{ key: 'gold', label: '金币', value: 20 }]); },
  render(G, p) {
    p.append(el('div', 'status', '金币：'));
    const s = el('span', ''); s.setAttribute('data-bind', 'gold');
    p.lastChild.appendChild(s);
    const work = el('button', 'btn ghost', '打工 +7');
    work.onclick = () => { Mem.set('gold', Mem.get('gold') + 7); Mem.applyFreezes(); G.afterChange(); };
    const shop = el('button', 'btn ghost', '购物 -3');
    shop.onclick = () => { Mem.set('gold', Mem.get('gold') - 3); Mem.applyFreezes(); G.afterChange(); };
    p.append(work, shop);
  },
  check(G) { return Mem.get('gold') >= 1000; },
  hints: ['先扫当前金币数，点一次打工，再扫新金币数。', '重复“变动→再扫描”直到只剩一个结果。', '把它改成 1000。'],
},

/* ============ 第5关 明文存档 ============ */
{
  name: '明文存档', method: '篡改 localStorage（明文）',
  brief: '游戏把进度写在浏览器本地存档里，而且是明文 JSON：coins 只有 5，需要 50。合法做任务每次 +1。直接在存档框里把 coins 改成 50，写回即可。',
  goal: '让 coins ≥ 50 并领取奖励。',
  onEnter(G) {
    LS.set('ccq_l5', JSON.stringify({ coins: 5, need: 50, task: '收集松果' }));
  },
  render(G, p) {
    const panel = savePanel(G, {
      key: 'ccq_l5',
      regen: () => JSON.stringify({ coins: 5, need: 50, task: '收集松果' }),
    });
    const task = el('button', 'btn ghost', '合法做任务 +1');
    task.onclick = () => {
      const o = JSON.parse(LS.get('ccq_l5')); o.coins += 1;
      LS.set('ccq_l5', JSON.stringify(o)); panel.refresh(); G.afterChange();
    };
    const claim = el('button', 'btn', '领取奖励');
    claim.onclick = () => {
      const o = JSON.parse(LS.get('ccq_l5'));
      if (o.coins >= o.need) G.state.ok = true;
      G.afterChange();
    };
    p.append(panel.wrap, task, claim);
  },
  check(G) { return G.state.ok === true; },
  hints: ['存档是明文 JSON，coins 就是松果数。', '把 coins 从 5 改成 50，点“写回存档”。', '再点“领取奖励”。'],
},

/* ============ 第6关 CE 冻结（练习 + 实战） ============ */
{
  name: '冻结你的血条', method: 'CE式扫描·冻结数值',
  stages: [
    {
      short: '练习：认识冻结', method: 'CE式扫描·冻结',
      brief: '练习小关：数字每秒 -2。扫到它，点“冻结”，它就再也不会掉了。这就是 CE 的锁值。',
      goal: '冻结练习数字让它不再下降。',
      onEnter(G) {
        Mem.define([{ key: 'x', label: '练习数字', value: 50 }]);
        G.tick(() => { Mem.set('x', Mem.get('x') - 2); Mem.applyFreezes(); G.afterChange(); }, 1000);
      },
      render(G, p) {
        p.append(el('div', 'status', '数字（每秒 -2）：'));
        const s = el('span', ''); s.setAttribute('data-bind', 'x');
        p.lastChild.appendChild(s);
      },
      check(G) { return Mem.get('x') >= 50 && Mem.cells.x.frozen; },
      hints: ['先扫 50，等它掉一点再扫新值锁定。', '在结果行点“冻结”。', '冻结后数字会一直保持 50。'],
    },
    {
      short: '实战：撑过毒伤', method: 'CE式扫描·冻结',
      brief: '实战：你中毒了，每秒掉 8 血，要撑过 10 秒。合法吃药也来不及。扫到 HP，冻结在 100，稳稳撑过去。',
      goal: '冻结 HP 并撑满 10 秒。',
      onEnter(G) {
        Mem.define([{ key: 'hp', label: 'HP', value: 100 }]);
        G.state.ticks = 0;
        G.tick(() => {
          Mem.set('hp', Mem.get('hp') - 8);
          Mem.applyFreezes();
          G.state.ticks += 1;
          G.afterChange();
        }, 1000);
      },
      render(G, p) {
        p.append(el('div', 'status', 'HP：'));
        const s = el('span', ''); s.setAttribute('data-bind', 'hp');
        p.lastChild.appendChild(s);
        p.append(el('div', 'status', '已撑过：'));
        const t = el('span', ''); t.setAttribute('data-bind', 'ticks');
        p.lastChild.appendChild(t);
        p.append(el('span', '', ' 秒 / 10'));
      },
      check(G) { return G.state.ticks >= 10; },
      hints: ['扫 HP，让它掉血后再扫，锁定地址。', '点“冻结”把它锁在 100。', '然后等 10 秒即可。'],
    },
  ],
},

/* ============ 第7关 控制台调用隐藏函数 ============ */
{
  name: '藏起来的调试函数', method: '控制台调用隐藏函数',
  brief: '开发者留了一个调试函数 debug.unlock()，但界面上没有按钮。它挂在全局对象 debug 上，直接在控制台调用就能通关。',
  goal: '调用 debug.unlock()。',
  onEnter(G) {
    window.debug = { unlock() { G.state.pass = true; G.afterChange(); } };
    G.state.pass = false;
  },
  render(G, p) {
    p.append(el('div', 'status', '大门紧闭，界面上没有任何按钮……'));
  },
  check(G) { return G.state.pass === true; },
  hints: ['全局对象叫 debug，里面有个 unlock 方法。', '控制台输入 debug.unlock() 回车。', '注意括号不能少。'],
},

/* ============ 第8关 源码注释里的暗号 ============ */
{
  name: '注释里的暗号', method: '读源码·找暗号',
  brief: '一道能量门要输入暗号。暗号藏在本关的 HTML 注释里，和第1关一样去源码里找，但这次是字母数字混合。',
  goal: '输入正确暗号。',
  onEnter(G) { G.state.ok = false; },
  render(G, p) {
    p.insertAdjacentHTML('beforeend',
      '<!-- dev note: 应急后门暗号 = H4CK，别写进文档 -->');
    const inp = el('input', 'text-input'); inp.placeholder = '暗号';
    const btn = el('button', 'btn', '提交');
    btn.onclick = () => { if (inp.value.trim() === 'H4CK') G.state.ok = true; G.afterChange(); };
    p.append(inp, btn);
  },
  check(G) { return G.state.ok === true; },
  hints: ['看本关的 HTML 注释。', '搜“暗号”。', '暗号是 H4CK。'],
},

/* ============ 第9关 Base64 编码存档 ============ */
{
  name: 'Base64 存档', method: '篡改存档·Base64 编码',
  brief: '存档不再是明文，而是 Base64 编码（一串字母数字+/=）。先解码看内容，把 exp 改成 30，再编码写回。控制台可用 codec.b64dec / codec.b64enc。',
  goal: '解码改 exp 到 30 再编码写回。',
  onEnter(G) {
    LS.set('ccq_l9', Codec.b64enc(JSON.stringify({ exp: 2, need: 30 })));
  },
  render(G, p) {
    const panel = savePanel(G, {
      key: 'ccq_l9',
      regen: () => Codec.b64enc(JSON.stringify({ exp: 2, need: 30 })),
    });
    const claim = el('button', 'btn', '领取升级');
    claim.onclick = () => {
      const o = JSON.parse(Codec.b64dec(LS.get('ccq_l9')));
      if (o.exp >= o.need) G.state.ok = true;
      G.afterChange();
    };
    p.append(panel.wrap, claim);
  },
  check(G) { return G.state.ok === true; },
  hints: ['控制台：codec.b64dec(存档字符串) 先解码。', '把 exp 改成 30，再用 codec.b64enc 编码。', '把编码结果粘进存档框写回。'],
},

/* ============ 第10关 CE 未知初始值扫描（练习+实战） ============ */
{
  name: '不知道数值怎么扫', method: 'CE式扫描·未知初始值',
  stages: [
    {
      short: '练习：增加了/减少了', method: 'CE·未知初始值',
      brief: '练习小关：你不知道这个数字是多少。先点“全部列出”，点一次“+3”，再点“增加了”，反复缩小范围。',
      goal: '锁定练习数字并改成 999。',
      onEnter(G) { Mem.define([{ key: 'e', label: '经验值(未知)', value: 11 }]); },
      render(G, p) {
        p.append(el('div', 'status', '经验值：（不显示具体数字）'));
        const b = el('button', 'btn ghost', '打怪 +3 经验');
        b.onclick = () => { Mem.set('e', Mem.get('e') + 3); Mem.applyFreezes(); G.afterChange(); };
        p.append(b);
      },
      check(G) { return Mem.get('e') >= 999; },
      hints: ['不知道初值就点“全部列出”。', '打一次怪，点“增加了”筛选。', '重复直到唯一，改成 999。'],
    },
    {
      short: '实战：刷经验升级', method: 'CE·未知初始值',
      brief: '实战：经验值不显示，打怪每次 +3，需要 100 升级。用“全部列出→增加了”反复定位，改成 100。',
      goal: '经验值达到 100 升级。',
      onEnter(G) { Mem.define([{ key: 'exp', label: '经验值', value: 7 }]); G.state.up = false; },
      render(G, p) {
        p.append(el('div', 'status', '经验值：隐藏'));
        const b = el('button', 'btn ghost', '打怪 +3');
        b.onclick = () => { Mem.set('exp', Mem.get('exp') + 3); Mem.applyFreezes(); G.afterChange(); };
        const lv = el('button', 'btn', '升级');
        lv.onclick = () => { if (Mem.get('exp') >= 100) G.state.up = true; G.afterChange(); };
        p.append(b, lv);
      },
      check(G) { return G.state.up === true; },
      hints: ['点“全部列出”，打一次怪，点“增加了”。', '多打几次、多筛几次，只剩一个。', '改成 100 再点升级。'],
    },
  ],
},

/* ============ 第11关 Hook 按钮判定 ============ */
{
  name: '被拒绝的按钮', method: '控制台·Hook 判定函数',
  brief: '提交按钮调用 canPass()，它写死返回 false，所以永远点不过。在控制台把 window.canPass 覆盖成返回 true，再点按钮。',
  goal: '让 canPass() 返回 true 并提交。',
  onEnter(G) {
    window.canPass = () => false;
    G.state.done = false;
  },
  render(G, p) {
    const btn = el('button', 'btn', '提交申请');
    btn.onclick = () => { if (window.canPass()) G.state.done = true; G.afterChange(); };
    p.append(btn, el('div', 'status', '（按钮内部调用 canPass()，当前恒为 false）'));
  },
  check(G) { return G.state.done === true; },
  hints: ['canPass 是全局函数，当前 () => false。', '控制台：canPass = () => true。', '再点提交。'],
},

/* ============ 第12关 XOR 异或加密存档 ============ */
{
  name: '异或加密存档', method: '篡改存档·XOR',
  brief: '存档是 Base64 + XOR 异或（密钥 ccq）。用 codec.unxorB64(存档, "ccq") 解出 JSON，把 atk 改到 99，再 codec.xorB64(改后的JSON, "ccq") 写回。',
  goal: '解开异或、改 atk=99 并写回。',
  onEnter(G) {
    LS.set('ccq_l12', Codec.xorB64(JSON.stringify({ atk: 3, need: 99 }), 'ccq'));
  },
  render(G, p) {
    const panel = savePanel(G, {
      key: 'ccq_l12',
      regen: () => Codec.xorB64(JSON.stringify({ atk: 3, need: 99 }), 'ccq'),
    });
    const fight = el('button', 'btn', '挑战 Boss');
    fight.onclick = () => {
      const o = JSON.parse(Codec.unxorB64(LS.get('ccq_l12'), 'ccq'));
      if (o.atk >= o.need) G.state.ok = true;
      G.afterChange();
    };
    p.append(panel.wrap, fight);
  },
  check(G) { return G.state.ok === true; },
  hints: ['控制台：codec.unxorB64(存档字符串, "ccq")。', '把 atk 改成 99，再 codec.xorB64(json, "ccq")。', '写回后点挑战 Boss。'],
},

/* ============ 第13关 真假地址陷阱 ============ */
{
  name: '真假地址陷阱', method: 'CE·辨别真假地址',
  brief: '扫描出来好几个像 HP 的地址，但假地址改完会自动回弹。哪个改完稳住、不掉回去，哪个才是真的。把真 HP 改成 999。',
  goal: '找到真 HP 并改成 999。',
  onEnter(G) {
    Mem.define([
      { key: 'hp_real', label: '玩家血量 HP', value: 100 },
      { key: 'd1', label: 'HP(缓存)', value: 100, decoy: true },
      { key: 'd2', label: 'HP(备份)', value: 100, decoy: true },
      { key: 'd3', label: '临时值', value: 100, decoy: true },
    ]);
  },
  render(G, p) {
    p.append(el('div', 'status', '扫描会得到 4 个结果，注意观察：假的改完会自己弹回 100。'));
    const go = el('button', 'btn', '确认血量 999');
    go.onclick = () => { if (Mem.get('hp_real') >= 999) G.state.ok = true; G.afterChange(); };
    p.append(go);
  },
  check(G) { return G.state.ok === true; },
  hints: ['逐个改，观察哪个不会回弹。', '假地址改完约 0.3 秒自动变回 100。', '稳住的那个改成 999，再点确认。'],
},

/* ============ 第14关 轻度混淆源码找开关 ============ */
{
  name: '改名后的开关', method: '读源码·轻度混淆',
  brief: '关键开关被改了变量名（_0x2f.a），代码还在页面里，只是看不懂。读懂它：把 a 置为 true，再点激活。',
  goal: '把隐藏开关打开。',
  onEnter(G) {
    window._0x2f = { a: false };
    G.state.active = false;
  },
  render(G, p) {
    p.insertAdjacentHTML('beforeend',
      '<script>' +
      '// _0x2f.a === true 时下面的核心才允许启动；这是个布尔开关\n' +
      '<\/script>');
    const btn = el('button', 'btn', '尝试激活核心');
    btn.onclick = () => { if (window._0x2f.a === true) G.state.active = true; G.afterChange(); };
    p.append(btn);
  },
  check(G) { return G.state.active === true; },
  hints: ['全局对象 _0x2f 里的字段 a 就是开关。', '控制台：_0x2f.a = true。', '再点激活核心。'],
},

/* ============ 第15关 嵌套对象状态 ============ */
{
  name: '藏在深处的锁', method: '控制台·改嵌套对象',
  brief: '任务锁在 player.quests[0].locked 这个深层对象里，不是一个扁平变量。顺着结构找到它，把 locked 改成 false。',
  goal: '解锁任务并领取。',
  onEnter(G) {
    window.player = { name: '勇者', quests: [{ title: '屠龙', locked: true }] };
    G.state.ok = false;
  },
  render(G, p) {
    const btn = el('button', 'btn', '领取任务');
    btn.onclick = () => { if (!window.player.quests[0].locked) G.state.ok = true; G.afterChange(); };
    p.append(btn, el('div', 'status', 'player.quests[0].locked 当前为 true'));
  },
  check(G) { return G.state.ok === true; },
  hints: ['路径是 player.quests[0].locked。', '控制台：player.quests[0].locked = false。', '再点领取任务。'],
},

/* ============ 第16关 绕过客户端校验 ============ */
{
  name: '客户端说了算', method: '绕过客户端校验',
  brief: '通关校验完全在客户端：verify() 检查 score≥1000，而 score 锁死在 10。既然校验函数在本地，直接覆盖它，或伪造通过标志。',
  goal: '骗过 verify() 并提交。',
  onEnter(G) {
    window.score = 10;
    window.verify = () => window.score >= 1000;
    G.state.ok = false;
  },
  render(G, p) {
    const btn = el('button', 'btn', '提交成绩');
    btn.onclick = () => { if (window.verify()) G.state.ok = true; G.afterChange(); };
    p.append(btn, el('div', 'status', 'score=10，verify() 检查 score>=1000'));
  },
  check(G) { return G.state.ok === true; },
  hints: ['不必改 score，直接改校验函数。', '控制台：verify = () => true。', '再点提交成绩。'],
},

/* ============ 第17关 地址漂移（练习+实战） ============ */
{
  name: '会搬家的地址', method: 'CE·地址漂移/重新扫描',
  stages: [
    {
      short: '练习：重新扫描', method: 'CE·地址漂移',
      brief: '练习小关：每次“重置”后地址都会重新随机分配，上次扫到的结果作废，需要重新扫。体会这一点。',
      goal: '重置后重新扫到 x 并改成 888。',
      onEnter(G) { Mem.define([{ key: 'x', label: '数值', value: 40 }]); },
      render(G, p) {
        p.append(el('div', 'status', '数值：'));
        const s = el('span', ''); s.setAttribute('data-bind', 'x');
        p.lastChild.appendChild(s);
        const rst = el('button', 'btn ghost', '重置（地址重新分配）');
        rst.onclick = () => { Mem.define([{ key: 'x', label: '数值', value: 40 }]); G.afterChange(); };
        p.append(rst);
      },
      check(G) { return Mem.get('x') >= 888; },
      hints: ['重置后旧候选全部失效，要重新扫。', '重新扫 40，再改值。'],
    },
    {
      short: '实战：改两个值', method: 'CE·地址漂移',
      brief: '实战：要同时把 a、b 都改到 50，但每次开始地址都漂移。重新扫描当前这一轮，两个都改够再提交。',
      goal: '本轮把 a≥50 且 b≥50。',
      onEnter(G) { Mem.define([{ key: 'a', label: '力量', value: 12 }, { key: 'b', label: '敏捷', value: 15 }]); G.state.ok = false; },
      render(G, p) {
        p.append(el('div', 'status', '力量 a、敏捷 b，每轮地址随机。'));
        const rst = el('button', 'btn ghost', '刷新（重新分配地址）');
        rst.onclick = () => { Mem.define([{ key: 'a', label: '力量', value: 12 }, { key: 'b', label: '敏捷', value: 15 }]); G.afterChange(); };
        const go = el('button', 'btn', '提交属性');
        go.onclick = () => { if (Mem.get('a') >= 50 && Mem.get('b') >= 50) G.state.ok = true; G.afterChange(); };
        p.append(rst, go);
      },
      check(G) { return G.state.ok === true; },
      hints: ['两个值都要在当前这一轮扫到并改。', '先扫力量 12 锁定，再扫敏捷 15。', '都改成 50 再提交。'],
    },
  ],
},

/* ============ 第18关 编码+异或+校验和存档 ============ */
{
  name: '带校验和的加密存档', method: '篡改存档·编码+XOR+CRC',
  brief: '存档 = Base64(XOR(JSON))，且 JSON 里带一个 crc 校验和（把各字符编码相加 mod 256）。只改数值不改 crc 会被拒；要改完重算 crc 再写回。',
  goal: '改 atk=150 并正确重算 crc。',
  onEnter(G) {
    const build = (atk) => {
      const obj = { atk, need: 150 };
      const s = JSON.stringify(obj);
      let crc = 0; for (const ch of s) crc = (crc + ch.charCodeAt(0)) % 256;
      obj.crc = crc;
      return Codec.xorB64(JSON.stringify(obj), 'ccq');
    };
    LS.set('ccq_l18', build(5));
    G._build = build;
  },
  render(G, p) {
    const panel = savePanel(G, {
      key: 'ccq_l18',
      regen: () => G._build(5),
    });
    const fight = el('button', 'btn', '挑战最终守卫');
    fight.onclick = () => {
      try {
        const o = JSON.parse(Codec.unxorB64(LS.get('ccq_l18'), 'ccq'));
        let crc = 0; const noCrc = JSON.stringify({ atk: o.atk, need: o.need });
        for (const ch of noCrc) crc = (crc + ch.charCodeAt(0)) % 256;
        if (crc === o.crc && o.atk >= o.need) G.state.ok = true;
        else G.say('校验和不符或攻击力不足，存档被拒绝。');
      } catch (e) { G.say('存档损坏，被拒绝。'); }
      G.afterChange();
    };
    p.append(panel.wrap, fight);
  },
  check(G) { return G.state.ok === true; },
  hints: ['先 unxorB64 解出 JSON，看清 crc 怎么算。', '改 atk 后，按“各字符编码相加 mod256”重算 crc。', '重新 xorB64 写回再挑战。'],
},

/* ============ 第19关 反混淆后 Hook ============ */
{
  name: '读懂那团乱码', method: '反混淆·再 Hook',
  brief: '通关判定函数被包进一个 IIFE 里、变量被打乱，表面返回 false。先在控制台读懂/直接替换它，让它返回 true，再提交。',
  goal: '让判定通过并提交。',
  onEnter(G) {
    window._chk = (function () {
      const _0x1 = [false, 'deny'];
      return function () { return _0x1[0] === true; };
    })();
    G.state.ok = false;
  },
  render(G, p) {
    p.insertAdjacentHTML('beforeend',
      '<!-- _chk 是判定函数，内部 _0x1[0] 恒为 false -->');
    const btn = el('button', 'btn', '提交（最终判定）');
    btn.onclick = () => { if (window._chk()) G.state.ok = true; G.afterChange(); };
    p.append(btn);
  },
  check(G) { return G.state.ok === true; },
  hints: ['不必真去解混淆，_chk 也是全局函数。', '控制台：_chk = () => true。', '再点提交。'],
},

/* ============ 第20关 终局·三手法综合 ============ */
{
  name: '终局·三合一', method: '综合：CE + 存档 + 绕过校验',
  stages: [
    {
      short: '第一步：CE 改攻击', method: 'CE改值',
      brief: '终局第一步：用 CE 扫描把攻击力 atk 改到 200。',
      onEnter(G) { Mem.define([{ key: 'atk', label: '攻击力', value: 20 }]); },
      render(G, p) {
        p.append(el('div', 'status', '攻击力：'));
        const s = el('span', ''); s.setAttribute('data-bind', 'atk');
        p.lastChild.appendChild(s);
        const w = el('button', 'btn ghost', '训练 +10');
        w.onclick = () => { Mem.set('atk', Mem.get('atk') + 10); Mem.applyFreezes(); G.afterChange(); };
        p.append(w);
      },
      check(G) { return Mem.get('atk') >= 200; },
      hints: ['扫当前攻击力，训练后再扫，锁定改到 200。'],
    },
    {
      short: '第二步：改存档解锁', method: '篡改存档',
      brief: '终局第二步：门钥匙锁在明文存档 ccq_final 里，key 为 false，改成 true。',
      onEnter(G) { LS.set('ccq_final', JSON.stringify({ key: false, badge: 'none' })); },
      render(G, p) {
        const panel = savePanel(G, {
          key: 'ccq_final',
          regen: () => JSON.stringify({ key: false, badge: 'none' }),
        });
        p.append(panel.wrap);
      },
      check(G) { return JSON.parse(LS.get('ccq_final')).key === true; },
      hints: ['把存档里 key 改成 true 写回。'],
    },
    {
      short: '第三步：绕过守门', method: '绕过客户端校验',
      brief: '终局第三步：守门函数 guard() 恒 false，覆盖它，敲响终局之钟。',
      onEnter(G) { window.guard = () => false; G.state.done = false; },
      render(G, p) {
        const btn = el('button', 'btn', '敲响终局之钟');
        btn.onclick = () => { if (window.guard()) G.state.done = true; G.afterChange(); };
        p.append(btn);
      },
      check(G) { return G.state.done === true; },
      hints: ['控制台 guard = () => true，再敲钟。'],
    },
  ],
},
];
