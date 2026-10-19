
// 기관평가인증 표기 정정기 - 정정 규칙 (2027년 편람 p.34~37, p.41 + 청암대학교 통일안)
// ---------- 정정 규칙 ----------
const pad = n => String(n).padStart(2, '0');
const comma = n => n.toLocaleString('en-US');

const COMMON = [
  ['기호 통일', /[｢｣∼～]/g, m => ({'｢':'「','｣':'」','∼':'~','～':'~'}[m])],
  ['마스킹 ○ 통일', /ㅇ|◯|〇/g, () => '○'],
  ['마스킹 ○ 통일', /(?<![A-Za-z])[OＯ]{1,2}(?=[가-힣])/g, m => '○'.repeat(m.length)],
  ['마스킹 ○ 통일', /(?<=[가-힣])\*{1,2}(?=[가-힣\s,()]|$)/g, m => '○'.repeat(m.length)],
  ['문서번호 "호" 삭제', /([가-힣]+)-(\d+)호(?=[\s,)]|$)/g, (m, a, b) => `${a}-${b}`],
  ['날짜 형식', /(?<![\d.])(\d{4})[ \t]*[.\-/][ \t]*(\d{1,2})[ \t]*[.\-/][ \t]*(\d{1,2})(?!\d)\.?/g,
    (m, y, mo, d) => (+mo >= 1 && +mo <= 12 && +d >= 1 && +d <= 31) ? `${y}.${pad(mo)}.${pad(d)}.` : m],
  ['날짜 형식', /(?<![\d.])(\d{4})\.[ \t]*(\d{1,2})[ \t]*월/g, (m, y, mo) => `${y}.${pad(mo)}.`],
  ['물결표 띄어쓰기', /(?<=[\d.])[ \t]*~[ \t]*(?=[\d현])/g, () => '~'],
  ['학년도·학기 표기', /(\d{4})[ \t]*(학년도|년도|년)?[ \t]*[-–.]?[ \t]*([1-4])[ \t]*학기/g, (m, y, _u, s) => `${y}학년도 ${s}학기`],
  ['페이지 표기', /(?<![A-Za-z])pp?\.[ \t]*(\d+)(?:[ \t]*[~\-][ \t]*(\d+))?/g, (m, a, b) => b ? `${a}~${b}페이지` : `${a}페이지`],
  ['페이지 표기', /(\d+)[ \t]*[~\-][ \t]*(\d+)[ \t]*(?:페이지|쪽(?!수)|p(?![A-Za-z]))/g, (m, a, b) => `${a}~${b}페이지`],
  ['페이지 표기', /(\d+)[ \t]*(?:페이지|쪽(?!수)|p(?![A-Za-z]))/g, (m, a) => `${a}페이지`],
  ['비율 소수 첫째자리', /(?<![\d.])(\d+(?:\.\d+)?)[ \t]*%/g, (m, n) => (Math.round(parseFloat(n) * 10 + 1e-7) / 10).toFixed(1) + '%'],
  ['금액 천원 단위', /(?<![\d,.])(\d{1,3}(?:,\d{3})+|\d{4,})[ \t]*원(?!장|칙|생)/g, (m, n) => {
    const v = parseInt(n.replace(/,/g, ''), 10); return v >= 1000 ? comma(Math.round(v / 1000)) + '천원' : m; }],
  ['정량지표 표기', /\)[ \t]*[x×X*][ \t]*100(?!\d)[ \t]*=?[ \t]*/g, m => /=/.test(m) ? ')×100=' : ')×100'],
  ['학년도 괄호 표기', /\((\d{4})[ \t]*,[ \t]*(\d{4})\)/g, (m, a, b) => `(${a}, ${b})`],
  ['정량지표 표기', /(률|율)[ \t]*=[ \t]*\(/g, (m, a) => `${a} = (`],
  ['정량지표 표기', /(\d[가-힣]{0,2})[ \t]+\/[ \t]*(?=\d)|(\d[가-힣]{0,2})\/[ \t]+(?=\d)/g, (m, a, b) => (a || b) + '/'],
  ['괄호 표기', /[\[(（][ \t]*정보[ \t]*공시[ \t]*[\])）][ \t]*/g, () => '(정보공시) '],
  ['괄호 표기', /[\[(（][ \t]*현장[ \t]*비치[ \t]*[\])）][ \t]*/g, () => '(현장비치) '],
  ['「」 뒤 띄어쓰기', /」(?=제\d)/g, () => '」 '],
  ['괄호 뒤 쉼표 삭제', /\)[ \t]*,[ \t]*(?=제\d+(?:조|장|절|항)|규정집|\d+(?:~\d+)?페이지)/g, () => ') '],
  ['괄호 뒤 띄어쓰기', /\)(?=제\d+(?:조|장|절|항)|규정집|\d+(?:~\d+)?페이지)/g, () => ') '],
  ['문서번호 뒤 쉼표', /([가-힣]+-\d+)[ \t]+(?=\d{4}\.\d{2}\.\d{2}\.)/g, (m, a) => `${a}, `],
  ['표준어', /캡쳐/g, () => '캡처'],
  ['판정 표기', /[<〈《＜][ \t]*(조건부충족|미충족|충족)[ \t]*[>〉》＞]/g, (m, a) => `〈${a}〉`],
  ['판정 표기', /(?<![〈가-힣])(조건부충족|미충족|충족)(?=[ \t]*판정)/g, (m, a) => `〈${a}〉`],
  ['오타', /의 따라/g, () => '에 따라'],
  ['오타', /위원회 에서/g, () => '위원회에서'],
];

