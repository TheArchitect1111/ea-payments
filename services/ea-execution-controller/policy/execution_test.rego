package ea.execution

base_input := {
  "intent": {"approved": true},
  "context": {"source_of_truth_locked": true},
  "target_state": "COMPLETE",
  "stage": {
    "activities": [{"required": true, "status": "passed"}],
    "gates": [{"required": true, "status": "passed"}]
  },
  "execution": {
    "verified": true,
    "unresolved_blocking_regressions": 0,
    "required_evidence_complete": true,
    "required_activity_substituted": false,
    "required_activity_skipped": false,
    "failed_required_gates": 0,
    "rollback_defined": true,
    "next_steps": ["Proceed to the next approved execution stage"]
  },
  "verification": {
    "functional_passed": true,
    "visual_required": true,
    "visual_passed": true,
    "production_required": true,
    "production_passed": true
  },
  "quality": {"unverified_identity_asset": false, "duplicate_image_source": false}
}

test_complete_passes_when_all_evidence_passes if allow_complete with input as base_input

test_unapproved_job_fails if not allow_complete with input as object.union(base_input, {"intent": {"approved": false}})

test_visual_failure_blocks if not allow_complete with input as object.union(base_input, {"verification": object.union(base_input.verification, {"visual_passed": false})})

test_duplicate_asset_blocks if not allow_complete with input as object.union(base_input, {"quality": object.union(base_input.quality, {"duplicate_image_source": true})})

test_unverified_identity_asset_blocks if not allow_complete with input as object.union(base_input, {"quality": object.union(base_input.quality, {"unverified_identity_asset": true})})

test_failed_gate_blocks if not allow_complete with input as object.union(base_input, {"execution": object.union(base_input.execution, {"failed_required_gates": 1})})

test_skipped_activity_blocks if not allow_complete with input as object.union(base_input, {"execution": object.union(base_input.execution, {"required_activity_skipped": true})})

test_missing_next_steps_blocks_complete if not allow_complete with input as object.union(base_input, {"execution": object.union(base_input.execution, {"next_steps": []})})
