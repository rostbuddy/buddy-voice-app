interface Env {
  GEMINI_API_KEY?: string;
  'Gemini-API'?: string;
  [key: string]: any;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    // 1. सारे संभव नामों से Key ढूँढना
    const apiKey = 
      context.env.GEMINI_API_KEY || 
      context.env['Gemini-API'] || 
      context.env.gemini_api_key ||
      context.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      const availableKeys = Object.keys(context.env).filter(k => !k.startsWith('CF_')).join(', ');
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Cloudflare में Key नहीं मिली। मिले हुए नाम: [${availableKeys || 'कोई नहीं'}]` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { imageBase64 } = (await context.request.json()) as { imageBase64?: string };
    if (!imageBase64) {
      return new Response(JSON.stringify({ success: false, error: 'फ़ोटो डेटा नहीं मिला।' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
   const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`; 

    const promptText = `Analyze this Indian courier receipt/parcel label image carefully.
Extract the REAL printed details accurately:
{
  "trackingId": "Exact consignment, barcode or waybill number",
  "carrier": "Courier brand (Delhivery, The Professional Couriers, Trackon, DTDC, Speed Post, Blue Dart)",
  "isDelivered": false,
  "statusText": "रास्ते में है (In Transit)",
  "receiverName": "Name of receiver/consignee if written",
  "receiverPhone": "Phone number if written",
  "destination": "Destination city, state, or PIN code",
  "origin": "Origin hub or city if written",
  "deliveryDate": "Printed date if visible"
}
Return ONLY valid JSON without markdown or code fences.`;

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
        error: `Gemini API Status ${geminiRes.status}: ${errText.slice(0, 120)}` 
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
