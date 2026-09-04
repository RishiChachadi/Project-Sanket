import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MOCK_INCIDENTS = [
  { lat: 12.9716, lng: 77.5946, hazard: 'Flood', headcount: 4, note: 'Water entered basement parking, 4 people stranded', source: 'PWA_DIRECT' },
  { lat: 12.9780, lng: 77.6020, hazard: 'Fire', headcount: 2, note: 'Transformer burst near commercial complex, active flames', source: 'PWA_DIRECT' },
  { lat: 12.9352, lng: 77.6245, hazard: 'Medical', headcount: 1, note: 'Elderly patient requires oxygen concentrator power backup', source: 'PWA_DIRECT' },
  { lat: 12.9250, lng: 77.5938, hazard: 'Trapped', headcount: 6, note: 'Roof sheet collapse blocking emergency exit stairway', source: 'LORA_GATEWAY' },
  { lat: 12.9915, lng: 77.5712, hazard: 'Flood', headcount: 3, note: 'Stormwater overflow, 3 ft deep water inside residence', source: 'PWA_DIRECT' },
  { lat: 13.0034, lng: 77.5645, hazard: 'Medical', headcount: 2, note: 'Flash flood injury, deep laceration needing suture kit', source: 'LORA_GATEWAY' },
  { lat: 12.9611, lng: 77.6387, hazard: 'Fire', headcount: 5, note: 'Residential kitchen LPG leak ignited', source: 'PWA_DIRECT' },
];

async function seed() {
  console.log('Seeding disaster incidents into Supabase...');

  for (const inc of MOCK_INCIDENTS) {
    const { error } = await supabase.rpc('ingest_distress_report', {
      p_lat: inc.lat,
      p_lng: inc.lng,
      p_hazard: inc.hazard,
      p_headcount: inc.headcount,
      p_note: inc.note,
      p_source: inc.source
    });

    if (error) {
      console.error(`Failed to seed ${inc.hazard}:`, error.message);
    } else {
      console.log(`[OK] Ingested ${inc.hazard} incident at (${inc.lat}, ${inc.lng})`);
    }
  }

  console.log('Seeding complete! Check your /rescuer command dashboard.');
}

seed();
