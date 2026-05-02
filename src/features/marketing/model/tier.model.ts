export interface Tier {
  key: string
  orders?: number
  price?: number
  isFree?: boolean
  saving?: number
  ordersDisplay?: string | null
}
