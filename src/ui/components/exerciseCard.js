/**
 * 練習題卡片：情境 → 題目 → 編輯器 → 執行 / 送出 / 提示 / 解答 → 回饋。
 */
import { h, icon, toast, difficultyDots, clear } from '../dom.js';
import { renderMarkdown } from '../../core/markdown.js';
import { runIsolated } from '../../core/sqlEngine.js';
import { grade } from '../../core/grader.js';
import { createSqlEditor, highlightBlocks, hintTables } from './sqlEditor.js';
import { resultView, errorView, dataTable } from './resultTable.js';

export function exerciseCard(app, { course, exercise: ex, index, onSolved }) {
  const state = app.progress.ex(ex.id);
  let hintShown = 0;

  const statusBadge = h('span', { class: 'badge' });
  const paintStatus = () => {
    const s = app.progress.ex(ex.id);
    statusBadge.className = 'badge';
    if (s?.status === 'solved') { statusBadge.classList.add('badge-ok'); statusBadge.textContent = s.revealed ? '已完成（看過解答）' : '已完成'; }
    else if (s?.attempts) { statusBadge.classList.add('badge-warn'); statusBadge.textContent = `嘗試 ${s.attempts} 次`; }
    else { statusBadge.textContent = '未作答'; }
    card.classList.toggle('is-solved', s?.status === 'solved');
  };

  const editorHost = h('div', { class: 'editor-host' });
  const output = h('div', { class: 'ex-output' });
  const hintBox = h('div', { class: 'ex-hints' });
  const solutionBox = h('div', { class: 'ex-solution', hidden: true });

  const hintBtn = h('button', { class: 'btn btn-ghost', type: 'button', onclick: showHint }, icon('bulb'), h('span', {}, '提示'));
  const revealBtn = h('button', { class: 'btn btn-ghost', type: 'button', onclick: reveal }, icon('eye'), h('span', {}, '看解答'));

  const card = h('section', { class: 'exercise card', id: ex.id },
    h('header', { class: 'ex-head' },
      h('span', { class: 'ex-index' }, `練習 ${index + 1}`),
      difficultyDots(ex.difficulty),
      statusBadge),
    h('h3', { class: 'ex-title' }, ex.title),
    ex.scenario && h('div', { class: 'ex-scenario' },
      h('span', { class: 'ex-avatar' }, icon('user')),
      h('p', {}, ex.scenario)),
    h('div', { class: 'ex-prompt prose', html: renderMarkdown(ex.prompt) }),
    h('div', { class: 'editor-frame' },
      editorHost,
      h('div', { class: 'editor-toolbar' },
        h('button', { class: 'btn btn-secondary', type: 'button', onclick: run, title: 'Ctrl + Enter' }, icon('play'), h('span', {}, '執行')),
        h('button', { class: 'btn btn-primary', type: 'button', onclick: submit, title: 'Ctrl + Shift + Enter' }, icon('check'), h('span', {}, '送出答案')),
        h('span', { class: 'kbd-hint' }, 'Ctrl + Enter 執行'),
        h('span', { class: 'spacer' }),
        hintBtn,
        revealBtn)),
    hintBox,
    output,
    solutionBox);

  const editor = createSqlEditor(editorHost, {
    value: state?.draft ?? ex.starter ?? '',
    tables: hintTables(course.dataset),
    onRun: run,
    onSubmit: submit,
    onChange: (v) => app.progress.saveDraft(ex.id, v),
  });
  paintStatus();

  function run() {
    const sql = editor.getValue();
    clear(output);
    if (!sql.trim()) return output.append(h('div', { class: 'result-empty' }, '還沒有輸入 SQL。'));
    output.append(resultView(runIsolated(course.dataset, sql), { title: '你的結果' }));
  }

  function submit() {
    const sql = editor.getValue();
    const actual = runIsolated(course.dataset, sql);
    const expected = runIsolated(course.dataset, ex.answer);
    const g = grade({ expected, actual, ordered: !!ex.ordered, sql, rules: ex.rules || [] });
    app.progress.recordAttempt(ex.id, g.correct);
    paintStatus();
    clear(output);

    if (g.correct) {
      output.append(h('div', { class: 'feedback feedback-ok', role: 'status' },
        h('div', { class: 'feedback-title' }, icon('check'), ' 答對了！'),
        g.notes.map((n) => h('div', { class: 'feedback-body' }, n)),
        h('div', { class: 'feedback-body muted' }, '建議打開「看解答」，比較標準寫法和其他解法。')));
      if (actual.ok) output.append(resultView(actual, { title: '你的結果' }));
      toast('答對了！進度已儲存');
      onSolved && onSolved();
      return;
    }

    if (g.code === 'error') {
      output.append(errorView(g.message));
      return;
    }
    output.append(h('div', { class: 'feedback feedback-fail', role: 'alert' },
      h('div', { class: 'feedback-title' }, '還不對，再試試看'),
      h('div', { class: 'feedback-body' }, g.message),
      g.detail?.expectedColumns && h('div', { class: 'feedback-body' },
        '預期的欄位依序是：', h('code', {}, g.detail.expectedColumns.join(', '))),
      g.detail?.actual && h('div', { class: 'feedback-body' },
        '例如這一列不在預期結果中：', h('code', {}, JSON.stringify(g.detail.actual)))));
    const cols = h('div', { class: 'compare' });
    if (actual.ok && actual.last) cols.append(resultView(actual, { title: '你的結果', maxRows: 10 }));
    if (expected.ok && expected.last) cols.append(dataTable(expected.last, { title: '預期結果', meta: `${expected.last.values.length} 列（顯示前 10 列）`, maxRows: 10 }));
    output.append(cols);
  }

  function showHint() {
    const hints = ex.hints || [];
    if (!hints.length) { toast('這題沒有提示，試試看「看解答」', 'info'); return; }
    if (hintShown >= hints.length) return;
    hintBox.append(h('div', { class: 'hint' }, h('strong', {}, `提示 ${hintShown + 1}`), ' ', hints[hintShown]));
    hintShown += 1;
    hintBtn.querySelector('span:last-child').textContent = hintShown >= hints.length ? '沒有更多提示' : `提示（${hintShown}/${hints.length}）`;
    if (hintShown >= hints.length) hintBtn.disabled = true;
  }

  function reveal() {
    if (solutionBox.hidden) {
      buildSolution();
      solutionBox.hidden = false;
      revealBtn.querySelector('span:last-child').textContent = '收起解答';
      if (app.progress.ex(ex.id)?.status !== 'solved') app.progress.markRevealed(ex.id);
      paintStatus();
    } else {
      solutionBox.hidden = true;
      revealBtn.querySelector('span:last-child').textContent = '看解答';
    }
  }

  function buildSolution() {
    clear(solutionBox);
    solutionBox.append(
      h('h4', {}, '標準答案'),
      h('pre', { class: 'code', 'data-lang': 'sql' }, ex.answer),
      h('div', { class: 'solution-actions' },
        h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => editor.setValue(ex.answer) }, '把答案放進編輯器')),
      h('h4', {}, '解說'),
      h('div', { class: 'prose', html: renderMarkdown(ex.explanation) }));
    if (ex.alternatives?.length) {
      solutionBox.append(h('h4', {}, '其他寫法'));
      ex.alternatives.forEach((a) => solutionBox.append(
        h('pre', { class: 'code', 'data-lang': 'sql' }, a.sql),
        a.note && h('p', { class: 'alt-note' }, a.note)));
    }
    if (ex.mistakes?.length) {
      solutionBox.append(h('h4', {}, '常見錯誤'), h('ul', { class: 'mistakes' }, ex.mistakes.map((m) => h('li', {}, m))));
    }
    highlightBlocks(solutionBox);
  }

  return { el: card, refresh: () => editor.refresh() };
}