const LIST_NO = ['목록 번호 형식', /^[ \t]*([A-Za-z])[ \t]*[^\s가-힣A-Za-z\d]*[ \t]*(\d+(?:[ \t]*[-–—_][ \t]*\d+)*)[ \t]*[^\s가-힣A-Za-z\d(\[]*[ \t]*/, (m, l, n) => `${l.toLowerCase()}-${n.replace(/[ \t]*[-–—_][ \t]*/g, '-')}. `];

// 목록 줄 맨 앞(알파벳 + 아무 기호·숫자)을 읽어 판단항목 제목(a))인지 자료 번호(a-1.)인지 판단
// - 숫자가 있고 '확인'으로 끝나지 않으면 자료 번호, 그 밖에는 판단항목 제목 (편람의 판단항목 제목은 모두 '~확인')
const LIST_HEAD = ['목록 앞부분 형식', /^[ \t]*([A-Za-z])[ \t]*([^\s가-힣A-Za-z]*?)[ \t]*(?=[가-힣(\[「○<〈])/, (m, l, junk, off, str) => {
  const rest = str.slice(m.length).replace(/[.\s]+$/, '');
  const d = junk.match(/\d+/g);
  if (d && !/확인$/.test(rest)) return `${l.toLowerCase()}-${d.join('-')}. `;
  return `${l.toLowerCase()}) `;
}];
const MODE = {
  list: [
    LIST_HEAD,
    ['괄호 뒤 쉼표 삭제', /\)[ \t]*,[ \t]*(?=\S)/g, () => ') '],
    ['정보공시 괄호', /^([a-z]-\d+\. )정보공시[ \t]*/, (m, a) => `${a}(정보공시) `],
    ['끝 마침표 삭제', /(?<=[가-힣)\]])\.[ \t]*$/, () => ''],
  ],
  status: [
    ['문단 시작 형식', /^[ \t]*(?:[-–—•·▪■][ \t]*)?\([ \t]*(\d{4})[ \t]*(?:학년도|년도|년)?[ \t]*\)[ \t]*/, (m, y) => `- (${y}학년도) `],
    ['문단 시작 형식', /^[ \t]*[–—•·▪■][ \t]*/, () => '- '],
    ['입증자료 표시', /[ \t]*\([ \t]*입증[ \t]*자료[ \t]*[:：]?[ \t]*([^)]*)\)/g, (m, inner) => {
      let s = inner.trim()
        .replace(/([A-Za-z])[ \t]*-[ \t]*(\d+)[ \t]*[,.]?[ \t]*(?=\d+(?:~\d+)?페이지)/g, (x, l, n) => `${l.toLowerCase()}-${n}. `)
        .replace(/([A-Za-z])[ \t]*-[ \t]*(\d+)/g, (x, l, n) => `${l.toLowerCase()}-${n}`)
        .replace(/[ \t]*,[ \t]*/g, ', ');
      return ` (입증자료 ${s})`;
    }],
    ['판정 문장 형식', /^[ \t]*(?:[-–—•·▪■][ \t]*)?이상의[ \t]*근거로[ \t]*,?[ \t]*/, () => '- 이상의 근거로, '],
    ['끝 마침표 삭제', /(?<=[가-힣)])\.[ \t]*$/, () => ''],
  ],
  file: [
    ['경로 지우기', /^[ \t]*"?(?:[A-Za-z]:[\\/]|\\\\)(?:[^"\\/]*[\\/])*([^"\\/]+?)"?[ \t]*$/, (m, n) => n],
    LIST_NO,
    ['괄호 뒤 쉼표 삭제', /\)[ \t]*,[ \t]*(?=\S)/g, () => ') '],
    ['파일명 금지문자 변경', /(?<=[가-힣A-Za-z0-9])\/(?=[가-힣A-Za-z0-9])/g, () => '·'],
    ['.pdf 빼기 (저장 시 자동으로 붙음)', /(?:[ \t]*\.pdf)+[ \t]*$/i, () => ''],
  ],
};
const TAIL = [['중복 띄어쓰기', /(?<=\S)[ \t]{2,}(?=\S)/g, () => ' ']];

