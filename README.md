<div align="center">

# 🚨 PROJECT SANKET (ಸಂಕೇತ್)
### High-Availability, Low-Bandwidth Crisis Response & Computer-Aided Dispatch (CAD) System

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20PostGIS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-Vision_AI-8E75B2?style=for-the-badge&logo=google-gemini&logoColor=white)](https://aistudio.google.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-Vector_Mapping-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![PWA](https://img.shields.io/badge/PWA-Offline_First-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

<p align="center">
  <strong>Engineered for catastrophic urban grid failures, cell-tower saturation, and life-critical search & rescue operations.</strong>
</p>

[Citizen PWA (`/victim`)](#-citizen-distress-pwa-victim) • [ICS Command Center (`/rescuer`)](#-incident-command-system-cad-rescuer) • [Architecture](#-architecture--data-flow) • [Quickstart](#-installation--deployment)

---

</div>

## 📌 Executive Summary

During cloudbursts, severe flash floods, and structural collapses, traditional emergency hotlines (e.g., 112/911) face immediate telecom queue saturation, while native apps stall trying to upload heavy multi-megabyte media over degraded 2G/EDGE uplinks. 

**Project Sanket** addresses this crisis communication bottleneck through:
1. **Zero-Latency Asymmetric Transmission:** The distress beacon ($<1\text{ KB}$ JSON payload with locked GPS and primary hazard) transmits instantaneously with zero barrier to entry.
2. **Deterministic UX & Vernacular Triage:** Native **English**, **ಕನ್ನಡ (Kannada)**, and **हिंदी (Hindi)** interfaces paired with ISO 22324 color conditioning (🌊 Flood, 🔥 Fire, 🏚️ Trapped, 🚑 Medical) bypass language and cognitive panics.
3. **Spatial Deduplication & Corroboration Engine:** PostGIS clustering automatically coalesces pings within a 50-meter radius into singular, corroboration-weighted tactical clusters ($2\times, 5\times$) to prevent command board flooding.
4. **Asynchronous Ocular Ground Verification:** Client-side HTML5 canvas micro-compression reduces photos to $\sim 35\text{ KB}$ WebP blobs, triggering Gemini 2.5 Flash multimodal AI to analyze ground severity and boost triage scores without blocking the original alert.
5. **Computer-Aided Dispatch (CAD) & Safe Havens:** A Common Operating Picture for Incident Commanders providing real-time vector hazard pins, aggregate soul counts, and automated evacuation routing to designated safe assembly shelters.

---

## 🏛️ System Architecture

```
[ CITIZEN DISTRESS PWA ]
    │
    ├── Stage 1: Immediate SOS (<1 KB JSON)
    │     │
    │     ├──► Supabase RPC (PostGIS Deduplication: 50m cluster window)
    │     │      │
    │     │      └──► `distress_incidents` (Status: 'pending', Base Score: 50–75)
    │     │
    │     └──► Network Failure Fallback ──► Native SMS 112 Synthesizer
    │
    └── Stage 2: Progressive Enrichment & Ocular Evidence (Optional)
          │
          ├── Client-Side Canvas WebP Compression (<35 KB, max-dim 800px)
          ├── Direct Upsert to Supabase Storage (`incident-evidence`)
          └── POST /api/verify-hazard
                │
                ├──► Google Gemini 2.5 Flash Vision API (Multimodal Analysis)
                │      ├── Damage assessment, water line depth, trapped recognition
                │      └── Structured JSON extraction (Severity Boost: +0 to +30)
                │
                └──► Realtime Postgres UPDATE (Score Elevation & Observation Logs)
                            │
                            ▼ WebSocket Push
[ INCIDENT COMMAND SYSTEM (CAD) DASHBOARD ]
    │
    ├── Live Vector Map (Custom SVG Pins + Corroboration Badges + Camera Indicators)
    ├── Situational Aggregates (Total Souls, Critical Hotspots, Active Clusters)
    ├── Safe Assembly Haven CAD Routing (Haversine Distance & Evacuation Nav)
    └── Public Alert Broadcast Engine (WebSocket PUSH + Haptic Alert Vibration)
```

---

## 🚀 Core Pillars & Capabilities

### 📱 Citizen Distress PWA (`/victim`)
* **1-Tap Distress Beacon:** Instantaneous coordinate locking via the HTML5 Geolocation API with graceful fallback to municipal sector coordinates.
* **Vernacular Switching Engine:** On-the-fly toggling between **English**, **ಕನ್ನಡ**, and **हिंदी** across all triage steps, prompts, and emergency warnings.
* **Chromatic Hazard Conditioning:**
  * 🌊 **Rising Flood:** Cobalt Blue theme (`#2563eb`)
  * 🔥 **Active Fire:** Crimson Red theme (`#dc2626`)
  * 🏚️ **Trapped / Collapse:** Structural Amber theme (`#d97706`)
  * 🚑 **Medical Urgent:** Trauma Emerald theme (`#059669`)
* **Micro-Compressed Ocular Evidence:** Browser-level downscaling converts multi-megabyte device photos to lightweight $\sim 35\text{ KB}$ WebP files for rapid upload even on throttled 2G networks.
* **Deep Battery Preservation Mode:** OLED-black screen mode (`#000000`) halts background location polling and drops CPU usage while maintaining live WebSocket tracking for en-route rescue updates.
* **112 Redundant SMS Link:** Dynamic URI string generation prepopulates structured disaster metadata into SMS payloads when internet data links fail entirely.

### 🛡️ Incident Command System CAD (`/rescuer`)
* **Live Situational Aggregates Bar:** Real-time computation of:
  * **Stranded Souls:** Cumulative headcount ($\sum \text{headcount}$) across active clusters.
  * **Critical Priority ($\ge 75$):** Active high-risk operations requiring immediate deployment.
  * **Corroborated Hotspots ($> 1\times$):** Clusters confirmed by multiple reporting citizens.
  * **Active Response Units:** Responders dispatched and actively engaged on scene.
* **Tactical SVG Hazard Pins:** Vector teardrop map markers featuring centered hazard emojis, multi-corroboration counters, pulse animations for critical alerts, and camera badges (`📷`) for visual evidence.
* **Ocular Evidence Lightbox:** Clickable in-popup thumbnails and dispatch cards displaying ground imagery alongside Gemini AI assessments (`hazard_confirmed`, `severity_boost`, `observations`).
* **Safe Haven Evacuation Routing:** Automated calculation of the closest safe assembly shelter (e.g., Stadiums, Disaster Relief Grounds) using the Haversine distance formula with instant external routing links.
* **Mass Public Advisory Broadcast:** Dispatchers can push evacuation alerts via WebSockets to all connected citizen PWAs with synchronized device vibration patterns.
* **Audit-Ready Data Export:** One-click CSV generation exporting cluster IDs, coordinates, corroboration counts, field notes, and evidence URLs for post-incident review.

---

## 🛠️ Technology Stack

| Domain | Technology | Implementation Details |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 15 (App Router)** | Server & Client Components, PWA Service Worker caching |
| **Language** | **TypeScript** | Strict compile-time typing for telemetry and state payloads |
| **Styling** | **Tailwind CSS** | High-contrast tactical themes, responsive mobile-first layouts |
| **Spatial Database** | **Supabase (PostgreSQL 15)** | PostGIS extension, Row-Level Security, Spatial indexing |
| **Realtime Transport** | **Supabase Realtime** | WebSocket subscriptions listening to database `INSERT`/`UPDATE` |
| **Object Storage** | **Supabase Storage** | `incident-evidence` public bucket for compressed field photos |
| **Vision AI** | **Google Gemini 2.5 Flash** | Multimodal damage inspection & structured JSON extraction |
| **Mapping Engine** | **Leaflet & React-Leaflet** | Dynamic OpenStreetMap vector tile rendering with custom SVG DOM markers |
| **Icons & Audio** | **Lucide React & Web Audio API**| Tactical alert chimes and crisis status iconography |

---

## 💾 Database Schema & PostGIS Logic

### Spatial Table Definition (`distress_incidents`)

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE distress_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geog GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) STORED,
  hazard_type TEXT NOT NULL,
  headcount INT DEFAULT 1,
  priority_score INT DEFAULT 50,
  corroboration_count INT DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'dispatched', 'resolved')),
  evidence_image_url TEXT,
  ai_verification JSONB DEFAULT NULL,
  caller_notes TEXT[] DEFAULT '{}',
  source_channel TEXT DEFAULT 'PWA',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_distress_incidents_geog ON distress_incidents USING GIST(geog);
