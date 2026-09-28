"""Read-only local readiness report. Never prints keys or calls speech providers."""
import json
import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).with_name('.env'), override=False)
from tenant import load_tenant, resolve_tenant_for_call

def report():
    checks=[]
    def check(name,ready,detail): checks.append({'check':name,'ready':bool(ready),'detail':detail})
    try: tenant=load_tenant(resolve_tenant_for_call(None))
    except Exception:
        return {'ready':False,'checks':[{'check':'practice','ready':False,'detail':'Configure TENANT_ID with a valid clinic.'}]}
    language=tenant.get('language','en')
    llm=os.getenv('LLM_SERVICE','openai' if language!='en' else 'phonellm').lower()
    tts=os.getenv('TTS_SERVICE','cartesia').lower()
    check('speech_recognition',os.getenv('DEEPGRAM_API_KEY'),'Deepgram credential present; live recognition still needs testing.')
    check('language_model',llm in ('openai','phonellm') and bool(os.getenv('OPENAI_API_KEY') if llm=='openai' else os.getenv('LLM_API_KEY') and os.getenv('LLM_BASE_URL')) and not(llm=='phonellm' and language!='en'),'Use a multilingual model for non-English clinics.')
    check('speech_output',bool(os.getenv('CARTESIA_API_KEY')) if tts=='cartesia' else tts=='deepgram' and bool(os.getenv('DEEPGRAM_API_KEY')) and (language=='en' or bool(os.getenv('TTS_VOICE'))),'Validate the voice and pronunciation in the clinic language.')
    check('practice_facts',all(tenant.get(k) for k in ['name','hours','services']),'Review clinic facts before a patient call.')
    return {'ready':all(c['ready'] for c in checks),'language':language,'checks':checks,'live_audio_tested':False,'telephony_security_verified':False,'calendar':'Staff confirmation unless the explicit calendar connector confirms the write.'}
if __name__=='__main__': print(json.dumps(report(),indent=2))
