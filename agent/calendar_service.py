"""Optional Google Calendar integration for bookings.

Configuration (agent/.env):
  GOOGLE_CALENDAR_CREDENTIALS=<path to service-account JSON>
  GOOGLE_CALENDAR_ID=<calendar id, default: primary>

Without configuration the agent silently falls back to its in-memory store.
"""

import os
from datetime import datetime, timedelta
from pathlib import Path


def is_configured() -> bool:
    return bool(os.getenv("GOOGLE_CALENDAR_CREDENTIALS") and os.getenv("GOOGLE_CALENDAR_ID"))


def create_event(booking: dict) -> tuple[bool, str]:
    """Create a calendar event for a booking. Returns (ok, note)."""
    if not is_configured():
        return False, "calendar non configuré (mode local)"
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        creds_path = os.getenv("GOOGLE_CALENDAR_CREDENTIALS", "")
        if not Path(creds_path).is_file():
            return False, "fichier de credentials introuvable"
        creds = service_account.Credentials.from_service_account_file(
            creds_path,
            scopes=["https://www.googleapis.com/auth/calendar"],
        )
        service = build("calendar", "v3", credentials=creds)
        start_dt = datetime.strptime(f"{booking['date']}T{booking['time']}:00", "%Y-%m-%dT%H:%M:%S")
        end_dt = start_dt + timedelta(hours=1)
        event = {
            "summary": f"{booking['service']} — {booking['customer_name']}",
            "description": f"Téléphone : {booking['phone']}\nRéservation réf : {booking['reference']}",
            "start": {"dateTime": start_dt.isoformat()},
            "end": {"dateTime": end_dt.isoformat()},
        }
        created = service.events().insert(
            calendarId=os.getenv("GOOGLE_CALENDAR_ID", "primary"), body=event
        ).execute()
        return True, created.get("htmlLink", "créé")
    except Exception as e:
        return False, f"erreur calendrier ({type(e).__name__})"
