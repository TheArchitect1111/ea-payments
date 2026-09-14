package ea.execution

default allow_advance := false

default allow_complete := false

# A stage may advance only when the job is approved, its source of truth is locked,
# all required activities for the stage ran, and all required applicable gates pass.
allow_advance if {
  input.intent.approved == true
  input.context.source_of_truth_locked == true
  every activity in input.stage.activities {
    activity.required == false
    or activity.status == "passed"
  }
  every gate in input.stage.gates {
    gate.required == false
    or gate.status == "passed"
  }
  count(deny) == 0
}

# COMPLETE is deliberately stricter than stage advancement.
allow_complete if {
  input.target_state == "COMPLETE"
  input.execution.verified == true
  input.execution.unresolved_blocking_regressions == 0
  input.execution.required_evidence_complete == true
  input.verification.functional_passed == true
  not visual_required_or_failed
  not production_required_or_failed
  count(deny) == 0
}

visual_required_or_failed if {
  input.verification.visual_required == true
  input.verification.visual_passed != true
}

production_required_or_failed if {
  input.verification.production_required == true
  input.verification.production_passed != true
}

deny contains "approved intent is required" if input.intent.approved != true

deny contains "source of truth must be locked" if input.context.source_of_truth_locked != true

deny contains "silent stack substitution is prohibited" if input.execution.required_activity_substituted == true

deny contains "required activity was skipped" if input.execution.required_activity_skipped == true

deny contains "unresolved required gate failure" if input.execution.failed_required_gates > 0

deny contains "rollback path required for production change" if {
  input.verification.production_required == true
  input.execution.rollback_defined != true
}

deny contains "visual fidelity failure" if {
  input.verification.visual_required == true
  input.verification.visual_passed != true
}

deny contains "functional verification failure" if input.verification.functional_passed != true

deny contains "production verification failure" if {
  input.verification.production_required == true
  input.verification.production_passed != true
}

deny contains "asset provenance failure" if input.quality.unverified_identity_asset == true

deny contains "duplicate image source" if input.quality.duplicate_image_source == true

deny contains "unresolved high severity regression" if input.execution.unresolved_blocking_regressions > 0
