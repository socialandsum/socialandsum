// Sends the client's signed Terms of Service + Guarantee PDFs to hello@socialandsum.com
// as real email attachments, via Resend (https://resend.com). Runs as a Vercel serverless
// function (this file is auto-detected because it lives in /api).
//
// Why this exists instead of doing it straight from the browser: EmailJS's client-side
// attachment feature kept hitting its request-size limit, even after the PDF was heavily
// shrunk and compressed. Sending from a server function means the email provider (Resend)
// receives one clean request with generous attachment limits (40MB), rather than a browser
// trying to squeeze a base64 file through a public API with an undocumented cap.
//
// Setup required (see the reply in the conversation this shipped with):
//   1. A free Resend account (resend.com) and an API key.
//   2. That key saved as the RESEND_API_KEY environment variable in Vercel
//      (Project Settings -> Environment Variables).
//   3. Ideally, socialandsum.com verified as a sending domain in Resend, so the "from"
//      address below can be an @socialandsum.com one instead of the resend.dev sandbox one.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  var data = req.body || {};

  var RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    res.status(500).send('Email service is not configured yet (missing RESEND_API_KEY environment variable in Vercel).');
    return;
  }

  var studio = data.studio || '—';
  var name = data.name || '—';
  var email = data.email || '—';
  var phone = data.phone || '—';
  var tosSigned = data.tos_signed || '—';
  var gSigned = data.g_signed || '—';
  var date = data.date || '—';

  var attachments = [];
  if (data.pdf_tos_base64 && data.pdf_tos_name) {
    attachments.push({ filename: data.pdf_tos_name, content: data.pdf_tos_base64, content_type: 'application/pdf' });
  }
  if (data.pdf_guarantee_base64 && data.pdf_guarantee_name) {
    attachments.push({ filename: data.pdf_guarantee_name, content: data.pdf_guarantee_base64, content_type: 'application/pdf' });
  }

  function esc(s) {
    return String(s == null ? '—' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var html =
    '<p>New onboarding submission — signed documents attached.</p>' +
    '<p>' +
    'Studio: ' + esc(studio) + '<br>' +
    'Contact: ' + esc(name) + '<br>' +
    'Email: ' + esc(email) + '<br>' +
    'Phone: ' + esc(phone) + '<br>' +
    'Terms signed: ' + esc(tosSigned) + '<br>' +
    'Guarantee signed: ' + esc(gSigned) + '<br>' +
    'Date: ' + esc(date) +
    '</p>';

  // FROM_EMAIL can be overridden with an environment variable once socialandsum.com is
  // verified in Resend (e.g. "Social+Sum <onboarding@socialandsum.com>"). Until then this
  // falls back to Resend's shared sandbox sender, which only reliably delivers to the email
  // address the Resend account itself was signed up with.
  var fromEmail = process.env.RESEND_FROM_EMAIL || 'Social+Sum Onboarding <onboarding@resend.dev>';
  var toEmail = process.env.RESEND_TO_EMAIL || 'hello@socialandsum.com';

  try {
    var resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: 'New onboarding submission — signed documents',
        html: html,
        attachments: attachments
      })
    });
    var text = await resp.text();
    if (!resp.ok) {
      res.status(502).send('Resend rejected the request: ' + text);
      return;
    }
    res.status(200).send(text);
  } catch (e) {
    res.status(500).send('Send failed: ' + e.message);
  }
};
