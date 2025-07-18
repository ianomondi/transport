import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Minus, Plus, UserPlus, DollarSign, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PassengerGroup {
  id: string;
  passengerCount: number;
  dropOffLocation: string;
  farePerPassenger: number;
  totalFare: number;
}

export default function PassengerBoarding() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/passenger-boarding/:tripId/:pickupLocation");
  const [passengerGroups, setPassengerGroups] = useState<PassengerGroup[]>([]);
  const { toast } = useToast();

  const tripId = params?.tripId ? parseInt(params.tripId) : 0;
  const currentLocation = params?.pickupLocation ? decodeURIComponent(params.pickupLocation) : "";

  // Get trip details
  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ["trips", tripId],
    queryFn: () => fetch(`/api/trips/${tripId}`).then(res => res.json()),
    enabled: !!tripId
  });

  // Get valid drop-off locations for the current pickup point
  const { data: validDropOffs, isLoading: loadingDropOffs } = useQuery({
    queryKey: ["valid-dropoffs", currentLocation, trip?.origin, trip?.destination],
    queryFn: async () => {
      const params = new URLSearchParams({
        pickupLocation: currentLocation,
        origin: trip?.origin || "",
        destination: trip?.destination || ""
      });
      const response = await fetch(`/api/routes/valid-dropoffs?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch valid drop-off locations");
      }
      return response.json();
    },
    enabled: !!currentLocation && !!trip
  });

  const addPassengerGroup = (dropOffLocation: string) => {
    const newGroup: PassengerGroup = {
      id: `${Date.now()}-${Math.random()}`,
      passengerCount: 1,
      dropOffLocation,
      farePerPassenger: 0,
      totalFare: 0
    };
    
    setPassengerGroups(prev => [...prev, newGroup]);
    calculateFare(newGroup.id, dropOffLocation, 1);
  };

  const updatePassengerCount = (groupId: string, change: number) => {
    setPassengerGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const newCount = Math.max(0, group.passengerCount + change);
        const updatedGroup = { ...group, passengerCount: newCount, totalFare: newCount * group.farePerPassenger };
        return updatedGroup;
      }
      return group;
    }));
  };

  const removePassengerGroup = (groupId: string) => {
    setPassengerGroups(prev => prev.filter(group => group.id !== groupId));
  };

  const calculateFare = async (groupId: string, dropOffLocation: string, passengerCount: number) => {
    try {
      const params = new URLSearchParams({
        pickupLocation: currentLocation,
        dropOffLocation,
        origin: trip?.origin || "",
        destination: trip?.destination || ""
      });
      
      const response = await fetch(`/api/routes/calculate-fare?${params}`);
      const data = await response.json();
      const farePerPassenger = data.fare || 0;
      
      setPassengerGroups(prev => prev.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            farePerPassenger,
            totalFare: farePerPassenger * passengerCount
          };
        }
        return group;
      }));
    } catch (error) {
      console.error("Failed to calculate fare:", error);
    }
  };

  const pickupMutation = useMutation({
    mutationFn: async (data: {
      tripId: number;
      passengerCount: number;
      pickupLocation: string;
      dropOffLocation: string;
      fareAmount: number;
    }) => {
      const response = await apiRequest("POST", `/api/trips/${tripId}/pickup-passenger`, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Passengers Picked Up",
        description: data.message,
      });
      
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["trips", tripId] });
      queryClient.invalidateQueries({ queryKey: ["trips", "active"] });
      queryClient.invalidateQueries({ queryKey: ["trips", "recent"] });
    },
    onError: (error: any) => {
      toast({
        title: "Pickup Failed",
        description: error.message || "Failed to pick up passengers",
        variant: "destructive",
      });
    },
  });

  const handleConfirmPickup = async () => {
    if (passengerGroups.length === 0) {
      toast({
        title: "No Passengers",
        description: "Please add passenger groups before confirming pickup",
        variant: "destructive",
      });
      return;
    }

    try {
      // Process each passenger group separately
      for (const group of passengerGroups) {
        if (group.passengerCount > 0) {
          await pickupMutation.mutateAsync({
            tripId: tripId,
            passengerCount: group.passengerCount,
            pickupLocation: currentLocation,
            dropOffLocation: group.dropOffLocation,
            fareAmount: group.totalFare
          });
        }
      }
      
      toast({
        title: "Success",
        description: "All passengers have been picked up successfully",
      });
      
      // Navigate back to trip details
      setLocation(`/trips/${tripId}`);
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const getTotalPassengers = () => {
    return passengerGroups.reduce((sum, group) => sum + group.passengerCount, 0);
  };

  const getTotalFare = () => {
    return passengerGroups.reduce((sum, group) => sum + group.totalFare, 0);
  };

  const availableDropOffs = validDropOffs?.filter(
    location => !passengerGroups.some(group => group.dropOffLocation === location)
  ) || [];

  if (tripLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="p-4">
          <Card className="text-center p-8">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Trip Not Found</h1>
            <p className="text-gray-600 mb-4">The requested trip could not be found.</p>
            <Button onClick={() => setLocation("/")}>
              Return to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="p-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/trips/${tripId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Trip
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Passenger Boarding</h1>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>Pickup Location: <strong>{currentLocation}</strong></span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Trip: {trip.origin} → {trip.destination}
          </div>
        </div>

        {/* Summary Card */}
        <Card className="bg-blue-50 border-blue-200 mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{getTotalPassengers()}</div>
                <div className="text-sm text-gray-600">Total Passengers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">KES {getTotalFare().toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Fare</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add New Passenger Group */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Passengers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Select destinations for new passengers boarding at <strong>{currentLocation}</strong>
              </div>
              
              {loadingDropOffs ? (
                <div className="text-center py-4 text-gray-500">Loading destinations...</div>
              ) : availableDropOffs.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {availableDropOffs.map((location: string) => (
                    <Button
                      key={location}
                      variant="outline"
                      onClick={() => addPassengerGroup(location)}
                      className="flex items-center justify-between p-4 h-auto"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{location}</span>
                      </div>
                      <Plus className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  All destinations already selected
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Passenger Groups */}
        {passengerGroups.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Passenger Groups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {passengerGroups.map((group) => (
                <div key={group.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">{group.dropOffLocation}</span>
                      <Badge variant="secondary">
                        KES {group.farePerPassenger.toLocaleString()}/person
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePassengerGroup(group.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePassengerCount(group.id, -1)}
                        disabled={group.passengerCount <= 0}
                        className="w-10 h-10 p-0 rounded-full"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-600" />
                        <span className="font-bold text-xl">{group.passengerCount}</span>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePassengerCount(group.id, 1)}
                        className="w-10 h-10 p-0 rounded-full"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total Fare</div>
                      <div className="font-bold text-green-600 text-lg">
                        KES {group.totalFare.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setLocation(`/trips/${tripId}`)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmPickup}
            disabled={pickupMutation.isPending || passengerGroups.length === 0 || getTotalPassengers() === 0}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {pickupMutation.isPending ? "Processing..." : `Confirm Pickup (${getTotalPassengers()} passengers)`}
          </Button>
        </div>
      </div>
    </div>
  );
}