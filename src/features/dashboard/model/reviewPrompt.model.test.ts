import { describe, expect, it } from 'vitest'
import { reviewOutcomeFor, type ReviewRequestCode } from './reviewPrompt.model'

describe('reviewOutcomeFor', () => {
  it.each<[ReviewRequestCode, string, boolean]>([
    ['success', 'thanks', false],
    ['already-reviewed', 'reviewed', false],
    ['cooldown-period', 'thanks', true],
    ['annual-limit-reached', 'thanks', true],
    ['mobile-app', 'thanks', true],
    ['recently-installed', 'thanks', true],
    ['unavailable', 'thanks', true],
    ['cancelled', 'keep', false],
    ['merchant-ineligible', 'hide', false],
    ['already-open', 'ignore', false],
    ['open-in-progress', 'ignore', false],
  ])('%s leads to %s (fallback: %s)', (code, ui, openFallback) => {
    expect(reviewOutcomeFor(code)).toEqual({ ui, openFallback })
  })
})
