import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "ssl0.ovh.net",
  port: Number(process.env.SMTP_PORT) || 465,
  secure:
    process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendSplitInviteParams {
  toEmail: string;
  recipientName: string;
  inviterEmail: string;
  subscriptionName: string;
  amount: number;
  currency: string;
}

export async function sendSplitInvitationEmail({
  toEmail,
  recipientName,
  inviterEmail,
  subscriptionName,
  amount,
  currency,
}: SendSplitInviteParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.dripcatch.eu";
  const signupUrl = `${appUrl}/login/?signup=true&email=${encodeURIComponent(toEmail)}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>You're invited to split a subscription</title>
</head>
<body style="background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; margin: 0;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px;">
    <tr>
      <td>
        <div style="display: inline-block; padding: 8px 12px; background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #10b981; font-weight: bold; font-size: 14px; margin-bottom: 24px;">
          DripCatch
        </div>

        <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">
          Hi ${recipientName || "there"},
        </h1>

        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          <strong style="color: #f4f4f5;">${inviterEmail}</strong> invited you to split a subscription on DripCatch.
        </p>

        <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table width="100%">
            <tr>
              <td style="color: #71717a; font-size: 12px; text-transform: uppercase; font-weight: 600;">Subscription</td>
              <td align="right" style="color: #f4f4f5; font-size: 14px; font-weight: 600;">${subscriptionName}</td>
            </tr>
            <tr>
              <td style="color: #71717a; font-size: 12px; text-transform: uppercase; font-weight: 600; padding-top: 10px;">Your Share</td>
              <td align="right" style="color: #10b981; font-family: monospace; font-size: 16px; font-weight: 700; padding-top: 10px;">
                ${amount.toFixed(2)} ${currency}
              </td>
            </tr>
          </table>
        </div>

        <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5; margin: 0 0 24px 0;">
          Create your account with this email address, and the subscription will automatically be linked to your ledger so you can track your share.
        </p>

        <div style="text-align: center;">
          <a href="${signupUrl}" style="display: inline-block; background-color: #10b981; color: #09090b; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 10px;">
            Join & View Subscription
          </a>
        </div>

        <p style="color: #52525b; font-size: 11px; text-align: center; margin-top: 32px; margin-bottom: 0;">
          If you were not expecting this invitation, you can safely ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"DripCatch" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `${inviterEmail} invited you to split ${subscriptionName}`,
    html,
  });
}
