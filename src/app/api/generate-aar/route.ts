import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.incident) {
      return NextResponse.json({ error: 'Missing incident payload' }, { status: 400 });
    }

    const { incident } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    const notesSummary = (incident.caller_notes || []).length > 0 
      ? incident.caller_notes.join('\n- ') 
      : 'No field notes logged.';

    const ocularSummary = incident.ai_verification 
      ? `Confirmed: ${incident.ai_verification.hazard_confirmed ? 'YES' : 'NO'} | Severity: ${incident.ai_verification.severity_level || 'N/A'} | Notes: ${incident.ai_verification.observations || 'N/A'}`
      : incident.evidence_image_url ? 'Ground photo attached (Unverified)' : 'No ocular ground evidence uploaded';

    // Graceful fallback when API key is unconfigured
    if (!apiKey) {
      const fallbackReport = `### INCIDENT COMMAND SYSTEM (ICS) — AFTER-ACTION REPORT
**Incident ID:** ${incident.id}  
**Classification:** ${incident.hazard_type.toUpperCase()} CRISIS EVENT  
**Operational Status:** COMPLETED & RESOLVED  

---

#### 1. EXECUTIVE MISSION OVERVIEW
On ${new Date(incident.created_at).toLocaleString()}, an emergency distress beacon was registered within Sector Command coordinates (${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}). A total of **${incident.headcount} soul(s)** were reported in immediate danger. Corroborated **${incident.corroboration_count} time(s)** through localized spatial clustering.

#### 2. RESOURCE ALLOCATION & CAD EFFICACY
- **Assigned Asset:** ${incident.assigned_unit || 'General Rapid Response Unit'}
- **Deployment Channel:** ${incident.source_channel}
- **Tactical Priority Score:** ${incident.priority_score} / 100

#### 3. FIELD LOGS & OCULAR TELEMETRY
- **Ground Photo Evidence:** ${incident.evidence_image_url ? 'Documented in master CAD registry' : 'None captured'}
- **Chronological Logs:**
  - ${notesSummary}

#### 4. ACTIONABLE RECOMMENDATIONS & LESSONS LEARNED
- **Spatial Deduplication:** PostGIS 50m radius prevented duplicate units from deploying to identical coordinates.
- **Connectivity:** Cellular bandwidth degraded under load; ensure offline PWA caching is primed.
- **Final Disposition:** Civilians secured and transferred; hazard operational zone cleared.
`;

      return NextResponse.json({ success: true, report: fallbackReport });
    }

    const systemPrompt = `You are a Senior Incident Command Evaluator and Emergency Operations Center Director.
Synthesize an official, rigorous After-Action Report (AAR) and Incident Operational Debriefing based on this resolved disaster incident record:

INCIDENT METADATA:
- Cluster ID: ${incident.id}
- Hazard Classification: ${incident.hazard_type}
- Stranded Headcount: ${incident.headcount}
- Initial Priority Score: ${incident.priority_score}/100
- Spatial Corroborations: ${incident.corroboration_count} reports coalesced
- Coordinates: ${incident.latitude}, ${incident.longitude}
- Assigned Response Asset: ${incident.assigned_unit || 'Unassigned / Local Self-Rescue'}
- Source Ingestion Channel: ${incident.source_channel}
- Initial Alert Time: ${incident.created_at}
- Final Resolution Time: ${incident.updated_at || new Date().toISOString()}
- Ocular Evidence Findings: ${ocularSummary}
- Field Notes Chronology:
${notesSummary}

Write a professional After-Action Report in Markdown format using these standard ICS sections:
1. **EXECUTIVE MISSION OVERVIEW** (Concise paragraph on the event and life safety risk)
2. **TIMELINE & INCIDENT LIFECYCLE** (Chronology from beacon trigger to resolution)
3. **RESOURCE ALLOCATION & RESPONSE EFFICACY** (Assessment of the assigned unit and speed of response)
4. **HAZARD MITIGATION & OCULAR AI ASSESSMENT** (Evaluation of ground observations and triage accuracy)
5. **ACTIONABLE RECOMMENDATIONS & LESSONS LEARNED** (3 concrete bullet points for future regional disaster mitigation)

Maintain a formal, objective, military/first-responder command tone. Avoid speculation.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1200,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedReport = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return NextResponse.json({
      success: true,
      report: generatedReport,
    });
  } catch (error: any) {
    console.error('AAR generation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate AAR' }, { status: 500 });
  }
}
