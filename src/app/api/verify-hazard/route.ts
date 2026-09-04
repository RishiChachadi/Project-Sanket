import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const { incidentId, imageUrl, reportedHazard } = await req.json();

    if (!incidentId || !imageUrl) {
      return NextResponse.json({ error: 'Missing incidentId or imageUrl' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured. Falling back to default verified status.');
      return NextResponse.json({ status: 'SKIPPED_NO_KEY' });
    }

    // 1. Fetch image buffer from Supabase Storage
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error('Failed to retrieve image from storage');
    const arrayBuffer = await imageRes.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageRes.headers.get('content-type') || 'image/webp';

    // 2. Multimodal Vision Analysis Prompt
    const prompt = `You are a disaster damage assessment AI. Analyze this emergency distress ground photo.
The user reported the hazard as: "${reportedHazard}".
Evaluate if the image depicts genuine emergency conditions (flood, fire, smoke, structural collapse, medical injury).

Respond ONLY with a valid JSON object matching this schema:
{
  "hazard_confirmed": boolean,
  "detected_hazard": "Flood" | "Fire" | "Collapse" | "Medical" | "None",
  "severity_level": "LOW" | "MODERATE" | "CRITICAL",
  "severity_boost": number (0 to 30),
  "observations": "Brief 1-2 sentence assessment of physical ground reality."
}`;

    // 3. Query Gemini 2.5 Flash
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${errText}`);
    }

    const geminiData = await response.json();
    const rawContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    const analysis = JSON.parse(rawContent);

    // 4. Retrieve current priority score
    const { data: currentRecord } = await supabase
      .from('distress_incidents')
      .select('priority_score, caller_notes')
      .eq('id', incidentId)
      .single();

    const oldScore = currentRecord?.priority_score || 50;
    const boost = analysis.hazard_confirmed ? (analysis.severity_boost || 20) : 0;
    const newScore = Math.min(100, oldScore + boost);

    const updatedNotes = currentRecord?.caller_notes || [];
    if (analysis.hazard_confirmed) {
      updatedNotes.push(`AI Ocular Verification: ${analysis.observations}`);
    }

    // 5. Update Postgres record
    const { error: updateError } = await supabase
      .from('distress_incidents')
      .update({
        evidence_image_url: imageUrl,
        priority_score: newScore,
        ai_verification: {
          ...analysis,
          verified_at: new Date().toISOString(),
        },
        caller_notes: updatedNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', incidentId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, analysis, newScore });
  } catch (error: any) {
    console.error('Vision triage error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
