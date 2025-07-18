import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, DollarSign, Plus, Minus, Navigation, TrendingUp, StopCircle, UserPlus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import type { Trip } from "@shared/schema";

interface DropOffPoint {
  name: string;
  coordinates: { lat: number; lng: number };
  passengerCount: number;
  farePerPassenger: number;
  totalRevenue: number;
}

interface DropOffPointManagerProps {
  trip: Trip;
}

export function DropOffPointManager({ trip }: DropOffPointManagerProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [localDropOffPoints, setLocalDropOffPoints] = useState<DropOffPoint[]>(
    trip.dropOffPoints || []
  );

  const updateTripMutation = useMutation({
    mutationFn: (updates: Partial<Trip>) => 
      apiRequest('PATCH', `/api/trips/${trip.id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', trip.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips/recent'] });
      toast({
        title: "Updated",
        description: "Drop-off points updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update drop-off points",
        variant: "destructive",
      });
    },
  });

  const updatePassengerCount = (index: number, change: number) => {
    const updatedPoints = [...localDropOffPoints];
    const newCount = Math.max(0, updatedPoints[index].passengerCount + change);
    updatedPoints[index].passengerCount = newCount;
    updatedPoints[index].totalRevenue = newCount * updatedPoints[index].farePerPassenger;
    
    setLocalDropOffPoints(updatedPoints);
    
    // Calculate total revenue from all drop-off points
    const totalRevenue = updatedPoints.reduce((sum, point) => sum + point.totalRevenue, 0);
    
    // Update the trip with new drop-off points and total revenue
    updateTripMutation.mutate({
      dropOffPoints: updatedPoints,
      revenue: totalRevenue.toString()
    });
  };

  const getTotalRevenue = () => {
    return localDropOffPoints.reduce((sum, point) => sum + point.totalRevenue, 0);
  };

  const getTotalPassengers = () => {
    return localDropOffPoints.reduce((sum, point) => sum + point.passengerCount, 0);
  };

  if (!localDropOffPoints || localDropOffPoints.length === 0) {
    return (
      <Card className="material-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Drop-off Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-4">
            No drop-off points configured for this trip
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="material-shadow overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-6">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-blue-100 rounded-lg mr-3">
            <Navigation className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">Drop-off Points</h3>
            <p className="text-sm text-gray-600 mt-1">Manage passenger boarding</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="bg-white/70 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <span className="text-2xl font-bold text-blue-600">{getTotalPassengers()}</span>
                <p className="text-xs text-gray-600 leading-tight">Total Passengers</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 rounded-lg p-3 border border-green-100">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <span className="text-2xl font-bold text-green-600">KES {getTotalRevenue().toLocaleString()}</span>
                <p className="text-xs text-gray-600 leading-tight">Total Revenue</p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {localDropOffPoints.map((point, index) => (
            <div key={index} className="group hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center p-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{point.name}</h4>
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                          KES {point.farePerPassenger}/person
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Users className="h-3 w-3" />
                          <span>{point.passengerCount} on board</span>
                        </div>
                        <div className="flex items-center space-x-1 text-green-600">
                          <TrendingUp className="h-3 w-3" />
                          <span>KES {point.totalRevenue.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {trip.status === 'active' && (
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const encodedLocation = encodeURIComponent(point.name);
                              setLocation(`/passenger-boarding/${trip.id}/${encodedLocation}`);
                            }}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 transition-all duration-200"
                          >
                            <UserPlus className="h-3 w-3" />
                            Pick Up Passengers
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 ml-4">
                  <div className="flex flex-col items-center space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updatePassengerCount(index, 1)}
                      disabled={updateTripMutation.isPending || trip.status === 'completed'}
                      className="w-10 h-10 p-0 rounded-full border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4 text-blue-600" />
                    </Button>
                    <div className="w-12 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-900">
                        {point.passengerCount}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updatePassengerCount(index, -1)}
                      disabled={point.passengerCount === 0 || updateTripMutation.isPending || trip.status === 'completed'}
                      className="w-10 h-10 p-0 rounded-full border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {trip.status === 'active' ? (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="h-3 w-3 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Passenger Management
                </p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Tap + to add passengers boarding at each stop. Tap - to remove them when they alight. 
                  Revenue is calculated automatically based on fare per passenger.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <StopCircle className="h-3 w-3 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Trip Completed
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  This trip has been completed. Drop-off point management is no longer available.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      

    </Card>
  );
}