// トップページと、アプリの紹介ページ（嵐のシリーズと Vollog）を、言語ごとに作る。`npm run build`
// 日本語はサイトの頭（/index.html・/apps/<アプリ>/index.html）、ほかの言語は /<言語>/ の下に書く。
// 文言は tools/text/<言語>.json（サイトの文）と tools/data/<アプリ>.json（ストアの説明文。npm run import で取りこむ）。
// 出来上がったページは手で直さない（次の build で消える）
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { APPS, FALLBACK, LOCALES } from './config.mjs'

const root = new URL('..', import.meta.url).pathname
const json = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'))
const TEXT = Object.fromEntries(LOCALES.map((l) => [l, json(`tools/text/${l}.json`)]))
const STORE = Object.fromEntries(APPS.filter((a) => a.storm).map((a) => [a.id, json(`tools/data/${a.id}.json`)]))
const VOLLOG_APP = APPS.find((a) => a.id === 'vollog')
const VOLLOG = json('tools/data/vollog.json')
const LICENSE = readFileSync(join(root, 'tools/lucide-license.html'), 'utf8').trimEnd()
const SITE = 'https://asakusasemao.com'
/** 言語を選んだ覚え。日本語のページで、ブラウザの言語より先に見る */
const KEY = 'site-lang'

// ---------- 文字 ----------

const escape = (s) =>
  String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
/** {name} のような所を埋める。値は escape する */
const fill = (template, values = {}) => escape(template).replace(/\{(\w+)\}/g, (_, k) => escape(values[k] ?? `{${k}}`))
/** 文言の中で <br> だけは使える（トップの見出し） */
const withBreaks = (s) => escape(s).replaceAll('&lt;br&gt;', '<br>')

/** その言語のページの道筋。path は 'apps/storm-volley/' のように、頭の / を付けない */
const href = (locale, path = '') => (locale === 'ja' ? `/${path}` : `/${locale}/${path}`)

// ---------- 絵記号（Lucide。ライセンスは tools/lucide-license.html をページの下に入れる） ----------

const ICONS = {
  pointer:
    '<path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"/><path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  school:
    '<path d="M14 22v-4a2 2 0 1 0-4 0v4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M18 5v17"/><path d="m4 6 8-4 8 4"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/>',
  ship: '<path d="M12 10.189V14"/><path d="M12 2v3"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-8.188-3.639a2 2 0 0 0-1.624 0L3 14a11.6 11.6 0 0 0 2.81 7.76"/><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  shirt:
    '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  share:
    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
  sliders:
    '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  clipboard:
    '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  chart: '<line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/>',
  export: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/>',
  swap: '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
  palette:
    '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
}
const icon = (name) => `<!-- Lucide: ${name} --><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`

const APPLE =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>'
const PLAY =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3.18 23.76a2 2 0 0 0 2.07-.22l11.4-6.58-2.53-2.53L3.18 23.76zM.5 1.26C.19 1.67 0 2.28 0 3.07v17.87c0 .79.19 1.4.51 1.8l.09.09 10.01-10.01v-.24L.59 1.17.5 1.26zM20.93 10.37l-2.9-1.67-2.83 2.83 2.83 2.83 2.91-1.68c.83-.48.83-1.26-.01-1.31zM5.25.46l11.4 6.58-2.53 2.53L3.18.22A2 2 0 0 1 5.25.46z"/></svg>'

// ---------- 言語 ----------

/**
 * 言語を決めて、そのページへ移るスクリプト（<head> の頭で、描く前に動かす）。
 * ?lang=ko のように言語が付いていれば、その言語へ（アプリの「ほかのアプリ」から開いたとき）。
 * 日本語のページ（サイトの頭）だけは、付いていなければ、前に選んだ言語 → ブラウザの言語の順に見る。
 * ほかの言語のページでは、付いていないときは動かない（検索エンジンが、どの言語のページも読めるように）。
 * 移らなかったときは、そのページの言語を覚える（最後に見ていた言語）
 * 言語の合わせ方は、アプリ（storm-volley などの src/i18n/index.ts の detectLocale）と同じ。'zh-TW' は 'zh-Hant' に合う
 */
