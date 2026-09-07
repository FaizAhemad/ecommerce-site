export async function sendVerificationSms(phone: string, code: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER
  if (!accountSid || !authToken || !from) return false
  const body = new URLSearchParams({ To: phone, From: from, Body: `Your Gadgify verification code is ${code}. It expires in 10 minutes.` })
  const result = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  return result.ok
}
