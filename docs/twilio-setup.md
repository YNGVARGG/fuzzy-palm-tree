# Twilio — real phone number setup (10–15 minutes)

Goal: someone dials a real phone number → Twilio streams the call → the agent answers on your PC via ngrok.

```
Caller -> Twilio number -> wss://<ngrok>/ws -> agent (phone_agent.py -t twilio) -> Mistral + Cartesia
```

## 1. Twilio account (free trial, $15 credit)

1. Go to https://www.twilio.com/try-twilio → sign up (email/Google).
2. Verify your phone number when asked (they call/SMS you a code).
3. Console → **Account Info**: copy **Account SID** and **Auth Token**.
4. Console → **Phone Numbers → Buy a number**: pick any number (voice enabled) —
   the trial credit covers it (~$1.15/mo).

## 2. ngrok token (free)

1. https://dashboard.ngrok.com → sign up → **Your Authtoken** → copy it.

## 3. Configure agent/.env

```
TWILIO_ACCOUNT_SID=<paste>
TWILIO_AUTH_TOKEN=<paste>
NGROK_AUTHTOKEN=<paste>
```

## 4. Start the phone service

```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-twilio.ps1
```

It starts ngrok + the agent (twilio mode) and prints, e.g.:

```
TUNNEL: https://abcd1234.ngrok.app
TWIML : wss://abcd1234.ngrok.app/ws
```

## 5. Point Twilio at the agent

1. Console → **TwiML Bins** → **Create new** → name it (e.g. `agent-demo`) → paste:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://abcd1234.ngrok.app/ws" />
  </Connect>
</Response>
```

2. **Phone Numbers → your number → Voice Configuration** → “A call comes in” = **TwiML Bin** →
   select `agent-demo` → **Save**.

## 6. Test

- Call your Twilio number from any phone → you should hear Alex.
- Say: *“Bonjour, je voudrais un rendez-vous pour une fuite d'eau demain”* → booking flow.
- Dashboard (:3000) shows the booking. (The agent bot on :7860 is now the phone line,
  not the browser test — the browser playground only works on the webrtc mode.)

## Notes & troubleshooting

- **ngrok URL changes on restart** → update the TwiML Bin with the new URL printed by the script.
- **Trial account**: calls to your number work; outbound calls/verification may be limited until
  you add a payment method — inbound is what we need.
- **No audio / one-way audio**: check `logs\agent-twilio.log`; the agent auto-detects 8kHz telephony.
- **Dashboard while on phone duty**: keep the dashboard (:3000) running; stop the phone line with:
  `powershell -ExecutionPolicy Bypass -File scripts\stop-all.ps1` then restart webrtc mode with
  `start-everything.ps1`.
- Back on the browser test anytime: `start-everything.ps1` (it restarts the bot in webrtc mode).