function redirect(locale, path, locales) {
  return `<script>
    (function () {
      var LOCALES = ${JSON.stringify(locales)}, HERE = ${JSON.stringify(locale)}, PATH = ${JSON.stringify(path)};
      function candidates(tag) {
        try {
          var l = new Intl.Locale(tag).maximize();
          return [tag, l.language + '-' + l.script + '-' + l.region, l.language + '-' + l.script, l.language + '-' + l.region, l.language];
        } catch (e) {
          return [tag];
        }
      }
      function match(tags) {
        for (var i = 0; i < tags.length; i++) {
          var c = candidates(tags[i]);
          for (var j = 0; j < c.length; j++) {
            for (var k = 0; k < LOCALES.length; k++) if (LOCALES[k].toLowerCase() === String(c[j]).toLowerCase()) return LOCALES[k];
          }
        }
        return null;
      }
      var want = null, asked = new URLSearchParams(location.search).get('lang');
      if (asked) {
        want = match([asked]) || ${JSON.stringify(FALLBACK)};
        try { localStorage.setItem('${KEY}', want); } catch (e) {}
      } else if (HERE === 'ja') {
        try { want = localStorage.getItem('${KEY}'); } catch (e) {}
        if (LOCALES.indexOf(want) < 0) want = match(navigator.languages || [navigator.language || 'ja']) || ${JSON.stringify(FALLBACK)};
      }
      if (want && want !== HERE) {
        location.replace((want === 'ja' ? '/' : '/' + want + '/') + PATH);
        return;
      }
      // このページの言語を覚える（利用規約などから / へ戻ったとき、最後に見ていた言語に戻すため）。
      // 覚えている言語がこのページにないとき（Vollog のページを開いたマレー語の人）は、上書きしない
      try {
        var saved = localStorage.getItem('${KEY}');
        if (!saved || LOCALES.indexOf(saved) >= 0) localStorage.setItem('${KEY}', HERE);
      } catch (e) {}
    })();
  </script>`
}

/** 言語を選ぶ一覧。押したら、その言語を覚える（日本語のページへ戻ったときに、ブラウザの言語へ移らないように） */
function picker(locale, path, locales = LOCALES) {
  const items = locales.map(
    (l) =>
      `<li><a href="${href(l, path)}" hreflang="${l}" lang="${l}" data-lang="${l}"${l === locale ? ' aria-current="page"' : ''}>${escape(TEXT[l].lang)}</a></li>`,
  ).join('\n          ')
  return `<details class="lang-picker">
      <summary aria-label="${escape(TEXT[locale].site.language)}">${icon('globe')}<span lang="${locale}">${escape(TEXT[locale].lang)}</span></summary>
      <ul>
          ${items}
      </ul>
    </details>`
}

const PICKER_SCRIPT = `<script>
    document.querySelectorAll('.lang-picker a[data-lang]').forEach(function (a) {
      a.addEventListener('click', function () {
        try { localStorage.setItem('${KEY}', a.dataset.lang); } catch (e) {}
      });
    });
  </script>`

// ---------- ページの枠 ----------

function page({ locale, path, title, description, bodyAttr, header, main, footer, license = false, locales = LOCALES }) {
  const alternates = locales.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE}${href(l, path)}" />`)
  alternates.push(`<link rel="alternate" hreflang="x-default" href="${SITE}${href('ja', path)}" />`)
  return `<!DOCTYPE html>
<!-- tools/build.mjs が作ったページ。直すときは tools/ の文言かスクリプトを直して、npm run build -->
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${redirect(locale, path, locales)}
  <title>${escape(title)}</title>
${description ? `  <meta name="description" content="${escape(description)}" />\n` : ''}  <link rel="canonical" href="${SITE}${href(locale, path)}" />
  ${alternates.join('\n  ')}
  <link rel="icon" href="/favicon.ico" sizes="48x48" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="/favicon-192.png" type="image/png" sizes="192x192" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Zen+Maru+Gothic:wght@500;700;900&display=swap" />
  <link rel="stylesheet" href="/assets/css/site.css" />
</head>
<body ${bodyAttr}>

  <header class="site-header">
    <a class="brand" href="${href(locale)}">AsakusaSemao</a>
${header}
  </header>

${main}
${license ? `\n${LICENSE}\n` : ''}
  <footer class="site-footer">
${footer}
  </footer>

  ${PICKER_SCRIPT}
</body>
</html>
`
}

