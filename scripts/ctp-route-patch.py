from pathlib import Path

p = Path('app/api/assessment/submit/route.ts')
text = p.read_text()

old1 = """    if (!proposalResult.ok) {
      console.error('Proposal write failed:', proposalResult.error);
      return NextResponse.json({
        ok: true,
        saved: false,
        message:
          'We received your assessment. Our team will follow up by email within 1–2 business days.',
      });
    }
"""
new1 = """    if (!proposalResult.ok) {
      console.error('Proposal write failed:', proposalResult.error);
      return NextResponse.json(
        {
          ok: false,
          saved: false,
          error: isCtpFlow
            ? 'Your CTP could not be safely saved. Please try again.'
            : 'Your assessment could not be safely saved. Please try again.',
        },
        { status: 503 },
      );
    }
"""
if old1 not in text:
    raise SystemExit('proposal false-success block not found')
text = text.replace(old1, new1, 1)

old2 = "        if (ctpResult.submission) {\n"
new2 = """        if (!ctpResult.ok || !ctpResult.submission) {
          console.error('[assessment/submit] CTP persistence failed:', ctpResult.error);
          return NextResponse.json(
            {
              ok: false,
              saved: false,
              error: 'Your CTP could not be verified as saved. Please try again.',
            },
            { status: 503 },
          );
        }

        if (ctpResult.submission) {
"""
if old2 not in text:
    raise SystemExit('CTP submission gate not found')
text = text.replace(old2, new2, 1)

old3 = """      } catch (err) {
        console.error('[assessment/submit] CTP submission failed:', err);
      }
"""
new3 = """      } catch (err) {
        console.error('[assessment/submit] CTP submission failed:', err);
        if (!ctpSubmissionId) {
          return NextResponse.json(
            {
              ok: false,
              saved: false,
              error: 'Your CTP could not be completed safely. Please try again.',
            },
            { status: 500 },
          );
        }
      }
"""
if old3 not in text:
    raise SystemExit('CTP catch block not found')
text = text.replace(old3, new3, 1)

p.write_text(text)
Path('.github/workflows/ctp-route-one-shot.yml').unlink(missing_ok=True)
Path('scripts/ctp-route-patch.py').unlink(missing_ok=True)
