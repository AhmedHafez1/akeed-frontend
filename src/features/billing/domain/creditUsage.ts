export interface CreditUsage {
  asOf: string
  timeZone: string
  monthStart: string
  usedThisMonth: number
  bySender: { akeed: number; ownNumber: number }
  daily: {
    date: string
    credits: number
    akeedCredits: number
    ownNumberCredits: number
  }[]
}

/** Missing or partial snapshots must never appear as zero usage. */
export function isCompleteCreditUsage(value: unknown): value is CreditUsage {
  if (!value || typeof value !== 'object') return false
  const snapshot = value as CreditUsage
  const integer = (amount: unknown) =>
    typeof amount === 'number' && Number.isSafeInteger(amount) && amount >= 0
  if (
    typeof snapshot.asOf !== 'string' ||
    !Number.isFinite(Date.parse(snapshot.asOf)) ||
    typeof snapshot.timeZone !== 'string' ||
    !integer(snapshot.usedThisMonth) ||
    !snapshot.bySender ||
    !integer(snapshot.bySender.akeed) ||
    !integer(snapshot.bySender.ownNumber) ||
    snapshot.usedThisMonth !==
      snapshot.bySender.akeed + snapshot.bySender.ownNumber ||
    !Array.isArray(snapshot.daily) ||
    snapshot.daily.length !== 14
  )
    return false
  let today: string
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: snapshot.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(snapshot.asOf))
    const part = (type: string) =>
      parts.find((item) => item.type === type)?.value
    today = [part('year'), part('month'), part('day')].join('-')
  } catch {
    return false
  }
  if (
    snapshot.monthStart !== today.slice(0, 7) + '-01' ||
    snapshot.daily[13]?.date !== today
  )
    return false
  const valid = snapshot.daily.every(
    (day, index) =>
      day &&
      typeof day.date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(day.date) &&
      integer(day.credits) &&
      integer(day.akeedCredits) &&
      integer(day.ownNumberCredits) &&
      day.credits === day.akeedCredits + day.ownNumberCredits &&
      (index === 0 ||
        Date.parse(day.date) - Date.parse(snapshot.daily[index - 1].date) ===
          86400000)
  )
  return (
    valid &&
    snapshot.daily
      .filter((day) => day.date >= snapshot.monthStart)
      .reduce((sum, day) => sum + day.credits, 0) <= snapshot.usedThisMonth
  )
}
