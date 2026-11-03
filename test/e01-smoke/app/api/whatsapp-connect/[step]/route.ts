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
  const body = (await request.json()) as Record<string, string>
  await pause(700)
  if (step === 'claim') {
    if (body.ticket?.startsWith('X'))
      return refuse(401, 'WHATSAPP_CONNECT_TICKET_INVALID')
    return Response.json({
      signupTicket: (body.ticket?.startsWith('F') ? 'F' : 'S').repeat(43),
      expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      appId: '999653349077771',
      configId: '2344392272632365',
      graphApiVersion: 'v26.0',
    })
  }
  if (step === 'complete') {
    if (body.signupTicket?.startsWith('F'))
      return refuse(409, 'WHATSAPP_NUMBER_ALREADY_CONNECTED')
    return Response.json({
      state: 'connecting',
      displayPhoneNumber: '+20 100 555 0101',
      signupPath: 'coexistence',
    })
  }
  return refuse(404, 'NOT_FOUND')
}
