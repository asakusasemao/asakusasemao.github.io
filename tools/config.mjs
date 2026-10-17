// サイトの言語とアプリの一覧。tools/import.mjs と tools/build.mjs が読む

/** 言語。並びは言語を選ぶ一覧の順（嵐のシリーズのアプリと同じ）。ja はサイトの頭（/）、ほかは /<言語>/ に置く */
export const LOCALES = [
  'id', 'ms', 'cs', 'de', 'en', 'es', 'fil', 'fr', 'it', 'pl', 'pt', 'sr', 'vi', 'tr', 'ru', 'uk', 'hi', 'th', 'ja', 'zh-Hans', 'zh-Hant', 'ko',
]

/** 合う言語がないときに出す言語 */
export const FALLBACK = 'en'

/**
 * アプリ。並びはトップページのカードの順。
 * storm は嵐のシリーズ（紹介ページを言語ごとに作る）。ios / android は公開していればストアの URL、準備中なら null。
 * icons は、紹介ページの「どんなゲーム」の節ごとの絵記号（ストアの説明文の ■ の順。ご注意は除く）。null の節は出さない
 * （ピックルボールの舞台は「このゲームならでは」に書いたので外す）
 */
export const APPS = [
  {
    id: 'storm-volley',
    storm: true,
    en: 'Storm Volleyball',
    ios: 'https://apps.apple.com/app/storm-volleyball/id6820509743',
    android: null,
    icons: ['pointer', 'zap', 'school', 'shirt', 'share', 'sliders'],
  },
  {
    id: 'storm-badminton',
    storm: true,
    en: 'Storm Badminton',
    ios: null,
    android: null,
    icons: ['pointer', 'zap', 'school', 'shirt', 'share', 'sliders'],
  },
  {
    id: 'storm-tennis',
    storm: true,
    en: 'Storm Tennis',
    ios: null,
    android: null,
    icons: ['pointer', 'zap', 'school', 'book', 'shirt', 'share', 'sliders'],
  },
  {
    id: 'storm-pickleball',
    storm: true,
    en: 'Storm Pickleball',
    ios: null,
    android: null,
    icons: ['pointer', 'zap', null, 'book', 'shirt', 'share', 'sliders'],
  },
  {
    id: 'vollog',
    storm: false,
    ios: 'https://apps.apple.com/app/vollog/id6761419267',
    android: 'https://play.google.com/store/apps/details?id=com.asakusasemao.vollog',
    // Vollog はマレー語に対応していない。マレー語のページからは英語のページへつなぐ
    locales: LOCALES.filter((l) => l !== 'ms'),
  },
]
