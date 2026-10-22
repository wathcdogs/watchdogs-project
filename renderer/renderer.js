// renderer.js - 渲染进程逻辑

const DEFAULT_SETTINGS = {
  fontSize: 16,
  lineHeight: 1.6,
  letterSpacing: 0,
  paragraphGap: 12,
  bgColor: '#ffffff',
  opacity: 100,
  forceTextColor: 'auto',
};

let settings = loadSettings();
let webview = null;

// ============ 启动 ============
window.addEventListener('DOMContentLoaded', () => {
  webview = document.getElementById('reader');
  bindEvents();
  applySettingsToUI();
  applyReaderSettings();
});

// ============ 事件绑定 ============
function bindEvents() {
  // 窗口控制
  document.getElementById('btn-minimize').onclick = () => window.api.minimize();
  document.getElementById('btn-maximize').onclick = () => window.api.maximize();
  document.getElementById('btn-close').onclick = () => window.api.close();

  // 置顶切换
  document.getElementById('btn-top').onclick = () => {
    const btn = document.getElementById('btn-top');
    const active = btn.classList.toggle('active');
    btn.style.background = active ? 'rgba(30,144,255,0.3)' : 'transparent';
    window.api.setAlwaysOnTop(active);
  };

  // 设置面板
  const btnSettings = document.getElementById('btn-settings');
  const panel = document.getElementById('settings-panel');
  const btnClosePanel = document.getElementById('btn-close-panel');
  btnSettings.onclick = () => panel.classList.toggle('hidden');
  btnClosePanel.onclick = () => panel.classList.add('hidden');

  // 工具栏按钮
  document.getElementById('btn-back').onclick = () => webview.goBack();
  document.getElementById('btn-forward').onclick = () => webview.goForward();
  document.getElementById('btn-reload').onclick = () => webview.reload();
  document.getElementById('btn-home').onclick = () => webview.loadURL('https://fanqienovel.com/');

  const urlInput = document.getElementById('url-input');
  document.getElementById('btn-go').onclick = () => {
    let url = urlInput.value.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    webview.loadURL(url);
  };
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-go').click();
  });

  // webview URL 更新
  webview.addEventListener('did-navigate', (e) => {
    urlInput.value = e.url;
    applyReaderSettings();
  });
  webview.addEventListener('did-finish-load', () => {
    applyReaderSettings();
  });
  // 拦截新窗口
  webview.addEventListener('new-window', (e) => {
    window.api.openExternal(e.url);
  });

  // ============ 设置滑块 ============
  bindSlider('slider-font-size', 'val-font-size', 'fontSize', (v) => v + 'px', () => applyReaderSettings());
  bindSlider('slider-line-height', 'val-line-height', 'lineHeight', (v) => v);
  bindSlider('slider-letter-spacing', 'val-letter-spacing', 'letterSpacing', (v) => v + 'px');
  bindSlider('slider-paragraph-gap', 'val-paragraph-gap', 'paragraphGap', (v) => v + 'px');

  // 透明度（改窗口）
  const sliderOpacity = document.getElementById('slider-opacity');
  const valOpacity = document.getElementById('val-opacity');
  sliderOpacity.value = settings.opacity;
  valOpacity.textContent = settings.opacity;
  sliderOpacity.addEventListener('input', () => {
    settings.opacity = parseInt(sliderOpacity.value);
    valOpacity.textContent = settings.opacity;
    window.api.setOpacity(settings.opacity / 100);
  });

  // 强制文字颜色
  const selTextColor = document.getElementById('force-text-color');
  selTextColor.value = settings.forceTextColor;
  selTextColor.addEventListener('change', () => {
    settings.forceTextColor = selTextColor.value;
    applyReaderSettings();
  });

  // 预设颜色
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      settings.bgColor = sw.dataset.color;
      document.getElementById('color-picker').value = settings.bgColor;
      applyReaderSettings();
    });
    // 高亮当前选中
    if (sw.dataset.color.toLowerCase() === settings.bgColor.toLowerCase()) {
      sw.classList.add('active');
    }
  });

  // 自定义颜色选择
  const colorPicker = document.getElementById('color-picker');
  colorPicker.value = settings.bgColor;
  colorPicker.addEventListener('input', () => {
    settings.bgColor = colorPicker.value;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    applyReaderSettings();
  });

  // 重置 / 保存
  document.getElementById('btn-reset').onclick = () => {
    settings = { ...DEFAULT_SETTINGS };
    applySettingsToUI();
    applyReaderSettings();
    window.api.setOpacity(settings.opacity / 100);
    saveSettings();
  };
  document.getElementById('btn-save').onclick = saveSettings;
}

// ============ 滑块绑定通用 ============
function bindSlider(sliderId, valId, key, formatFn, onApply) {
  const slider = document.getElementById(sliderId);
  const val = document.getElementById(valId);
  slider.value = settings[key];
  val.textContent = formatFn(settings[key]);
  slider.addEventListener('input', () => {
    const v = parseFloat(slider.value);
    settings[key] = v;
    val.textContent = formatFn(v);
    if (onApply) onApply();
    else applyReaderSettings();
  });
}