const links = (items) =>
  `    <div class="footer-links">\n${items.map(([label, url]) => `      <a href="${url}">${escape(label)}</a>`).join('\n')}\n    </div>`

// ---------- アプリの状態 ----------

/** 公開しているストア（ios / android）と、準備中のストアを分ける */
function platforms(app) {
  const all = [
    ['iOS', app.ios],
    ['Android', app.android],
  ]
  return { live: all.filter(([, url]) => url).map(([p]) => p), soon: all.filter(([, url]) => !url).map(([p]) => p) }
}

/** トップのカードに出す状態。公開しているものがあれば、それを出す */
function status(app, s) {
  const { live, soon } = platforms(app)
  return live.length
    ? { live: true, text: fill(s.released, { p: live.join(' / ') }) }
    : { live: false, text: fill(s.coming, { p: soon.join(' / ') }) }
}

// ---------- ストアのボタン ----------

/** App Store と Google Play のボタン。公開していなければ「準備中」の形にする */
function storeButtons(app, t) {
  const apple = app.ios
    ? `<a class="store-btn store-btn-apple" href="${app.ios}" target="_blank" rel="noopener noreferrer">
          ${APPLE}
          <span class="store-btn-label">
            <small>Download on the</small>
            App Store
          </span>
        </a>`
    : `<span class="store-btn store-btn-soon">
          ${APPLE}
          <span class="store-btn-label">
            <small>${escape(t.site.soon)}</small>
            App Store
          </span>
        </span>`
  const google = app.android
    ? `<a class="store-btn store-btn-google" href="${app.android}" target="_blank" rel="noopener noreferrer">
          ${PLAY}
          <span class="store-btn-label">
            <small>GET IT ON</small>
            Google Play
          </span>
        </a>`
    : `<span class="store-btn store-btn-soon">
          ${PLAY}
          <span class="store-btn-label">
            <small>${escape(t.site.soon)}</small>
            Google Play
          </span>
        </span>`
  return { apple, google }
}

// ---------- トップページ ----------

function home(locale) {
  const t = TEXT[locale]
  const cards = APPS.map((app) => {
    const storm = app.storm ? STORE[app.id][locale] : null
    // Vollog に合う言語がなければ（マレー語）、英語のページへつなぐ
    const vollogLocale = VOLLOG_APP.locales.includes(locale) ? locale : FALLBACK
    const name = storm ? storm.name : VOLLOG[vollogLocale].name
    const line = storm ? t.apps[app.id].card : t.home.vollogCard
    const tag = app.storm ? `<span class="app-tag game">${escape(t.home.game)}</span>` : `<span class="app-tag">${escape(t.home.tool)}</span>`
    const st = status(app, t.site)
    const url = href(app.storm ? locale : vollogLocale, `apps/${app.id}/`)
    return `      <a class="app-card" data-app="${app.id}" href="${url}">
        <div class="app-card-top">
          <img src="/assets/images/${app.id}-icon.png" alt="${fill(t.site.iconAlt, { name })}" />
        </div>
        <div class="app-card-text">
          ${tag}
          <h2>${escape(name)}</h2>
          <p>${escape(line)}</p>
          <span class="app-status${st.live ? ' live' : ''}">${st.text}</span>
        </div>
        <span class="app-card-arrow" aria-hidden="true">›</span>
      </a>`
  }).join('\n')

  const main = `  <main>
    ${picker(locale, '')}

    <div class="home-hero">
      <!-- 飾り。雷・雲・ボール・星 -->
      <div class="deco" aria-hidden="true">
        <svg class="deco-bolt" viewBox="0 0 24 24"><path d="M14 1 3 13h7L7 23 21 9h-7z"/></svg>
        <svg class="deco-cloud" viewBox="0 0 32 20"><path d="M8 19a6 6 0 0 1-.9-11.93A8.5 8.5 0 0 1 23.4 6.1 6.5 6.5 0 0 1 24.5 19z"/></svg>
        <svg class="deco-ball" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.5"/><path d="M12 1.5c3.5 3 5 6.5 4.6 10.9M3.2 17.7c4.4.9 8.2-.2 11.2-3.3M2.2 9.3c3.2-2.5 6.9-3.3 10.8-2.3" fill="none"/></svg>
        <svg class="deco-star" viewBox="0 0 24 24"><path d="m12 1.5 3.1 6.7 7.4.9-5.4 5.1 1.4 7.3L12 17.9l-6.5 3.6 1.4-7.3L1.5 9.1l7.4-.9z"/></svg>
      </div>
      <h1>${withBreaks(t.home.h1)}</h1>
      <p class="desc">${escape(t.home.desc)}</p>
    </div>

    <div class="apps">
${cards}
    </div>
  </main>`

  const footer = [[t.site.privacy, '/apps/privacy.html'], [t.home.vollogTerms, '/apps/vollog/terms.html']]
  if (locale === 'ja') footer.push([t.site.tokushohoLong, '/apps/tokushoho.html'])
  return page({
    locale,
    path: '',
    title: t.home.title,
    description: t.home.desc,
    bodyAttr: 'class="home"',
    header: '',
    main,
    footer: `${links(footer)}\n    <p>© 2026 AsakusaSemao. All rights reserved.</p>`,
  })
}

