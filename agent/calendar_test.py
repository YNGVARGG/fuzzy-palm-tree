"""Calendar service fallback test."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from dotenv import load_dotenv

load_dotenv(override=True)

from calendar_service import create_event, is_configured


print("CONFIGURED:", is_configured())
ok, note = create_event(
    {"date": "2026-08-30", "time": "10:00", "service": "test", "customer_name": "T", "phone": "0", "reference": "1"}
)
print("CREATE ok:", ok, "| note:", note)
print("FALLBACK_OK:", not ok and "non configuré" in note)