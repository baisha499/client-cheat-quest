/* 无头自测：合并加载引擎/关卡/主程序，逐关执行“作弊解法”，断言 check 通过 */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/' });
const w = dom.window;

// 合并成一次 eval，让 const/let 跨模块共享（等价于浏览器里多个 <script>）
let bundle = '';
for (const f of ['engine.js', 'levels.js', 'main.js']) {
  bundle += fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8') + '\n';
}
// 暴露测试句柄到 window
bundle += `
window.Mem = Mem; window.LS = LS; window.codec = codec; window.goto = goto;
window.getG = () => G;
`;
w.eval(bundle);

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ FAIL ' + name); }
}
function go(i, s) { w.goto(i, s); }
function ev(code) { return w.eval(code); }
const G = () => w.getG();
function checkStage() { return G().S.check(G()) === true; }

console.log('L1 读源码');
go(0, 0);
ev(`document.querySelector('#legit-panel input').value='1337';document.querySelectorAll('#legit-panel button')[0].click();`);
check('L1 开门', checkStage());

console.log('L2 控制台改 gold');
go(1, 0);
ev('window.gold=1000;document.querySelectorAll("#legit-panel button")[1].click();');
check('L2 购买', checkStage());

console.log('L3 CE固定值(练习+实战)');
go(2, 0); ev('Mem.set("a",999)'); check('L3-1 练习改值', checkStage());
go(2, 1); ev('Mem.set("hp",999);document.querySelectorAll("#legit-panel button")[1].click();'); check('L3-2 存活', checkStage());

console.log('L4 CE动态金币');
go(3, 0); ev('Mem.set("gold",1000)'); check('L4 金币1000', checkStage());

console.log('L5 明文存档');
go(4, 0);
ev('LS.set("ccq_l5",JSON.stringify({coins:50,need:50}));document.querySelectorAll("#legit-panel button")[3].click();');
check('L5 领取', checkStage());

console.log('L6 冻结(练习+实战)');
go(5, 0); ev('Mem.freeze("x",true)'); check('L6-1 冻结练习', checkStage());
go(5, 1); ev('Mem.freeze("hp",true);const g=window.getG();g.state.ticks=10;g.afterChange();'); check('L6-2 撑过毒伤', checkStage());

console.log('L7 隐藏函数');
go(6, 0); ev('debug.unlock()'); check('L7 调用unlock', checkStage());

console.log('L8 源码暗号');
go(7, 0);
ev(`document.querySelector('#legit-panel input').value='H4CK';document.querySelectorAll('#legit-panel button')[0].click();`);
check('L8 暗号', checkStage());

console.log('L9 Base64存档');
go(8, 0);
ev('LS.set("ccq_l9",codec.b64enc(JSON.stringify({exp:30,need:30})));document.querySelectorAll("#legit-panel button")[2].click();');
check('L9 升级', checkStage());

console.log('L10 未知值扫描(练习+实战)');
go(9, 0); ev('Mem.set("e",999)'); check('L10-1 练习', checkStage());
go(9, 1); ev('Mem.set("exp",100);document.querySelectorAll("#legit-panel button")[1].click();'); check('L10-2 升级', checkStage());

console.log('L11 Hook canPass');
go(10, 0); ev('canPass=()=>true;document.querySelectorAll("#legit-panel button")[0].click();');
check('L11 提交', checkStage());

console.log('L12 XOR存档');
go(11, 0);
ev('LS.set("ccq_l12",codec.xorB64(JSON.stringify({atk:99,need:99}),"ccq"));document.querySelectorAll("#legit-panel button")[2].click();');
check('L12 挑战Boss', checkStage());

console.log('L13 真假地址');
go(12, 0); ev('Mem.set("hp_real",999);document.querySelectorAll("#legit-panel button")[0].click();');
check('L13 真HP', checkStage());

console.log('L14 混淆开关');
go(13, 0); ev('_0x2f.a=true;document.querySelectorAll("#legit-panel button")[0].click();');
check('L14 激活', checkStage());

console.log('L15 嵌套对象');
go(14, 0); ev('player.quests[0].locked=false;document.querySelectorAll("#legit-panel button")[0].click();');
check('L15 解锁任务', checkStage());

console.log('L16 绕过verify');
go(15, 0); ev('verify=()=>true;document.querySelectorAll("#legit-panel button")[0].click();');
check('L16 提交成绩', checkStage());

console.log('L17 地址漂移(练习+实战)');
go(16, 0); ev('Mem.set("x",888)'); check('L17-1 重扫练习', checkStage());
go(16, 1); ev('Mem.set("a",50);Mem.set("b",50);document.querySelectorAll("#legit-panel button")[1].click();');
check('L17-2 双值提交', checkStage());

console.log('L18 编码+XOR+CRC存档');
go(17, 0);
ev(`
(function(){
  const obj={atk:150,need:150};
  let crc=0;const s=JSON.stringify(obj);for(const ch of s)crc=(crc+ch.charCodeAt(0))%256;
  obj.crc=crc;
  LS.set("ccq_l18",codec.xorB64(JSON.stringify(obj),"ccq"));
  document.querySelectorAll("#legit-panel button")[2].click();
})();`);
check('L18 守卫', checkStage());

console.log('L19 反混淆Hook');
go(18, 0); ev('_chk=()=>true;document.querySelectorAll("#legit-panel button")[0].click();');
check('L19 提交', checkStage());

console.log('L20 终局三合一');
go(19, 0); ev('Mem.set("atk",200)'); check('L20-1 CE攻击', checkStage());
go(19, 1); ev('LS.set("ccq_final",JSON.stringify({key:true,badge:"x"}))'); check('L20-2 存档钥匙', checkStage());
go(19, 2); ev('guard=()=>true;document.querySelectorAll("#legit-panel button")[0].click();'); check('L20-3 守门', checkStage());

console.log('\n反例检查（合法操作不得直接通关）');
go(1, 0); ev('window.getG().state.bought=false'); check('L2 不花钱不能买', ev('window.gold<1000 && !window.getG().state.bought'));
go(15, 0); ev('window.getG().state.ok=false'); check('L16 不改verify过不了', ev('!window.verify() && !window.getG().state.ok'));

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
