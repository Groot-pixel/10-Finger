import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { downloadFile, sha1File } from '@main/services/network/downloader'

describe('sha1File', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'daybreak-sha1-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('computes the correct SHA1 hex digest for a file', async () => {
    const filePath = join(dir, 'sample.txt')
    const content = 'Daybreak Client Hash-Test'
    await writeFile(filePath, content, 'utf-8')
    const expected = createHash('sha1').update(content).digest('hex')
    await expect(sha1File(filePath)).resolves.toBe(expected)
  })
})

describe('downloadFile', () => {
  let dir: string
  const originalFetch = globalThis.fetch

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'daybreak-download-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
    globalThis.fetch = originalFetch
  })

  it('skips the download when an existing file already matches the expected SHA1', async () => {
    const destPath = join(dir, 'already-there.bin')
    const content = 'cached content'
    await writeFile(destPath, content, 'utf-8')
    const sha1 = createHash('sha1').update(content).digest('hex')

    let fetchCalled = false
    globalThis.fetch = (async () => {
      fetchCalled = true
      throw new Error('fetch should not be called when the file already matches')
    }) as typeof fetch

    const report = await downloadFile({ url: 'https://example.invalid/file.bin', destPath, expectedSha1: sha1 })
    expect(report.skipped).toBe(true)
    expect(fetchCalled).toBe(false)
  })

  it('rejects and removes the temp file when the downloaded content does not match the expected SHA1', async () => {
    const destPath = join(dir, 'mismatched.bin')
    globalThis.fetch = (async () =>
      new Response('wrong content', { status: 200 })) as typeof fetch

    await expect(
      downloadFile({ url: 'https://example.invalid/file.bin', destPath, expectedSha1: 'deadbeef'.padEnd(40, '0') }, 0)
    ).rejects.toThrow(/SHA1/)

    await expect(readFile(destPath)).rejects.toThrow()
  })

  it('writes the file and succeeds when the content matches the expected SHA1', async () => {
    const destPath = join(dir, 'ok.bin')
    const content = 'correct content'
    const sha1 = createHash('sha1').update(content).digest('hex')
    globalThis.fetch = (async () => new Response(content, { status: 200 })) as typeof fetch

    const report = await downloadFile({ url: 'https://example.invalid/file.bin', destPath, expectedSha1: sha1 })
    expect(report.skipped).toBe(false)
    await expect(readFile(destPath, 'utf-8')).resolves.toBe(content)
  })
})
