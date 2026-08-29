import sys
try:
    from cartesia import Cartesia
    c = Cartesia(api_key='sk_car_ojijbFJiLsLcsMYXmVKH7p')
    v = c.voices.get(voice_id='7c58f4a4-a72c-42fa-a503-41b9408820f3')
    print('VOICE:', v, flush=True)
except Exception as e:
    print('ERROR:', type(e).__name__, str(e)[:400], flush=True)