// ============ 设置 UI ============
function applySettingsToUI() {
  document.getElementById('slider-font-size').value = settings.fontSize;
  document.getElementById('val-font-size').textContent = settings.fontSize;
  document.getElementById('slider-line-height').value = settings.lineHeight;
  document.getElementById('val-line-height').textContent = settings.lineHeight;
  document.getElementById('slider-letter-spacing').value = settings.letterSpacing;
  document.getElementById('val-letter-spacing').textContent = settings.letterSpacing;
  document.getElementById('slider-paragraph-gap').value = settings.paragraphGap;
  document.getElementById('val-paragraph-gap').textContent = settings.paragraphGap;
  document.getElementById('slider-opacity').value = settings.opacity;
  document.getElementById('val-opacity').textContent = settings.opacity;
  document.getElementById('color-picker').value = settings.bgColor;
  document.getElementById('force-text-color').value = settings.forceTextColor;

  document.querySelectorAll('.color-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color.toLowerCase() === settings.bgColor.toLowerCase());
  });

  // 主容器背景
  document.documentElement.style.setProperty('--reader-bg', settings.bgColor);
  window.api.setOpacity(settings.opacity / 100);

  // 深/浅主题
  const isDark = isDarkColor(settings.bgColor);
  document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

// ============ 判断深浅色 ============
function isDarkColor(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0,2),16);
  const g = parseInt(c.substring(2,4),16);
  const b = parseInt(c.substring(4,6),16);
  const brightness = (r*299 + g*587 + b*114) / 1000;
  return brightness < 128;
}

// ============ 生成注入 webview 的 CSS ============
function buildInjectedCSS() {
  const textColor = settings.forceTextColor === 'auto'
    ? (isDarkColor(settings.bgColor) ? '#e0e0e0' : '#2b2b2b')
    : settings.forceTextColor;

  return `
    html, body,
    #app, #root,
    div, section, article, main, header, footer, aside, nav,
    p, span, li, td, th {
      background-color: ${settings.bgColor} !important;
    }

    /* 正文容器 */
    .content, .reader-content, .chapter-content,
    [class*="content"], [class*="reader"], [class*="chapter"],
    article p, .article p, .text-body p, .read-content p {
      background-color: ${settings.bgColor} !important;
    }

    /* 字体 & 行间距 */
    p, span, li, td, th, div, article, section, main {
      font-size: ${settings.fontSize}px !important;
      line-height: ${settings.lineHeight} !important;
      letter-spacing: ${settings.letterSpacing}px !important;
      color: ${textColor} !important;
    }

    /* 段落间距 */
    p {
      margin-bottom: ${settings.paragraphGap}px !important;
    }

    /* 章节标题 */
    h1, h2, h3, h4, h5, h6 {
      background-color: ${settings.bgColor} !important;
      color: ${textColor} !important;
    }

    /* 链接颜色 */
    a, a:link, a:visited {
      color: ${isDarkColor(settings.bgColor) ? '#7eb8ff' : '#1a5fb4'} !important;
    }

    /* 隐藏广告 & 弹窗 */
    [class*="ad"], [class*="Ad"], [class*="AD"],
    [id*="ad"], [id*="Ad"],
    [class*="banner"], [class*="popup"], [class*="mask"],
    [class*="login-mask"], [class*="paywall"], [class*="modal"] {
      display: none !important;
    }

    /* 顶部导航半透明 */
    header, nav, [class*="Header"], [class*="Nav"] {
      background-color: ${settings.bgColor} !important;
    }

    /* 尽量覆盖 */
    * {
      text-shadow: none !important;
      font-family: "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif !important;
    }
  `;
}

// ============ 应用阅读设置到 webview ============
function applyReaderSettings() {
  applySettingsToUI();
  if (!webview) return;

  const css = buildInjectedCSS();
  // 用 insertCSS 注入
  try {
    webview.insertCSS(css).catch(()=>{});
  } catch(e) {}

  // 同时通过 executeJavaScript 覆盖
  try {
    webview.executeJavaScript(`
      (function(){
        let style = document.getElementById('__tomato_reader_style__');
        if (!style) {
          style = document.createElement('style');
          style.id = '__tomato_reader_style__';
          document.head.appendChild(style);
        }
        style.textContent = \`${css.replace(/`/g,'\\`')}\`;
      })();
    `).catch(()=>{});
  } catch(e) {}
}

// ============ 本地存储 ============
function saveSettings() {
  try {
    localStorage.setItem('tomato_reader_settings', JSON.stringify(settings));
  } catch(e) {}
}
function loadSettings() {
  try {
    const raw = localStorage.getItem('tomato_reader_settings');
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch(e) {}
  return { ...DEFAULT_SETTINGS };
}
