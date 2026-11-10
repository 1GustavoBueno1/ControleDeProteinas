import { describe, expect, it } from 'vitest'
import { ehRole } from './usuario'

describe('ehRole', () => {
  it('aceita as duas roles do sistema', () => {
    expect(ehRole('adm')).toBe(true)
    expect(ehRole('churras')).toBe(true)
  })

  it('recusa qualquer outro valor', () => {
    expect(ehRole('ADM')).toBe(false)
    expect(ehRole('admin')).toBe(false)
    expect(ehRole('')).toBe(false)
    expect(ehRole(undefined)).toBe(false)
    expect(ehRole(null)).toBe(false)
    expect(ehRole(1)).toBe(false)
  })
})
