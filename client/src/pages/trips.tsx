import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users } from "lucide-react";
import type { Trip } from "@shared/schema";

export default function Trips() {
  const { data: recentTrips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ['/api/trips/recent?limit=20'],
  });

  return (
    <>
      <AppHeader />
      <main className="pb-20 min-h-screen">
        <div className="p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Trips</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentTrips.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No trips found</p>
                <p className="text-sm text-gray-500 mt-1">Start your first trip to see it here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentTrips.map((trip) => (
                <Card key={trip.id} className="material-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Trip #{trip.id}</span>
                      <Badge 
                        variant={trip.status === 'active' ? 'default' : 'secondary'}
                        className={trip.status === 'active' ? 'bg-green-500' : ''}
                      >
                        {trip.status}
                      </Badge>
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
                        <span>{trip.currentPassengers} passengers</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(trip.startTime).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNavigation />
    </>
  );
}
