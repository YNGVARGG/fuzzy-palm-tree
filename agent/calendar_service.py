"""Explicitly bound pilot calendar. Any unavailable/uncertain result is not confirmed."""
import os
import threading
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from pathlib import Path

_booking_lock = threading.Lock()

def is_configured() -> bool:
    return bool(os.getenv("GOOGLE_CALENDAR_CREDENTIALS") and os.getenv("GOOGLE_CALENDAR_ID") and os.getenv("GOOGLE_CALENDAR_TENANT_ID"))

def booking_window(booking: dict, tenant: dict):
    if booking.get("tenant") != tenant.get("id"):
        raise ValueError("tenant mismatch")
    if booking.get("service") not in tenant.get("services", []):
        raise ValueError("unknown service")
    if not booking.get("customer_name", "").strip() or not booking.get("phone", "").strip():
        raise ValueError("missing caller details")
    tz = ZoneInfo(tenant.get("timezone", "Europe/Paris"))
    raw = f"{booking['date']}T{booking['time']}"
    start = datetime.strptime(raw, "%Y-%m-%dT%H:%M").replace(tzinfo=tz)
    if start.strftime("%Y-%m-%dT%H:%M") != raw or start <= datetime.now(tz):
        raise ValueError("invalid or past time")
    # Ambiguous/nonexistent DST wall times require staff review.
    if start.utcoffset() != start.replace(fold=1).utcoffset() or start.astimezone(timezone.utc).astimezone(tz).replace(tzinfo=None) != start.replace(tzinfo=None):
        raise ValueError("ambiguous time")
    # Operators explicitly approve pilot slots; prose in a prompt is not availability.
    if raw not in tenant.get("calendar_slots", []):
        raise ValueError("slot needs staff review")
    duration = tenant.get("appointment_duration_minutes")
    if not isinstance(duration, int) or not 10 <= duration <= 240:
        raise ValueError("duration not configured")
    return start, start + timedelta(minutes=duration)

def create_event(booking: dict, tenant: dict | None = None) -> tuple[bool, str]:
    if not tenant or not is_configured() or os.getenv("GOOGLE_CALENDAR_TENANT_ID") != tenant.get("id"):
        return False, "calendar not configured for this practice"
    try:
        start, end = booking_window(booking, tenant)
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        from googleapiclient.errors import HttpError
        credentials = os.getenv("GOOGLE_CALENDAR_CREDENTIALS", "")
        if not Path(credentials).is_file():
            return False, "calendar unavailable"
        creds = service_account.Credentials.from_service_account_file(credentials, scopes=["https://www.googleapis.com/auth/calendar"])
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        calendar_id = os.environ["GOOGLE_CALENDAR_ID"]
        event_id = booking["reference"]
        # Serializes this agent process only. External calendar writers can still race.
        with _booking_lock:
            try:
                existing = service.events().get(calendarId=calendar_id, eventId=event_id).execute()
                return existing.get("status") == "confirmed", "existing request"
            except HttpError as error:
                if error.resp.status != 404:
                    raise
            availability = service.freebusy().query(body={"timeMin":start.isoformat(), "timeMax":end.isoformat(), "items":[{"id":calendar_id}]}).execute()
            info = availability.get("calendars", {}).get(calendar_id)
            if not info or info.get("errors") or "busy" not in info or info["busy"]:
                return False, "availability not confirmed"
            created = service.events().insert(calendarId=calendar_id, body={
                "id":event_id, "summary":"Rendez-vous cabinet",
                "description":f"Référence : {booking['reference']}",
                "start":{"dateTime":start.isoformat()}, "end":{"dateTime":end.isoformat()},
            }).execute()
            return created.get("id") == event_id and created.get("status") == "confirmed", "calendar response"
    except Exception:
        # A timeout may have committed remotely. Staff must reconcile; never claim success.
        return False, "calendar requires staff verification"
