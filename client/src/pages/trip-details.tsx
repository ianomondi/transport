import { useParams, useLocation } from "wouter";
import { ArrowLeft, MapPin, Clock, Users, DollarSign, Navigation, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { formatTime, formatDate, formatDistance } from "@/lib/utils";
import type { Trip } from "@shared/schema";

export default function TripDetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const tripId = params.id;

  const { data: trip, isLoading } = useQuery<Trip>({
    queryKey: ['/api/trips', tripId],
    enabled: !!tripId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
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

  if (!trip) {
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
          <Badge 
            variant={trip.status === 'active' ? 'default' : 'secondary'}
            className={trip.status === 'active' ? 'bg-green-500' : ''}
          >
            {trip.status}
          </Badge>
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
                ${trip.revenue || "0.00"}
              </div>
              <p className="text-sm text-gray-600 mt-1">Total earnings from this trip</p>
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
                  <p className="text-lg font-semibold">{trip.currentPassengers}</p>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}