import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const geocodeCache = new Map<string, { locality: string; fullAddress: string }>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Missing lat or lng parameter' }, { status: 400 });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const cacheKey = `${parsedLat.toFixed(4)},${parsedLng.toFixed(4)}`;
    if (geocodeCache.has(cacheKey)) {
      return NextResponse.json(geocodeCache.get(cacheKey));
    }

    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${parsedLat}&lon=${parsedLng}`;
    
    const response = await fetch(osmUrl, {
      headers: {
        'User-Agent': 'ProjectSanket-CAD/1.0 (disaster-response-system)',
        'Accept-Language': 'en',
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return NextResponse.json({ 
        locality: `Sector (${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)})`,
        fullAddress: ''
      });
    }

    const data = await response.json();
    const addr = data.address || {};

    const primary = addr.neighbourhood || addr.suburb || addr.residential || addr.road || addr.village;
    const secondary = addr.city_district || addr.subdistrict || addr.city || addr.town;

    const parts = [primary, secondary].filter(Boolean);
    const locality = parts.length > 0 
      ? parts.join(', ') 
      : data.display_name?.split(',').slice(0, 2).join(',') || 'Identified Ground Sector';

    const result = {
      locality,
      fullAddress: data.display_name || locality,
    };

    geocodeCache.set(cacheKey, result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Reverse geocoding error:', error);
    return NextResponse.json({ 
      locality: 'Identified Sector',
      fullAddress: ''
    });
  }
}
