// 공용 오디오 환경: 하나의 AudioContext 와 마스터 체인(컴프레서 → 마스터 볼륨)을 만든다. 음원 파일은 쓰지 않는다.
let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = false

export function audio(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AC()
      const comp = ctx.createDynamicsCompressor()
      comp.threshold.value = -14
      comp.knee.value = 12
      comp.ratio.value = 5
      comp.attack.value = 0.004
      comp.release.value = 0.2
      master = ctx.createGain()
      master.gain.value = muted ? 0 : 0.85
      master.connect(comp).connect(ctx.destination)
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** 효과음/음악이 연결될 마스터 입력 (실패하면 null) */
export function masterOut(): AudioNode | null {
  audio()
  return master
}

export function setMuted(m: boolean) {
  muted = m
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.85, ctx.currentTime, 0.02)
}
export const isMuted = () => muted