// ---------- 紹介ページ ----------

/** ストアの説明文を、頭の文と ■ の節に分ける */
function sections(description) {
  const [intro, ...rest] = description.split(/^■\s*/m)
  return {
    intro: intro.trim().split(/\n\s*\n/).map((p) => p.trim().split('\n')),
    sections: rest.map((s) => {
      const [title, ...lines] = s.split('\n')
      return { title: title.trim(), lines: lines.map((l) => l.trim()).filter(Boolean) }
    }),
  }
}

/** 節の行。「・」「- 」で始まる行は箇条書きにし、「風: 」のような頭は太くする */
function lines(list) {
  const out = []
  let bullets = []
  const flush = () => {
    if (bullets.length) out.push(`<ul>${bullets.join('')}</ul>`)
    bullets = []
  }
  for (const line of list) {
    const bullet = line.match(/^(?:・|- |• )(.*)$/)
    if (!bullet) {
      flush()
      out.push(`<p>${escape(line)}</p>`)
      continue
    }
    const head = bullet[1].match(/^(.{1,24}?)(\s?[:：]\s?)(.+)$/)
    bullets.push(head ? `<li><b>${escape(head[1])}</b>${escape(head[2])}${escape(head[3])}</li>` : `<li>${escape(bullet[1])}</li>`)
  }
  flush()
  return out.join('')
}

