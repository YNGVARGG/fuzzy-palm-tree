import asyncio, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from dotenv import load_dotenv; load_dotenv(override=True)
from business_context import build_system_instruction
from openai import OpenAI
import os
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'), base_url=os.getenv('LLM_BASE_URL') or None)
tools = [{'type':'function','function':{'name':'escalate_to_staff','description':'Escalate to clinical staff.','parameters':{'type':'object','properties':{'reason':{'type':'string'},'details':{'type':'string'},'customer_name':{'type':'string'},'phone':{'type':'string'}},'required':['reason','details']}}}]
msgs = [{'role':'system','content':build_system_instruction({'name':'Cabinet Test','tagline':'cabinet dentaire','language':'fr','greeting_name':'Sophie','services':['consultation','soins'],'hours':'9h-18h','faq':{'urgence':'creneaux dispo'},'after_hours_note':'','booking_slots':'','callback_promise':''})}, {'role':'user','content':'J\'ai mal depuis hier soir, une grosse douleur à la mâchoire, qu\'est-ce que je dois faire ?'}]
resp = client.chat.completions.create(model=os.getenv('OPENAI_MODEL'), messages=msgs, tools=tools, temperature=0, max_tokens=250)
msg = resp.choices[0].message
print('TOOL_CALLS:', json.dumps(msg.tool_calls, ensure_ascii=False)[:300] if msg.tool_calls else 'NONE')
print('CONTENT:', (msg.content or '')[:200])