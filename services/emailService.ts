/**
 * Email Service — sends OTP emails via EmailJS.
 *
 * Setup:
 *   1. Go to https://www.emailjs.com/ and create a free account.
 *   2. Create a service (Gmail / Outlook / SMTP).
 *   3. Create two email templates:
 *        - "artforge_otp"         (for login OTP)
 *        - "artforge_forgot_otp"  (for forgot-password OTP)
 *   4. Copy your Service ID, Template IDs, and Public Key into .env.local:
 *        VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
 *        VITE_EMAILJS_OTP_TEMPLATE_ID=template_xxxxxxx
 *        VITE_EMAILJS_FP_TEMPLATE_ID=template_yyyyyyy
 *        VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxxxxxxx
 *
 * Template Variables (use in your EmailJS template):
 *   {{to_email}}   - recipient email
 *   {{to_name}}    - recipient name / email prefix
 *   {{otp_code}}   - 6-digit OTP
 *   {{expiry_min}} - "5" (minutes until expiry)
 *   {{year}}       - current year
 */

const env = (import.meta as any).env ?? {};

const SERVICE_ID   = env.VITE_EMAILJS_SERVICE_ID       || '';
const OTP_TPL_ID   = env.VITE_EMAILJS_OTP_TEMPLATE_ID  || '';
const FP_TPL_ID    = env.VITE_EMAILJS_FP_TEMPLATE_ID   || '';
const PUBLIC_KEY   = env.VITE_EMAILJS_PUBLIC_KEY        || '';

const EMAILJS_CONFIGURED = !!(SERVICE_ID && OTP_TPL_ID && PUBLIC_KEY);

// ── Dynamic EmailJS SDK loader ────────────────────────────────────────────────

let emailjsLoaded = false;

