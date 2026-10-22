interface Env {
  GEMINI_API_KEY?: string;
  'Gemini-API'?: string;
  [key: string]: any;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    // Read both variable names
    const apiKey = context.env.GEMINI_API_KEY || context.env['Gemini-API'];
    
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Cloudflare में API Key नहीं मिली। Settings -> Variables चेक करें।' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { imageBase64 } = (await context.request.json()) as { imageBase64?: string };
    if (!imageBase64) {
      return new Response(JSON.stringify({ success: false, error: 'फ़ोटो डेटा खाली है।' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const promptText = `Analyze this Indian courier receipt/consignment note carefully. 
Extract real details without hallucination:
{
  "trackingId": "Exact consignment or barcode number on receipt",
  "carrier": "Courier brand (e.g. Trackon Courier, Delhivery, Speed Post, DTDC, Blue Dart, Professional)",
  "isDelivered": true if marked delivered/signed/received, otherwise false,
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
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey 
      },
      body: JSON.stringify(payload),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Gemini API Status ${geminiRes.status}: ${errText.slice(0, 150)}` 
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const geminiData: any = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
    const parsed = JSON.parse(rawText);

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
