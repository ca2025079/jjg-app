// 자체평가 표기 정정기 - 화면 동작과 Supabase 연동
const $ = id => document.getElementById(id);
const MODE_NAME = { list: '입증자료 목록', status: '현황 및 분석결과', file: '증빙파일명' };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};

// ---------- Supabase ----------
const cfg = window.APP_CONFIG || {};
let sb = null;
try {
  if (cfg.SUPABASE_URL && cfg.SUPABASE_KEY && window.supabase) sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);
} catch (e) { sb = null; }

let extra = { terms: [], rules: [] };
let adminPw = '';

function setConn(state, msg) {
  const el = $('conn');
  el.className = 'conn ' + (state === 'on' ? 'on' : state === 'err' ? 'err' : '');
  el.textContent = state === 'on' ? `학교 사전 연결됨 · 사전 ${extra.terms.length} · 규칙 ${extra.rules.length}`
    : state === 'err' ? '학교 사전 연결 오류' : '기본 규칙만 사용 중 (Supabase 미연결)';
  if (msg) el.title = msg;
}

async function loadExtra() {
  if (!sb) { setConn('off'); renderAdmin(); return; }
  const [t, r] = await Promise.all([
    sb.from('jjg_terms').select('*').order('kind').order('wrong'),
    sb.from('jjg_rules').select('*').order('id'),
  ]);
  if (t.error || r.error) { setConn('err', (t.error || r.error).message); renderAdmin(); return; }
  extra = { terms: t.data, rules: r.data };
  setConn('on');
  render(); renderAdmin();
}

// ---------- 정정하기 ----------
let mode = store.get('jjg-mode', 'list');
const drafts = Object.assign({ ...SAMPLES }, store.get('jjg-drafts', {}));
let last = { text: '', log: [], warns: [] };

let useSug = store.get('jjg-sug', true);

// 줄별로 원문→최종 비교, 그중 '제안' 단계에서 들어간 글자는 노란색
function lineHtml(orig, auto, fin) {
  const sugIdx = new Set(); let j = 0;
  if (auto !== fin) for (const o of diff(auto, fin)) {
    if (o.t === '-') continue;
    for (let k = 0; k < o.s.length; k++, j++) if (o.t === '+') sugIdx.add(j);
  }
  let out = ''; j = 0;
  for (const o of diff(orig, fin)) {
    if (o.t === '-') { out += `<del>${esc(o.s)}</del>`; continue; }
    if (o.t === '=') { out += esc(o.s); j += o.s.length; continue; }
    let buf = '', cur = null;
    const flush = () => { if (buf) out += `<ins${cur ? ' class="sug"' : ''}>${esc(buf)}</ins>`; buf = ''; };
    for (const ch of o.s) { const sg = sugIdx.has(j++); if (sg !== cur) { flush(); cur = sg; } buf += ch; }
    flush();
  }
  return out;
}

function render() {
  const src = $('input').value;
  const r = correct(src, mode, extra, { suggest: useSug }); last = r;
  const a = src.split('\n'), au = r.auto.split('\n'), b = r.text.split('\n');
  const wl = {}; r.warns.forEach(w => { if (w.ln) wl[w.ln] = (wl[w.ln] || 0) + 1; });
  $('output').innerHTML = src.trim() ? b.map((line, i) => `<div class="line${wl[i + 1] ? ' w' : ''}"${wl[i + 1] ? ` data-n="${wl[i + 1]}건"` : ''}>${lineHtml((a[i] || '').replace(/[ \t]+$/, ''), au[i] || '', line)}</div>`).join('')
    : '<span class="empty">입력하면 바로 정정됩니다.</span>';
  const nSug = r.log.filter(x => x.sug).length;
  const len = r.text.replace(/\n/g, '').length;
  $('stats').innerHTML =
    `<span class="stat ok">자동 수정 ${r.log.length - nSug}건</span>` +
    (useSug ? `<span class="stat warn">제안 반영 ${nSug}건</span>` : '') +
    `<span class="stat ${r.warns.length ? 'warn' : 'ok'}">${useSug ? '남은 ' : ''}확인 필요 ${r.warns.length}건</span>` +
    (mode === 'status' ? `<span class="stat ${len > 6000 ? 'over' : ''}">글자수 ${comma(len)} / 6,000자</span>` : '');
  const ws = r.warns.slice();
  if (mode === 'status' && len > 6000) ws.unshift({ msg: `<b>글자수 초과</b> · ${comma(len)}자입니다. 평가요소별 입력칸은 6,000자(띄어쓰기 포함)까지입니다.` });
  $('warns').innerHTML = ws.map(x => `<li>${x.ln ? `<span class="lnb">${x.ln}줄</span>` : '<span class="lnb">전체</span>'}${x.msg}</li>`).join('');
  $('alert').classList.toggle('ok', !ws.length);
  $('alert-count').textContent = ws.length;
  $('alert').querySelector('h2').textContent = ws.length ? '확인 필요' : '확인할 부분이 없습니다';
  $('alert').querySelector('.alert-sub').hidden = !ws.length;
  $('log').innerHTML = r.log.length
    ? r.log.map(x => `<tr class="${x.sug ? 'sug' : ''}"><td class="n">${x.ln}</td><td class="r">${esc(x.rule)}</td><td><span class="from">${vis(x.from)}</span></td><td><span class="to ${x.sug ? 'sug' : ''}">${vis(x.to) || '(삭제)'}</span></td></tr>`).join('')
    : '<tr><td colspan="4" class="empty">고칠 부분이 없습니다.</td></tr>';
  drafts[mode] = src; store.set('jjg-drafts', drafts);
}

