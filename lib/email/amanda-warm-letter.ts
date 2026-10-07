import 'server-only';
import { sendEmail } from '@ea/portal-chassis/email';

export type AmandaWarmLetterCtaType = 'waitlist' | 'apply' | 'enroll' | 'book';

type AmandaWarmLetterInput = {
  to: string;
  name: string;
  course: string;
  ctaType: AmandaWarmLetterCtaType;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function thankYouLine(ctaType: AmandaWarmLetterCtaType, course: string) {
  if (ctaType === 'waitlist') return `Thank you for joining the priority waitlist for ${course}.`;
  if (ctaType === 'apply') return `Thank you for applying and sharing a little about what you are building.`;
  if (ctaType === 'enroll') return `Thank you for taking the next step with ${course}.`;
  return `Thank you for booking time with me.`;
}

function nextStepLine(ctaType: AmandaWarmLetterCtaType, course: string) {
  if (ctaType === 'waitlist') return `My team has your details for ${course}. We will reach out when the next enrollment opportunity is available.`;
  if (ctaType === 'apply') return `My team will review what you shared and follow up with the most helpful next step.`;
  if (ctaType === 'enroll') return `We have your information for ${course}. You will receive the next details for getting started as your enrollment moves forward.`;
  return `Your booking is the next step. I look forward to connecting with you.`;
}

export async function sendAmandaWarmLetter({ to, name, course, ctaType }: AmandaWarmLetterInput) {
  const safeName = escapeHtml(name.trim() || 'there');
  const safeCourse = escapeHtml(course.trim() || 'your next step');
  const safeThankYou = escapeHtml(thankYouLine(ctaType, course.trim() || 'your next step'));
  const safeNextStep = escapeHtml(nextStepLine(ctaType, course.trim() || 'your next step'));

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f6f0e6;font-family:Arial,Helvetica,sans-serif;color:#17211c;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#f6f0e6;">
      <tr>
        <td>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#fffdf8;border:1px solid #ddd7cb;">
            <tr>
              <td style="padding:40px;">
                <p style="margin:0 0 18px;font-family:Georgia,serif;font-size:28px;line-height:1.25;color:#17211c;">Hi ${safeName},</p>
                <p style="margin:0 0 18px;font-size:16px;line-height:1.75;">${safeThankYou}</p>
                <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#596b5b;">What happens next</p>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.75;">${safeNextStep}</p>
                <p style="margin:0 0 18px;font-size:16px;line-height:1.75;">I’m grateful you chose to take this step. I want the experience from here to feel clear, thoughtful, and personal.</p>
                <p style="margin:0;font-size:16px;line-height:1.75;">Warmly,<br><strong>Amanda Catherine</strong><br><a href="mailto:hello@amandacatherine.ca" style="color:#596b5b;">hello@amandacatherine.ca</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return sendEmail({
    to: to.trim().toLowerCase(),
    subject: "You're in — a personal note from Amanda",
    html,
  });
}
