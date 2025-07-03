import { useQuery } from "@tanstack/react-query";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Map, Navigation } from "lucide-react";
import type { Trip } from "@shared/schema";

export function LiveMap() {
  const { location, error } = useGeolocation();
  
  const { data: activeTrip } = useQuery<Trip>({
    queryKey: ['/api/trips/active'],
    refetchInterval: 5000,
  });

  return (
    <div className="px-4 mb-4">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Live Route</h3>
      <div className="map-container">
        <div className="text-center z-10">
          <Map className="h-12 w-12 mx-auto mb-2 text-green-700" />
          <p className="text-sm font-medium">Interactive Map View</p>
          {location && (
            <p className="text-xs opacity-75">
              GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          )}
          {error && (
            <p className="text-xs text-red-600 mt-1">
              Location unavailable
            </p>
          )}
          {activeTrip && (
            <div className="mt-2 flex items-center justify-center">
              <Navigation className="h-4 w-4 mr-1" />
              <span className="text-xs">
                {activeTrip.origin} → {activeTrip.destination}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
