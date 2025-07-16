import { useParams, useLocation } from "wouter";
import { ArrowLeft, MapPin, Clock, Users, DollarSign, Navigation, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TripStatusBadge } from "@/components/TripStatusBadge";
import { DropOffPointManager } from "@/components/DropOffPointManager";
import { useQuery } from "@tanstack/react-query";
import { formatTime, formatDate, formatDistance } from "@/lib/utils";
import type { Trip } from "@shared/schema";

export default function TripDetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const tripId = params.id;

  const { data: trip, isLoading, error } = useQuery<Trip>({
    queryKey: ['/api/trips', tripId],
    queryFn: () => fetch(`/api/trips/${tripId}`).then(res => {
      if (!res.ok) {
        throw new Error('Trip not found');
      }
      return res.json();
    }),
    enabled: !!tripId,
  });

  // Fetch driver details if trip has a driverId
  const { data: driver } = useQuery({
    queryKey: ['/api/drivers', trip?.driverId],
    queryFn: () => fetch(`/api/drivers/${trip?.driverId}`).then(res => res.json()),
    enabled: !!trip?.driverId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || (!trip && !isLoading)) {
    return (
      <div className="min-h-screen">
        <div className="p-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/trips")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trips
          </Button>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">Trip not found</p>
              <p className="text-sm text-gray-500 mt-2">The trip you're looking for doesn't exist or has been removed.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const duration = trip.endTime 
    ? Math.round((new Date(trip.endTime).getTime() - new Date(trip.startTime).getTime()) / (1000 * 60))
    : null;

  return (
    <div className="min-h-screen pb-4">
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => setLocation("/trips")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Trips
        </Button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Trip #{trip.id}</h1>
          <TripStatusBadge status={trip.status} />
        </div>

        <div className="space-y-4">
          {/* Route Information */}
          <Card className="material-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Route
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm text-gray-600">From</p>
                    <p className="font-medium">{trip.origin}</p>
                  </div>
                </div>
                <div className="w-px h-6 bg-gray-300 ml-5"></div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <div>
                    <p className="text-sm text-gray-600">To</p>
                    <p className="font-medium">{trip.destination}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Drop-off Points Management */}
          <DropOffPointManager trip={trip} />

          {/* Driver Information */}
          <Card className="material-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Driver Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Driver Name</p>
                    <p className="font-medium">{driver?.name || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Driver Contact</p>
                    <p className="font-medium">{driver?.contact || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Assistant Name</p>
                    <p className="font-medium">{driver?.assistantName || "No assistant"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Assistant Contact</p>
                    <p className="font-medium">{driver?.assistantContact || "No assistant"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card className="material-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${parseFloat(trip.revenue || "0").toFixed(2)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Total earnings from this trip</p>
              {trip.currentPassengers > 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  ${(parseFloat(trip.revenue || "0") / trip.initialPassengers).toFixed(2)} per passenger
                </p>
              )}
            </CardContent>
          </Card>

          {/* Driver Information */}
          <Card className="material-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Driver
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">{trip.driverName || "Driver"}</p>
              <p className="text-sm text-gray-600">Trip operator</p>
            </CardContent>
          </Card>

          {/* Trip Statistics */}
          <Card className="material-shadow">
            <CardHeader>
              <CardTitle>Trip Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Navigation className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Distance</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {formatDistance(trip.totalDistance || "0")}
                  </p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Passengers</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {trip.status === 'completed' ? trip.initialPassengers : trip.currentPassengers}
                    {trip.status === 'completed' && trip.initialPassengers !== trip.currentPassengers && (
                      <span className="text-sm text-gray-500 ml-1">
                        (started with {trip.initialPassengers})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Navigation className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Turns</span>
                  </div>
                  <p className="text-lg font-semibold">{trip.turnsCount || 0}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Duration</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {duration !== null ? `${duration} min` : "In progress"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Information */}
          <Card className="material-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Time Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Started</p>
                  <p className="font-medium">
                    {formatDate(trip.startTime)} at {formatTime(trip.startTime)}
                  </p>
                </div>
                {trip.endTime && (
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="font-medium">
                      {formatDate(trip.endTime)} at {formatTime(trip.endTime)}
                    </p>
                  </div>
                )}
                {trip.status === 'active' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm text-orange-800 font-medium">
                      Trip in progress
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Started {Math.floor((new Date().getTime() - new Date(trip.startTime).getTime()) / (1000 * 60))} minutes ago
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {trip.status === 'active' && (
            <Card className="material-shadow border-orange-200">
              <CardHeader>
                <CardTitle className="text-orange-800">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="border-green-300 text-green-700 hover:bg-green-50"
                    onClick={() => setLocation('/dashboard')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Passengers
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={() => setLocation('/queue')}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    View Queue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}