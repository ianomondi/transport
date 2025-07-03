import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import type { Trip } from "@shared/schema";

export function ActiveTripCard() {
  const { toast } = useToast();
  const { location } = useGeolocation();
  
  const { data: activeTrip, isLoading } = useQuery<Trip>({
    queryKey: ['/api/trips/active'],
    refetchInterval: 5000,
  });

  const passengerOnMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/passenger-events', {
      tripId: activeTrip?.id,
      eventType: 'board',
      passengerCount: 1,
      location: location,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips/active'] });
      toast({
        title: "Passenger Added",
        description: "Passenger has boarded the vehicle",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add passenger",
        variant: "destructive",
      });
    },
  });

  const passengerOffMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/passenger-events', {
      tripId: activeTrip?.id,
      eventType: 'alight',
      passengerCount: 1,
      location: location,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips/active'] });
      toast({
        title: "Passenger Removed",
        description: "Passenger has alighted from the vehicle",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove passenger",
        variant: "destructive",
      });
    },
  });

  const handlePassengerOn = () => {
    if (activeTrip) {
      passengerOnMutation.mutate();
    }
  };

  const handlePassengerOff = () => {
    if (activeTrip && activeTrip.currentPassengers > 0) {
      passengerOffMutation.mutate();
    }
  };

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
              <span className="text-sm opacity-90">Current Passengers</span>
              <span className="text-2xl font-bold">{activeTrip.currentPassengers}</span>
            </div>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <Button
              className="flex-1 bg-green-500 hover:bg-green-600 text-white ripple-effect"
              onClick={handlePassengerOn}
              disabled={passengerOnMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Passenger On
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white ripple-effect"
              onClick={handlePassengerOff}
              disabled={passengerOffMutation.isPending || activeTrip.currentPassengers === 0}
            >
              <Minus className="h-4 w-4 mr-2" />
              Passenger Off
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
