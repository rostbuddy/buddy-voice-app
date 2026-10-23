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
        error: 'Cloudflare में API Key नहीं मिली।' 
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

    const promptText = `Analyze this Indian courier receipt/consignment note/shipping label carefully.
Target couriers: Delhivery, Trackon, India Post / Speed Post, DTDC, Blue Dart, Professional Couriers, etc.

Instructions:
1. Extract the main tracking number:
   - For Delhivery: Look for the Waybill number or barcode number (digits like 12 to 14 numbers).
   - For Trackon: Look for 9-digit consignment number (e.g. starting with 208..., 101...).
   - For Speed Post: Look for 13-character alphanumeric (e.g. EU123456789IN).
   - If unsure, pick ANY prominent barcode/consignment number printed on the slip.
2. Identify the Courier Company.
3. Detect booking date or delivery date.
4. If signed/stamped delivered, set isDelivered to true, else false.

Return STRICTLY a JSON object with this format:
{
  "trackingId": "extracted digits/string without spaces",
  "carrier": "Courier Company Name",
  "isDelivered": false,
  "statusText": "रास्ते में है (In Transit)",
  "deliveryDate": "Extracted date or current date",
  "origin": "Origin hub",
  "destination": "Destination city",
  "currentLocation": "ट्रांज़िट हब"
}
Output ONLY raw valid JSON.`;

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

    if (!parsed.trackingId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'पर्ची से नंबर नहीं पढ़ा जा सका। कृपया कैमरे से बिल्कुल सीधी और साफ़ फ़ोटो लें।' 
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
