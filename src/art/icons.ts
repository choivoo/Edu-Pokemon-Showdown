import { INK, make, type Pix } from './px'

// 16x16 도트 아이콘. 전부 코드로 찍는다. (이모지 사용 금지)
const Y = '#ffd23f', Yd = '#e09a12', W = '#ffffff', R = '#ee4b4b', Rd = '#b02a35', B = '#4a8fe0', Bd = '#2f5fb0'
const G = '#58cf7c', Gd = '#2e9f55', P = '#b061d8', K = '#aab0bd', Kd = '#6d7382', N = '#8a5a34', Nd = '#5a3a1a', L = '#fff3c8', C = '#7fe0f0', O = '#ff9a3c'

type Draw = (p: Pix) => void
const ICONS: Record<string, Draw> = {
  coin: p => { p.disc(8, 8, 6, Yd).disc(7, 7, 5, Y).rect(7, 5, 2, 6, Yd).rect(5, 4, 2, 1, W).dot(4, 5, W).dot(4, 6, W); p.outline(INK) },
  gem: p => p.rows(1, 2, [
    '...cccccc...',
    '..cWcCCCCb..',
    '.cWcCCCCCCb.',
    'cccCCCCCCCcb',
    '.bbCCCCCCbb.',
    '..bbCCCCbb..',
    '...bbCCbb...',
    '....bbbb....',
  ], { c: '#b8f4ff', W, C: '#46c8f0', b: '#2a8fc0' }).outline(INK),
  star: p => p.rows(1, 1, [
    '.......YY.......'.slice(0, 14),
    '.....YYYYYY...'.slice(0, 14),
    '.....YYYYYY...'.slice(0, 14),
    'YYYYYYYYYYYYYY',
    '.YYYYYYYYYYYY.',
    '..YYYWYYYYYY..',
    '...YYYYYYYY...',
    '...YYYYYYYY...',
    '..YYYYYYYYYY..',
    '..YYYY..YYYY..',
    '.YYY......YYY.',
    '.YY........YY.',
  ], { Y, W, y: Yd }).outline(INK),
  heart: p => p.rows(1, 2, [
    '.RRRR..RRRR.',
    'RRWWRRRRRRRr',
    'RRWRRRRRRRRr',
    'RRRRRRRRRRRr',
    '.RRRRRRRRRr.',
    '..RRRRRRRr..',
    '...RRRRRr...',
    '....RRRr....',
    '.....Rr.....',
  ], { R, W, r: Rd }).outline(INK),
  sword: p => { p.line(4, 12, 12, 4, K).line(5, 12, 12, 5, W).line(3, 11, 4, 12, Yd).line(3, 8, 8, 13, Yd).line(4, 8, 8, 12, Y).line(2, 13, 4, 11, N).dot(2, 13, Nd); p.outline(INK) },
  shield: p => p.rows(2, 1, [
    'BBBBBBBBBBBB',
    'BwBBBwwBBBBb',
    'BwBBBwwBBBBb',
    'BwwwwwwwwwBb',
    'BBBBBwwBBBBb',
    'BBBBBwwBBBBb',
    '.BBBBwwBBBb.',
    '..BBBwwBBb..',
    '...BBBBBBb..',
    '....BBBBb...',
    '.....bb.....',
  ], { B, b: Bd, w: '#cfe6ff' }).outline(INK),
  boots: p => p.rows(1, 2, [
    '..GGGG......',
    '..GGGg......',
    '..GGGg......',
    '..GGGg......',
    '..GGGGggg...',
    '..GGGGGGGg..',
    '.GGGGGGGGGg.',
    '.wwwwwwwwwww',
  ], { G, g: Gd, w: W }).outline(INK),
  target: p => { p.disc(8, 8, 6, P).disc(8, 8, 4, L).disc(8, 8, 3, P).disc(8, 8, 1, W); p.rect(7, 1, 2, 3, W).rect(7, 12, 2, 3, W).rect(1, 7, 3, 2, W).rect(12, 7, 3, 2, W); p.outline(INK) },
  key: p => { p.disc(5, 5, 3, Y).clear(4, 4, 2, 2).line(7, 7, 13, 13, Y).line(8, 7, 13, 12, Yd).rect(11, 12, 2, 2, Y).rect(13, 10, 2, 2, Y); p.outline(INK) },
  book: p => { p.rect(2, 3, 12, 11, B).rect(2, 3, 12, 1, '#7ab4f0').rect(3, 4, 5, 8, L).rect(9, 4, 4, 8, L).rect(8, 4, 1, 8, Bd); for (let i = 0; i < 3; i++) { p.rect(4, 6 + i * 2, 3, 1, K); p.rect(10, 6 + i * 2, 2, 1, K) } p.outline(INK) },
  cart: p => { p.line(1, 3, 3, 3, Kd).line(3, 3, 5, 10, Kd).rect(4, 5, 10, 5, O).rect(4, 5, 10, 1, Y).rect(5, 10, 9, 1, Kd).disc(6, 13, 1, Kd).disc(12, 13, 1, Kd); p.outline(INK) },
  pot: p => { p.oval(8, 7, 7, 3, Kd).rect(2, 7, 12, 5, Kd).oval(8, 7, 6, 2, O).oval(8, 6, 4, 1, Y).rect(3, 8, 10, 4, '#55555c').rect(1, 8, 2, 2, Kd).rect(13, 8, 2, 2, Kd).rect(4, 13, 2, 2, Nd).rect(10, 13, 2, 2, Nd); p.outline(INK) },
  home: p => { p.rows(1, 2, [
    '.....RR.....',
    '....RRRR....',
    '...RRRRRR...',
    '..RRRRRRRR..',
    '.RRRRRRRRRR.',
    'RRRRRRRRRRRR',
    '..LLLLLLLL..',
    '..LLLLLLLL..',
    '..LLNNLLLL..',
    '..LLNNLLLL..',
    '..LLNNLLLL..',
  ], { R, L, N }).outline(INK) },
  sound: p => { p.rows(1, 3, ['...KK.....', '..KKK..W..', 'KKKKK...W.', 'KKKKK.W.W.', 'KKKKK.W.W.', 'KKKKK...W.', '..KKK..W..', '...KK.....'], { K: W, W: C }).outline(INK) },
  mute: p => { p.rows(1, 3, ['...KK.....', '..KKK.....', 'KKKKK.R..R', 'KKKKK..RR.', 'KKKKK..RR.', 'KKKKK.R..R', '..KKK.....', '...KK.....'], { K: Kd, R }).outline(INK) },
  pause: p => { p.rect(3, 2, 4, 12, W).rect(9, 2, 4, 12, W); p.outline(INK) },
  play: p => { for (let i = 0; i < 6; i++) p.rect(4 + i, 2 + i, 1, 12 - i * 2, W); p.rect(4, 2, 1, 12, W); p.outline(INK) },
  x: p => { p.line(3, 3, 12, 12, W).line(4, 3, 12, 11, W).line(12, 3, 3, 12, W).line(11, 3, 3, 11, W); p.outline(INK) },
  check: p => { p.line(2, 8, 6, 12, G).line(2, 7, 6, 11, G).line(6, 12, 13, 3, G).line(6, 11, 13, 2, G); p.outline(INK) },
  lock: p => { p.rect(3, 7, 10, 7, Y).rect(3, 7, 10, 1, '#ffe98a').rect(7, 9, 2, 3, Nd).rect(4, 2, 2, 5, K).rect(10, 2, 2, 5, K).rect(4, 2, 8, 2, K); p.outline(INK) },
  rotate: p => { p.disc(7, 8, 6, W).erase(7, 8, 4); p.clear(8, 1, 7, 7); p.rows(9, 1, ['WWWWWW', '.WWWWW', '..WWWW', '...WWW', '....WW'], { W }); p.outline(INK) },
  next: p => { for (let i = 0; i < 6; i++) p.rect(5 + i, 2 + i, 1, 12 - i * 2, W); p.rect(4, 2, 1, 12, W); p.outline(INK) },
  back: p => { for (let i = 0; i < 6; i++) p.rect(11 - i, 2 + i, 1, 12 - i * 2, W); p.rect(11, 2, 1, 12, W); p.outline(INK) },
  expand: p => { for (const [x, y, sx, sy] of [[2, 2, 1, 1], [13, 2, -1, 1], [2, 13, 1, -1], [13, 13, -1, -1]] as const) { p.rect(x, y, 1 + 4 * (sx > 0 ? 1 : 0) || 1, 1, W); for (let i = 0; i < 5; i++) { p.dot(x + sx * i, y, W); p.dot(x, y + sy * i, W) } } p.outline(INK) },
  clock: p => { p.disc(8, 8, 6, W).disc(8, 8, 5, L).line(8, 8, 8, 4, INK).line(8, 8, 11, 8, INK).dot(8, 8, R); p.outline(INK) },
  phone: p => { p.rect(5, 1, 6, 14, Kd).rect(6, 2, 4, 10, C).rect(7, 13, 2, 1, W); p.outline(INK) },
  flag: p => { p.rect(3, 1, 2, 14, Nd).rect(5, 2, 8, 5, R).rect(5, 2, 8, 1, '#ff8a8a'); p.outline(INK) },
  // ---- 재료 (원작의 색·식감·종류 분류를 따른다) ----
  mushroomRed: p => { p.rect(6, 8, 4, 6, L).rect(6, 8, 1, 6, '#e6d6a0').oval(8, 7, 6, 4, R).rect(2, 7, 12, 1, Rd).dot(5, 5, W).dot(6, 5, W).dot(5, 6, W).rect(9, 4, 2, 2, W).dot(11, 7, W).dot(3, 7, W); p.outline(INK) },
  berryBlue: p => { p.disc(5, 9, 3, B).disc(10, 9, 3, B).disc(8, 5, 3, B).dot(4, 8, W).dot(9, 8, W).dot(7, 4, W).dot(5, 10, Bd).dot(11, 10, Bd).rect(7, 1, 2, 2, G).rect(9, 1, 3, 1, Gd); p.outline(INK) },
  nutYellow: p => { p.oval(8, 9, 5, 5, Y).oval(8, 9, 5, 5, Y).rect(4, 8, 8, 1, Yd).rect(3, 10, 10, 1, Yd).rect(7, 2, 2, 3, G).rect(8, 2, 3, 1, Gd).dot(6, 6, W).dot(5, 7, W); p.outline(INK) },
  fossil: p => { p.oval(8, 9, 6, 5, K).oval(8, 9, 4, 3, Kd).oval(8, 9, 2, 1, K).dot(8, 9, Kd).rect(3, 5, 3, 1, W).dot(4, 6, W).dot(11, 12, Kd); p.outline(INK) },
  rootRed: p => { p.rect(7, 1, 2, 3, G).rect(4, 2, 3, 2, G).rect(9, 2, 3, 2, G).oval(8, 8, 4, 3, R).rect(5, 9, 6, 2, R).rect(6, 11, 4, 2, R).rect(7, 13, 2, 2, Rd).dot(6, 7, W).dot(6, 8, '#ff9a9a'); p.outline(INK) },
  rockBlue: p => p.rows(1, 2, [
    '....cc......',
    '...cCCc.....',
    '..cCCCCb.cc.',
    '..cCCCCbcCCb',
    '.cCCCCCCbCCb',
    'cCCCCCCCCCCb',
    'cCCCCCCCCCbb',
    '.bbCCCCCCbb.',
    '..bbbbbbbb..',
  ], { c: '#d2f6ff', C: '#6ec8ee', b: '#3a8cc0' }).outline(INK),
  honey: p => { p.rect(4, 6, 8, 8, '#e8a317').rect(4, 6, 8, 1, '#ffd23f').rect(3, 4, 10, 3, N).rect(3, 4, 10, 1, '#b07a44').rect(5, 8, 1, 4, '#ffe98a').rect(9, 12, 2, 2, Yd).dot(10, 14, Yd); p.outline(INK) },
  mushroomGray: p => { p.rect(6, 8, 4, 6, L).oval(8, 7, 6, 4, K).rect(2, 7, 12, 1, Kd).dot(5, 5, W).dot(6, 5, W).rect(9, 4, 2, 2, W).dot(11, 7, W); p.outline(INK) },
  rainbow: p => { const cols = [R, O, Y, G, B, P]; cols.forEach((c, i) => { p.rect(2 + i * 2, 4 + Math.abs(2 - Math.abs(i - 2.5)) * 0, 2, 9 - 0, c) }); p.rect(2, 3, 12, 1, '#ffffff66'); p.disc(8, 8, 1, W); p.outline(INK) },
  shell: p => p.rows(1, 2, [
    '....pppppp....'.slice(0, 12),
    '..pPPPPPPPp...'.slice(0, 12),
    '.pPwPPwPPwPp',
    'pPwPPwPPwPPp',
    'pPPPPPPPPPPp',
    '.pPPPwPPPPp.',
    '..pPPPPPPp..',
    '...ppssspp..'.slice(0, 12),
    '....ssss....',
  ], { p: '#d27ab0', P: '#ffb8dc', w: W, s: L }).outline(INK),
  // ---- 지역/기타 ----
  areaBeach: p => { for (let i = 0; i < 11; i++) p.rect(7 + Math.round(Math.sin(i / 4)), 14 - i, 2, 1, i % 3 ? N : '#a0703c'); for (const [dx, dy] of [[-5, 1], [5, 1], [-3, -3], [3, -3], [0, -4]]) { p.line(8, 4, 8 + dx, 4 + dy, G); p.line(8, 5, 8 + dx, 5 + dy, Gd) } p.rect(2, 14, 12, 1, '#f0dc9c'); p.outline(INK) },
  areaForest: p => { p.rect(7, 10, 2, 5, N).rect(3, 3, 10, 8, Gd).rect(3, 3, 10, 2, G).rect(5, 0, 6, 4, G).dot(5, 6, '#a6ec7c').dot(10, 7, '#a6ec7c'); p.outline(INK) },
  areaCave: p => { p.rect(2, 12, 12, 3, Kd); for (const [x, h, w] of [[4, 8, 3], [8, 12, 4], [12, 7, 3]] as const) { p.rect(x - 1, 13 - h, w, h, '#9a8cff').rect(x - 1, 13 - h, 1, h, '#e8e0ff') } p.outline(INK) },
  areaGorge: p => { p.rect(1, 6, 7, 9, '#c9b98e').rect(1, 6, 7, 2, '#e6d6a8').rect(8, 2, 7, 13, '#a89868').rect(8, 2, 7, 2, '#c9b98e').rect(3, 10, 2, 1, '#8a7a58').rect(10, 8, 3, 1, '#8a7a58'); p.outline(INK) },
  areaVolcano: p => { for (let y = 0; y < 11; y++) p.rect(8 - 2 - y / 1.4, 4 + y, 4 + y * 1.4, 1, y % 3 ? '#8a3a2a' : '#6a2a22'); p.rect(6, 2, 4, 3, O).rect(7, 0, 2, 3, Y).rect(5, 5, 2, 2, R); p.outline(INK) },
  areaAltar: p => { p.rect(3, 10, 10, 4, '#7a6fb8').rect(5, 6, 6, 5, '#a99cf0').rect(7, 2, 2, 5, '#c8b8ff').dot(8, 1, W).dot(7, 2, W).dot(9, 2, W).dot(8, 3, W).dot(4, 4, '#fff6a8').dot(12, 5, '#fff6a8'); p.outline(INK) },
  crown: p => p.rows(1, 3, [
    '.Y...YY...Y.',
    '.YY..YY..YY.',
    '.YYY.YY.YYY.',
    '.YYYYYYYYYY.',
    '.YYYYRYYYYY.',
    '.YYYYYYYYYY.',
    '.yyyyyyyyyy.',
  ], { Y, y: Yd, R }).outline(INK),
  up: p => { p.rows(2, 1, ['....GG....', '...GGGG...', '..GGGGGG..', '.GGGGGGGG.', '...GGGG...', '...GGGG...', '...GGGG...', '...GGGG...'], { G }); p.outline(INK) },
  warn: p => { p.rows(1, 1, ['.....YY.....', '....YYYY....', '...YYIIYY...', '...YYIIYY...', '..YYYIIYYY..', '..YYYIIYYY..', '.YYYYYYYYYY.', '.YYYYIIYYYY.', 'YYYYYYYYYYYY'], { Y, I: INK }); p.outline(INK) },
  download: p => { p.rect(7, 1, 2, 7, W).rows(4, 7, ['WWWWWWWW', '.WWWWWW.', '..WWWW..', '...WW...'], { W }); p.rect(2, 12, 12, 2, W); p.outline(INK) },
  upload: p => { p.rect(7, 6, 2, 7, W).rows(4, 2, ['...WW...', '..WWWW..', '.WWWWWW.', 'WWWWWWWW'], { W }); p.rect(2, 13, 12, 2, W); p.outline(INK) },
  sparkle: p => { p.rect(7, 1, 2, 14, Y).rect(1, 7, 14, 2, Y).rect(5, 5, 6, 6, '#fff3a0').rect(6, 6, 4, 4, W).dot(3, 3, Y).dot(12, 3, Y).dot(3, 12, Y).dot(12, 12, Y); p.outline(INK) },
}

const cache = new Map<string, HTMLCanvasElement>()
const urls = new Map<string, string>()

export const ICON_NAMES = Object.keys(ICONS)

export function iconCanvas(name: string): HTMLCanvasElement {
  let c = cache.get(name)
  if (!c) {
    const draw = ICONS[name]
    if (!draw) throw new Error(`unknown icon: ${name}`)
    c = make(16, 16, draw)
    cache.set(name, c)
  }
  return c
}
export function iconUrl(name: string): string {
  let u = urls.get(name)
  if (!u) { u = iconCanvas(name).toDataURL(); urls.set(name, u) }
  return u
}
