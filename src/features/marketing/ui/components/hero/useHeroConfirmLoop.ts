import { useEffect, useState } from 'react'

/**
 * The hero chat, step by step: the confirmation message, the customer tapping
 * Confirm, their reply, Akeed typing, then the thank-you.
 */
export type HeroChatStage =
  | 'typing'
  | 'message'
  | 'pressed'
  | 'replied'
  | 'thanksTyping'
  | 'thanked'

const STAGES: ReadonlyArray<HeroChatStage> = [
  'typing',
  'message',
  'pressed',
  'replied',
  'thanksTyping',
  'thanked',
]

/** How long each stage stays on screen before the next one, in ms. */
const STAGE_MS: Record<HeroChatStage, number> = {
  typing: 1200,
  message: 2400,
  pressed: 900,
  replied: 900,
  thanksTyping: 1300,
  thanked: 6000,
}

/**
 * Plays the stages in a loop while `active` (the phone is on screen) and
 * pauses where it is otherwise. Starts on the message, so the first paint
 * already shows it. Reduced motion shows the finished chat and never moves.
 */
export function useHeroConfirmLoop(
  active: boolean,
  reduceMotion: boolean
): HeroChatStage {
  const [index, setIndex] = useState(1)

  useEffect(() => {
    if (!active || reduceMotion) return
    const timer = setTimeout(
      () => setIndex((current) => (current + 1) % STAGES.length),
      STAGE_MS[STAGES[index]]
    )
    return () => clearTimeout(timer)
  }, [active, reduceMotion, index])

  return reduceMotion ? 'thanked' : STAGES[index]
}

/** Whether `stage` is `from` or any stage after it. */
export function reachedStage(stage: HeroChatStage, from: HeroChatStage) {
  return STAGES.indexOf(stage) >= STAGES.indexOf(from)
}
