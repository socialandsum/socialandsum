// Sends a contact-form submission (homepage or /contact.html) to hello@socialandsum.com
// via Resend. Runs as a Vercel serverless function (auto-detected from living in /api).

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

  var name = data.name || '—';
  var email = data.email || '—';
  var message = data.message || '—';

  function esc(s) {
    return String(s == null ? '—' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var html =
    '<p>New contact form submission.</p>' +
    '<p>' +
    'Name: ' + esc(name) + '<br>' +
    'Email: ' + esc(email) +
    '</p>' +
    '<p>' + esc(message).replace(/\n/g, '<br>') + '</p>';

  var fromEmail = process.env.RESEND_FROM_EMAIL || 'Social+Sum Website <onboarding@resend.dev>';
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
        reply_to: email && email.indexOf('@') > -1 ? email : undefined,
        subject: 'Website enquiry from ' + name,
        html: html
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
