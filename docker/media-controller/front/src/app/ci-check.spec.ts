/// <reference types="vitest/globals" />

describe('CI ruleset check', () => {
  it('intentionally fails to test branch protection', () => {
    expect(true).toBe(false)
  })
})
