// Route mapping system for automatic drop-off point generation
interface DropOffPoint {
  name: string;
  coordinates: { lat: number; lng: number };
  farePerPassenger: number;
}

interface RouteMapping {
  origin: string;
  destination: string;
  dropOffPoints: DropOffPoint[];
}

// Predefined route mappings with drop-off points
const ROUTE_MAPPINGS: RouteMapping[] = [
  {
    origin: "Capital Center",
    destination: "Central Station",
    dropOffPoints: [
      {
        name: "Unity Plaza",
        coordinates: { lat: -1.9441, lng: 30.0619 },
        farePerPassenger: 500
      },
      {
        name: "City Mall",
        coordinates: { lat: -1.9395, lng: 30.0644 },
        farePerPassenger: 600
      },
      {
        name: "Business District",
        coordinates: { lat: -1.9355, lng: 30.0675 },
        farePerPassenger: 700
      },
      {
        name: "University Junction",
        coordinates: { lat: -1.9320, lng: 30.0705 },
        farePerPassenger: 800
      }
    ]
  },
  {
    origin: "Central Station",
    destination: "Capital Center",
    dropOffPoints: [
      {
        name: "University Junction",
        coordinates: { lat: -1.9320, lng: 30.0705 },
        farePerPassenger: 800
      },
      {
        name: "Business District",
        coordinates: { lat: -1.9355, lng: 30.0675 },
        farePerPassenger: 700
      },
      {
        name: "City Mall",
        coordinates: { lat: -1.9395, lng: 30.0644 },
        farePerPassenger: 600
      },
      {
        name: "Unity Plaza",
        coordinates: { lat: -1.9441, lng: 30.0619 },
        farePerPassenger: 500
      }
    ]
  },
  {
    origin: "Airport",
    destination: "City Center",
    dropOffPoints: [
      {
        name: "Airport Junction",
        coordinates: { lat: -1.9663, lng: 30.1336 },
        farePerPassenger: 1000
      },
      {
        name: "Industrial Area",
        coordinates: { lat: -1.9580, lng: 30.1190 },
        farePerPassenger: 1200
      },
      {
        name: "Residential Complex",
        coordinates: { lat: -1.9520, lng: 30.1050 },
        farePerPassenger: 1400
      },
      {
        name: "Shopping Center",
        coordinates: { lat: -1.9460, lng: 30.0920 },
        farePerPassenger: 1600
      }
    ]
  },
  {
    origin: "City Center",
    destination: "Airport",
    dropOffPoints: [
      {
        name: "Shopping Center",
        coordinates: { lat: -1.9460, lng: 30.0920 },
        farePerPassenger: 1600
      },
      {
        name: "Residential Complex",
        coordinates: { lat: -1.9520, lng: 30.1050 },
        farePerPassenger: 1400
      },
      {
        name: "Industrial Area",
        coordinates: { lat: -1.9580, lng: 30.1190 },
        farePerPassenger: 1200
      },
      {
        name: "Airport Junction",
        coordinates: { lat: -1.9663, lng: 30.1336 },
        farePerPassenger: 1000
      }
    ]
  },
  {
    origin: "Downtown",
    destination: "Suburb East",
    dropOffPoints: [
      {
        name: "Main Street",
        coordinates: { lat: -1.9500, lng: 30.0580 },
        farePerPassenger: 400
      },
      {
        name: "Park Avenue",
        coordinates: { lat: -1.9480, lng: 30.0720 },
        farePerPassenger: 500
      },
      {
        name: "Hospital Junction",
        coordinates: { lat: -1.9460, lng: 30.0850 },
        farePerPassenger: 600
      },
      {
        name: "School Area",
        coordinates: { lat: -1.9440, lng: 30.0980 },
        farePerPassenger: 700
      }
    ]
  }
];

export function getDropOffPointsForRoute(origin: string, destination: string): DropOffPoint[] {
  const route = ROUTE_MAPPINGS.find(
    mapping => 
      mapping.origin.toLowerCase() === origin.toLowerCase() && 
      mapping.destination.toLowerCase() === destination.toLowerCase()
  );
  
  if (route) {
    return route.dropOffPoints.map(point => ({
      ...point,
      passengerCount: 0,
      totalRevenue: 0
    }));
  }
  
  // If no predefined route found, return empty array
  return [];
}

export function getAllAvailableLocations(): string[] {
  const locations = new Set<string>();
  
  ROUTE_MAPPINGS.forEach(route => {
    locations.add(route.origin);
    locations.add(route.destination);
  });
  
  return Array.from(locations).sort();
}

export function getAvailableDestinations(origin: string): string[] {
  return ROUTE_MAPPINGS
    .filter(route => route.origin.toLowerCase() === origin.toLowerCase())
    .map(route => route.destination);
}