import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, DollarSign, Plus, Minus } from "lucide-react";
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
    <Card className="material-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Drop-off Points
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span>{getTotalPassengers()} total</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span>${getTotalRevenue().toFixed(2)}</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {localDropOffPoints.map((point, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{point.name}</span>
                  <Badge variant="outline" className="text-xs">
                    ${point.farePerPassenger}/person
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{point.passengerCount} passengers</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-3 w-3" />
                    <span>${point.totalRevenue.toFixed(2)} revenue</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updatePassengerCount(index, 1)}
                  disabled={updateTripMutation.isPending}
                  className="w-8 h-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-center font-medium min-w-[24px]">
                  {point.passengerCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updatePassengerCount(index, -1)}
                  disabled={point.passengerCount === 0 || updateTripMutation.isPending}
                  className="w-8 h-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {trip.status === 'active' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong> Click the + and - buttons to record passengers 
                alighting at each drop-off point. The fare will be automatically calculated 
                and added to your total revenue.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}