/**
 * MCQ 卡片：選擇題 — 顯示題目 + 四個選項，點選即判斷，記錄進度。
 * 用於非 SQL 課程（PRD、Looker Studio 等）。
 * exercise 格式：{ id, type:'mcq', title, question, options, answer, explanation }
 */
import { h, icon, toast } from '../dom.js';
import { renderMarkdown } from '../../core/markdown.js';

export function mcqCard(app, { courseId, exercise: ex, index, onSolved }) {
  const state = app.progress.ex(ex.id);

  const statusBadge = h('span', { class: 'badge' });
  const paintStatus = () => {
    const s = app.progress.ex(ex.id);
    statusBadge.className = 'badge';
    if (s?.status === 'solved') { statusBadge.classList.add('badge-ok'); statusBadge.textContent = '已完成'; }
    else if (s?.attempts) { statusBadge.classList.add('badge-warn'); statusBadge.textContent = `嘗試 ${s.attempts} 次`; }
    else { statusBadge.textContent = '未作答'; }
    card.classList.toggle('is-solved', s?.status === 'solved');
  };

  const feedback = h('div', { class: 'mcq-feedback', hidden: true });
  const optionEls = [];

  const alreadySolved = state?.status === 'solved';

  const handleSelect = (i) => {
    if (app.progress.ex(ex.id)?.status === 'solved') return; // 已解鎖不重算
    const correct = i === ex.answer;
    app.progress.recordAttempt(ex.id, correct);
    paintStatus();

    // 標記選項顏色
    optionEls.forEach((el, idx) => {
      el.disabled = true;
      if (idx === ex.answer) el.classList.add('mcq-correct');
      else if (idx === i && !correct) el.classList.add('mcq-wrong');
    });

    // 顯示解說
    feedback.hidden = false;
    feedback.className = `mcq-feedback ${correct ? 'feedback-ok' : 'feedback-fail'}`;
    feedback.replaceChildren(
      h('div', { class: 'feedback-title' }, correct ? icon('check') + ' 答對了！' : '✗ 答錯了，看看解說'),
      h('div', { class: 'feedback-body prose', html: renderMarkdown(ex.explanation || '') })
    );

    if (correct) {
      toast('答對了！進度已儲存');
      onSolved && onSolved();
    }
  };

  // 若已解題，直接顯示正確狀態
  const buttons = ex.options.map((opt, i) => {
    const btn = h('button', {
      class: `mcq-option${alreadySolved && i === ex.answer ? ' mcq-correct' : ''}`,
      type: 'button',
      disabled: alreadySolved,
      onclick: () => handleSelect(i),
    }, opt);
    optionEls.push(btn);
    return btn;
  });

  const card = h('section', { class: `exercise card${alreadySolved ? ' is-solved' : ''}`, id: ex.id },
    h('header', { class: 'ex-head' },
      h('span', { class: 'ex-index' }, `練習 ${index + 1}`),
      h('span', { class: 'badge badge-soft' }, '選擇題'),
      statusBadge),
    h('h3', { class: 'ex-title' }, ex.title || ex.question?.split('\n')[0]?.replace(/\*\*/g, '') || ''),
    h('div', { class: 'mcq-question prose', html: renderMarkdown(ex.question || '') }),
    h('div', { class: 'mcq-options' }, ...buttons),
    feedback);

  if (alreadySolved) {
    feedback.hidden = false;
    feedback.className = 'mcq-feedback feedback-ok';
    feedback.replaceChildren(
      h('div', { class: 'feedback-title' }, icon('check') + ' 已完成'),
      h('div', { class: 'feedback-body prose', html: renderMarkdown(ex.explanation || '') })
    );
  }

  paintStatus();
  return { el: card, refresh: () => {} }; // refresh() 是 exerciseCard 的介面，MCQ 不需要
}
