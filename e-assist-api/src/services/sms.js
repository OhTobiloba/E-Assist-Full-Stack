import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

// Sends an SMS. "console" provider prints it (free dev mode). "termii" uses Termii's HTTP API.
// Verify the request fields against https://developers.termii.com if Termii changes their API.
export async function sendSms(phone, message) {
  if (env.SMS_PROVIDER === 'console') {
    console.log(`\n📱 [SMS → ${phone}] ${message}\n`);
    return;
  }
  let res;
  try {
    res = await fetch(`${env.TERMII_BASE_URL}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phone.replace('+', ''), // Termii wants 234XXXXXXXXXX
        from: env.TERMII_SENDER_ID,
        sms: message,
        type: 'plain',
        channel: env.TERMII_CHANNEL,
        api_key: env.TERMII_API_KEY,
      }),
    });
  } catch (e) {
    console.error('Termii network error', e);
    throw new ApiError(502, 'Could not send the SMS right now. Please try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Termii error', res.status, data);
    throw new ApiError(502, 'Could not send the SMS right now. Please try again.');
  }
}
