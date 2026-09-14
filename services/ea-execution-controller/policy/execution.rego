package ea.execution

default allow_advance := false
default allow_complete := false

allow_advance if {
  input.intent.approved == true
  input.context.source_of_truth_locked == true
  count([a | a := input.stage.activities[_]; a.required == true; a.status != "passed"]) == 0
  count([g | g := input.stage.gates[_]; g.required == true; g.status != "passed"]) == 0
  count(deny) == 0
}

allow_complete if {
  input.target_state == "COMPLETE"
  input.execution.verified == true
  input.execution.unresolved_blocking_regressions == 0
  input.execution.required_evidence_complete == true
  count(input.execution.next_steps) > 0
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

deny contains "approved intent is required" if { input.intent.approved != true }
deny contains "source of truth must be locked" if { input.context.source_of_truth_locked != true }
deny contains "silent stack substitution is prohibited" if { input.execution.required_activity_substituted == true }
deny contains "required activity was skipped" if { input.execution.required_activity_skipped == true }
deny contains "unresolved required gate failure" if { input.execution.failed_required_gates > 0 }
deny contains "next steps are required before COMPLETE" if { count(input.execution.next_steps) == 0 }
deny contains "rollback path required for production change" if {
  input.verification.production_required == true
  input.execution.rollback_defined != true
}
deny contains "visual fidelity failure" if {
  input.verification.visual_required == true
  input.verification.visual_passed != true
}
deny contains "functional verification failure" if { input.verification.functional_passed != true }
deny contains "production verification failure" if {
  input.verification.production_required == true
  input.verification.production_passed != true
}
deny contains "asset provenance failure" if { input.quality.unverified_identity_asset == true }
deny contains "duplicate image source" if { input.quality.duplicate_image_source == true }
deny contains "unresolved high severity regression" if { input.execution.unresolved_blocking_regressions > 0 }
