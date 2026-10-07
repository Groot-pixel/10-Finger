import { useRef } from 'react'
import { FINGER_COLOR, KEY_ROWS, shiftKeyFor, type KeyDef } from '../data/keyboard'
import { useKeyRects } from '../hooks/useKeyRects'
import HandsOverlay from './HandsOverlay'

/** dark lettering on the light finger colours (yellow, green, cyan …), white on the darker ones */
function textOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.62 ? '#10231a' : '#ffffff'
}

interface Props {
  nextChar: string | null
}

function Key({ k, active }: { k: KeyDef; active: boolean }) {
  const color = FINGER_COLOR[k.finger]
  return (
    <div
      data-key={k.base}
      className="relative flex h-9 w-0 min-w-0 flex-1 select-none flex-col items-center justify-center rounded-md border text-[9px] font-semibold transition-all duration-100 sm:h-12 sm:rounded-lg sm:text-[11px]"
      style={{
        borderColor: active ? color : 'var(--kb-border)',
        background: active ? color : 'var(--kb-key-bg)',
        color: active ? textOn(color) : 'var(--kb-key-fg)',
        boxShadow: active ? 'none' : '0 2px 0 0 var(--kb-key-shadow)',
        transform: active ? 'translateY(1px)' : 'none',
      }}
    >
      {k.shift && <span className="absolute right-0.5 top-0 hidden text-[8px] opacity-60 sm:block">{k.shift}</span>}
      <span className="text-[10px] sm:text-sm">{k.base === ' ' ? '' : k.base === 'ß' ? 'ß' : k.base.toUpperCase()}</span>
    </div>
  )
}

function ShiftKey({ id, active }: { id: 'shiftL' | 'shift'; active: boolean }) {
  // pressed by the pinky of that side
  const color = FINGER_COLOR[id === 'shiftL' ? 'L-pinky' : 'R-pinky']
  return (
    <div
      data-key={id}
      className="flex h-9 w-[13%] items-center justify-center rounded-md border text-[10px] font-bold sm:h-12 sm:rounded-lg sm:text-[11px]"
      style={{
        borderColor: active ? color : 'var(--kb-border)',
        background: active ? color : 'var(--kb-key-bg)',
        color: active ? textOn(color) : 'var(--kb-key-fg)',
        boxShadow: active ? 'none' : '0 2px 0 0 var(--kb-key-shadow)',
      }}
    >
      ⇧
    </div>
  )
}

export default function Keyboard({ nextChar }: Props) {
  const shiftKey = nextChar ? shiftKeyFor(nextChar) : null
  const containerRef = useRef<HTMLDivElement>(null)
  const keyRects = useKeyRects(containerRef)

  return (
    <div className="relative mb-20 w-full rounded-2xl border p-1.5 sm:mb-36 sm:p-3" style={{ background: 'var(--kb-panel-bg)', borderColor: 'var(--kb-border)' }}>
      <div ref={containerRef} className="relative flex flex-col gap-1 sm:gap-1.5">
        <HandsOverlay keyRects={keyRects} nextChar={nextChar} />
        {KEY_ROWS.map((row, i) => (
          <div key={i} className="flex gap-0.5 sm:gap-1.5" style={{ paddingLeft: `${i * 2.2}%` }}>
            {row.map((k) => (
              <Key
                key={k.base}
                k={k}
                active={nextChar !== null && (nextChar.toLowerCase() === k.base || nextChar === k.shift)}
              />
            ))}
          </div>
        ))}
        <div className="flex gap-0.5 sm:gap-1.5">
          <ShiftKey id="shiftL" active={shiftKey === 'shiftL'} />
          <div
            data-key=" "
            className="h-9 flex-1 rounded-md border sm:h-12 sm:rounded-lg"
            style={{
              borderColor: nextChar === ' ' ? FINGER_COLOR['L-thumb'] : 'var(--kb-border)',
              background: nextChar === ' ' ? FINGER_COLOR['L-thumb'] : 'var(--kb-key-bg)',
              boxShadow: nextChar === ' ' ? 'none' : '0 2px 0 0 var(--kb-key-shadow)',
            }}
          />
          <ShiftKey id="shift" active={shiftKey === 'shift'} />
        </div>
      </div>
    </div>
  )
}
