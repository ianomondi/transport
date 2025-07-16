import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { TripStatusBadge } from "@/components/TripStatusBadge";
import { DropOffPointManager } from "@/components/DropOffPointManager";
import { AppHeader } from "@/components/AppHeader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MapPin, User, Car, Play, Clock, Route, Users, DollarSign } from "lucide-react";
import type { Trip, Driver } from "@shared/schema";
import type { Vehicle } from "@shared/vehicles";

export default function TripDetails() {
  const { id } = useParams();
  const { toast } = useToast();

  const { data: trip, isLoading } = useQuery({
    queryKey: ['/api/trips', id],
    queryFn: () => fetch(`/api/trips/${id}`).then(res => res.json()) as Promise<Trip>,
    enabled: !!id,
  });

  const { data: driver } = useQuery({
    queryKey: ['/api/drivers', trip?.driverId],
    queryFn: () => fetch(`/api/drivers/${trip?.driverId}`).then(res => res.json()) as Promise<Driver>,
    enabled: !!trip?.driverId,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['/api/vehicles/available'],
    queryFn: () => fetch('/api/vehicles/available').then(res => res.json()) as Promise<Vehicle[]>,
  });

  const vehicle = vehicles.find(v => v.number === trip?.vehicleNumber);

  const startTripMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/trips/${id}/start`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      toast({
        title: "Trip Started",
        description: "The trip has been started successfully",
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <LoadingSpinner text="Loading trip details..." />
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">Trip not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Trip Header */}
        <Card className="material-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Trip Details
              </CardTitle>
              <TripStatusBadge status={trip.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Route Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">From:</span>
                  <span>{trip.origin}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">To:</span>
                  <span>{trip.destination}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Passengers:</span>
                  <span>{trip.currentPassengers} / {trip.initialPassengers} initial</span>
                </div>
              </div>

              {/* Vehicle & Driver Information */}
              <div className="space-y-3">
                {vehicle && (
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Vehicle:</span>
                    <Badge variant="outline">{vehicle.number}</Badge>
                    <span className="text-xs text-gray-500">({vehicle.type})</span>
                  </div>
                )}
                {driver && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Driver:</span>
                    <span>{driver.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Revenue:</span>
                  <span>${parseFloat(trip.revenue || "0").toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Trip Times */}
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Created:</span>
                <span className="text-sm">{new Date(trip.createdAt).toLocaleString()}</span>
              </div>
              {trip.startTime && (
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Started:</span>
                  <span className="text-sm">{new Date(trip.startTime).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Start Trip Button */}
            {trip.status === 'pending' && (
              <div className="pt-4 border-t">
                <Button
                  onClick={() => startTripMutation.mutate()}
                  disabled={startTripMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {startTripMutation.isPending ? "Starting Trip..." : "Start Trip"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Drop-off Points Management */}
        {trip.status === 'active' && <DropOffPointManager trip={trip} />}
      </div>
    </div>
  );
}