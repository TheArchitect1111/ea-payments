import asyncio
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch
import httpx

SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))
os.environ.setdefault("UXG_RESEARCH_WORKER_TOKEN", "test-token")

from app import main
from app.models import ResearchCrawlJobMeta, ResearchCrawlRequest, ResearchCrawlResult, ResearchIdentity


def completed_result(job_id: str) -> ResearchCrawlResult:
    return ResearchCrawlResult(
        identity=ResearchIdentity(canonicalName="Test Subject", entityType="organization"),
        job=ResearchCrawlJobMeta(
            jobId=job_id,
            status="succeeded",
            startedAt=main.now_iso(),
            finishedAt=main.now_iso(),
        ),
    )


class AsyncJobTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        main.jobs.clear()

    async def test_execute_job_records_stages_and_result(self):
        job_id = "job-unit"
        now = main.now_iso()
        main.jobs[job_id] = main.ResearchJobSnapshot(
            jobId=job_id, status="queued", createdAt=now, updatedAt=now
        )

        async def fake_run(req, emitter):
            await emitter("preparing", "running", "start")
            await emitter("preparing", "succeeded", "done")
            await emitter("crawling", "running", "start")
            await emitter("crawling", "succeeded", "one page")
            return completed_result(job_id)

        with patch.object(main, "run_crawl_job", side_effect=fake_run):
            await main.execute_job(job_id, ResearchCrawlRequest(subjectName="Test Subject"))

        snapshot = main.jobs[job_id]
        self.assertEqual(snapshot.status, "succeeded")
        self.assertIsNotNone(snapshot.result)
        self.assertEqual([s.name for s in snapshot.stages], ["preparing", "crawling"])
        self.assertTrue(all(s.durationMs is not None for s in snapshot.stages))
        self.assertEqual(len(snapshot.result.job.stages), 2)

    async def test_execute_job_failure_is_terminal(self):
        job_id = "job-failure"
        now = main.now_iso()
        main.jobs[job_id] = main.ResearchJobSnapshot(
            jobId=job_id, status="queued", createdAt=now, updatedAt=now
        )
        with patch.object(main, "run_crawl_job", new=AsyncMock(side_effect=RuntimeError("boom"))):
            await main.execute_job(job_id, ResearchCrawlRequest(subjectName="Test Subject"))
        self.assertEqual(main.jobs[job_id].status, "failed")
        self.assertIn("RuntimeError", main.jobs[job_id].error)

    async def test_authenticated_endpoint_submit_and_poll(self):
        async def fake_run(req, emitter):
            await emitter("preparing", "running", "start")
            await emitter("preparing", "succeeded", "done")
            return completed_result(req.jobId)

        transport = httpx.ASGITransport(app=main.app)
        headers = {"Authorization": "Bearer test-token"}
        with patch.object(main, "run_crawl_job", side_effect=fake_run):
            async with httpx.AsyncClient(transport=transport, base_url="http://worker") as client:
                submitted = await client.post(
                    "/v1/jobs",
                    headers=headers,
                    json={"subjectName": "Test Subject", "jobId": "job-http"},
                )
                self.assertEqual(submitted.status_code, 202)
                self.assertEqual(submitted.json()["statusUrl"], "/v1/jobs/job-http")
                for _ in range(20):
                    polled = await client.get("/v1/jobs/job-http", headers=headers)
                    if polled.json()["status"] == "succeeded":
                        break
                    await asyncio.sleep(0.01)
                payload = polled.json()
                self.assertEqual(payload["status"], "succeeded")
                self.assertIn(
                    "preparing",
                    [stage["name"] for stage in payload["result"]["job"]["stages"]],
                )


if __name__ == "__main__":
    unittest.main()
