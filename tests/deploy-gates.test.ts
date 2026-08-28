import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(path, 'utf8')

describe('deploy gates', () => {
  it('mantém hook e CI no mesmo preflight Node 24', () => {
    const pkg = JSON.parse(read('package.json'))
    const workflow = read('.github/workflows/ci.yml')

    expect(pkg.engines.node).toBe('24.x')
    expect(pkg.scripts.preflight).toContain('npm run typecheck')
    expect(pkg.scripts.preflight).toContain('npm test')
    expect(read('.githooks/pre-push')).toContain('npm run preflight')
    expect(workflow).toContain('node-version: \'24\'')
    expect(workflow).toContain('run: npm run preflight')
    expect([...workflow.matchAll(/uses:\s+([^\s]+)/g)].every((match) => /@[a-f0-9]{40}$/.test(match[1]))).toBe(true)
  })

  it('não silencia falhas do Vercel', () => {
    const config = JSON.parse(read('vercel.json'))
    expect(config.github?.silent).not.toBe(true)
  })
})
