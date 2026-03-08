export interface Tier {
  key: string
  orders?: number
  price?: number
  perOrder?: number
  isFree?: boolean
  saving?: number
  ordersDisplay?: string | null
}
