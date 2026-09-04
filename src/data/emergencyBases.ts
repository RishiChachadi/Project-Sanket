export interface EmergencyBase {
  id: string;
  name: string;
  type: 'FIRE' | 'NDRF' | 'HOSPITAL' | 'SHELTER';
  latitude: number;
  longitude: number;
  contact: string;
  capacity: string;
}

export const EMERGENCY_BASES: EmergencyBase[] = [
  // NDRF Regional Response Assets
  {
    id: 'ndrf-rrc-1',
    name: 'NDRF Regional Response Centre (RRC)',
    type: 'NDRF',
    latitude: 13.1007,
    longitude: 77.5963, // Yelahanka
    contact: '080-28478444',
    capacity: '4 Deep Flood Rescue Teams, 8 Inflatable Boats',
  },
  {
    id: 'sdrf-hq',
    name: 'Karnataka SDRF Quick Response Post',
    type: 'NDRF',
    latitude: 12.9866,
    longitude: 77.6189, // Ulsoor
    contact: '080-22942400',
    capacity: 'Urban Search & Rescue (USAR) Unit 1',
  },

  // Fire & Emergency Services Stations
  {
    id: 'fire-highgrounds',
    name: 'High Grounds Fire Station',
    type: 'FIRE',
    latitude: 12.9912,
    longitude: 77.5871,
    contact: '101 / 080-22971520',
    capacity: '2 Heavy Water Tenders, Hydraulic Platform',
  },
  {
    id: 'fire-mayohall',
    name: 'Mayo Hall Fire Station',
    type: 'FIRE',
    latitude: 12.9734,
    longitude: 77.6105,
    contact: '101 / 080-22971523',
    capacity: '2 Foam Tenders, HazMat Unit',
  },
  {
    id: 'fire-south-end',
    name: 'Jayanagar Fire Station',
    type: 'FIRE',
    latitude: 12.9295,
    longitude: 77.5818,
    contact: '101 / 080-22971525',
    capacity: '2 Water Bowsers, Structural Gear',
  },
  {
    id: 'fire-hebbal',
    name: 'Hebbal Fire Station',
    type: 'FIRE',
    latitude: 13.0358,
    longitude: 77.5970,
    contact: '101 / 080-22971527',
    capacity: '1 Foam Tender, Inflatable Dinghy',
  },

  // Major Trauma & Emergency Medical Centers
  {
    id: 'hosp-victoria',
    name: 'Victoria Hospital Trauma Care Centre',
    type: 'HOSPITAL',
    latitude: 12.9634,
    longitude: 77.5750,
    contact: '080-26701150',
    capacity: 'Level 1 Trauma, 40 Emergency ICU Beds',
  },
  {
    id: 'hosp-bowring',
    name: 'Bowring & Lady Curzon Hospital',
    type: 'HOSPITAL',
    latitude: 12.9830,
    longitude: 77.6044,
    contact: '080-25591362',
    capacity: 'Mass Casualty Triage Bay, Burn Unit',
  },
  {
    id: 'hosp-msr',
    name: 'Ramaiah Memorial Hospital',
    type: 'HOSPITAL',
    latitude: 13.0308,
    longitude: 77.5647,
    contact: '080-23608888',
    capacity: 'Emergency Resuscitation Unit, Blood Bank',
  },
  {
    id: 'hosp-manipal',
    name: 'Manipal Hospital (Old Airport Rd)',
    type: 'HOSPITAL',
    latitude: 12.9587,
    longitude: 77.6485,
    contact: '080-25024444',
    capacity: 'Air Ambulance Pad, Pediatric Emergency',
  },

  // Designated Safe Assembly Zones & Evacuation Shelters
  {
    id: 'shelter-kanteerava',
    name: 'Kanteerava Indoor Stadium Safe Zone',
    type: 'SHELTER',
    latitude: 12.9698,
    longitude: 77.5926,
    contact: '080-22211786',
    capacity: 'Capacity: 3,500 Evacuees • Generator Backup • Food & Clean Water Camp',
  },
  {
    id: 'shelter-palace',
    name: 'Palace Grounds Disaster Relief Camp',
    type: 'SHELTER',
    latitude: 13.0068,
    longitude: 77.5813,
    contact: '1077 (Disaster HQ)',
    capacity: 'Capacity: 8,000 Evacuees • Helicopter Landing Area • Field Hospital',
  },
  {
    id: 'shelter-koramangala',
    name: 'Koramangala Indoor Relief Centre',
    type: 'SHELTER',
    latitude: 12.9344,
    longitude: 77.6190,
    contact: '080-25530101',
    capacity: 'Capacity: 2,000 Evacuees • Emergency Sanitation & Medical Supplies',
  },
  {
    id: 'shelter-national-college',
    name: 'National College Grounds Safe Haven',
    type: 'SHELTER',
    latitude: 12.9436,
    longitude: 77.5739,
    contact: '080-26674441',
    capacity: 'Capacity: 2,500 Evacuees • Community Kitchen & Dry Ration Depot',
  },
];

// Haversine distance calculator in kilometers
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}
