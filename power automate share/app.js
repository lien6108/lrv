const BLOCK_TAGS = new Set([
  'P', 'DIV', 'BR', 'LI', 'TR', 'TABLE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'UL', 'OL', 'BLOCKQUOTE', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'HR',
]);

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE']);

function extractText(root) {
  let text = '';

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (SKIP_TAGS.has(node.tagName)) return;

    node.childNodes.forEach(walk);

    if (BLOCK_TAGS.has(node.tagName)) {
      text += '\n';
    }
  }

  walk(root);

  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function htmlToPlainText(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return extractText(doc.body);
}

// Apptio Cloudability 的異常警示信轉成純文字後，每個欄位長這樣：
// "ACCOUNT NAMEcubaws-comlxboa01-uat\n\nSERVICEAWS Glue\n\n..."
// 標籤跟值中間沒有分隔符，值跟下一個標籤中間隔著一個空行。
function extractAfterMarkerUntilBlankLine(plainText, marker) {
  const afterMarker = plainText.split(marker).pop() ?? '';
  const value = afterMarker.split(/\n\s*\n/)[0] ?? '';
  const trimmed = value.trim();
  return trimmed || null;
}

// 對應使用者提供的正式 Power Automate 公式：
// float(replace(trim(first(split(last(split(body('Html_轉文字'), 'UNUSUAL SPEND')), '('))), '$', ''))
function extractAnomalySpend(plainText) {
  const afterMarker = plainText.split('UNUSUAL SPEND').pop() ?? '';
  const beforeParen = afterMarker.split('(')[0] ?? '';
  const trimmed = beforeParen.trim();
  const noDollarSign = trimmed.split('$').join('');
  const value = parseFloat(noDollarSign);
  return Number.isNaN(value) ? null : value;
}

// "UNUSUAL SPEND$207.00($312.75 total)" 裡括號內的總費用
function extractAnomalyTotalCost(plainText) {
  const afterMarker = plainText.split('UNUSUAL SPEND').pop() ?? '';
  const match = afterMarker.match(/\(\$([\d,]+(?:\.\d+)?)\s*total\)/i);
  if (!match) return null;
  const value = parseFloat(match[1].replace(/,/g, ''));
  return Number.isNaN(value) ? null : value;
}

const DERIVED_LABEL = '公式（依你貼的範例信件推導，尚未經你確認）';
const CONFIRMED_LABEL = '公式（你提供的正式 Power Automate 運算式）';

const COMPOSE_FIELDS = [
  {
    key: 'account',
    title: 'Account',
    subtitle: '帳戶',
    formulaLabel: DERIVED_LABEL,
    formulaCode: `// 找 "ACCOUNT NAME" 後面、下一個空行前的值
const afterMarker = plainText.split('ACCOUNT NAME').pop();
const output = afterMarker.split(/\\n\\s*\\n/)[0].trim();`,
    extract: (plainText) => extractAfterMarkerUntilBlankLine(plainText, 'ACCOUNT NAME'),
  },
  {
    key: 'occurredDate',
    title: '發生日期',
    subtitle: 'Occurred Date',
    formulaLabel: DERIVED_LABEL,
    formulaCode: `// 找 "DATE" 後面、下一個空行前的值
const afterMarker = plainText.split('DATE').pop();
const output = afterMarker.split(/\\n\\s*\\n/)[0].trim();`,
    extract: (plainText) => extractAfterMarkerUntilBlankLine(plainText, 'DATE'),
  },
  {
    key: 'resource',
    title: '資源服務',
    subtitle: 'Resource / Service',
    formulaLabel: DERIVED_LABEL,
    formulaCode: `// 找 "SERVICE" 後面、下一個空行前的值
const afterMarker = plainText.split('SERVICE').pop();
const output = afterMarker.split(/\\n\\s*\\n/)[0].trim();`,
    extract: (plainText) => extractAfterMarkerUntilBlankLine(plainText, 'SERVICE'),
  },
  {
    key: 'totalCost',
    title: '總費用',
    subtitle: 'Total Cost',
    formulaLabel: DERIVED_LABEL,
    formulaCode: `// 從 "UNUSUAL SPEND$207.00($312.75 total)" 這種格式，
// 抓括號裡 "$312.75 total" 的數字部分
const afterMarker = plainText.split('UNUSUAL SPEND').pop();
const match = afterMarker.match(/\\(\\$([\\d,]+(?:\\.\\d+)?)\\s*total\\)/i);
const output = match ? parseFloat(match[1].replace(/,/g, '')) : null;`,
    extract: extractAnomalyTotalCost,
  },
  {
    key: 'anomalyCost',
    title: '非預期花費',
    subtitle: 'Anomaly / Unexpected Cost',
    formulaLabel: CONFIRMED_LABEL,
    formulaCode: `float(
  replace(
    trim(
      first(
        split(
          last(split(body('Html_轉文字'), 'UNUSUAL SPEND')),
          '('
        )
      )
    ),
    '$',
    ''
  )
)`,
    extract: extractAnomalySpend,
  },
];

function buildComposeRow(field) {
  const row = document.createElement('section');
  row.className = 'card compose-row';
  row.dataset.field = field.key;

  row.innerHTML = `
    <div class="card-header">
      <span class="card-icon compose-icon" aria-hidden="true">ƒx</span>
      <div>
        <h2 class="card-title">${field.title}</h2>
        <p class="card-subtitle">${field.subtitle} · Compose</p>
      </div>
    </div>
    <div class="compose-row-body">
      <div class="code-block">
        <p class="code-label">${field.formulaLabel}</p>
        <pre><code>${field.formulaCode}</code></pre>
      </div>
      <div class="flow-arrow" aria-hidden="true">&rarr;</div>
      <pre class="output-text" data-empty="true">（尚未輸入任何內容）</pre>
    </div>
  `;

  return row;
}

const htmlInput = document.getElementById('html-input');
const composeList = document.getElementById('compose-list');

const rows = COMPOSE_FIELDS.map((field) => {
  const row = buildComposeRow(field);
  composeList.appendChild(row);
  return { field, outputEl: row.querySelector('.output-text') };
});

function updateOutputs() {
  const raw = htmlInput.value;

  if (!raw.trim()) {
    rows.forEach(({ outputEl }) => {
      outputEl.textContent = '（尚未輸入任何內容）';
      outputEl.dataset.empty = 'true';
    });
    return;
  }

  const plainText = htmlToPlainText(raw);

  rows.forEach(({ field, outputEl }) => {
    const value = field.extract(plainText);
    outputEl.textContent = value ?? '（找不到，公式可能跟這封信的結構對不上）';
    outputEl.dataset.empty = value === null || value === undefined ? 'true' : 'false';
  });
}

htmlInput.addEventListener('input', updateOutputs);
updateOutputs();