function setMode(m) {
  mode = m; store.set('jjg-mode', m);
  document.querySelectorAll('.mode').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  $('hint').textContent = HINTS[m];
  $('input').value = drafts[m] ?? '';
  render();
}

let typing;
$('input').addEventListener('input', () => { clearTimeout(typing); typing = setTimeout(render, 120); });
document.querySelectorAll('.mode').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
$('btn-sample').onclick = () => { $('input').value = SAMPLES[mode]; render(); };
$('btn-clear').onclick = () => { $('input').value = ''; render(); $('input').focus(); };
$('btn-apply').onclick = () => { $('input').value = last.text; render(); toast('입력칸에 반영했습니다'); };
$('show-diff').onchange = e => $('output').classList.toggle('clean', !e.target.checked);
$('use-sug').checked = useSug;
$('use-sug').onchange = e => { useSug = e.target.checked; store.set('jjg-sug', useSug); render(); };
$('btn-copy').onclick = () => {
  const fallback = () => {
    $('output').classList.add('clean'); $('show-diff').checked = false;
    const rg = document.createRange(); rg.selectNodeContents($('output'));
    const s = getSelection(); s.removeAllRanges(); s.addRange(rg);
    toast('선택된 결과를 복사해 주세요');
  };
  if (navigator.clipboard) navigator.clipboard.writeText(last.text).then(() => toast('결과를 복사했습니다'), fallback); else fallback();
};

$('author').value = store.get('jjg-author', '');
$('author').addEventListener('change', e => store.set('jjg-author', e.target.value.trim()));
$('btn-save').onclick = async () => {
  if (!sb) return toast('Supabase를 연결해야 기록을 저장할 수 있습니다');
  const src = $('input').value.trim();
  if (!src) return toast('저장할 내용이 없습니다');
  const author = $('author').value.trim();
  if (!author) { $('author').focus(); return toast('작성자를 입력해 주세요'); }
  $('btn-save').disabled = true;
  const { error } = await sb.from('jjg_history').insert({
    author, mode, original: $('input').value, corrected: last.text,
    fix_count: last.log.length, warn_count: last.warns.length,
  });
  $('btn-save').disabled = false;
  toast(error ? '저장하지 못했습니다: ' + error.message : '정정 기록을 저장했습니다');
};

