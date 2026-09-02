import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendContactFormEmail({
  name,
  businessName,
  email,
  phone,
  message,
}: {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  message: string;
}) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: 'reviewtaps77@gmail.com',
    replyTo: email,
    subject: `ReviewTap Contact Form - ${businessName}`,
    text: [
      `Full Name: ${name}`,
      `Business Name: ${businessName}`,
      `Email: ${email}`,
      `Phone Number: ${phone}`,
      '',
      'Message:',
      message,
    ].join('\n'),
  });
}

export async function sendWelcomeEmail({
  to,
  businessName,
  loginId,
  tempPassword,
  dashboardUrl,
}: {
  to: string;
  businessName: string;
  loginId: string;
  tempPassword: string;
  dashboardUrl: string;
}) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `Welcome to ReviewTap - ${businessName}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0;">ReviewTap</h1>
          <p style="color: #64748b; margin-top: 4px;">Turn Every Customer Experience Into a Review</p>
        </div>
        <h2 style="color: #0f172a;">Welcome, ${businessName}!</h2>
        <p style="color: #334155;">Your ReviewTap account has been created. Here are your login details:</p>
        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <p style="margin: 4px 0;"><strong>Login ID:</strong> ${loginId}</p>
          <p style="margin: 4px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p style="margin: 4px 0;"><strong>Dashboard:</strong> <a href="${dashboardUrl}">${dashboardUrl}</a></p>
        </div>
        <p style="color: #334155;">Please change your password after first login.</p>
        <h3 style="color: #0f172a;">Getting Started:</h3>
        <ol style="color: #334155;">
          <li>Log in to your dashboard</li>
          <li>Set up your business profile (logo, colors, Google Review URL)</li>
          <li>Add your employees</li>
          <li>Generate and print QR codes</li>
          <li>Start collecting reviews!</li>
        </ol>
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} ReviewTap. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'ReviewTap - Password Reset',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0;">ReviewTap</h1>
        </div>
        <h2 style="color: #0f172a;">Password Reset Request</h2>
        <p style="color: #334155;">Click the button below to reset your password. This link expires in 1 hour.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset Password</a>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendSubscriptionNotification({
  to,
  businessName,
  plan,
  expiryDate,
  status,
}: {
  to: string;
  businessName: string;
  plan: string;
  expiryDate: string;
  status: string;
}) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `ReviewTap - Subscription ${status === 'active' ? 'Activated' : 'Updated'} for ${businessName}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0;">ReviewTap</h1>
        </div>
        <h2 style="color: #0f172a;">Subscription Update</h2>
        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <p style="margin: 4px 0;"><strong>Business:</strong> ${businessName}</p>
          <p style="margin: 4px 0;"><strong>Plan:</strong> ${plan}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> ${status}</p>
          <p style="margin: 4px 0;"><strong>Valid Until:</strong> ${expiryDate}</p>
        </div>
      </div>
    `,
  });
}
