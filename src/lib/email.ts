import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL || "recruitment@humanityorg.foundation";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || "re_placeholder");
}

export async function sendAssignmentEmail(to: string, name: string, applicantName: string) {
  return sendTelePanelistAssignmentEmail({ to, telePanelistName: name, applicantName, applicantId: "" })
}

export async function sendTelePanelistAssignmentEmail({
  to,
  telePanelistName,
  applicantName,
  applicantId,
}: {
  to: string;
  telePanelistName: string;
  applicantName: string;
  applicantId: string;
}) {
  const feedbackUrl = `${APP_URL}/tele-feedback/${applicantId}`;

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `New Tele-Screening Assignment: ${applicantName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
                  <tr>
                    <td style="background:#3191c2;padding:24px 32px;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">HUManity Foundation</h1>
                      <p style="margin:4px 0 0;color:#bfdbfe;font-size:14px;">Recruitment Management System</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px;">
                      <p style="color:#94a3b8;margin:0 0 16px;font-size:16px;">Hi ${telePanelistName},</p>
                      <p style="color:#e2e8f0;margin:0 0 24px;font-size:16px;line-height:1.6;">
                        You have been assigned to conduct a <strong style="color:#3191c2;">Tele-Screening</strong> for the following applicant:
                      </p>
                      <div style="background:#0f172a;border-radius:8px;padding:20px;margin:0 0 24px;">
                        <p style="margin:0;color:#94a3b8;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Applicant Name</p>
                        <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:600;">${applicantName}</p>
                      </div>
                      <p style="color:#e2e8f0;margin:0 0 24px;font-size:15px;line-height:1.6;">
                        Please contact the applicant at your earliest convenience and complete the tele-screening. After the call, submit your feedback using the button below.
                      </p>
                      <div style="text-align:center;margin:0 0 32px;">
                        <a href="${feedbackUrl}" style="display:inline-block;background:#3191c2;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
                          Submit Tele-Feedback
                        </a>
                      </div>
                      <div style="border-top:1px solid #334155;padding-top:24px;">
                        <p style="color:#64748b;margin:0;font-size:13px;">
                          If the button doesn't work, copy and paste this link:<br />
                          <a href="${feedbackUrl}" style="color:#3191c2;">${feedbackUrl}</a>
                        </p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#0f172a;padding:16px 32px;text-align:center;">
                      <p style="color:#475569;margin:0;font-size:12px;">
                        © ${new Date().getFullYear()} HUManity Foundation. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email notification");
  }
}

export async function sendStageChangeEmail({
  to,
  applicantName,
  fromStage,
  toStage,
  applicantId,
}: {
  to: string;
  applicantName: string;
  fromStage: string;
  toStage: string;
  applicantId: string;
}) {
  const detailUrl = `${APP_URL}/applicants/${applicantId}`;
  const isRejected = toStage === "Rejected";
  const isOnboarded = toStage === "Onboarded";

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Application Update: ${applicantName} — ${toStage}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;max-width:600px;">
                  <tr>
                    <td style="background:${isRejected ? "#ef4444" : isOnboarded ? "#22c55e" : "#3191c2"};padding:24px 32px;">
                      <h1 style="margin:0;color:#ffffff;font-size:22px;">Application Stage Update</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px;">
                      <p style="color:#e2e8f0;margin:0 0 16px;font-size:16px;">Applicant <strong>${applicantName}</strong> has moved to a new stage:</p>
                      <div style="display:flex;gap:16px;align-items:center;margin:0 0 24px;">
                        <span style="background:#334155;color:#94a3b8;padding:6px 12px;border-radius:6px;font-size:14px;">${fromStage}</span>
                        <span style="color:#64748b;">→</span>
                        <span style="background:${isRejected ? "#ef4444" : isOnboarded ? "#22c55e" : "#3191c2"};color:#fff;padding:6px 12px;border-radius:6px;font-size:14px;font-weight:600;">${toStage}</span>
                      </div>
                      <a href="${detailUrl}" style="display:inline-block;background:#3191c2;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;">View Details</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error("Failed to send stage change email:", error);
  }
}
