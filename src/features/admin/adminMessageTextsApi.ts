import { adminRequest } from './adminApi'
import type {
  MessageTextForm,
  MessageTextSaveResult,
  MessageTextsResponse,
} from './admin-message-texts.model'

const path = '/api/admin/message-texts'

export function getMessageTexts() {
  return adminRequest<MessageTextsResponse>(path)
}

export function saveMessageText(form: MessageTextForm) {
  return adminRequest<MessageTextSaveResult>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  })
}
