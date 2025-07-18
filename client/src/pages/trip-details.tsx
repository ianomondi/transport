import { useParams, useLocation } from "wouter";
import { ArrowLeft, MapPin, Clock, Users, DollarSign, Navigation, User, Play, StopCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TripStatusBadge } from "@/components/TripStatusBadge";
import { DropOffPointManager } from "@/components/DropOffPointManager";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatTime, formatDate, formatDistance } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import type { Trip } from "@shared/schema";

export default function TripDetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const tripId = params.id;
  const { toast } = useToast();
  const { location } = useGeolocation();

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

  // Fetch vehicle details if trip has a vehicleId
  const { data: vehicle } = useQuery({
    queryKey: ['/api/vehicles', trip?.vehicleId],
    queryFn: () => fetch(`/api/vehicles/${trip?.vehicleId}`).then(res => res.json()),
    enabled: !!trip?.vehicleId,
  });

  // Start trip mutation
  const startTripMutation = useMutation({
    mutationFn: (tripId: number) => apiRequest('POST', `/api/trips/${tripId}/start`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips/recent'] });
      toast({
        title: "Trip Started",
        description: "Trip has been started successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start trip",
        variant: "destructive",
      });
    },
  });

  // End trip mutation
  const endTripMutation = useMutation({
    mutationFn: (tripId: number) => 
      apiRequest('PATCH', `/api/trips/${tripId}`, {
        status: 'completed',
        endTime: new Date()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips/recent'] });
      toast({
        title: "Trip Ended",
        description: "Trip has been completed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to end trip",
        variant: "destructive",
      });
    },
  });

  const handleStartTrip = () => {
    if (trip) {
      startTripMutation.mutate(trip.id);
    }
  };

  const handleEndTrip = () => {
    endTripMutation.mutate(trip.id);
  };

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
    <div className="min-h-screen pb-8">
      <div className="p-4 pb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/trips")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Trips
        </Button>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900">Trip #{trip.id}</h1>
            <TripStatusBadge status={trip.status} />
          </div>
          <div className="flex space-x-3">
            {trip.status !== 'active' && trip.status !== 'completed' && (
              <Button
                onClick={handleStartTrip}
                disabled={startTripMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                {startTripMutation.isPending ? "Starting..." : "Start Trip"}
              </Button>
            )}
            
            {trip.status === 'active' && (
              <Button
                onClick={handleEndTrip}
                disabled={endTripMutation.isPending}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                {endTripMutation.isPending ? "Ending..." : "End Trip"}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Route Information */}
          <Card className="material-shadow trip-details-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Route
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">From</p>
                    <p className="font-medium">{trip.origin}</p>
                  </div>
                </div>
                <div className="w-px h-6 bg-gray-300 ml-5"></div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">To</p>
                    <p className="font-medium">{trip.destination}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Drop-off Points Management */}
          <div className="trip-details-card">
            <DropOffPointManager trip={trip} />
          </div>

          {/* Driver Information */}
          <Card className="material-shadow trip-details-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Driver Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Driver Name</p>
                  <p className="font-medium">{driver?.name || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Driver Contact</p>
                  <p className="font-medium">{driver?.contact || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Assistant Name</p>
                  <p className="font-medium">{driver?.assistantName || "No assistant"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Assistant Contact</p>
                  <p className="font-medium">{driver?.assistantContact || "No assistant"}</p>
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

          {/* Vehicle Information */}
          <Card className="material-shadow trip-details-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Number Plate</p>
                  <p className="font-medium">{vehicle?.numberPlate || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Make & Model</p>
                  <p className="font-medium">{vehicle ? `${vehicle.make} ${vehicle.model}` : "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Year</p>
                  <p className="font-medium">{vehicle?.year || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Capacity</p>
                  <p className="font-medium">{vehicle?.capacity ? `${vehicle.capacity} passengers` : "Not specified"}</p>
                </div>
              </div>
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