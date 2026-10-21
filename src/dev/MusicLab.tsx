import { useEffect, useRef, useState } from 'react'
import { ALL_TRACKS, type Song } from '../lib/songs'
import { renderSong } from '../lib/music'
import { bgm } from '../lib/sound'

interface Stat { seconds: number; peak: number; rms: number; clipped: number }

function fft(re: Float32Array, im: Float32Array) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]] }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    const wr = Math.cos(ang), wi = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0
      for (let j = 0; j < len / 2; j++) {
        const ur = re[i + j], ui = im[i + j]
        const vr = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci
        const vi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr
        re[i + j] = ur + vr; im[i + j] = ui + vi
        re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi
        const nr = cr * wr - ci * wi
        ci = cr * wi + ci * wr; cr = nr
      }
    }
  }
}

/** 개발용: #music 주소로 열면 곡을 렌더링해서 파형 통계와 스펙트로그램으로 검수할 수 있다 */
function Row({ song }: { song: Song }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [stat, setStat] = useState<Stat | null>(null)
  useEffect(() => {
    let dead = false
    void renderSong(song).then(data => {
      if (dead) return
      let peak = 0, sum = 0, clipped = 0
      for (const v of data) { const a = Math.abs(v); if (a > peak) peak = a; sum += v * v; if (a >= 0.999) clipped++ }
      setStat({ seconds: data.length / 22050, peak, rms: Math.sqrt(sum / data.length), clipped })
      const c = ref.current!
      const g = c.getContext('2d')!
      const N = 1024, hop = 1024
      const frames = Math.floor((data.length - N) / hop)
      c.width = Math.min(frames, 1400); c.height = 128
      const img = g.createImageData(c.width, c.height)
      const stride = Math.max(1, Math.floor(frames / c.width))
      for (let x = 0; x < c.width; x++) {
        const re = new Float32Array(N), im = new Float32Array(N)
        for (let i = 0; i < N; i++) re[i] = data[x * stride * hop + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N))
        fft(re, im)
        for (let y = 0; y < c.height; y++) {
          // 로그 눈금으로 40Hz ~ 8kHz 표시
          const f = 40 * Math.pow(8000 / 40, 1 - y / c.height)
          const bin = Math.min(N / 2 - 1, Math.round((f / 11025) * (N / 2)))
          const mag = Math.sqrt(re[bin] * re[bin] + im[bin] * im[bin])
          const v = Math.max(0, Math.min(1, (Math.log10(mag + 1e-6) + 3) / 3))
          const o = (y * c.width + x) * 4
          img.data[o] = 255 * Math.min(1, v * 1.6); img.data[o + 1] = 255 * v * v; img.data[o + 2] = 120 * (1 - v) + 40; img.data[o + 3] = 255
        }
      }
      g.putImageData(img, 0, 0)
    })
    return () => { dead = true }
  }, [song])
  return (
    <div className="mb-3 bg-[#1b1b2f] p-2 text-xs text-white">
      <div className="flex items-center gap-3">
        <b className="w-20">{song.name}</b>
        <span>{song.bpm}BPM · {song.bars}마디 · 트랙 {song.tracks.length}</span>
        {stat && <span>길이 {stat.seconds.toFixed(1)}초 · 최대 {stat.peak.toFixed(2)} · RMS {stat.rms.toFixed(3)} · 클리핑 {stat.clipped}</span>}
        <button className="ml-auto border px-2" onClick={() => (song.loop ? bgm.play(song.name as never) : null)}>듣기</button>
      </div>
      <canvas ref={ref} style={{ width: '100%', height: 96, imageRendering: 'pixelated' }} />
    </div>
  )
}

export default function MusicLab() {
  return <div className="h-full overflow-auto bg-[#0b0b1a] p-3">{ALL_TRACKS.map(s => <Row key={s.name} song={s} />)}</div>
}
