from app import verify_completion
from models import CompletionRequest, Evidence


def test_finished_requires_every_gate():
    result = verify_completion(
        CompletionRequest(
            task_id="video-1",
            goal="Render and verify episode",
            claimed_status="finished",
            required_gates=["render", "audio", "deploy"],
            evidence=[
                Evidence(name="render", passed=True),
                Evidence(name="audio", passed=True),
            ],
        )
    )
    assert result.verified is False
    assert result.status == "in_progress"
    assert result.missing_gates == ["deploy"]


def test_finished_when_every_gate_passes():
    result = verify_completion(
        CompletionRequest(
            task_id="video-2",
            goal="Render and verify episode",
            claimed_status="finished",
            required_gates=["render", "audio", "deploy"],
            evidence=[
                Evidence(name="render", passed=True),
                Evidence(name="audio", passed=True),
                Evidence(name="deploy", passed=True),
            ],
        )
    )
    assert result.verified is True
    assert result.status == "finished"
