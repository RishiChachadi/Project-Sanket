import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

// Registry of physical ESP32 gateway drop-locations
const GATEWAY_COORDINATES: Record<string, { lat: number; lng: number; sector: string }> = {
  ESP_GATEWAY_01: { lat: 12.9716, lng: 77.5946, sector: 'City Center Command Hub' },
  ESP_GATEWAY_02: { lat: 12.9176, lng: 77.6238, sector: 'Silk Board Transit Relay' },
  ESP_GATEWAY_03: { lat: 13.0285, lng: 77.5197, sector: 'Peenya Industrial Node' },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { node_id, victim_ip, priority, location, survivors, details } = body;

    if (!node_id || !priority) {
      return NextResponse.json({ error: 'Invalid ESP32 telemetry packet' }, { status: 400 });
    }

    // 1. Resolve Anchor Coordinates for the Gateway Node
    const anchor = GATEWAY_COORDINATES[node_id] || { 
      lat: 12.9716, 
      lng: 77.5946, 
      sector: 'Forward Operating Drop-Node' 
    };

    // 2. Map textual priority to Sanket triage score & hazard classification
    let priorityScore = 60;
    let hazardType = 'Trapped';

    const pUpper = (priority || '').toUpperCase();
    if (pUpper.includes('LIFE') || pUpper.includes('THREAT') || pUpper.includes('CRITICAL')) {
      priorityScore = 95;
    } else if (pUpper.includes('HIGH')) {
      priorityScore = 80;
    } else if (pUpper.includes('MED')) {
      priorityScore = 65;
    }

    const dLower = (details || '').toLowerCase();
    if (dLower.includes('water') || dLower.includes('flood') || dLower.includes('drown')) {
      hazardType = 'Flood';
    } else if (dLower.includes('fire') || dLower.includes('smoke') || dLower.includes('burn')) {
      hazardType = 'Fire';
    } else if (dLower.includes('bleed') || dLower.includes('heart') || dLower.includes('medical') || dLower.includes('unconscious')) {
      hazardType = 'Medical';
    }

    // 3. Format Field Notes
    const formattedNotes = [
      `[ESP32 OFFLINE AP] Relay: ${node_id} (Client IP: ${victim_ip || 'unknown'})`,
      `Local Pinpoint: ${location || 'Unspecified Micro-Location'}`,
      `Reported Details: ${details || 'No additional field remarks'}`,
    ];

    // 4. Ingest into Supabase PostGIS
    const { data, error } = await supabase
      .from('distress_incidents')
      .insert([
        {
          latitude: anchor.lat,
          longitude: anchor.lng,
          geom: `POINT(${anchor.lng} ${anchor.lat})`,
          hazard_type: hazardType,
          headcount: Number(survivors) || 1,
          priority_score: priorityScore,
          status: 'pending',
          source_channel: 'ESP32_CAPTIVE_AP',
          caller_notes: formattedNotes,
          battery_level: null,
          corroboration_count: 1,
        },
      ])
      .select();

    if (error) {
      console.error('Database ingestion failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, incident: data?.[0] });
  } catch (err: any) {
    console.error('API Gateway Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
