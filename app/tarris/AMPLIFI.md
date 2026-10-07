# TB3 Amplifi Status

Amplifi exists in the EA platform, including a social publishing gateway. TB3's tenant-specific social profile and publishing permissions are not verified here, so the Tarris portal uses Amplifi-Lite as a safe draft queue.

Amplifi-Lite active — tenant=tarris — draft queue ready — plug real Amplifi with 1 line swap after the family connects and verifies the Tarris social profile.

The portal creates caption drafts from five TB3 templates, current aggregate audience counts, and approved TB3 imagery. Drafts remain pending family approval. Approval copies the caption for review and manual publishing; it does not post automatically.

Drafts are stored as `contentType="social_draft"` records in the existing tenant intake ledger. The gallery's TODO marks the publishing replacement point: `amplifi.post({ tenant, image, caption })`.
