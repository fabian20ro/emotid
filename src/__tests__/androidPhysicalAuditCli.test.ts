import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const auditScript = path.resolve(process.cwd(), 'scripts/android-physical-audit.mjs')

describe('Android physical audit CLI', () => {
  it('prints help without starting a device journey', () => {
    const result = spawnSync(process.execPath, [auditScript, '--help'], { encoding: 'utf8' })

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Usage:')
    expect(result.stdout).not.toContain('J1 start')
  })

  it('rejects unknown arguments before starting a device journey', () => {
    const result = spawnSync(process.execPath, [auditScript, '--unknown'], { encoding: 'utf8' })

    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('Unsupported argument: --unknown')
    expect(result.stdout).not.toContain('J1 start')
  })

  it('rejects an unregistered journey before accessing a device', () => {
    const result = spawnSync(process.execPath, [auditScript, '--journey=j10'], { encoding: 'utf8' })

    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('Unsupported journey: j10')
    expect(result.stdout).not.toContain('J1 start')
  })
})
