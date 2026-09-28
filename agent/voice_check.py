"""Inspect a configured Cartesia voice without embedding credentials in source."""
import os
from pathlib import Path
from dotenv import load_dotenv

def main():
    load_dotenv(Path(__file__).with_name('.env'), override=False)
    key=os.getenv('CARTESIA_API_KEY')
    voice=os.getenv('TTS_VOICE')
    if not key or not voice:
        print('Configure CARTESIA_API_KEY and TTS_VOICE privately before checking the voice.')
        return 1
    try:
        from cartesia import Cartesia
        result=Cartesia(api_key=key).voices.get(voice_id=voice)
        print('Voice configuration found:', getattr(result,'name','configured voice'))
        return 0
    except Exception:
        print('Voice lookup failed. Check the configured credentials and voice ID.')
        return 1
if __name__=='__main__': raise SystemExit(main())
