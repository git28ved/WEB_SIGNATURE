const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initialize mail transporter
 * Uses env vars if available, otherwise creates an Ethereal test account
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    // Use configured SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback: Ethereal test account (emails viewable at https://ethereal.email)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Using Ethereal test email account:', testAccount.user);
    console.log('   View sent emails at: https://ethereal.email');
  }

  return transporter;
};

/**
 * Send a signature request email
 */
const sendSignatureRequest = async ({
  toEmail,
  docTitle,
  signerName,
  senderName,
  signLink,
}) => {
  try {
    const transport = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || '"DocSign" <noreply@docsign.app>';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:linear-gradient(135deg,#1e293b 0%,#1e1b4b 100%);border-radius:20px;overflow:hidden;border:1px solid rgba(148,163,184,0.15);">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
            ✍️ DocSign
          </h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">
            Signature Request
          </p>
        </div>
        
        <!-- Body -->
        <div style="padding:40px;">
          <h2 style="color:#e2e8f0;margin:0 0 16px;font-size:20px;font-weight:700;">
            Hi ${signerName || 'there'},
          </h2>
          <p style="color:#94a3b8;margin:0 0 24px;font-size:15px;line-height:1.6;">
            <strong style="color:#e2e8f0;">${senderName}</strong> has requested your signature on the following document:
          </p>
          
          <!-- Document Card -->
          <div style="background:rgba(15,23,42,0.6);border:1px solid rgba(148,163,184,0.15);border-radius:12px;padding:20px;margin-bottom:32px;">
            <p style="color:#818cf8;margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
              📄 Document
            </p>
            <p style="color:#f1f5f9;margin:0;font-size:18px;font-weight:700;">
              ${docTitle}
            </p>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${signLink}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 15px rgba(99,102,241,0.4);">
              Review & Sign Document
            </a>
          </div>
          
          <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;">
            If you didn't expect this email, you can safely ignore it. The link above will take you to the document where you can review and place your signature.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="border-top:1px solid rgba(148,163,184,0.1);padding:24px 40px;text-align:center;">
          <p style="color:#475569;margin:0;font-size:12px;">
            Secured with bank-grade encryption • © ${new Date().getFullYear()} DocSign
          </p>
        </div>
      </div>
    </body>
    </html>`;

    const info = await transport.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `📝 ${senderName} requests your signature on "${docTitle}"`,
      html,
    });

    // If using Ethereal, log the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 Email preview URL:', previewUrl);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('Send signature request email error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send a notification when signing is complete
 */
const sendSignatureComplete = async ({ toEmail, docTitle, signerName }) => {
  try {
    const transport = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || '"DocSign" <noreply@docsign.app>';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:linear-gradient(135deg,#1e293b 0%,#1e1b4b 100%);border-radius:20px;overflow:hidden;border:1px solid rgba(148,163,184,0.15);">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;">
            ✅ Signature Complete
          </h1>
        </div>
        
        <!-- Body -->
        <div style="padding:40px;">
          <p style="color:#94a3b8;margin:0 0 24px;font-size:15px;line-height:1.6;">
            Great news! <strong style="color:#e2e8f0;">${signerName}</strong> has signed your document:
          </p>
          
          <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
            <p style="color:#34d399;margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;">
              ✓ Signed
            </p>
            <p style="color:#f1f5f9;margin:0;font-size:18px;font-weight:700;">
              ${docTitle}
            </p>
          </div>
          
          <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;">
            You can download the signed PDF from your DocSign dashboard.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="border-top:1px solid rgba(148,163,184,0.1);padding:24px 40px;text-align:center;">
          <p style="color:#475569;margin:0;font-size:12px;">
            © ${new Date().getFullYear()} DocSign
          </p>
        </div>
      </div>
    </body>
    </html>`;

    const info = await transport.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `✅ "${docTitle}" has been signed by ${signerName}`,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 Email preview URL:', previewUrl);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('Send signature complete email error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendSignatureRequest, sendSignatureComplete };