function applyRules(line, rules, log, ln) {
  for (const [rule, re, fn] of rules) {
    line = line.replace(re, (...args) => {
      const m = args[0];
      const out = fn(...args);
      if (out !== m) log.push({ ln, rule, from: m, to: out });
      return out;
    });
  }
  return line;
}

const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 학교 사전(terms)과 사용자 규칙(custom_rules)을 정정 규칙 배열로 바꿈
function buildExtra(extra, mode) {
  const pre = [], post = [], warns = [];
  (extra.terms || []).forEach(t => {
    if (!t.wrong || t.wrong === t.correct) return;
    pre.push([`학교 사전(${t.kind || '표기'})`, new RegExp(reEsc(t.wrong), 'g'), () => t.correct]);
  });
  (extra.rules || []).forEach(r => {
    if (r.active === false || !r.find) return;
    if (r.mode && r.mode !== 'all' && r.mode !== mode) return;
    let re;
    try { re = new RegExp(r.is_regex ? r.find : reEsc(r.find), 'g'); } catch (err) { return; }
    if (r.kind === 'warn') warns.push({ re, msg: r.message || r.name, name: r.name });
    else post.push([`추가 규칙: ${r.name}`, re, (...a) => r.is_regex
      ? a[0].replace(new RegExp(r.find), r.replace || '') : (r.replace || '')]);
  });
  return { pre, post, warns };
}