function stormPage(app, locale) {
  const t = TEXT[locale]
  const store = STORE[app.id][locale]
  const own = t.apps[app.id]
  const { intro, sections: parts } = sections(store.description)
  const notice = parts.at(-1)
  const features = parts.slice(0, -1).map((s, i) => ({ ...s, icon: app.icons[i] })).filter((s) => s.icon)
  if (features.length !== app.icons.filter(Boolean).length || parts.length !== app.icons.length + 1)
    throw new Error(`${app.id} ${locale}: ストアの説明文の節の数が合わない`)
  const path = `apps/${app.id}/`
  const { live, soon } = platforms(app)

  const badges = [...t.game.badges.map((b) => `<span class="badge accent">${escape(b)}</span>`)]
  for (const p of live) badges.push(`<span class="badge accent">${fill(t.site.releasedShort, { p })}</span>`)
  for (const p of soon) badges.push(`<span class="badge">${fill(t.site.comingShort, { p })}</span>`)

  const { apple, google } = storeButtons(app, t)

  const unique = own.unique
    .map(
      ([title, body], i) => `        <div class="feature-card unique-card">
          <div class="feature-icon unique-number" aria-hidden="true">${i + 1}</div>
          <h3>${escape(title)}</h3>
          <p>${escape(body)}</p>
        </div>`,
    )
    .join('\n')
  const cards = features
    .map(
      (s) => `        <div class="feature-card">
          <div class="feature-icon">
            ${icon(s.icon)}
          </div>
          <h3>${escape(s.title)}</h3>
          ${lines(s.lines)}
        </div>`,
    )
    .join('\n')

  const main = `  <main>
    ${picker(locale, path)}

    <div class="hero">
      <img class="app-icon" src="/assets/images/${app.id}-icon.png" alt="${fill(t.site.iconAlt, { name: store.name })}" />
      <div class="hero-text">
        <h1>
          <span>${escape(store.tagline)}</span>
          ${escape(store.name)}
        </h1>
        ${intro.map((p) => `<p>${p.map(escape).join('<br>')}</p>`).join('\n        ')}
        <div class="badge-row">
          ${badges.join('\n          ')}
        </div>
      </div>
      <div class="store-buttons">
        ${apple}
        ${google}
      </div>
    </div>

    <section>
      <h2>${escape(t.game.unique)}</h2>
      <div class="feature-grid">
${unique}
      </div>
    </section>

    <section>
      <h2>${escape(t.game.features)}</h2>
      <div class="feature-grid">
${cards}
      </div>
    </section>

    <section class="callout">
      <h2>${escape(t.game.ads)}</h2>
      <p class="section-note">${fill(t.game.adsBody, { removeAds: store.removeAds, support: store.support })}<br>${escape(t.game.adsNote)}</p>
    </section>

    <section class="callout">
      <h2>${escape(notice.title)}</h2>
      <p class="section-note">${notice.lines.map(escape).join('<br>')}</p>
    </section>

    <section class="callout">
      <h2>${escape(t.site.contact)}</h2>
      <p class="section-note"><a href="mailto:asakusasemao@gmail.com">asakusasemao@gmail.com</a></p>
    </section>
  </main>`

  const privacy = `/apps/${app.id}/privacy.html`
  const nav = [[t.site.privacy, privacy]]
  if (locale === 'ja') nav.push([t.site.tokushoho, '/apps/tokushoho.html'])
  const footer = [[t.site.home, href(locale)], [t.site.privacy, privacy]]
  if (locale === 'ja') footer.push([t.site.tokushohoLong, '/apps/tokushoho.html'])

  return page({
    locale,
    path,
    title:
      locale === 'en'
        ? `${store.name} - ${store.tagline}`
        : locale === 'ja'
          ? `${store.name}（${app.en}）- ${store.tagline}`
          : `${store.name} (${app.en}) - ${store.tagline}`,
    description: intro.map((p) => p.join(' ')).join(' '),
    bodyAttr: `data-app="${app.id}"`,
    header: `    <nav class="header-links">\n${nav.map(([label, url]) => `      <a href="${url}">${escape(label)}</a>`).join('\n')}\n    </nav>`,
    main,
    footer: `${links(footer)}
    <p>© 2026 AsakusaSemao. All rights reserved.</p>
    <p>${fill(t.site.icons).replace('{lucide}', '<a href="https://lucide.dev/license" target="_blank" rel="noopener" style="color: inherit;">Lucide</a>')}</p>`,
    license: true,
  })
}

// ---------- Vollog の紹介ページ ----------

const VOLLOG_ICONS = ['users', 'clipboard', 'chart', 'export', 'swap', 'palette']