CREATE INDEX idx_distress_incidents_status ON distress_incidents(status);
```

### 50-Meter Spatial Deduplication Function (`ingest_distress_report`)

```sql
CREATE OR REPLACE FUNCTION ingest_distress_report(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_hazard TEXT,
  p_headcount INT DEFAULT 1,
  p_note TEXT DEFAULT '',
  p_source TEXT DEFAULT 'WEB_PWA'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_incident_id UUID;
  v_existing_score INT;
BEGIN
  -- Search for active incident within 50 meters
  SELECT id, priority_score INTO v_incident_id, v_existing_score
  FROM distress_incidents
  WHERE status != 'resolved'
    AND ST_DWithin(
      geog,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      50
    )
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_incident_id IS NOT NULL THEN
    -- Update existing cluster: increment corroboration and append notes
    UPDATE distress_incidents
    SET
      hazard_type = p_hazard,
      corroboration_count = corroboration_count + 1,
      headcount = GREATEST(headcount, p_headcount),
      priority_score = LEAST(100, v_existing_score + 10),
      caller_notes = array_append(caller_notes, p_note),
      updated_at = NOW()
    WHERE id = v_incident_id;

    RETURN v_incident_id;
  ELSE
    -- Insert new cluster record
    INSERT INTO distress_incidents (
      latitude, longitude, hazard_type, headcount,
      priority_score, source_channel, caller_notes
    ) VALUES (
      p_lat, p_lng, p_hazard, p_headcount,
      CASE 
        WHEN p_hazard = 'Medical' THEN 75
        WHEN p_hazard = 'Fire' THEN 70
        ELSE 50
      END,
      p_source, ARRAY[p_note]
    )
    RETURNING id INTO v_incident_id;

    RETURN v_incident_id;
  END IF;
END;
$$;
```

---

## ⚡ Installation & Deployment

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/project-sanket.git](https://github.com/your-username/project-sanket.git)
cd project-sanket
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=[https://your-supabase-project-id.supabase.co](https://your-supabase-project-id.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Google AI Studio API Key (for Multimodal Damage Triage)
GEMINI_API_KEY=AIzaSy...
```

### 3. Apply Database Migrations
1. Open your **Supabase Dashboard** $\to$ **SQL Editor**.
2. Run the SQL schema and functions defined in the [Database Schema](#-database-schema--postgis-logic) section.
3. Configure the Storage Bucket:
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('incident-evidence', 'incident-evidence', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow Public Uploads" ON storage.objects 
FOR INSERT TO public WITH CHECK (bucket_id = 'incident-evidence');

CREATE POLICY "Allow Public Select" ON storage.objects 
FOR SELECT TO public USING (bucket_id = 'incident-evidence');

ALTER TABLE distress_incidents REPLICA IDENTITY FULL;
```

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000/victim](http://localhost:3000/victim) for the Citizen SOS PWA and [http://localhost:3000/rescuer](http://localhost:3000/rescuer) for the CAD Command Center.

### 5. Deploy to Vercel
```bash
npx vercel env add GEMINI_API_KEY production
npx vercel --prod
```

---

## 🧭 Operational Field Protocol

```
+-----------------------------------------------------------------------------------+
|                              INCIDENT RESPONSE CYCLE                              |
+-----------------------------------------------------------------------------------+
|  1. SIGNAL LOCK    | Victim triggers SOS; GPS lock verified; beacon queued.       |
|  2. CLUSTER DEDUP  | PostGIS groups reports within 50m into a single incident.    |
|  3. ASYNC AI AUDIT | Micro-compressed photo evaluated by Gemini 2.5 Flash.        |
|  4. CAD DISPATCH   | Incident Commander stages rescue boat/engine on map board.   |
|  5. SAFE PASSAGE   | Victims routed to nearest designated Evacuation Haven.       |
|  6. RESOLUTION     | Responders clear cluster; client displays auto-reset timer.  |
+-----------------------------------------------------------------------------------+
```

---

