const nodemailer = require('nodemailer');

// Configure SMTP transporter
let transporter = null;
const isSMTPConfigured =
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS;

if (isSMTPConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('Nodemailer SMTP transporter configured successfully.');
} else {
  console.warn('Nodemailer SMTP details missing in .env. Falling back to terminal email simulation.');
}

/**
 * Base helper to send emails
 */
async function sendEmail({ to, subject, html, text }) {
  const from = process.env.SMTP_FROM || '"InterviewIQ" <no-reply@interviewiq.com>';
  
  if (isSMTPConfigured && transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      console.log(`Email sent successfully: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Failed to send email via SMTP:', error.message);
      logEmailSimulation({ to, subject, html, text });
    }
  } else {
    logEmailSimulation({ to, subject, html, text });
  }
}

function logEmailSimulation({ to, subject, html, text }) {
  console.log('\n==================================================');
  console.log('📧  [SIMULATED EMAIL NOTIFICATION]');
  console.log(`TO:      ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log('--------------------------------------------------');
  console.log(`TEXT CONTENT:\n${text || 'HTML Only'}`);
  console.log('==================================================\n');
}

/**
 * Beautiful HTML email wrapper
 */
function emailTemplateWrapper(content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>InterviewIQ</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #0f172a;
          color: #f8fafc;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #1e293b;
          border: 1px solid #334155;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        }
        .header {
          background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          color: #ffffff;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.025em;
        }
        .content {
          padding: 30px 24px;
          line-height: 1.6;
          color: #cbd5e1;
        }
        .content h2 {
          color: #ffffff;
          font-size: 20px;
          margin-top: 0;
          font-weight: 600;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin-top: 20px;
          margin-bottom: 20px;
          text-align: center;
        }
        .footer {
          background-color: #0f172a;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #64748b;
          border-top: 1px solid #1e293b;
        }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .badge-score {
          background-color: rgba(124, 58, 237, 0.2);
          color: #a78bfa;
          border: 1px solid rgba(124, 58, 237, 0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>InterviewIQ</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} InterviewIQ. All rights reserved.</p>
          <p>Elevate your technical interviewing skills with AI.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 1. Registration Success Email
 */
async function sendWelcomeEmail(user) {
  const subject = 'Welcome to InterviewIQ! 🚀';
  const html = emailTemplateWrapper(`
    <h2>Welcome, ${user.name}!</h2>
    <p>We are thrilled to welcome you to <strong>InterviewIQ</strong>, your personal AI-powered mock interview partner.</p>
    <p>With InterviewIQ, you can:</p>
    <ul>
      <li>Practice subjective questions across multiple technology domains (Frontend, Backend, AI/ML).</li>
      <li>Get real-time, interactive follow-up questions tailored to your answers.</li>
      <li>Receive detailed AI evaluations covering communication and technical depth.</li>
      <li>Analyze your resume against customized job descriptions.</li>
    </ul>
    <p>Kickstart your journey by taking your first mock interview today!</p>
    <div style="text-align: center;">
      <a href="http://localhost:5173/interview/setup" class="btn">Take Mock Interview</a>
    </div>
  `);
  
  const text = `Welcome ${user.name} to InterviewIQ! Start practicing mock interviews here: http://localhost:5173/interview/setup`;
  
  return sendEmail({ to: user.email, subject, html, text });
}

/**
 * 2. Password Reset Email
 */
async function sendPasswordResetEmail(user, token) {
  const subject = 'Reset Your Password - InterviewIQ';
  const resetUrl = `http://localhost:5173/reset-password?token=${token}`;
  
  const html = emailTemplateWrapper(`
    <h2>Reset Password Request</h2>
    <p>Hello ${user.name},</p>
    <p>We received a request to reset your password. Click the button below to choose a new password. This link is valid for 1 hour.</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <p>If you did not make this request, you can safely ignore this email.</p>
  `);

  const text = `Hello ${user.name},\nReset your password here: ${resetUrl}`;

  return sendEmail({ to: user.email, subject, html, text });
}

/**
 * 3. Resume Analysis Complete Email
 */
async function sendResumeAnalysisCompleteEmail(user) {
  const subject = 'Resume Analysis Complete! 📄';
  const html = emailTemplateWrapper(`
    <h2>Resume Analysis Report Ready</h2>
    <p>Hello ${user.name},</p>
    <p>Your resume has been successfully scanned and analyzed by our AI system against your target technical domain.</p>
    <p>You can now log in to view details including matching keywords, missing skills, resume weaknesses, and tailored recommendations.</p>
    <div style="text-align: center;">
      <a href="http://localhost:5173/resumes" class="btn">View Resume Feedback</a>
    </div>
  `);

  const text = `Hello ${user.name},\nYour resume analysis is complete. View details here: http://localhost:5173/resumes`;

  return sendEmail({ to: user.email, subject, html, text });
}

/**
 * 4. Job Match Analysis Complete Email
 */
async function sendJobMatchCompleteEmail(user, score) {
  const subject = `Job Match Analysis Complete - Score: ${score}% 🎯`;
  const html = emailTemplateWrapper(`
    <h2>Job Description Match Analysis</h2>
    <p>Hello ${user.name},</p>
    <p>Your resume has been compared against the pasted job description.</p>
    <p><strong>Overall Match Score: <span style="color:#a78bfa; font-size: 22px;">${score}%</span></strong></p>
    <p>Login to view your full match report detailing matching skills, missing skills, resume strengths, weaknesses, and direct suggestions to tailor your resume.</p>
    <div style="text-align: center;">
      <a href="http://localhost:5173/job-match" class="btn">View Match Analysis</a>
    </div>
  `);

  const text = `Hello ${user.name},\nJob description match analysis completed with score: ${score}%. Details at: http://localhost:5173/job-match`;

  return sendEmail({ to: user.email, subject, html, text });
}

/**
 * 5. Interview Report Approved Email
 */
async function sendReportApprovedEmail(user, interviewDomain, reportScore, feedbackSummary) {
  const subject = 'Interview Report Approved! 🎉';
  const html = emailTemplateWrapper(`
    <h2>Your Mock Interview Report is Approved</h2>
    <p>Hello ${user.name},</p>
    <p>An administrator has reviewed and approved your mock interview report for the domain: <strong>${interviewDomain}</strong>.</p>
    <div style="background-color: #0f172a; padding: 16px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 600;">Overall Score</p>
      <span class="badge badge-score" style="font-size: 24px; padding: 8px 16px;">${reportScore} / 10</span>
      <p style="margin: 16px 0 0 0; font-size: 14px; color: #cbd5e1; font-style: italic;">"${feedbackSummary}"</p>
    </div>
    <p>Head to your dashboard to read full question-by-question assessments, technical accuracy reviews, and communications advice.</p>
    <div style="text-align: center;">
      <a href="http://localhost:5173/reports" class="btn">View Full Report</a>
    </div>
  `);

  const text = `Hello ${user.name},\nYour mock interview report for ${interviewDomain} has been approved with a score of ${reportScore}/10.\nSummary: "${feedbackSummary}"\nView dashboard: http://localhost:5173/reports`;

  return sendEmail({ to: user.email, subject, html, text });
}

/**
 * 6. Account Status Changes (User Blocked/Unblocked)
 */
async function sendAccountStatusEmail(user, status) {
  const subject = `Account Status Update: ${status}`;
  const isBlocked = status === 'BLOCKED';
  
  const html = emailTemplateWrapper(`
    <h2>Account Status Notification</h2>
    <p>Hello ${user.name},</p>
    <p>Your user account status has been updated to <strong>${status}</strong> by a portal administrator.</p>
    ${isBlocked 
      ? `<p style="color: #ef4444;">Your access to mock interviews, resume analyzer, and dashboard features has been suspended. If you believe this is a mistake, please reach out to admin support.</p>`
      : `<p style="color: #10b981;">Your account is fully active. You can now log in and resume using all features.</p>
         <div style="text-align: center;">
           <a href="http://localhost:5173/login" class="btn">Login to Account</a>
         </div>`
    }
  `);

  const text = `Hello ${user.name},\nYour account status is now ${status}.`;

  return sendEmail({ to: user.email, subject, html, text });
}

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendResumeAnalysisCompleteEmail,
  sendJobMatchCompleteEmail,
  sendReportApprovedEmail,
  sendAccountStatusEmail,
};
