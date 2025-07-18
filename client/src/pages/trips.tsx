import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Clock, Users, DollarSign, User, Phone } from "lucide-react";
import { useLocation } from "wouter";
import { TripStatusBadge } from "@/components/TripStatusBadge";
import { formatTime, formatDate } from "@/lib/utils";
import type { Trip } from "@shared/schema";

export default function Trips() {
  const [, setLocation] = useLocation();

  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ['/api/trips/recent?limit=50'],
    refetchInterval: 10000,
  });



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="p-4">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
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
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="p-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">All Trips</h1>
          <div className="text-sm text-gray-600">
            {trips.length} trip{trips.length !== 1 ? 's' : ''} total
          </div>
        </div>

        {trips.length === 0 ? (
          <Card className="material-shadow">
            <CardContent className="p-8 text-center">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trips yet</h3>
              <p className="text-gray-600">Start your first trip to see it here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => (
              <Card 
                key={trip.id} 
                className="material-shadow cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => setLocation(`/trips/${trip.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Trip #{trip.id}</span>
                      <TripStatusBadge status={trip.status} />
                    </div>
                    <div className="flex items-center space-x-2 text-green-600">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">KES {parseFloat(trip.revenue || "0").toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {trip.origin} → {trip.destination}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {trip.dropOffPoints 
                          ? trip.dropOffPoints.reduce((sum, point) => sum + point.passengerCount, 0)
                          : trip.initialPassengers || 0
                        } passengers
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formatTime(trip.startTime)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {trip.driverName || "Driver"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(trip.startTime)}
                    </div>
                  </div>
                  
                  {trip.driverContact && (
                    <div className="flex items-center space-x-2 mt-2 pt-2 border-t">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {trip.driverContact}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <BottomNavigation />
    </div>
  );
}