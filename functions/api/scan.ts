interface Env {
  GEMINI_API_KEY?: string;
  'Gemini-API'?: string;
  [key: string]: any;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const apiKey = context.env.GEMINI_API_KEY || context.env['Gemini-API'];
    
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'API Key missing in Cloudflare.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { imageBase64 } = (await context.request.json()) as { imageBase64?: string };
    if (!imageBase64) {
      return new Response(JSON.stringify({ success: false, error: 'कृपया फ़ोटो चुनें।' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const promptText = `Analyze this shipping parcel or courier receipt image.
Task:
1. Find the main Consignment / Waybill / Barcode / Tracking Number (it can be 8 to 15 digits or alphanumeric).
2. Detect the courier company (Delhivery, Trackon, India Post / Speed Post, DTDC, Blue Dart, etc.).
3. Check delivery date or booking date.
4. If signed/delivered, status is true, otherwise false.

Respond ONLY with this valid JSON format:
{
  "trackingId": "Number without spaces",
  "carrier": "Courier Name",
  "isDelivered": false,
  "statusText": "रास्ते में है (In Transit)",
  "deliveryDate": "Detected date or today",
  "origin": "मूल केंद्र",
  "destination": "ग्राहक का पता",
  "currentLocation": "ट्रांज़िट हब"
}
If no courier name is found, default to 'भारतीय कूरियर'. If multiple numbers exist, pick the longest barcode/consignment digits.`;

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
        error: `Gemini Error: ${errText.slice(0, 100)}` 
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const geminiData: any = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
    const parsed = JSON.parse(rawText);

    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        trackingId: parsed.trackingId || 'पर्ची सत्यापित',
        carrier: parsed.carrier || 'भारतीय कूरियर',
        isDelivered: !!parsed.isDelivered,
        statusText: parsed.statusText || 'रास्ते में है (In Transit)',
        deliveryDate: parsed.deliveryDate || 'तारीख सत्यापित',
        origin: parsed.origin || 'मूल केंद्र',
        destination: parsed.destination || 'ग्राहक का पता',
        currentLocation: parsed.currentLocation || 'डिलीवरी हब'
      }
    }), {
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
