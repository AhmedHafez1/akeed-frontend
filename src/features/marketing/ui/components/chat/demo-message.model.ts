export interface DemoMessage {
  type: 'bot' | 'user'
  contentType?: 'text' | 'location'
  text?: string
  locationData?: {
    lat: number
    lng: number
    address?: string
  }
  delay: number
  buttons?: {
    text: string
    action: string
  }[]
  selectedAction?: string
}
