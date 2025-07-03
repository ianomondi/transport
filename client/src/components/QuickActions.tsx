import { Route, MapPin, Square, BarChart3 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLocation } from "wouter";

interface QuickActionsProps {
  onNewTrip: () => void;
}

export function QuickActions({ onNewTrip }: QuickActionsProps) {
  const { toast } = useToast();
  const { location } = useGeolocation();
  const [, navigate] = useLocation();

  const endTripMutation = useMutation({
    mutationFn: async () => {
      const activeTrip = await fetch('/api/trips/active', { credentials: 'include' }).then(r => r.json());
      if (activeTrip) {
        return apiRequest('POST', `/api/trips/${activeTrip.id}/end`, {});
      }
      throw new Error('No active trip found');
    },
    onSuccess: () => {
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

  const handleEndTrip = () => {
    endTripMutation.mutate();
  };

  const handleMarkLocation = () => {
    if (location) {
      toast({
        title: "Location Marked",
        description: `Location saved: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
      });
    } else {
      toast({
        title: "Location Error",
        description: "Unable to get current location",
        variant: "destructive",
      });
    }
  };

  const handleShowAnalytics = () => {
    navigate('/analytics');
  };

  return (
    <div className="px-4 mb-4">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          className="bg-white p-4 rounded-xl material-shadow text-center ripple-effect"
          onClick={onNewTrip}
        >
          <Route className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">New Trip</p>
        </button>
        
        <button
          className="bg-white p-4 rounded-xl material-shadow text-center ripple-effect"
          onClick={handleMarkLocation}
        >
          <MapPin className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Mark Location</p>
        </button>
        
        <button
          className="bg-white p-4 rounded-xl material-shadow text-center ripple-effect"
          onClick={handleEndTrip}
          disabled={endTripMutation.isPending}
        >
          <Square className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">End Trip</p>
        </button>
        
        <button
          className="bg-white p-4 rounded-xl material-shadow text-center ripple-effect"
          onClick={handleShowAnalytics}
        >
          <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Analytics</p>
        </button>
      </div>
    </div>
  );
}
