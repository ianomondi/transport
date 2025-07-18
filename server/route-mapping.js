// Static route mapping for the transit tracker
// This provides predefined routes and drop-off points

const locations = [
  { name: "Downtown Terminal", coordinates: { lat: 40.7128, lng: -74.0060 } },
  { name: "Airport", coordinates: { lat: 40.6405, lng: -73.7789 } },
  { name: "University Campus", coordinates: { lat: 40.7489, lng: -73.9680 } },
  { name: "Shopping Mall", coordinates: { lat: 40.7505, lng: -73.9934 } },
  { name: "Central Park", coordinates: { lat: 40.7829, lng: -73.9654 } },
  { name: "Business District", coordinates: { lat: 40.7580, lng: -73.9855 } },
  { name: "Hospital", coordinates: { lat: 40.7614, lng: -73.9776 } },
  { name: "Train Station", coordinates: { lat: 40.7505, lng: -73.9934 } },
  { name: "Beach Resort", coordinates: { lat: 40.5795, lng: -73.9707 } },
  { name: "Sports Complex", coordinates: { lat: 40.8176, lng: -73.9782 } }
];

const routes = {
  "Downtown Terminal": {
    "Airport": [
      { name: "Metro Station", coordinates: { lat: 40.7280, lng: -74.0020 }, passengerCount: 3, farePerPassenger: 5.50, totalRevenue: 16.50 },
      { name: "Highway Plaza", coordinates: { lat: 40.6800, lng: -73.8500 }, passengerCount: 2, farePerPassenger: 7.00, totalRevenue: 14.00 },
      { name: "Airport Terminal", coordinates: { lat: 40.6405, lng: -73.7789 }, passengerCount: 4, farePerPassenger: 10.00, totalRevenue: 40.00 }
    ],
    "University Campus": [
      { name: "City Hall", coordinates: { lat: 40.7420, lng: -73.9890 }, passengerCount: 2, farePerPassenger: 4.00, totalRevenue: 8.00 },
      { name: "Library", coordinates: { lat: 40.7489, lng: -73.9680 }, passengerCount: 5, farePerPassenger: 6.00, totalRevenue: 30.00 }
    ],
    "Shopping Mall": [
      { name: "Midtown Plaza", coordinates: { lat: 40.7505, lng: -73.9934 }, passengerCount: 3, farePerPassenger: 5.00, totalRevenue: 15.00 }
    ]
  },
  "Airport": {
    "Downtown Terminal": [
      { name: "Highway Plaza", coordinates: { lat: 40.6800, lng: -73.8500 }, passengerCount: 2, farePerPassenger: 7.00, totalRevenue: 14.00 },
      { name: "Metro Station", coordinates: { lat: 40.7280, lng: -74.0020 }, passengerCount: 3, farePerPassenger: 5.50, totalRevenue: 16.50 },
      { name: "Downtown Terminal", coordinates: { lat: 40.7128, lng: -74.0060 }, passengerCount: 4, farePerPassenger: 10.00, totalRevenue: 40.00 }
    ],
    "University Campus": [
      { name: "City Center", coordinates: { lat: 40.7200, lng: -73.9000 }, passengerCount: 2, farePerPassenger: 8.00, totalRevenue: 16.00 },
      { name: "University Campus", coordinates: { lat: 40.7489, lng: -73.9680 }, passengerCount: 3, farePerPassenger: 12.00, totalRevenue: 36.00 }
    ],
    "Business District": [
      { name: "Corporate Center", coordinates: { lat: 40.7580, lng: -73.9855 }, passengerCount: 4, farePerPassenger: 9.00, totalRevenue: 36.00 }
    ]
  },
  "University Campus": {
    "Downtown Terminal": [
      { name: "Student Union", coordinates: { lat: 40.7489, lng: -73.9680 }, passengerCount: 4, farePerPassenger: 3.00, totalRevenue: 12.00 },
      { name: "City Hall", coordinates: { lat: 40.7420, lng: -73.9890 }, passengerCount: 2, farePerPassenger: 4.00, totalRevenue: 8.00 },
      { name: "Downtown Terminal", coordinates: { lat: 40.7128, lng: -74.0060 }, passengerCount: 3, farePerPassenger: 6.00, totalRevenue: 18.00 }
    ],
    "Shopping Mall": [
      { name: "Campus Gate", coordinates: { lat: 40.7500, lng: -73.9700 }, passengerCount: 3, farePerPassenger: 4.50, totalRevenue: 13.50 },
      { name: "Shopping Mall", coordinates: { lat: 40.7505, lng: -73.9934 }, passengerCount: 2, farePerPassenger: 5.50, totalRevenue: 11.00 }
    ],
    "Central Park": [
      { name: "Museum District", coordinates: { lat: 40.7829, lng: -73.9654 }, passengerCount: 3, farePerPassenger: 4.00, totalRevenue: 12.00 }
    ]
  },
  "Shopping Mall": {
    "Downtown Terminal": [
      { name: "Retail Plaza", coordinates: { lat: 40.7505, lng: -73.9934 }, passengerCount: 3, farePerPassenger: 4.00, totalRevenue: 12.00 },
      { name: "Downtown Terminal", coordinates: { lat: 40.7128, lng: -74.0060 }, passengerCount: 2, farePerPassenger: 5.00, totalRevenue: 10.00 }
    ],
    "University Campus": [
      { name: "Student Plaza", coordinates: { lat: 40.7500, lng: -73.9700 }, passengerCount: 2, farePerPassenger: 4.50, totalRevenue: 9.00 },
      { name: "University Campus", coordinates: { lat: 40.7489, lng: -73.9680 }, passengerCount: 3, farePerPassenger: 5.50, totalRevenue: 16.50 }
    ],
    "Business District": [
      { name: "Commerce Center", coordinates: { lat: 40.7580, lng: -73.9855 }, passengerCount: 4, farePerPassenger: 6.00, totalRevenue: 24.00 }
    ]
  },
  "Central Park": {
    "Downtown Terminal": [
      { name: "Park Entrance", coordinates: { lat: 40.7829, lng: -73.9654 }, passengerCount: 2, farePerPassenger: 3.50, totalRevenue: 7.00 },
      { name: "Midtown", coordinates: { lat: 40.7505, lng: -73.9934 }, passengerCount: 3, farePerPassenger: 4.00, totalRevenue: 12.00 },
      { name: "Downtown Terminal", coordinates: { lat: 40.7128, lng: -74.0060 }, passengerCount: 2, farePerPassenger: 5.50, totalRevenue: 11.00 }
    ],
    "University Campus": [
      { name: "Museum District", coordinates: { lat: 40.7600, lng: -73.9700 }, passengerCount: 3, farePerPassenger: 4.00, totalRevenue: 12.00 },
      { name: "University Campus", coordinates: { lat: 40.7489, lng: -73.9680 }, passengerCount: 2, farePerPassenger: 5.00, totalRevenue: 10.00 }
    ]
  },
  "Business District": {
    "Airport": [
      { name: "Corporate Plaza", coordinates: { lat: 40.7580, lng: -73.9855 }, passengerCount: 3, farePerPassenger: 7.00, totalRevenue: 21.00 },
      { name: "Airport Terminal", coordinates: { lat: 40.6405, lng: -73.7789 }, passengerCount: 4, farePerPassenger: 9.00, totalRevenue: 36.00 }
    ],
    "Downtown Terminal": [
      { name: "Financial District", coordinates: { lat: 40.7580, lng: -73.9855 }, passengerCount: 4, farePerPassenger: 5.00, totalRevenue: 20.00 },
      { name: "Downtown Terminal", coordinates: { lat: 40.7128, lng: -74.0060 }, passengerCount: 3, farePerPassenger: 6.00, totalRevenue: 18.00 }
    ],
    "Shopping Mall": [
      { name: "Commerce Center", coordinates: { lat: 40.7580, lng: -73.9855 }, passengerCount: 2, farePerPassenger: 4.50, totalRevenue: 9.00 },
      { name: "Shopping Mall", coordinates: { lat: 40.7505, lng: -73.9934 }, passengerCount: 4, farePerPassenger: 6.00, totalRevenue: 24.00 }
    ]
  }
};

export function getAllAvailableLocations() {
  return locations;
}

export function getAvailableDestinations(origin) {
  return Object.keys(routes[origin] || {}).map(dest => ({
    name: dest,
    coordinates: locations.find(loc => loc.name === dest)?.coordinates
  }));
}

export function getDropOffPointsForRoute(origin, destination) {
  const route = routes[origin]?.[destination];
  if (!route) {
    // Return a default drop-off point if route not found
    return [
      {
        name: destination,
        coordinates: locations.find(loc => loc.name === destination)?.coordinates || { lat: 40.7128, lng: -74.0060 },
        passengerCount: 3,
        farePerPassenger: 5.00,
        totalRevenue: 15.00
      }
    ];
  }
  return route;
}

export function calculateRouteRevenue(origin, destination) {
  const dropOffPoints = getDropOffPointsForRoute(origin, destination);
  return dropOffPoints.reduce((total, point) => total + point.totalRevenue, 0);
}