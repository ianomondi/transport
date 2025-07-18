import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Clock, Users } from "lucide-react";
import { useLocation } from "wouter";
import { TripStatusBadge } from "./TripStatusBadge";
import type { Trip } from "@shared/schema";

export function RecentTrips() {
  const [, setLocation] = useLocation();
  const { data: recentTrips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ['/api/trips/recent?limit=5'],
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="px-4 mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Trips</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (recentTrips.length === 0) {
    return (
      <div className="px-4 mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Trips</h3>
        <Card className="material-shadow">
          <CardContent className="p-4 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No recent trips</p>
            <p className="text-sm text-gray-500 mt-1">Your trip history will appear here</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 mb-4">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Trips</h3>
      <div className="space-y-3">
        {recentTrips.map((trip) => (
          <Card 
            key={trip.id} 
            className="material-shadow cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => setLocation(`/trips/${trip.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Trip #{trip.id}</span>
                <TripStatusBadge status={trip.status} />
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">
                  {trip.origin} → {trip.destination}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>
                    {trip.dropOffPoints 
                      ? trip.dropOffPoints.reduce((sum, point) => sum + point.passengerCount, 0)
                      : trip.initialPassengers || 0
                    } passengers
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(trip.startTime).toLocaleTimeString()}</span>
                </div>
              </div>
              {trip.revenue && parseFloat(trip.revenue) > 0 && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Revenue</span>
                  <span className="text-sm font-semibold text-green-600">
                    KES {parseFloat(trip.revenue).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