// ---------- 제안(확인 필요 항목 중 고칠 방법이 분명한 것) ----------
const SUGGEST = {
  status: [
    ['제안: 개조식 종결어미', /(하였습니다|했습니다|합니다|하였다|했다|한다|되었습니다|됐습니다|됩니다|되었다|됐다|된다|있었습니다|있습니다|있다|없었습니다|없습니다|없다|나타났습니다|나타납니다|나타났다|보였습니다|보였다|입니다|이다)(?=[\s.,(]|$)/g,
      (m) => /^(하였|했|합|한)/.test(m) ? '함' : /^(되었|됐|됩|된)/.test(m) ? '됨' : /^있/.test(m) ? '있음'
        : /^없/.test(m) ? '없음' : /^나타/.test(m) ? '나타남' : /^보였/.test(m) ? '보임' : '임'],
    ['제안: 개조식 종결어미', /([높낮많적좋])(았|었)(습니다|다)(?=[\s.,(]|$)/g, (m, a) => `${a}음`],
    ['제안: 모호 표현 삭제', /(충분히|매우|상당히|대체로|크게)[ \t]+/g, () => ''],
    ['제안: 학년도 표기', /(\d{4})년도(?![ \t]*\d)/g, (m, y) => `${y}학년도`],
    ['제안: 문장 중간 마침표', /(?<=[함됨음임])\.[ \t]+(?=[가-힣])/g, () => ', '],
  ],
  list: [['제안: [ ] 앞 띄어쓰기 통일', /(?<=[가-힣)])\[/g, () => ' [']],
  file: [['제안: [ ] 앞 띄어쓰기 통일', /(?<=[가-힣)])\[/g, () => ' [']],
};

// 목록: 판단항목 알파벳에 맞춰 1부터 다시 번호 매김 (파일명은 현장비치 때문에 빈 번호가 정상이라 제외)
function renumber(lines, log) {
  if (lines.some(l => /^[a-z]-\d+-\d+/.test(l))) return lines;
  let head = null; const cnt = {};
  return lines.map((s, i) => {
    const h = s.match(/^([a-z])\) /); if (h) { head = h[1]; return s; }
    const it = s.match(/^([a-z])-(\d+)\. /); if (!it) return s;
    const l = head || it[1]; cnt[l] = (cnt[l] || 0) + 1;
    const nu = `${l}-${cnt[l]}. `;
    if (nu !== it[0]) { log.push({ ln: i + 1, rule: '제안: 번호 다시 매김', from: it[0], to: nu, sug: true }); return nu + s.slice(it[0].length); }
    return s;
  });
}

function correct(text, mode, extra = {}, opt = {}) {
  const log = [];
  const x = buildExtra(extra, mode);
  const auto = text.split('\n').map((raw, i) => {
    if (!raw.trim()) return '';
    let s = applyRules(raw, x.pre, log, i + 1);
    s = applyRules(s, COMMON, log, i + 1);
    s = applyRules(s, MODE[mode], log, i + 1);
    s = applyRules(s, x.post, log, i + 1);
    s = applyRules(s, TAIL, log, i + 1);
    return s.replace(/[ \t]+$/, '');
  });
  let lines = auto;
  if (opt.suggest) {
    const n0 = log.length;
    lines = auto.map((s, i) => s ? applyRules(s, SUGGEST[mode], log, i + 1).replace(/[ \t]+$/, '') : s);
    if (mode === 'list') lines = renumber(lines, log);
    for (let k = n0; k < log.length; k++) log[k].sug = true;
  }
  const warns = check(lines, mode);
  lines.forEach((s, i) => x.warns.forEach(w => {
    w.re.lastIndex = 0; const m = s.match(w.re);
    if (m) warns.push({ ln: i + 1, msg: `${esc(w.msg)} (<b>${esc(m[0])}</b>)` });
  }));
  return { text: lines.join('\n'), auto: auto.join('\n'), log, warns };
}

// ---------- 확인 필요(경고) ----------
function check(lines, mode) {
  const w = [];
  const add = (ln, msg) => w.push({ ln, msg });
  if (mode === 'list' || mode === 'file') {
    let labels = []; let head = null; let group = '';
    const flushSeen = () => {
      const where = group ? `[${group}] ` : '';
      const kids = {};
      labels.forEach(lb => { const p = lb.split('-'); for (let k = 1; k < p.length; k++) (kids[p.slice(0, k).join('-')] = kids[p.slice(0, k).join('-')] || new Set()).add(+p[k]); });
      const miss = [];
      for (const [par, set] of Object.entries(kids)) { const max = Math.max(...set); for (let k = 1; k <= max; k++) if (!set.has(k)) miss.push(`${par}-${k}`); }
      const dup = [...new Set(labels.filter((x, i) => labels.indexOf(x) !== i))];
      if (miss.length) add(null, mode === 'file'
        ? `${where}파일이 없는 번호: <b>${miss.join(', ')}</b> (현장비치 자료라면 정상입니다. 아니면 목록 번호를 확인해 주세요.)`
        : `${where}번호가 빠졌습니다: <b>${miss.join(', ')}</b> (1부터 빠짐없이)`);
      if (dup.length) add(null, `${where}번호가 중복됩니다: <b>${dup.join(', ')}</b>`);
      labels = [];
    };
    lines.forEach((s, i) => {
      if (!s) return;
      const g = s.match(/^\[(.+)\]$/);
      if (g) { flushSeen(); group = g[1]; return; }  // [판단항목1.1.1.a] 같은 폴더 구분 줄
      const h = s.match(/^([a-z])\) /);
      if (h) { head = h[1]; if (mode === 'list') return; }
      const it = s.match(/^([a-z])-(\d+(?:-\d+)*)\. /);
      if (!it) { if (!h) add(i + 1, '번호 형식(<b>a-1.</b> 또는 <b>a)</b>)으로 시작하지 않습니다.'); return; }
      if (head && it[1] !== head) add(i + 1, `<b>${head})</b> 판단항목 아래에 <b>${it[1]}-${it[2]}</b> 번호가 있습니다. 알파벳을 맞춰 주세요.`);
      labels.push(`${it[1]}-${it[2]}`);
      const sp = s.match(/[가-힣·()]{18,}|[가-힣](?:에대한|에따른|에관한|에의한)|[가-힣)]및|및[가-힣(]|\((?:안)\)(?![에의를을은는과와로이가도\s,])[가-힣]/);
      if (sp) add(i + 1, `띄어쓰기가 빠진 곳이 있습니다(<b>${sp[0].length > 12 ? sp[0].slice(0, 12) + '…' : sp[0]}</b>). 다른 파일명처럼 띄어 써 주세요.`);
      const ip = s.match(/\(정보공시\) (\S+)/);
      if (/\(정보공시\)/.test(s) && !/\(\d{4}(?:, \d{4})*\)(?:\.pdf)?$/.test(s)) add(i + 1, '정보공시 자료는 항목명 뒤에 <b>해당 학년도</b>를 붙입니다. (예: …캡스톤 디자인 운영 현황(2025, 2026) / 이번 2025학년도분은 (2025))');
      if (ip && !/\.$/.test(ip[1])) add(i + 1, `정보공시 목차번호 <b>${ip[1]}</b>가 「대학정보공시 지침서」 목차 표기와 같은지 확인해 주세요. (예: 12-카-2.)`);
      if (mode === 'file') {
        const ext = s.match(/\.(hwpx?|docx?|xlsx?|pptx?|jpe?g|png|gif|zip|txt)$/i);
        if (ext) add(i + 1, `PDF가 아닌 파일(<b>.${ext[1]}</b>)입니다. 서면평가자료는 PDF로 변환해서 올립니다.`);
        if (/\(현장비치\)/.test(s)) add(i + 1, '<b>(현장비치)</b> 자료는 파일을 올리지 않습니다. 목록에만 적고 원본은 평가장에 비치합니다.');
        const bad = s.match(/[\\/:*?"<>|]/g);
        if (bad) add(i + 1, `파일명에 쓸 수 없는 문자 <b>${[...new Set(bad)].join(' ')}</b>가 있습니다. 목록 문구에서도 빼 주세요.`);
        if (s.length > 120) add(i + 1, `파일명이 ${s.length}자로 깁니다. 폴더 경로까지 합치면 Windows에서 오류가 날 수 있어 줄이는 것이 좋습니다.`);
      }
    });
    flushSeen();
  }
  if (mode === 'status') {
    const vague = ['충분히', '매우', '상당히', '대체로', '크게', '높은 수준', '우수한 수준', '것으로 보임', '것으로 사료', '브로드', '시나브로'];
    let verdicts = []; let lastIdx = -1;
    lines.forEach((s, i) => {
      if (!s) return; lastIdx = i;
      const end = s.match(/(습니다|입니다|하였다|했다|한다|이다)(?=[\s.(]|$)/);
      if (end) add(i + 1, `<b>~${end[1]}</b> → 개조식 종결어미(<b>~함, ~됨, ~있음</b>)로 바꿔 주세요.`);
      vague.forEach(v => { if (s.includes(v)) add(i + 1, `모호·과장 표현 <b>${v}</b> → 수치나 사실로 바꿔 주세요. (예: 만족도가 90.0%로 나타남)`); });
      if (/판정/.test(s)) verdicts.push(i);
      if (/^- \(\d{4}학년도\)/.test(s) && !/\(입증자료 [^)]+\)/.test(s) && (!/\(입증자료/.test(lines[i + 1] || '') || /^- \(\d{4}/.test(lines[i + 1] || '')))
        add(i + 1, '문단 끝에 <b>(입증자료 a-1. 00페이지)</b> 표시가 없습니다.');
      if (/[가-힣]\.\s+[가-힣]/.test(s)) add(i + 1, '문장 중간에 마침표가 있습니다. 개조식은 마침표 없이 끝냅니다.');
      if (/\(\d{4}년\)|\d{4}년도(?!\s*\d)/.test(s)) add(i + 1, '연도는 <b>○○○○학년도</b>로 씁니다. (회계연도라면 그대로)');
    });
    if (lines.some(Boolean)) {
      if (!verdicts.length) add(null, '판정 문장이 없습니다. 마지막 줄에 <b>- 이상의 근거로, 〈충족〉 판정함</b>을 넣어 주세요.');
      else {
        if (verdicts.length > 1) add(null, '판정 문장이 여러 번 있습니다. a, b, c를 종합해 <b>마지막 줄에 한 번만</b> 씁니다.');
        if (verdicts[verdicts.length - 1] !== lastIdx) add(null, '판정 문장은 <b>맨 마지막 줄</b>에 둡니다.');
        const v = lines[verdicts[verdicts.length - 1]];
        if (/〈(조건부충족|미충족)〉/.test(v) && !/(없어|미흡|부족|않아|못해)/.test(v)) add(null, '조건부충족·미충족이면 <b>원인</b>을 함께 씁니다. (예: 2025학년도에 ~실적이 없어 〈미충족〉 판정함)');
      }
    }
  }
  return w;
}

// ---------- 글자 단위 비교 ----------
function diff(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops = []; let i = 0, j = 0;
  const push = (t, c) => { const l = ops[ops.length - 1]; if (l && l.t === t) l.s += c; else ops.push({ t, s: c }); };
  while (i < n && j < m) {
    if (a[i] === b[j]) { push('=', a[i]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { push('-', a[i]); i++; }
    else { push('+', b[j]); j++; }
  }
  while (i < n) push('-', a[i++]);
  while (j < m) push('+', b[j++]);
  return ops;
}
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const vis = s => esc(s).replace(/ /g, '<span style="opacity:.5">·</span>');

// ---------- 예시 ----------
const SAMPLES = {
  list: `a) 전공 교육과정 개발(개편) 관련 규정 준수 확인.
a-1 학칙(개정 2025.2.19.),제22조
A-2. 교육과정운영지침(개정 2021-04-20) 제1조.
b) 전공 교육과정 개발(개편) 관련 내·외부환경 분석 및 의견수렴 확인
b-1. 제21차 ㅇㅇ위원회 회의록(기획처-29호, 2022.7.10.), 9 쪽
b-3. [현장 비치] OO학과 전공 교육과정 개발 보고서
c) 전공 교육과정 개발(개편) 실적 확인
c-1. 정보공시 12-카-2. 캡스톤 디자인 운영 현황`,
  status: `b) ~ 추진체계 확인
• (2024년도) 대학은 ｢직제규정｣제12조(대학본부)에 따라 OO처 산하 OO운영팀을 두고, 「사무분장 규정」 제12조(○○처) 제2항의 따라 업무를 수행하고 있음 (입증자료 B-3, 10 ~ 14페이지).
- (2025학년도) 2025년-1학기 강의만족도는 매우 높은 87.25%로 나타났습니다(입증자료: b-5)
- (2025학년도) 상담사 안ㅇ헌(업무기간 2024.3.1.~ 2026.4월 현재)이 상담 업무를 수행함(입증자료 b-6. 3p)
- (2025학년도) 취업률 = (80명 / 100명) x 100 = 80%이며, 교육비 124,445,678원을 집행함(입증자료 b-7)
이상의 근거로 충족 판정함.`,
  file: `a-1. 학칙(개정 2025.02.19.),제22조.pdf
a-2. 제32차 OO위원회 회의결과 보고(기획처-5호, 2025.07.10.), 10페이지.PDF
a-4. (정보공시)12-카-2. 캡스톤 디자인 운영 현황 .pdf
b-1. 산학/취업 협력 실적
b-2. (현장비치) 2024학년도 직원 근무평정 결과 보고`,
};
const HINTS = {
  list: '「평가인증시스템」 입증자료 칸에 쓸 목록을 한 줄에 하나씩 넣으세요. 판단항목 제목(a) …)도 함께 넣으면 번호 검사까지 합니다.',
  status: '「현황 및 분석결과」 칸에 쓸 내용을 넣으세요. 한 문단이 한 줄입니다. 글자수 6,000자 제한도 함께 셉니다.',
  file: '파일 이름을 한 줄에 하나씩 넣거나, 위 버튼으로 파일·폴더·캡처를 불러오세요. 목록 문구와 같은 규칙으로 고칩니다. .pdf는 PDF로 저장할 때 자동으로 붙으므로 결과에서는 뺍니다. 결과를 저장 창의 파일 이름 칸에 그대로 붙여 넣으세요.',
};

