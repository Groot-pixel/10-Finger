import { useCallback, useRef } from 'react'
import { useStore } from '../store/useStore'

type SoundKind = 'tick' | 'error' | 'complete' | 'levelup' | 'coin' | 'combo' | 'fail'

let ctx: AudioContext | null = null
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

function beep(freq: number, durationMs: number, type: OscillatorType = 'sine', gain = 0.08, delayMs = 0) {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.value = gain
  osc.connect(g)
  g.connect(c.destination)
  const start = c.currentTime + delayMs / 1000
  osc.start(start)
  g.gain.setValueAtTime(gain, start)
  g.gain.exponentialRampToValueAtTime(0.001, start + durationMs / 1000)
  osc.stop(start + durationMs / 1000 + 0.02)
}

export function useSound() {
  const enabled = useStore((s) => s.soundEnabled)
  const lastTick = useRef(0)

  const play = useCallback((kind: SoundKind) => {
    if (!enabled) return
    const c = getCtx()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    switch (kind) {
      case 'tick': {
        const now = performance.now()
        if (now - lastTick.current < 25) return
        lastTick.current = now
        beep(720, 40, 'square', 0.035)
        break
      }
      case 'error':
        beep(160, 130, 'sawtooth', 0.07)
        break
      case 'combo':
        beep(980, 60, 'triangle', 0.05)
        break
      case 'complete':
        beep(523, 120, 'sine', 0.08)
        beep(659, 120, 'sine', 0.08, 110)
        beep(784, 200, 'sine', 0.09, 220)
        break
      case 'levelup':
        beep(392, 100, 'sine', 0.08)
        beep(523, 100, 'sine', 0.08, 100)
        beep(659, 100, 'sine', 0.08, 200)
        beep(880, 220, 'sine', 0.09, 300)
        break
      case 'coin':
        beep(988, 70, 'square', 0.05)
        beep(1318, 90, 'square', 0.05, 60)
        break
      case 'fail':
        beep(300, 160, 'sawtooth', 0.07)
        beep(220, 220, 'sawtooth', 0.07, 140)
        break
    }
  }, [enabled])

  return play
}
