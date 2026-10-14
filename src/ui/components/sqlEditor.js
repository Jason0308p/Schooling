/**
 * SQL 編輯器元件：包裝 CodeMirror 5（語法上色、括號配對、自動補全資料表 / 欄位名稱）。
 * 快捷鍵：Ctrl/Cmd+Enter 執行、Ctrl/Cmd+Shift+Enter 送出、Ctrl+Space 補全。
 */
let lastFocused = null;
export const getLastFocusedEditor = () => lastFocused;

export function createSqlEditor(host, { value = '', tables = {}, onRun, onSubmit, onChange, minLines = 6, placeholder = '在這裡輸入 SQL…' } = {}) {
  const CM = window.CodeMirror;
  const keys = {
    'Ctrl-Enter': () => onRun && onRun(),
    'Cmd-Enter': () => onRun && onRun(),
    'Shift-Ctrl-Enter': () => onSubmit && onSubmit(),
    'Shift-Cmd-Enter': () => onSubmit && onSubmit(),
    'Ctrl-Space': 'autocomplete',
    Tab: (cm) => (cm.somethingSelected() ? cm.indentSelection('add') : cm.replaceSelection('  ')),
  };
  const cm = CM(host, {
    value,
    mode: 'text/x-sqlite',
    theme: 'course',
    lineNumbers: true,
    indentUnit: 2,
    tabSize: 2,
    lineWrapping: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    placeholder,
    extraKeys: keys,
    hintOptions: { tables, completeSingle: false },
    viewportMargin: Infinity,
  });
  host.querySelector('.CodeMirror').style.minHeight = `${minLines * 1.6 + 1}em`;

  // 打字時自動跳出補全（英文字母開頭、長度 ≥ 2）
  cm.on('inputRead', (inst, change) => {
    if (change.origin !== '+input') return;
    const tok = inst.getTokenAt(inst.getCursor());
    if (/^[A-Za-z_][\w.]*$/.test(tok.string) && tok.string.length >= 2) inst.showHint({ completeSingle: false });
  });
  cm.on('focus', () => { lastFocused = api; });
  if (onChange) cm.on('change', () => onChange(cm.getValue()));

  const api = {
    cm,
    getValue: () => cm.getValue(),
    setValue: (v) => { cm.setValue(v); cm.focus(); cm.setCursor(cm.lineCount(), 0); },
    insert: (text) => { cm.replaceSelection(text); cm.focus(); },
    focus: () => cm.focus(),
    refresh: () => cm.refresh(),
  };
  return api;
}

/** 唯讀的 SQL 語法上色（課文中的程式碼區塊） */
export function highlightBlocks(root) {
  const CM = window.CodeMirror;
  root.querySelectorAll('pre.code[data-lang="sql"]').forEach((pre) => {
    if (pre.dataset.hl) return;
    const text = pre.textContent;
    pre.textContent = '';
    CM.runMode(text, 'text/x-sqlite', pre);
    pre.classList.add('cm-s-course');
    pre.dataset.hl = '1';
  });
}

/** 把資料集欄位資訊轉成 CodeMirror sql-hint 需要的格式 */
export function hintTables(dataset) {
  return Object.fromEntries(dataset.tables.map((t) => [t.name, t.columns.map((c) => c[0])]));
}
