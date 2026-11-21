'use client'

import { useTranslations } from 'next-intl'
import type { WhatsappStatusNote } from '../model/whatsappStatusNote'

/** Left-to-right isolate, so a phone number keeps its order inside Arabic or Urdu. */
const LRI = String.fromCharCode(0x2066)
const PDI = String.fromCharCode(0x2069)

/** The status note as one plain sentence in the interface language. */
export function useStatusNoteText(note: WhatsappStatusNote): string {
  const t = useTranslations('whatsappConnect.tab')
  if (!note.key) return ''
  const text = t('statusNote.' + note.key, {
    number: LRI + (note.number ?? t('statusNote.numberFallback')) + PDI,
    approved: note.approved,
    total: note.total,
  })
  return note.action ? `${text} ${t('progress.issues.' + note.action)}` : text
}
