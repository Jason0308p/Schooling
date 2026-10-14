/**
 * 課文用的精簡 Markdown 轉 HTML（純函式）。
 * 只支援課程需要的語法，完整清單見 docs/CONTENT_GUIDE.md：
 *   ## / ### / #### 標題、段落、- 清單、1. 清單、表格、**粗體**、*斜體*、`行內程式碼`、[連結](url)
 *   ```sql            → 純展示的程式碼區塊
 *   ```sql run        → 可執行範例（頁面上會出現「執行」按鈕）
 *   > [!TIP] 標題      → 提示框，類型：TIP / WARN / BIZ / DIALECT / NOTE
 */

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(s) {
  let out = esc(s);
  const codes = [];
  out = out.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  out = out
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
      const ext = /^https?:/.test(u);
      return `<a href="${u}"${ext ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
    });
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
}

const CALLOUTS = {
  TIP: { cls: 'tip', label: '小技巧' },
  WARN: { cls: 'warn', label: '常見錯誤' },
  BIZ: { cls: 'biz', label: '實務情境' },
  DIALECT: { cls: 'dialect', label: '方言差異' },
  NOTE: { cls: 'note', label: '補充' },
};

export function renderMarkdown(src) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let i = 0;
  let runIdx = 0;

  const isBlockStart = (l) => /^(#{2,4}\s|```|>|\s*[-*]\s|\s*\d+\.\s|\|)/.test(l);

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    const fence = line.match(/^```(\w*)\s*(run)?\s*$/);
    if (fence) {
      const body = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++]);
      i++;
      const code = body.join('\n');
      if (fence[2] === 'run') {
        html.push(`<div class="runnable" data-run-index="${runIdx++}"><pre class="code" data-lang="sql">${esc(code)}</pre></div>`);
      } else {
        html.push(`<pre class="code" data-lang="${esc(fence[1] || 'text')}">${esc(code)}</pre>`);
      }
      continue;
    }

    const h = line.match(/^(#{2,4})\s+(.*)$/);
    if (h) { html.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }

    if (line.startsWith('>')) {
      const block = [];
      while (i < lines.length && lines[i].startsWith('>')) block.push(lines[i++].replace(/^>\s?/, ''));
      const m = block[0].match(/^\[!(\w+)\]\s*(.*)$/);
      const type = m && CALLOUTS[m[1].toUpperCase()];
      if (type) {
        const title = m[2] || type.label;
        html.push(`<aside class="callout callout-${type.cls}"><div class="callout-label">${esc(type.label)}</div>` +
          (m[2] ? `<div class="callout-title">${inline(title)}</div>` : '') +
          `<div class="callout-body">${renderMarkdown(block.slice(1).join('\n'))}</div></aside>`);
      } else {
        html.push(`<blockquote>${renderMarkdown(block.join('\n'))}</blockquote>`);
      }
      continue;
    }

    if (line.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(rows[0]);
      const bodyRows = rows.slice(2).map(cells);
      html.push('<div class="table-wrap"><table class="md-table"><thead><tr>' +
        head.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
        bodyRows.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table></div>');
      continue;
    }

    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ul || ol) {
      const tag = ul ? 'ul' : 'ol';
      const re = ul ? /^\s*[-*]\s+(.*)$/ : /^\s*\d+\.\s+(.*)$/;
      const items = [];
      while (i < lines.length && re.test(lines[i])) items.push(lines[i++].match(re)[1]);
      html.push(`<${tag}>${items.map((it) => `<li>${inline(it)}</li>`).join('')}</${tag}>`);
      continue;
    }

    const para = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) para.push(lines[i++]);
    if (para.length) html.push(`<p>${inline(para.join(' '))}</p>`);
    else i++;
  }
  return html.join('\n');
}

/** 取出課文裡所有 ```sql run 區塊（驗證工具用來確認範例都能執行） */
export function extractRunnable(src) {
  const out = [];
  const re = /^```sql\s+run\s*\n([\s\S]*?)\n```/gm;
  let m;
  while ((m = re.exec(src))) out.push(m[1]);
  return out;
}

export { esc as escapeHtml };