// ---------- 정정 기록 ----------
let hist = [];
async function loadHistory() {
  if (!sb) { $('hist-list').innerHTML = '<p class="muted">Supabase를 연결하면 저장한 정정 기록이 여기에 보입니다.</p>'; return; }
  $('hist-list').innerHTML = '<p class="muted">불러오는 중입니다.</p>';
  const { data, error } = await sb.from('jjg_history').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) { $('hist-list').innerHTML = `<p class="muted">불러오지 못했습니다: ${esc(error.message)}</p>`; return; }
  hist = data; renderHistory();
}
function renderHistory() {
  const m = $('hist-mode').value, q = $('hist-q').value.trim();
  const rows = hist.filter(h => (!m || h.mode === m) && (!q || [h.author, h.original, h.corrected].some(v => (v || '').includes(q))));
  if (!rows.length) { $('hist-list').innerHTML = '<p class="muted">저장된 기록이 없습니다. 정정하기 화면에서 [기록 저장]을 누르면 쌓입니다.</p>'; return; }
  $('hist-list').innerHTML = rows.map(h => {
    const d = new Date(h.created_at);
    const when = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}. ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const first = (h.corrected || '').split('\n').find(Boolean) || '';
    return `<details class="hist"><summary>
      <span class="pill">${MODE_NAME[h.mode] || h.mode}</span>
      <span>${esc(h.author || '')}</span>
      <span class="muted">${when} · 수정 ${h.fix_count}건 · 확인 ${h.warn_count}건</span>
      <span class="muted" style="flex-basis:100%;font-weight:400">${esc(first.slice(0, 80))}</span></summary>
      <div class="two"><div><p class="muted">원래</p><pre>${esc(h.original || '')}</pre></div>
      <div><p class="muted">정정 결과</p><pre>${esc(h.corrected || '')}</pre></div></div>
      <div class="row" style="margin-top:8px">
        <button class="b" data-load="${h.id}">정정하기로 불러오기</button>
        ${adminPw ? `<button class="b danger" data-del-hist="${h.id}">삭제</button>` : ''}
      </div></details>`;
  }).join('');
}
$('hist-mode').onchange = renderHistory;
$('hist-q').oninput = renderHistory;
$('btn-hist-reload').onclick = loadHistory;
$('hist-list').addEventListener('click', async e => {
  const load = e.target.dataset.load, del = e.target.dataset.delHist;
  if (load) {
    const h = hist.find(x => String(x.id) === load);
    location.hash = '#fix'; setMode(h.mode); $('input').value = h.original; render();
  }
  if (del) {
    if (!(await confirmInline(e.target))) return;
    const { error } = await sb.rpc('jjg_delete_history', { pw: adminPw, p_id: Number(del) });
    toast(error ? error.message : '삭제했습니다'); if (!error) loadHistory();
  }
});

// 버튼을 한 번 더 눌러야 실행되는 확인 (브라우저 confirm 대신)
function confirmInline(btn) {
  if (btn.dataset.armed) return Promise.resolve(true);
  btn.dataset.armed = '1'; const t = btn.textContent; btn.textContent = '한 번 더 누르면 삭제';
  setTimeout(() => { delete btn.dataset.armed; btn.textContent = t; }, 3000);
  return Promise.resolve(false);
}

// ---------- 학교 사전·규칙 ----------
function renderAdmin() {
  document.querySelectorAll('.admin-only').forEach(el => el.hidden = !adminPw);
  $('lock-row').hidden = !!adminPw;
  if (!sb) $('lock-msg').textContent = 'Supabase를 연결해야 사전과 규칙을 관리할 수 있습니다. (config.js 설정)';
  else if (adminPw) $('lock-msg').textContent = '관리자로 확인되었습니다. 이 창을 닫으면 다시 확인해야 합니다.';
  else $('lock-msg').textContent = '';

  $('term-list').innerHTML = extra.terms.length ? extra.terms.map(t => `<tr>
    <td><span class="pill">${esc(t.kind || '')}</span></td><td><span class="from">${esc(t.wrong)}</span></td>
    <td><span class="to">${esc(t.correct)}</span></td><td class="muted">${esc(t.note || '')}</td>
    <td class="admin-only" ${adminPw ? '' : 'hidden'}><button class="b danger" data-del-term="${t.id}">삭제</button></td></tr>`).join('')
    : '<tr><td colspan="5" class="empty">아직 등록된 표기가 없습니다. 관리자 확인 후 위 칸에서 추가하세요.</td></tr>';

  $('rule-list').innerHTML = extra.rules.length ? extra.rules.map(r => `<tr>
    <td class="r">${esc(r.name)}</td><td>${r.mode === 'all' ? '전체' : MODE_NAME[r.mode]}</td>
    <td><span class="pill">${r.kind === 'warn' ? '알려주기' : '고치기'}</span></td>
    <td><code class="k">${esc(r.find)}</code>${r.is_regex ? ' <span class="muted">(정규식)</span>' : ''}</td>
    <td>${r.kind === 'warn' ? esc(r.message || '') : `<span class="to">${esc(r.replace || '')}</span>`}</td>
    <td>${adminPw ? `<label class="tog"><input type="checkbox" data-toggle-rule="${r.id}" ${r.active ? 'checked' : ''}> 사용</label>` : (r.active ? '사용' : '꺼짐')}</td>
    <td class="admin-only" ${adminPw ? '' : 'hidden'}><button class="b danger" data-del-rule="${r.id}">삭제</button></td></tr>`).join('')
    : '<tr><td colspan="7" class="empty">아직 추가한 규칙이 없습니다.</td></tr>';
}

