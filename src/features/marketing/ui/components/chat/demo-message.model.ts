export interface DemoMessage {
  type: 'bot' | 'user'
  text?: string
  delay: number
  buttons?: {
    text: string
    action: string
  }[]
  selectedAction?: string
}
