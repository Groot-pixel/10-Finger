import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Keyboard from './Keyboard'
import FingerGuide from './FingerGuide'
import Icon from './Icon'
import Mascot from './Mascot'
import { useStore } from '../store/useStore'
import { fingerFor } from '../data/keyboard'
import { useSound } from '../hooks/useSound'
import type { LessonResult } from '../types'

type CharStatus = 'pending' | 'correct' | 'incorrect' | 'current'

/** Flowy cheers when you type this many characters in a row without a mistake */
const CHEERS: Record<number, string> = {
  20: '20 richtig in Folge – super!',
  40: '40 ohne Fehler! Du bist im Flow!',
  75: '75 am Stück – unglaublich!',
  120: '120! Deine Finger fliegen!',
}

interface Props {
  text: string
  onFinish: (result: Omit<LessonResult, 'lessonId'>) => void
  onAbort: () => void
}

export default function TypingArea({ text, onFinish, onAbort }: Props) {
  const [index, setIndex] = useState(0)
  const [statuses, setStatuses] = useState<CharStatus[]>(() => Array(text.length).fill('pending'))
  const [combo, setCombo] = useState(0)
  const [shakeKey, setShakeKey] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [precisionHearts, setPrecisionHearts] = useState(5)
  const [confirmExit, setConfirmExit] = useState(false)
  const [cheer, setCheer] = useState<string | null>(null)
  const showHands = useStore((s) => s.showHands)
  const showKeyboard = useStore((s) => s.showKeyboard)
  const showFingerGuide = useStore((s) => s.showFingerGuide)
  const bigText = useStore((s) => s.bigText)

  const startTimeRef = useRef<number | null>(null)
  const mistakeCountRef = useRef(0)
  const maxComboRef = useRef(0)
  const heartsLostRef = useRef(0)
  const mistakesSinceHeartLossRef = useRef(0)
  const errorsByCharRef = useRef<Record<string, number>>({})
  const attemptsByCharRef = useRef<Record<string, number>>({})
  const finishedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const charRefs = useRef<(HTMLSpanElement | null)[]>([])

  const play = useSound()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])

  // Esc asks before leaving the lesson (like Duolingo's "Wait, don't go!")
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      setConfirmExit((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => {
    if (!confirmExit) inputRef.current?.focus()
  }, [confirmExit])

  useEffect(() => {
    if (!cheer) return
    const id = setTimeout(() => setCheer(null), 1800)
    return () => clearTimeout(id)
  }, [cheer])

  const finish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    const durationSec = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0.001
    const minutes = Math.max(durationSec / 60, 1 / 60)
    const correctChars = index - mistakeCountRef.current > 0 ? index - mistakeCountRef.current : 0
    const wpm = Math.round((correctChars / 5) / minutes)
    const accuracy = index > 0 ? Math.round(((index - mistakeCountRef.current) / index) * 1000) / 10 : 100
    onFinish({
      accuracy: Math.max(0, Math.min(100, accuracy)),
      wpm: Math.max(0, wpm),
      charsTyped: index,
      mistakeCount: mistakeCountRef.current,
      maxCombo: maxComboRef.current,
      durationSec,
      errorsByChar: errorsByCharRef.current,
      attemptsByChar: attemptsByCharRef.current,
      heartsLost: heartsLostRef.current,
    })
  }, [index, onFinish])

  const processChar = useCallback((ch: string) => {
    if (finishedRef.current || index >= text.length || confirmExit) return
    if (startTimeRef.current === null) startTimeRef.current = Date.now()
    const target = text[index]
    attemptsByCharRef.current[target] = (attemptsByCharRef.current[target] ?? 0) + 1

    const isCorrect = ch === target
    setStatuses((prev) => {
      const next = [...prev]
      next[index] = isCorrect ? 'correct' : 'incorrect'
      return next
    })

    if (isCorrect) {
      play('tick')
      setCombo((c) => {
        const nc = c + 1
        maxComboRef.current = Math.max(maxComboRef.current, nc)
        if (nc > 0 && nc % 15 === 0) play('combo')
        if (CHEERS[nc]) setCheer(CHEERS[nc])
        return nc
      })
    } else {
      play('error')
      setCombo(0)
      setShakeKey((k) => k + 1)
      mistakeCountRef.current += 1
      errorsByCharRef.current[target] = (errorsByCharRef.current[target] ?? 0) + 1
      mistakesSinceHeartLossRef.current += 1
      if (mistakesSinceHeartLossRef.current >= 4) {
        mistakesSinceHeartLossRef.current = 0
        heartsLostRef.current += 1
        setPrecisionHearts((h) => Math.max(0, h - 1))
      }
    }

    const nextIndex = index + 1
    setIndex(nextIndex)

    const el = charRefs.current[nextIndex]
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })

    if (nextIndex >= text.length) {
      setTimeout(() => { play('complete'); finish() }, 50)
    }
  }, [index, text, play, finish, confirmExit])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    e.target.value = ''
    if (!val) return
    for (const ch of val) processChar(ch)
  }

  const elapsedSec = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0
  const liveWpm = useMemo(() => {
    if (elapsedSec < 1) return 0
    const correct = index - mistakeCountRef.current
    return Math.max(0, Math.round((correct / 5) / (elapsedSec / 60)))
  }, [elapsedSec, index])
  const liveAccuracy = index > 0 ? Math.round(((index - mistakeCountRef.current) / index) * 1000) / 10 : 100

  const nextChar = index < text.length ? text[index] : null
  const activeFinger = nextChar ? fingerFor(nextChar) : null
  const progressPct = Math.round((index / text.length) * 100)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-3">
      <div className="flex w-full items-center gap-3">
        <button onClick={() => (index > 0 ? setConfirmExit(true) : onAbort())} className="rounded-lg p-1.5 opacity-50 transition-opacity hover:opacity-100" aria-label="Abbrechen" title="Lektion verlassen (Esc)">
          <Icon name="close" size={22} />
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--kb-key-bg)' }}>
          <div className="h-full rounded-full transition-all duration-200" style={{ width: `${progressPct}%`, background: '#2fb9a8' }}>
            <div className="mx-2 mt-[3px] h-1 rounded-full bg-white/40" />
          </div>
        </div>
        <div
          className="flex items-center gap-0.5 rounded-full px-2 py-1 text-base"
          style={{ background: 'var(--kb-key-bg)', boxShadow: 'var(--card-shadow)' }}
          title="Präzisions-Bonus: bleibt erhalten, solange du wenig Fehler machst – kostet dich nie das Weiterlernen"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Icon key={i} name="heart" size={20} muted={i >= precisionHearts} />
          ))}
        </div>
      </div>

      <div className="flex w-full items-center justify-center gap-6 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1"><Icon name="bolt" size={18} /> {liveWpm} WPM</span>
        <span className="flex items-center gap-1"><Icon name="target" size={18} /> {liveAccuracy}%</span>
        <span className={`flex items-center gap-1 ${combo >= 10 ? 'text-orange-500' : ''}`}><Icon name={combo > 0 ? 'flame' : 'flameGray'} size={18} /> Combo {combo}</span>
      </div>

      <div
        onClick={() => inputRef.current?.focus()}
        className={`w-full cursor-text rounded-2xl border p-5 leading-relaxed tracking-wide ${bigText ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', fontFamily: 'ui-monospace, Consolas, monospace', maxHeight: bigText ? '13rem' : '9.5rem', overflowY: 'auto' }}
        key={shakeKey}
      >
        <span className="shake-wrap">
          {text.split('').map((c, i) => {
            const status = statuses[i]
            const isCurrent = i === index
            let cls = 'transition-colors duration-100 '
            if (status === 'correct') cls += 'text-emerald-500'
            else if (status === 'incorrect') cls += 'text-rose-500 underline decoration-2 decoration-wavy'
            else cls += ''
            return (
              <span
                key={i}
                ref={(el) => { charRefs.current[i] = el }}
                className={cls}
                style={{
                  color: status === 'pending' ? 'var(--text-muted)' : undefined,
                  opacity: status === 'pending' ? 0.55 : 1,
                  background: isCurrent ? 'var(--kb-key-bg)' : undefined,
                  borderBottom: isCurrent ? '3px solid var(--primary)' : '3px solid transparent',
                  borderRadius: isCurrent ? '3px' : undefined,
                  whiteSpace: c === ' ' ? 'pre' : undefined,
                }}
              >
                {c}
              </span>
            )
          })}
        </span>
      </div>

      <input
        ref={inputRef}
        onChange={handleChange}
        onBlur={() => setTimeout(() => { if (!document.querySelector('[data-exit-dialog]')) inputRef.current?.focus() }, 10)}
        className="absolute h-px w-px opacity-0"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        aria-label="Tipp-Eingabe"
      />

      {showFingerGuide && <FingerGuide active={activeFinger} />}
      {showKeyboard && <Keyboard nextChar={nextChar} hands={showHands} />}

      {/* Flowy cheering for a mistake-free run */}
      {cheer && (
        <div className="pop-in pointer-events-none fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border-2 px-4 py-2 shadow-lg" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
          <Mascot mood="excited" size={52} />
          <span className="font-extrabold">{cheer}</span>
        </div>
      )}

      {confirmExit && (
        <div data-exit-dialog className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setConfirmExit(false)}>
          <div className="pop-in tile flex w-full max-w-sm flex-col items-center gap-3 p-6 text-center" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Lektion verlassen?">
            <Mascot mood="sad" size={96} />
            <div className="text-xl font-black">Warte, geh nicht!</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Wenn du jetzt aufhörst, geht dein Fortschritt in dieser Lektion verloren.
            </p>
            <button
              autoFocus
              onClick={() => setConfirmExit(false)}
              className="btn-3d w-full px-6 py-3 text-white"
              style={{ background: '#2fb9a8', ['--btn-edge' as string]: '#168e83' }}
            >
              Weiter üben
            </button>
            <button onClick={onAbort} className="w-full py-2 text-sm font-extrabold uppercase tracking-wide" style={{ color: '#ff6b6b' }}>
              Lektion beenden
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