$('btn-unlock').onclick = async () => {
  if (!sb) return toast('Supabase를 먼저 연결해 주세요');
  const pw = $('admin-pw').value;
  const { data, error } = await sb.rpc('jjg_admin_ok', { pw });
  if (error) return toast('확인하지 못했습니다: ' + error.message);
  if (!data) { $('lock-msg').textContent = '비밀번호가 맞지 않습니다.'; return; }
  adminPw = pw; $('admin-pw').value = ''; renderAdmin(); renderHistory();
};
$('admin-pw').addEventListener('keydown', e => { if (e.key === 'Enter') $('btn-unlock').click(); });

$('r-kind').onchange = e => { const w = e.target.value === 'warn'; $('r-message-wrap').hidden = !w; $('r-replace-wrap').hidden = w; };

$('btn-add-term').onclick = async () => {
  const wrong = $('t-wrong').value.trim(), right = $('t-correct').value.trim();
  if (!wrong || !right) return toast('틀린 표기와 바른 표기를 모두 입력해 주세요');
  const { error } = await sb.rpc('jjg_save_term', { pw: adminPw, p_id: null, p_kind: $('t-kind').value, p_wrong: wrong, p_correct: right, p_note: $('t-note').value.trim() });
  if (error) return toast(error.message);
  ['t-wrong', 't-correct', 't-note'].forEach(id => $(id).value = '');
  toast('사전에 추가했습니다'); loadExtra();
};

$('btn-add-rule').onclick = async () => {
  const name = $('r-name').value.trim(), find = $('r-find').value, kind = $('r-kind').value, isRe = $('r-regex').checked;
  if (!name || !find) return toast('규칙 이름과 찾을 말을 입력해 주세요');
  if (isRe) { try { new RegExp(find); } catch (e) { return toast('정규식 형식이 맞지 않습니다'); } }
  if (kind === 'warn' && !$('r-message').value.trim()) return toast('안내 문구를 입력해 주세요');
  const { error } = await sb.rpc('jjg_save_rule', {
    pw: adminPw, p_id: null, p_name: name, p_mode: $('r-mode').value, p_kind: kind, p_find: find,
    p_is_regex: isRe, p_replace: $('r-replace').value, p_message: $('r-message').value.trim(), p_active: true,
  });
  if (error) return toast(error.message);
  ['r-name', 'r-find', 'r-replace', 'r-message'].forEach(id => $(id).value = ''); $('r-regex').checked = false;
  toast('규칙을 추가했습니다'); loadExtra();
};

document.addEventListener('click', async e => {
  const t = e.target.dataset;
  if (t.delTerm) {
    if (!(await confirmInline(e.target))) return;
    const { error } = await sb.rpc('jjg_delete_term', { pw: adminPw, p_id: Number(t.delTerm) });
    toast(error ? error.message : '삭제했습니다'); if (!error) loadExtra();
  }
  if (t.delRule) {
    if (!(await confirmInline(e.target))) return;
    const { error } = await sb.rpc('jjg_delete_rule', { pw: adminPw, p_id: Number(t.delRule) });
    toast(error ? error.message : '삭제했습니다'); if (!error) loadExtra();
  }
});
document.addEventListener('change', async e => {
  const id = e.target.dataset.toggleRule; if (!id) return;
  const r = extra.rules.find(x => String(x.id) === id);
  const { error } = await sb.rpc('jjg_save_rule', {
    pw: adminPw, p_id: r.id, p_name: r.name, p_mode: r.mode, p_kind: r.kind, p_find: r.find,
    p_is_regex: r.is_regex, p_replace: r.replace, p_message: r.message, p_active: e.target.checked,
  });
  toast(error ? error.message : (e.target.checked ? '규칙을 켰습니다' : '규칙을 껐습니다')); loadExtra();
});

// ---------- 화면 전환 ----------
function route() {
  const v = (location.hash || '#fix').slice(1);
  const view = ['fix', 'history', 'admin'].includes(v) ? v : 'fix';
  ['fix', 'history', 'admin'].forEach(k => {
    $('view-' + k).hidden = k !== view;
    $('nav-' + k).setAttribute('aria-current', k === view ? 'page' : 'false');
  });
  if (view === 'history') loadHistory();
}
window.addEventListener('hashchange', route);

function toast(msg) { const el = $('toast'); el.textContent = msg; el.hidden = false; clearTimeout(el._t); el._t = setTimeout(() => el.hidden = true, 2200); }

setMode(mode);
route();
loadExtra();
