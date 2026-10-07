import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import type { ConsoleLogLine, CrashSummary } from '@shared/types'
import { useTranslation } from '../i18n/useTranslation'

export function ConsolePage(): JSX.Element {
  const { t } = useTranslation()
  const [lines, setLines] = useState<ConsoleLogLine[]>([])
  const [crash, setCrash] = useState<CrashSummary | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const unsubscribeLine = window.daybreak.launch.onConsoleLine((event) => {
      setLines((prev) => [...prev.slice(-999), event])
    })
    const unsubscribeCrash = window.daybreak.launch.onCrash((event) => {
      setCrash(event)
    })
    return () => {
      unsubscribeLine()
      unsubscribeCrash()
    }
  }, [])

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight })
  }, [lines])

  return (
    <section>
      <h1>{t('console.title')}</h1>
      <button type="button" onClick={() => setLines([])}>
        {t('console.clear')}
      </button>
      {crash && (
        <div className="error-banner">
          <strong>Crash erkannt (Exit-Code {crash.exitCode ?? 'unbekannt'})</strong>
          <p>{crash.probableCause}</p>
          {crash.crashReportPath && <p>Crash-Report: {crash.crashReportPath}</p>}
        </div>
      )}
      <div className="console-output" ref={containerRef}>
        {lines.length === 0
          ? t('console.noOutput')
          : lines.map((line, index) => (
              <div key={index} style={{ color: line.stream === 'stderr' ? '#f88' : undefined }}>
                [{line.stream}] {line.line}
              </div>
            ))}
      </div>
    </section>
  )
}