function vollogPage(locale) {
  const t = TEXT[locale]
  const v = t.vollog
  const d = VOLLOG[locale]
  const app = VOLLOG_APP
  const path = 'apps/vollog/'
  const { apple, google } = storeButtons(app, t)
  const values = { realtime: d.realtime, summary: d.summary, themes: d.themes.join(v.listSep), // 文の途中に入れるので、小文字にする（ドイツ語の名詞は大文字のまま）
    reception: locale === 'de' ? d.stats[3][0] : d.stats[3][0].toLocaleLowerCase(locale),
  }

  const cards = v.cards
    .map(
      ([title, body], i) => `        <div class="feature-card">
          <div class="feature-icon">
            ${icon(VOLLOG_ICONS[i])}
          </div>
          <h3>${escape(title)}</h3>
          <p>${fill(body, values)}</p>
        </div>`,
    )
    .join('\n')
  const chips = d.stats
    .map(([group, items]) => `        <div class="stat-chip">${escape(group)} <span>${items.map(escape).join(' / ')}</span></div>`)
    .join('\n')
  const cell = (value) =>
    value === true ? '<span class="check">✓</span>' : value === false ? '<span class="cross">—</span>' : escape(value)
  const rows = d.plan.rows
    .map(([label, free, pro]) => `          <tr>
            <td>${escape(label)}</td>
            <td>${cell(free)}</td>
            <td>${typeof pro === 'string' ? `<span class="check">${escape(pro)}</span>` : cell(pro)}</td>
          </tr>`)
    .join('\n')

  const main = `  <main>
    ${picker(locale, path, app.locales)}

    <div class="hero">
      <img class="app-icon" src="/assets/images/vollog-icon.png" alt="${fill(t.site.iconAlt, { name: 'Vollog' })}" />
      <div class="hero-text">
        <h1>
          <span>${escape(d.subtitle)}</span>
          ${escape(d.name)}
        </h1>
        ${d.lead.map((p) => `<p>${p.split('\n').map(escape).join('<br>')}</p>`).join('\n        ')}
        <div class="badge-row">
          ${v.badges.map((b) => `<span class="badge accent">${escape(b)}</span>`).join('\n          ')}
        </div>
      </div>
      <div class="store-buttons">
        ${apple}
        ${google}
      </div>
    </div>

    <section>
      <h2>${escape(v.features)}</h2>
      <div class="feature-grid">
${cards}
      </div>
    </section>

    <section>
      <h2>${escape(v.stats)}</h2>
      <div class="stats-list">
${chips}
      </div>
      <p class="section-note">${fill(v.statsNote, values)}</p>
    </section>

    <section>
      <h2>${escape(v.plans)}</h2>
      <table class="plan-table">
        <thead>
          <tr>
            <th>${escape(d.plan.feature)}</th>
            <th><span class="plan-label-free">FREE</span></th>
            <th><span class="plan-label-pro">PRO</span></th>
          </tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>
    </section>

    <section class="callout">
      <h2>${escape(t.site.contact)}</h2>
      <p class="section-note"><a href="mailto:asakusasemao@gmail.com">asakusasemao@gmail.com</a></p>
    </section>
  </main>`

  const privacy = '/apps/vollog/privacy.html'
  const terms = '/apps/vollog/terms.html'
  const nav = [[t.site.privacy, privacy], [v.terms, terms]]
  if (locale === 'ja') nav.push([t.site.tokushoho, '/apps/tokushoho.html'])
  const footer = [[t.site.home, href(locale)], [t.site.privacy, privacy], [v.terms, terms]]
  if (locale === 'ja') footer.push([t.site.tokushohoLong, '/apps/tokushoho.html'])

  return page({
    locale,
    path,
    locales: app.locales,
    title: `${d.name} - ${d.subtitle}`,
    description: d.lead.join(' ').replaceAll('\n', ' '),
    bodyAttr: 'data-app="vollog"',
    header: `    <nav class="header-links">\n${nav.map(([label, url]) => `      <a href="${url}">${escape(label)}</a>`).join('\n')}\n    </nav>`,
    main,
    footer: `${links(footer)}
    <p>© 2026 AsakusaSemao. All rights reserved.</p>
    <p>${fill(t.site.icons).replace('{lucide}', '<a href="https://lucide.dev/license" target="_blank" rel="noopener" style="color: inherit;">Lucide</a>')}</p>`,
    license: true,
  })
}

// ---------- 書き出し ----------

function write(path, html) {
  const file = join(root, path)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

for (const locale of LOCALES) {
  const base = locale === 'ja' ? '' : `${locale}/`
  write(`${base}index.html`, home(locale))
  for (const app of APPS.filter((a) => a.storm)) write(`${base}apps/${app.id}/index.html`, stormPage(app, locale))
  if (VOLLOG_APP.locales.includes(locale)) write(`${base}apps/vollog/index.html`, vollogPage(locale))
}
console.log(`${LOCALES.length} 言語（Vollog は ${VOLLOG_APP.locales.length} 言語）`)
