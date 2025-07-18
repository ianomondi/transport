import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Users, MapPin, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PassengerPickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: number;
  tripOrigin: string;
  tripDestination: string;
  currentLocation: string; // Current drop-off point where pickup happens
}

export function PassengerPickupModal({
  isOpen,
  onClose,
  tripId,
  tripOrigin,
  tripDestination,
  currentLocation
}: PassengerPickupModalProps) {
  const [passengerCount, setPassengerCount] = useState(1);
  const [dropOffLocation, setDropOffLocation] = useState("");
  const [calculatedFare, setCalculatedFare] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get valid drop-off locations for the current pickup point
  const { data: validDropOffs, isLoading: loadingDropOffs } = useQuery({
    queryKey: ["valid-dropoffs", currentLocation, tripOrigin, tripDestination],
    queryFn: async () => {
      const params = new URLSearchParams({
        pickupLocation: currentLocation,
        origin: tripOrigin,
        destination: tripDestination
      });
      const response = await fetch(`/api/routes/valid-dropoffs?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch valid drop-off locations");
      }
      return response.json();
    },
    enabled: isOpen && !!currentLocation
  });

  // Calculate fare when pickup/dropoff locations change
  useEffect(() => {
    if (dropOffLocation && currentLocation) {
      const params = new URLSearchParams({
        pickupLocation: currentLocation,
        dropOffLocation,
        origin: tripOrigin,
        destination: tripDestination
      });
      
      fetch(`/api/routes/calculate-fare?${params}`)
        .then(response => response.json())
        .then(data => setCalculatedFare(data.fare || 0))
        .catch(() => setCalculatedFare(0));
    } else {
      setCalculatedFare(0);
    }
  }, [dropOffLocation, currentLocation, tripOrigin, tripDestination]);

  const pickupMutation = useMutation({
    mutationFn: async (data: {
      passengerCount: number;
      pickupLocation: string;
      dropOffLocation: string;
      fareAmount: number;
    }) => {
      return apiRequest(`/api/trips/${tripId}/pickup-passenger`, {
        method: "POST",
        body: JSON.stringify(data)
      });
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
      
      // Reset form and close modal
      setPassengerCount(1);
      setDropOffLocation("");
      setCalculatedFare(0);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Pickup Failed",
        description: error.message || "Failed to pick up passengers",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dropOffLocation) {
      toast({
        title: "Missing Information",
        description: "Please select a drop-off location",
        variant: "destructive",
      });
      return;
    }

    if (calculatedFare <= 0) {
      toast({
        title: "Invalid Fare",
        description: "Cannot calculate fare for this route",
        variant: "destructive",
      });
      return;
    }

    pickupMutation.mutate({
      passengerCount,
      pickupLocation: currentLocation,
      dropOffLocation,
      fareAmount: calculatedFare * passengerCount
    });
  };

  const totalFare = calculatedFare * passengerCount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Pick Up Passengers
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Pickup Location
            </Label>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-700">{currentLocation}</p>
              <p className="text-xs text-gray-500">Current vehicle location</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passengerCount">Number of Passengers</Label>
            <Input
              id="passengerCount"
              type="number"
              min="1"
              max="50"
              value={passengerCount}
              onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dropOffLocation">Drop-off Destination</Label>
            {loadingDropOffs ? (
              <div className="flex items-center justify-center p-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading destinations...
              </div>
            ) : (
              <Select value={dropOffLocation} onValueChange={setDropOffLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select drop-off location" />
                </SelectTrigger>
                <SelectContent>
                  {validDropOffs?.map((location: string) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {calculatedFare > 0 && (
            <div className="p-3 bg-green-50 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Fare Calculation</span>
              </div>
              <div className="space-y-1 text-sm text-green-600">
                <p>Fare per passenger: RWF {calculatedFare}</p>
                <p>Total passengers: {passengerCount}</p>
                <p className="font-bold">Total fare: RWF {totalFare}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pickupMutation.isPending || !dropOffLocation || calculatedFare <= 0}
              className="flex-1"
            >
              {pickupMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Picking Up...
                </>
              ) : (
                "Pick Up Passengers"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}