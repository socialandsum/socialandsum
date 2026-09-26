// Sends the client's signed Terms of Service + Guarantee PDFs to hello@socialandsum.com
// as real email attachments, via Resend (https://resend.com). Runs as a Vercel serverless
// function (this file is auto-detected because it lives in /api).

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
