interface Env {
  GEMINI_API_KEY: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'GEMINI_API_KEY set nahi hai.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { imageBase64 } = (await context.request.json()) as { imageBase64?: string };
    if (!imageBase64) {
      return new Response(JSON.stringify({ success: false, error: 'Photo data nahi mila.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const promptText = `Analyze this Indian courier receipt/slip carefully.
Extract the REAL details without hallucination or dummy data:
{
  "trackingId": "Exact consignment / barcode number on receipt",
  "carrier": "Courier brand (e.g. Trackon Courier, Delhivery, Speed Post, DTDC, Blue Dart, Professional)",
  "isDelivered": true if marked delivered/signed, otherwise false,
  "statusText": "Short status in Hindi (सफलतापूर्वक डिलीवर or रास्ते में है)",
  "deliveryDate": "Exact date printed on slip",
  "origin": "Origin hub/city",
  "destination": "Destination city/address",
  "currentLocation": "Delivery Hub"
}
Return ONLY pure JSON.`;

    const payload = {
      contents: [
        {
          parts: [
            { text: promptText },
            { inline_data: { mime_type: 'image/jpeg', data: cleanBase64 } },
          ],
        },
      ],
      generationConfig: { response_mime_type: 'application/json' },
    };

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(JSON.stringify({ success: false, error: 'Gemini API Error: ' + errText }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
    const parsed = JSON.parse(rawText);

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
