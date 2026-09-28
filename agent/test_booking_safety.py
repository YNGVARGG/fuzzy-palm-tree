import asyncio
import json
import os
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
import business_tools as tools
from calendar_service import create_event, booking_window
from call_recorder import save_operational_capture

class BookingSafety(unittest.TestCase):
    def test_failed_calendar_creates_followup_not_booking(self):
        with tempfile.TemporaryDirectory() as root, patch.dict(os.environ, {"BUSINESS_LOG_FILE":str(Path(root)/"events.jsonl")}):
            store=tools.BusinessStore({"id":"dental","services":["Consultation"]})
            result=[]
            async def callback(value): result.append(value)
            params=SimpleNamespace(app_resources=store,result_callback=callback)
            with patch.object(tools,"create_event",return_value=(False,"timeout")) as remote:
                asyncio.run(tools.book_appointment(params,"Patient","123456789","Consultation","2030-01-01","10:00"))
                asyncio.run(tools.book_appointment(params,"Patient","123456789","Consultation","2030-01-01","10:00"))
                self.assertEqual(remote.call_count,1)
            self.assertFalse(result[0]["success"])
            self.assertEqual(store.appointments,[])
            rows=[json.loads(x) for x in (Path(root)/"events.jsonl").read_text().splitlines()]
            self.assertEqual([x["kind"] for x in rows],["message_taken"])
            self.assertEqual(rows[0]["call_id"],store.call_id)
    def test_only_remote_success_logs_confirmation(self):
        with tempfile.TemporaryDirectory() as root, patch.dict(os.environ,{"BUSINESS_LOG_FILE":str(Path(root)/"events.jsonl")}):
            store=tools.BusinessStore({"id":"dental"})
            result=[]
            async def callback(value): result.append(value)
            with patch.object(tools,"create_event",return_value=(True,"ok")):
                asyncio.run(tools.book_appointment(SimpleNamespace(app_resources=store,result_callback=callback),"Patient","123456789","Consultation","2030-01-01","10:00"))
            self.assertTrue(result[0]["success"])
            self.assertEqual(len(store.appointments),1)
            self.assertEqual(json.loads((Path(root)/"events.jsonl").read_text())["status"],"confirmed")
    def test_wrong_tenant_and_unapproved_slots_fail_closed(self):
        self.assertFalse(create_event({"tenant":"other"},{"id":"dental"})[0])
        with self.assertRaises(ValueError): booking_window({"tenant":"dental","service":"Consultation","customer_name":"Patient","phone":"123456","date":"2030-01-01","time":"10:00"},{"id":"dental","services":["Consultation"]})
    def test_disk_failure_does_not_promise_followup(self):
        store=tools.BusinessStore({"id":"dental"})
        results=[]
        async def callback(value): results.append(value)
        with patch.object(tools,"create_event",return_value=(False,"timeout")), patch.object(tools,"_log_event",side_effect=OSError()):
            asyncio.run(tools.book_appointment(SimpleNamespace(app_resources=store,result_callback=callback),"Patient","123456789","Consultation","2030-01-01","10:00"))
        self.assertEqual(results[0]["status"],"not_saved")
        self.assertEqual(store.messages,[])
    def test_concurrent_duplicate_calls_share_one_result(self):
        with tempfile.TemporaryDirectory() as root, patch.dict(os.environ,{"BUSINESS_LOG_FILE":str(Path(root)/"events.jsonl")}):
            store=tools.BusinessStore({"id":"dental"})
            results=[]
            async def callback(value):results.append(value)
            params=SimpleNamespace(app_resources=store,result_callback=callback)
            async def run():
                await asyncio.gather(*(tools.book_appointment(params,"Patient","123456789","Consultation","2030-01-01","10:00") for _ in range(2)))
            with patch.object(tools,"create_event",return_value=(True,"ok")) as remote:
                asyncio.run(run())
                self.assertEqual(remote.call_count,1)
            self.assertEqual(results[0]["reference"],results[1]["reference"])
    def test_dialed_number_cannot_fall_back_to_caller_or_demo(self):
        import tenant
        with patch.dict(os.environ,{"TENANTS_PHONE_MAP":"+33123456789:dental"}):
            self.assertEqual(tenant.resolve_tenant_for_call(SimpleNamespace(to_number="+33123456789")),"dental")
            with self.assertRaises(RuntimeError):tenant.resolve_tenant_for_call(SimpleNamespace(to_number="+33000000000",from_number="+33123456789"))
    def test_operational_capture_contains_no_transcript_audio_or_patient(self):
        with tempfile.TemporaryDirectory() as root:
            p=Path(root)
            save_operational_capture(p,[],[{"customer_name":"PRIVATE","message":"PRIVATE"}])
            self.assertEqual({f.name for f in p.iterdir()},{"meta.json","summary.txt"})
            self.assertNotIn("PRIVATE","".join(f.read_text() for f in p.iterdir()))
            self.assertFalse(json.loads((p/"meta.json").read_text())["recording_enabled"])
        source=Path(__file__).with_name('phone_agent.py').read_text(encoding='utf8')
        self.assertNotIn('start_recording',source)
        self.assertNotIn('save_transcript',source)



class VoiceToolReliability(unittest.TestCase):
    def test_message_and_escalation_disk_failure_do_not_promise_callback(self):
        async def run():
            for fn,args in [(tools.take_message,('Patient','123','Please call')), (tools.escalate_to_staff,('urgent','Needs staff','Patient','123'))]:
                results=[]
                async def callback(value): results.append(value)
                params=SimpleNamespace(app_resources=tools.BusinessStore({'id':'dental'}),result_callback=callback)
                with patch.object(tools,'_log_event',side_effect=OSError()): await fn(params,*args)
                self.assertFalse(results[0]['success'])
                self.assertEqual(results[0]['status'],'not_saved')
        asyncio.run(run())
    def test_callback_uses_practice_policy(self):
        async def run():
            results=[]
            async def callback(value): results.append(value)
            params=SimpleNamespace(app_resources=tools.BusinessStore({'id':'dental','callback_promise':'Configured policy'}),result_callback=callback)
            with patch.object(tools,'_log_event'): await tools.take_message(params,'Patient','123','Callback')
            self.assertEqual(results[0]['promise'],'Configured policy')
        asyncio.run(run())

if __name__=='__main__':unittest.main()

