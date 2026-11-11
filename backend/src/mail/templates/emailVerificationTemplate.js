export const otpTemplate = (otp, purpose = 'LOGIN') => {
  const isSignup = purpose === 'SIGNUP';
  const heading = isSignup ? 'Welcome to The Road Eagle!' : 'Your Verification Code';
  const description = isSignup
    ? 'Thank you for choosing The Road Eagle - Premium Bike Rentals. Please use the following One-Time Password (OTP) to complete your account registration.'
    : 'Use the following One-Time Password (OTP) to securely sign in to your Road Eagle Bike Rentals account.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Road Eagle - OTP Verification</title>
  <style>
    body {
      background-color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #e2e8f0;
    }
    .wrapper {
      max-width: 580px;
      margin: 30px auto;
      background: #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      border: 1px solid #334155;
    }
    .header {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 36px 28px;
      text-align: center;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 12px;
    }
    .intro {
      font-size: 15px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 28px;
    }
    .otp-card {
      background: #0f172a;
      border: 2px dashed #f97316;
      border-radius: 12px;
      padding: 24px 20px;
      display: inline-block;
      margin-bottom: 24px;
      min-width: 240px;
    }
    .otp-label {
      font-size: 12px;
      font-weight: 700;
      color: #f97316;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }
    .otp-code {
      font-size: 38px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 10px;
      margin: 0;
      font-family: 'Courier New', Courier, monospace;
    }
    .expiry {
      font-size: 13px;
      color: #fb923c;
      font-weight: 600;
      margin-top: 10px;
    }
    .notice {
      font-size: 13px;
      line-height: 1.5;
      color: #64748b;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #334155;
    }
    .footer {
      background: #090d16;
      padding: 20px 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
    .footer a {
      color: #f97316;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>THE ROAD EAGLE</h1>
      <p>Self-Drive Bike & Scooter Rentals</p>
    </div>
    <div class="content">
      <div class="greeting">${heading}</div>
      <div class="intro">${description}</div>

      <div class="otp-card">
        <div class="otp-label">One-Time Password (OTP)</div>
        <div class="otp-code">${otp}</div>
        <div class="expiry">⏱ Valid for 5 minutes only</div>
      </div>

      <div class="notice">
        If you did not request this OTP, please ignore this email or contact support immediately. Never share your OTP with anyone.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} The Road Eagle. All rights reserved.<br/>
      Need help? Contact us at <a href="mailto:support@theroadeagle.com">support@theroadeagle.com</a>
    </div>
  </div>
</body>
</html>`;
};

export default otpTemplate;
