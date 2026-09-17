const $ = (selector) => document.querySelector(selector);

let toastTimer;
function showToast(message, isError = false) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.style.background = isError ? '#b42318' : '#172033';
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
}

async function copyText(id) {
  const field = document.getElementById(id);
  if (!field || !field.value) {
    showToast('没有可复制的内容', true);
    return;
  }

  try {
    await navigator.clipboard.writeText(field.value);
  } catch {
    field.select();
    document.execCommand('copy');
    field.setSelectionRange(0, 0);
  }
  showToast('复制成功');
}

function clearFields(ids) {
  ids.split(',').forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = '';
  });
  showToast('已清空');
}

function quoteSqlValue(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

const featurePanels = {
  repeat: 'repeat-panel',
  params: 'params-panel',
  json: 'json-panel',
  timestamp: 'timestamp-panel',
  sql: 'sql-panel'
};

function activatePanel(panelId, updateHash = true) {
  const tab = document.querySelector(`.tool-tab[data-target="${panelId}"]`);
  if (!tab) return;

  document.querySelectorAll('.tool-tab').forEach((item) => {
    const selected = item === tab;
    item.classList.toggle('is-active', selected);
    item.setAttribute('aria-selected', String(selected));
  });
  document.querySelectorAll('.tool-panel').forEach((panel) => {
    const selected = panel.id === panelId;
    panel.hidden = !selected;
    panel.classList.toggle('is-active', selected);
  });

  if (updateHash) {
    const feature = Object.keys(featurePanels).find((key) => featurePanels[key] === panelId);
    if (feature) history.replaceState(null, '', `#${feature}`);
  }
}

document.querySelectorAll('.tool-tab').forEach((tab) => {
  tab.addEventListener('click', () => activatePanel(tab.dataset.target));
});

function activateFeatureFromHash() {
  const feature = location.hash.slice(1);
  activatePanel(featurePanels[feature] || featurePanels.repeat, false);
}

window.addEventListener('hashchange', activateFeatureFromHash);
activateFeatureFromHash();

document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', () => copyText(button.dataset.copy));
});

document.querySelectorAll('[data-clear]').forEach((button) => {
  button.addEventListener('click', () => clearFields(button.dataset.clear));
});

$('#repeat-action').addEventListener('click', () => {
  const lines = $('#repeat-input').value.split(/\r?\n/);
  $('#repeat-output').value = [...new Set(lines)].join('\n');
  showToast('去重完成');
});

$('#params-action').addEventListener('click', () => {
  const values = $('#params-input').value.split(/\r?\n/).filter((value) => value.trim() !== '');
  const type = $('#params-type').value;
  $('#params-output').value = values
    .map((value) => type === 'string' ? quoteSqlValue(value) : value.trim())
    .join(',');
  showToast('格式化完成');
});

$('#json-action').addEventListener('click', () => {
  const field = $('#json-input');
  try {
    field.value = JSON.stringify(JSON.parse(field.value), null, 2);
    showToast('JSON 格式化完成');
  } catch {
    showToast('格式化失败，请检查 JSON 格式', true);
  }
});

$('#timestamp-to-date').addEventListener('click', () => {
  const raw = $('#timestamp-input').value.trim();
  const milliseconds = raw.length === 10 ? Number(raw) * 1000 : Number(raw);
  const date = new Date(milliseconds);
  if (!raw || Number.isNaN(milliseconds) || Number.isNaN(date.getTime())) {
    showToast('请输入有效的时间戳', true);
    return;
  }
  $('#date-output').textContent = formatDate(date);
});

$('#date-to-timestamp').addEventListener('click', () => {
  const date = new Date($('#date-input').value.trim().replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) {
    showToast('请输入有效的日期', true);
    return;
  }
  $('#timestamp-output').textContent = String(date.getTime());
});

$('#sql-action').addEventListener('click', () => {
  const sql = $('#sql-input').value;
  const params = $('#sql-params').value.split(/\s*,\s*/);
  let index = 0;
  const result = sql.replace(/\?/g, () => index < params.length ? quoteSqlValue(params[index++]) : '?');
  $('#sql-output').value = result;
  showToast(index < (sql.match(/\?/g) || []).length ? '部分占位符未找到入参' : '条件注入完成', index < (sql.match(/\?/g) || []).length);
});

function formatDate(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
