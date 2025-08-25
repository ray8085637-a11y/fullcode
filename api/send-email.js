export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'SENDGRID_API_KEY is not configured on the server' });
    }

    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });

    const { toEmails, subject, content, contentType = 'text/plain', fromEmail, fromName } = body || {};
    if (!toEmails || !subject || !content) {
      return res.status(400).json({ error: 'Missing required fields: toEmails, subject, content' });
    }

    const recipients = Array.isArray(toEmails) ? toEmails : [toEmails];

    const emailData = {
      personalizations: [{
        to: recipients.map(email => ({ email })),
        subject
      }],
      from: {
        email: fromEmail || 'noreply@watercharging.com',
        name: fromName || 'Water TT 관리시스템'
      },
      content: [{
        type: contentType,
        value: content
      }]
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText || 'SendGrid request failed' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

