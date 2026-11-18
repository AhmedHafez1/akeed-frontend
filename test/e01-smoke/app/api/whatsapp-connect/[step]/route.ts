/**
 * The connect page's two ticket requests, answered in process with synthetic
 * data. A ticket starting with F makes the completion fail with the
 * number-in-use code; one starting with X is refused at claim.
 */
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function refuse(status: number, code: string) {
  return Response.json({ statusCode: status, message: code, code }, { status })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ step: string }> }
) {
  const { step } = await params
  const fixtureOrigin = 'http://127.0.0.1:3098'
  const body = (await request.json()) as Record<string, string>
  const requestedLocale =
    step === 'complete' ? body.redirectLocale : body.locale
  const locale = ['ar', 'en', 'ur', 'es', 'fr', 'tr'].includes(requestedLocale)
    ? requestedLocale
    : 'en'
  const returnUrl = new URL(
    '/' + locale + '/settings?tab=whatsapp',
    fixtureOrigin
  ).href
  await pause(700)
  if (step === 'claim' || step === 'relaunch') {
    if (body.ticket?.startsWith('X'))
      return refuse(401, 'WHATSAPP_CONNECT_TICKET_INVALID')
    return Response.json({
      signupTicket: (body.ticket?.startsWith('F') ? 'F' : 'S').repeat(43),
      expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      signupUrl: new URL(
        '/' +
          locale +
          '/whatsapp-connect?code=synthetic-code&state=' +
          (body.ticket?.startsWith('F') ? 'F' : 'S').repeat(43),
        fixtureOrigin
      ).href,
      returnUrl,
    })
  }
  if (step === 'complete') {
    if (body.signupTicket?.startsWith('F'))
      return refuse(409, 'WHATSAPP_NUMBER_ALREADY_CONNECTED')
    return Response.json({
      state: 'connecting',
      displayPhoneNumber: '+20 100 555 0101',
      signupPath: 'coexistence',
      returnUrl,
    })
  }
  return refuse(404, 'NOT_FOUND')
}
