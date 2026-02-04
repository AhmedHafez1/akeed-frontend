export type AnalyticsEvent =
  | 'page_view'
  | 'form_start'
  | 'form_complete'
  | 'payment_start'
  | 'payment_complete'
  | 'button_click'

export type AnalyticsEventProperties = Record<
  string,
  string | number | boolean | null
>

export interface AnalyticsEventData {
  event: AnalyticsEvent
  properties?: AnalyticsEventProperties
}
