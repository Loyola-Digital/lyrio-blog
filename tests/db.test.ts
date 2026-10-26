import { describe, expect, it } from 'vitest'
import { getSql } from '@/lib/db'

describe('getSql', () => {
  it('sem DATABASE_URL avisa em vez de tentar o localhost', () => {
    const saved = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    try {
      expect(() => getSql()).toThrow('DATABASE_URL não configurada')
    } finally {
      if (saved !== undefined) process.env.DATABASE_URL = saved
    }
  })
})
