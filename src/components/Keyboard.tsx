import { useRef } from 'react'
import { KEY_ROWS, FINGER_COLOR, fingerFor, isShifted, type KeyDef } from '../data/keyboard'
import { useKeyRects } from '../hooks/useKeyRects'
import HandsOverlay from './HandsOverlay'

interface Props {
  nextChar: string | null
}

function Key({ k, active, dim }: { k: KeyDef; active: boolean; dim: boolean }) {
  const color = FINGER_COLOR[k.finger]
  return (
    <div
      data-key={k.base}
      className="relative flex h-9 w-0 min-w-0 flex-1 select-none flex-col items-center justify-center rounded-md border text-[9px] font-semibold transition-all duration-100 sm:h-12 sm:rounded-lg sm:text-[11px]"
      style={{
        borderColor: active ? color : 'var(--kb-border)',
        background: active ? color : 'var(--kb-key-bg)',
        color: active ? '#0b1220' : 'var(--kb-key-fg)',
        opacity: dim ? 0.45 : 1,
        boxShadow: active ? `0 0 0 3px ${color}55, 0 3px 0 0 ${color}aa` : '0 2px 0 0 var(--kb-key-shadow)',
        transform: active ? 'translateY(1px)' : 'none',
      }}
    >
      {k.shift && <span className="absolute right-0.5 top-0 hidden text-[8px] opacity-60 sm:block">{k.shift}</span>}
      <span className="text-[10px] sm:text-sm">{k.base === ' ' ? '' : k.base === 'ß' ? 'ß' : k.base.toUpperCase()}</span>
    </div>
  )
}

export default function Keyboard({ nextChar }: Props) {
  const activeFinger = nextChar ? fingerFor(nextChar) : null
  const nextIsShift = nextChar ? isShifted(nextChar) : false
  const containerRef = useRef<HTMLDivElement>(null)
  const keyRects = useKeyRects(containerRef)

  return (
    <div className="w-full overflow-hidden rounded-2xl border p-1.5 pb-10 sm:p-3 sm:pb-14" style={{ background: 'var(--kb-panel-bg)', borderColor: 'var(--kb-border)' }}>
      <div ref={containerRef} className="relative flex flex-col gap-1 sm:gap-1.5">
        <HandsOverlay keyRects={keyRects} nextChar={nextChar} />
        {KEY_ROWS.map((row, i) => (
          <div key={i} className="flex gap-0.5 sm:gap-1.5" style={{ paddingLeft: `${i * 2.2}%` }}>
            {row.map((k) => (
              <Key
                key={k.base}
                k={k}
                active={nextChar !== null && (nextChar.toLowerCase() === k.base || nextChar === k.shift)}
                dim={activeFinger !== null && k.finger !== activeFinger && !(nextChar !== null && (nextChar.toLowerCase() === k.base || nextChar === k.shift))}
              />
            ))}
          </div>
        ))}
        <div className="flex gap-0.5 pl-4 sm:gap-1.5 sm:pl-6">
          <div
            data-key=" "
            className="h-9 flex-1 rounded-md border sm:h-12 sm:rounded-lg"
            style={{
              borderColor: nextChar === ' ' ? FINGER_COLOR['L-thumb'] : 'var(--kb-border)',
              background: nextChar === ' ' ? FINGER_COLOR['L-thumb'] : 'var(--kb-key-bg)',
              boxShadow: nextChar === ' ' ? `0 0 0 3px ${FINGER_COLOR['L-thumb']}55` : '0 2px 0 0 var(--kb-key-shadow)',
              opacity: nextChar !== null && nextChar !== ' ' ? 0.45 : 1,
            }}
          />
          <div
            data-key="shift"
            className="flex h-9 items-center justify-center rounded-md border px-2.5 text-[10px] font-bold sm:h-12 sm:rounded-lg sm:px-4 sm:text-[11px]"
            style={{
              borderColor: nextIsShift ? FINGER_COLOR['L-pinky'] : 'var(--kb-border)',
              background: nextIsShift ? FINGER_COLOR['L-pinky'] : 'var(--kb-key-bg)',
              color: nextIsShift ? '#0b1220' : 'var(--kb-key-fg)',
              boxShadow: nextIsShift ? `0 0 0 3px ${FINGER_COLOR['L-pinky']}55` : '0 2px 0 0 var(--kb-key-shadow)',
              opacity: nextChar !== null && !nextIsShift ? 0.45 : 1,
            }}
          >
            ⇧
          </div>
        </div>
      </div>
    </div>
  )
}
