export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GOOGLE_VISION_API_KEY is not configured on the server' });
    }

    const raw = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
    const body = raw ? JSON.parse(raw) : {};

    const { requests, imageBase64, features } = body || {};

    const requestBody = requests ? { requests } : {
      requests: [
        {
          image: { content: imageBase64 },
          features: features || [
            { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
            { type: 'TEXT_DETECTION', maxResults: 1 }
          ],
          imageContext: { languageHints: ['ko', 'en'] }
        }
      ]
    };

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const json = await response.json();
    if (!response.ok) {
      const message = json?.error?.message || 'Google Vision API error';
      return res.status(response.status).json({ error: message, responses: json });
    }

    return res.status(200).json(json);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