async function loadEmailJS(): Promise<any> {
  if (emailjsLoaded && (window as any).emailjs) return (window as any).emailjs;

  return new Promise((resolve, reject) => {
    if ((window as any).emailjs) {
      emailjsLoaded = true;
      return resolve((window as any).emailjs);
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    script.async = true;
    script.onload = () => {
      (window as any).emailjs.init({ publicKey: PUBLIC_KEY });
      emailjsLoaded = true;
      resolve((window as any).emailjs);
    };
    script.onerror = () => reject(new Error('Failed to load EmailJS SDK'));
    document.head.appendChild(script);
  });
}

// ── Template params builder ───────────────────────────────────────────────────

function buildParams(email: string, otp: string): Record<string, string> {
  return {
    to_email:   email,
    to_name:    email.split('@')[0],
    otp_code:   otp,
    expiry_min: '5',
    year:       new Date().getFullYear().toString(),
  };
}

// ── Send helpers ──────────────────────────────────────────────────────────────

/** Send a login / signup OTP email */
export async function sendLoginOtpEmail(email: string, otp: string): Promise<void> {
  if (!EMAILJS_CONFIGURED) {
    console.warn('[EmailService] EmailJS not configured — showing OTP in console for dev:', otp);
    console.info(`%c🔐 DEV OTP for ${email}: ${otp}`, 'color:#f59e0b;font-size:18px;font-weight:bold');
    return;
  }
  const ejs = await loadEmailJS();
  const result = await ejs.send(SERVICE_ID, OTP_TPL_ID, buildParams(email, otp));
  if (result.status !== 200) throw new Error('Failed to send OTP email. Please try again.');
}

/** Send a forgot-password OTP email */
export async function sendForgotPasswordOtpEmail(email: string, otp: string): Promise<void> {
  const templateId = FP_TPL_ID || OTP_TPL_ID; // fallback to same template
  if (!EMAILJS_CONFIGURED) {
    console.warn('[EmailService] EmailJS not configured — showing FP OTP in console for dev:', otp);
    console.info(`%c🔑 DEV FORGOT-PASSWORD OTP for ${email}: ${otp}`, 'color:#f59e0b;font-size:18px;font-weight:bold');
    return;
  }
  const ejs = await loadEmailJS();
  const result = await ejs.send(SERVICE_ID, templateId, buildParams(email, otp));
  if (result.status !== 200) throw new Error('Failed to send OTP email. Please try again.');
}

/** Whether EmailJS is fully configured */
export const isEmailConfigured = EMAILJS_CONFIGURED;

// ── Beautiful HTML email template (for reference / self-hosted mail) ──────────
// If you host your own backend, use this template in Nodemailer:

export const getOtpEmailHtml = (toName: string, otp: string, isPasswordReset = false): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${isPasswordReset ? 'Password Reset' : 'Verify your identity'} — ArtForge</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- HEADER -->
        <tr><td style="background:linear-gradient(135deg,#1a1a1a 0%,#0f0f0f 100%);border-radius:20px 20px 0 0;padding:40px 40px 32px;text-align:center;border:1px solid rgba(245,158,11,0.15);border-bottom:none">
          <div style="display:inline-flex;align-items:center;gap:12px;margin-bottom:8px">
            <div style="width:42px;height:42px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:12px;display:flex;align-items:center;justify-content:center">
              <span style="font-size:20px">⚒</span>
            </div>
            <span style="color:#f59e0b;font-size:22px;font-weight:800;letter-spacing:-0.5px">ArtForge</span>
          </div>
          <p style="margin:0;color:#52525b;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:600">
            ${isPasswordReset ? 'Password Reset' : 'Authentication Code'}
          </p>
        </td></tr>

        <!-- BODY -->
        <tr><td style="background:#111111;padding:40px;border:1px solid rgba(245,158,11,0.10);border-top:none;border-bottom:none">
          <p style="margin:0 0 8px;color:#a1a1aa;font-size:15px">Hello, <strong style="color:#e4e4e7">${toName}</strong> 👋</p>
          <p style="margin:0 0 32px;color:#71717a;font-size:14px;line-height:1.7">
            ${isPasswordReset
              ? 'We received a request to reset the password for your ArtForge account. Use the code below to proceed:'
              : 'Use the code below to securely verify your identity and access the ArtForge gallery:'}
          </p>

          <!-- OTP BOX -->
          <div style="background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(245,158,11,0.03));border:2px solid rgba(245,158,11,0.25);border-radius:16px;padding:32px;text-align:center;margin-bottom:32px">
            <p style="margin:0 0 12px;color:#71717a;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-weight:700">Your Verification Code</p>
            <div style="display:inline-block;letter-spacing:14px;font-size:48px;font-weight:900;color:#f59e0b;font-family:'Courier New',monospace;text-shadow:0 0 30px rgba(245,158,11,0.4)">${otp}</div>
            <p style="margin:16px 0 0;color:#52525b;font-size:12px">
              ⏱ Expires in <strong style="color:#f59e0b">5 minutes</strong>
            </p>
          </div>

          <!-- INSTRUCTIONS -->
          <div style="background:rgba(255,255,255,0.02);border-radius:12px;padding:20px;margin-bottom:24px">
            <p style="margin:0 0 10px;color:#a1a1aa;font-size:13px;font-weight:600">How to use:</p>
            <ol style="margin:0;padding-left:20px;color:#71717a;font-size:13px;line-height:1.8">
              <li>Return to the ArtForge authentication screen</li>
              <li>Enter the 6-digit code in the verification boxes</li>
              <li>The code will auto-submit once all digits are entered</li>
            </ol>
          </div>

          <!-- SECURITY NOTICE -->
          <div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);border-radius:12px;padding:16px 20px">
            <p style="margin:0;color:#f87171;font-size:12px;line-height:1.7">
              🛡️ <strong>Security Notice:</strong> ArtForge will never ask for your OTP via phone, chat, or email reply. 
              If you did not request this code, please ignore this email — your account remains secure.
            </p>
          </div>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="background:#0d0d0d;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center;border:1px solid rgba(245,158,11,0.08);border-top:1px solid rgba(255,255,255,0.04)">
          <p style="margin:0 0 8px;color:#3f3f46;font-size:11px">
            © ${new Date().getFullYear()} ArtForge Platform · All rights reserved
          </p>
          <p style="margin:0;color:#27272a;font-size:10px">
            This is an automated security email. Please do not reply.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;
