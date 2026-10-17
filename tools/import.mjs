// 嵐のシリーズの文言を、となりのリポジトリ（../storm-*）から取りこむ。
// ストアの説明文（store/metadata/）と、アプリの文言（src/i18n/）の一部を tools/data/<アプリ>.json に書く。
// ストアの文言を直したら、`npm run import` → `npm run build` で、紹介ページに映す。
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { APPS, LOCALES } from './config.mjs'

const root = new URL('..', import.meta.url).pathname
const work = join(root, '..')

/** アプリの言語 → App Store の説明文のフォルダ。App Store に欄のない言語は Google Play の形（store/metadata/play/） */
const IOS = { en: 'en-US', de: 'de-DE', es: 'es-MX', fr: 'fr-FR', pt: 'pt-BR' }
const PLAY = ['fil', 'sr']

const read = (path) => readFileSync(path, 'utf8').trim()

/** i18n の ts から、start の後で最初に出てくる key: '…' の文字を取る */
function pick(source, key, start = '') {
  const from = start ? source.indexOf(start) : 0
  if (from < 0) throw new Error(`${start} がない`)
  const match = source.slice(from).match(new RegExp(`\\b${key}: (['"\`])((?:\\\\.|(?!\\1).)*)\\1`))
  if (!match) throw new Error(`${key} がない`)
  // フランス語は、感嘆符の前の狭い空白を変数（nb）で書いている
  return match[2].replace(/\\(.)/g, '$1').replaceAll('${nb}', '\u202f')
}

for (const app of APPS.filter((a) => a.storm)) {
  const repo = join(work, app.id)
  if (!existsSync(repo)) throw new Error(`${repo} がない`)
  const out = {}
  for (const locale of LOCALES) {
    const source = read(join(repo, 'src/i18n', `${locale}.ts`))
    const play = PLAY.includes(locale)
    const dir = play ? join(repo, 'store/metadata/play', locale) : join(repo, 'store/metadata/ios', IOS[locale] ?? locale)
    out[locale] = {
      name: pick(source, 'name', 'app: {'),
      tagline: pick(source, 'tagline', 'app: {'),
      description: read(join(dir, play ? 'full_description.txt' : 'description.txt')),
      removeAds: pick(source, 'name', 'removeAds: {'),
      support: pick(source, 'name', 'support: {'),
    }
  }
  writeFileSync(join(root, 'tools/data', `${app.id}.json`), JSON.stringify(out, null, 2) + '\n')
  console.log(`${app.id}: ${LOCALES.length} 言語`)
}

// ---------- Vollog ----------
/** 語と語の間に空白を入れない言語。区分の名前のすぐ後ろで切ってよい */
const UNSPACED = ['ja', 'zh-Hans', 'zh-Hant']

function strip(item, group, locale) {
  // トルコ語は「Servis Adedi」の「Adedi」が「〜の数」の形で、前の語なしでは使えない
  if (locale === 'tr') return item
  if (!item.toLowerCase().startsWith(group.toLowerCase())) return item
  const after = item.slice(group.length)
  // 空白のある言語は、語の切れ目でだけ外す（「Angriffe」を「Angriff」+「e」にしない）
  if (!UNSPACED.includes(locale) && !/^\s/.test(after)) return item
  const rest = after.trim()
  return rest ? rest[0].toLocaleUpperCase() + rest.slice(1) : item
}

// 名前・サブタイトル・説明文はストアの文言（../ストア素材/04_文言/。ここが正）、
// 成績の項目名とプランの表はアプリの文言（../volleyball-app/src/i18n/）から取る。
// セルビア語は App Store に欄がないので、Google Play の文言（supply/）を使う
{
  const app = APPS.find((a) => a.id === 'vollog')
  const words = join(work, 'ストア素材/04_文言')
  const source = join(work, 'volleyball-app/src/i18n')
  const out = {}
  for (const locale of app.locales) {
    const play = locale === 'sr'
    const dir = play ? join(words, 'supply/metadata/android/sr') : join(words, 'fastlane/metadata', IOS[locale] ?? locale)
    const t = (await import(join(source, `${locale}.ts`))).default
    const f = t.upgrade.features
    const m = t.match
    out[locale] = {
      name: read(join(dir, play ? 'title.txt' : 'name.txt')),
      subtitle: read(join(dir, play ? 'short_description.txt' : 'subtitle.txt')),
      // 説明文の2つめと3つめの段落（1つめはアプリの名前）
      lead: read(join(dir, play ? 'full_description.txt' : 'description.txt')).split(/\n\s*\n/).slice(1, 3),
      // 成績の画面の短い名前（「Att」「Gr.」など）は略語なので、略さない名前を使う。
      // 頭に区分の名前が付いていれば外す（「サーブ打数」→「打数」、「Serve Attempts」→「Attempts」）
      stats: [
        [m.serve, [m.serveTotal, m.servePoint, m.serveMiss]],
        [m.attack, [m.attackTotal, m.attackPoint, m.attackMiss]],
        [m.block, [m.blockPoint]],
        [m.reception, [m.receptionTotal, m.receptionSuccess, m.receptionError]],
      ].map(([group, items]) => [group, items.map((item) => strip(item, group, locale))]),
      // 入力の2つの形と、テーマの名前（紹介ページのカードに入れる）。「ブルー（デフォルト）」の括弧は外す
      realtime: m.scoreInputModeRealtime,
      summary: m.scoreInputModeSummary,
      themes: ['blue', 'green', 'dark', 'scoreboard'].map((k) => t.settings.themeNames[k].replace(/\s*[（(].*?[)）]\s*$/, '')),
      plan: {
        feature: t.settings.planTable.feature,
        rows: [
          [f.ads, f.adsYes, f.adsNo],
          [f.teams, f.teamsFree, f.teamsPro],
          [f.players, f.playersFree, f.playersPro],
          [f.matchRecord, true, true],
          [f.statsGraph, true, true],
          [f.imagePdf, true, true],
          [f.csv, false, true],
          [f.backup, false, true],
          [f.share, f.shareFree, f.sharePro],
          [f.playerImport, false, true],
        ],
      },
    }
  }
  writeFileSync(join(root, 'tools/data/vollog.json'), JSON.stringify(out, null, 2) + '\n')
  console.log(`vollog: ${app.locales.length} 言語`)
}
