export interface WaitlistFormData {
  name: string
  phone: string
  monthlyOrders: string
  platform?: string
}

export interface WaitlistSubmissionResponse {
  error?: string
}
