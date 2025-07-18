import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Trip } from "@shared/schema";

export function ActiveTripCard() {
  const { data: activeTrip, isLoading } = useQuery<Trip>({
    queryKey: ['/api/trips/active'],
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <Card className="animate-pulse">
          <CardContent className="p-4">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activeTrip) {
    return (
      <div className="p-4">
        <Card className="material-shadow">
          <CardContent className="p-4 text-center">
            <p className="text-gray-600">No active trip</p>
            <p className="text-sm text-gray-500 mt-1">Start a new trip to begin tracking</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card className="material-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium text-gray-900">Active Trip</h2>
            <div className="flex items-center">
              <div className="status-indicator status-active" />
              <span className="text-sm text-gray-600">In Progress</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">From</p>
                <p className="font-medium">{activeTrip.origin}</p>
              </div>
            </div>
            
            <div className="w-px h-6 bg-gray-300 ml-5"></div>
            
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">To</p>
                <p className="font-medium">{activeTrip.destination}</p>
              </div>
            </div>
          </div>
          
          <div className="passenger-counter mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-90">Passengers</span>
              <span className="text-2xl font-bold">{activeTrip.initialPassengers}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
