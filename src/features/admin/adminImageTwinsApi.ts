import { adminRequest } from './adminApi'
import type {
  ImageTwinActivation,
  ImageTwinOverview,
  ImageTwinResult,
} from './admin-image-twins.model'

const path = '/api/admin/templates/image-twins'

export function getImageTwins() {
  return adminRequest<ImageTwinOverview>(path)
}

/** Submits a twin for every template without one. Calls Meta. */
export function createMissingImageTwins() {
  return adminRequest<{ results: ImageTwinResult[] }>(path, { method: 'POST' })
}

export function activateApprovedImageTwins() {
  return adminRequest<ImageTwinActivation>(`${path}/activate`, {
    method: 'POST',
  })
}
