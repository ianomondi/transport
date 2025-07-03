import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, MapPin, CheckCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "@/lib/utils";
import type { DestinationQueue, Trip } from "@shared/schema";

export function QueueStatusCard() {
  const { toast } = useToast();
  
  const { data: activeTrip } = useQuery<Trip>({
    queryKey: ['/api/trips/active'],
    refetchInterval: 5000,
  });

  const { data: queuePosition, isLoading } = useQuery<DestinationQueue>({
    queryKey: ['/api/queue/position', activeTrip?.id],
    enabled: !!activeTrip?.id && activeTrip?.status === 'completed',
    refetchInterval: 10000,
  });

  const { data: destinationQueue = [] } = useQuery<DestinationQueue[]>({
    queryKey: ['/api/queue', activeTrip?.destination],
    enabled: !!activeTrip?.destination && activeTrip?.status === 'completed',
    refetchInterval: 10000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => 
      apiRequest('PATCH', `/api/queue/${queuePosition?.id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/queue/position'] });
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      toast({
        title: "Status Updated",
        description: "Your queue status has been updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update queue status",
        variant: "destructive",
      });
    },
  });

  const removeFromQueueMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/queue/${queuePosition?.id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/queue/position'] });
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      toast({
        title: "Departed",
        description: "You have left the queue",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to depart from queue",
        variant: "destructive",
      });
    },
  });

  // Don't show if no active trip or trip is still active
  if (!activeTrip || activeTrip.status !== 'completed') {
    return null;
  }

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

  if (!queuePosition) {
    return null;
  }

  const isFirst = queuePosition.queuePosition === 1;
  const vehiclesAhead = queuePosition.queuePosition - 1;

  return (
    <div className="p-4">
      <Card className="material-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium text-gray-900">Queue Status</h2>
            <Badge 
              variant={queuePosition.status === 'waiting' ? 'default' : 'secondary'}
              className={queuePosition.status === 'waiting' ? 'bg-orange-500' : 'bg-green-500'}
            >
              {queuePosition.status === 'waiting' ? 'In Queue' : queuePosition.status}
            </Badge>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Destination</p>
                <p className="font-medium">{queuePosition.destination}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {queuePosition.queuePosition}
                </p>
                <p className="text-xs text-gray-600">Position in Queue</p>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-lg font-bold text-orange-600">
                  {queuePosition.estimatedBoardingTime 
                    ? formatTime(queuePosition.estimatedBoardingTime)
                    : 'Now'
                  }
                </p>
                <p className="text-xs text-gray-600">Estimated Boarding</p>
              </div>
            </div>

            {vehiclesAhead > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">
                  {vehiclesAhead} vehicle{vehiclesAhead > 1 ? 's' : ''} ahead of you
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Estimated wait: ~{vehiclesAhead * 5} minutes
                </p>
              </div>
            )}

            {isFirst && queuePosition.status === 'waiting' && (
              <div className="p-3 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-medium text-green-800">
                    You're next! Ready to board passengers
                  </p>
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => updateStatusMutation.mutate('boarding')}
                  disabled={updateStatusMutation.isPending}
                >
                  Start Boarding
                </Button>
              </div>
            )}

            {queuePosition.status === 'boarding' && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  Currently boarding passengers
                </p>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => removeFromQueueMutation.mutate()}
                  disabled={removeFromQueueMutation.isPending}
                >
                  Complete & Depart
                </Button>
              </div>
            )}

            {/* Queue overview */}
            {destinationQueue.length > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Queue at {queuePosition.destination}
                </h3>
                <div className="space-y-2">
                  {destinationQueue.slice(0, 5).map((item, index) => (
                    <div 
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded ${
                        item.id === queuePosition.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          index === 0 ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                        }`}>
                          {item.queuePosition}
                        </span>
                        <span className="text-sm">
                          Trip #{item.tripId}
                          {item.id === queuePosition.id && ' (You)'}
                        </span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          item.status === 'waiting' ? 'border-orange-300 text-orange-600' :
                          item.status === 'boarding' ? 'border-blue-300 text-blue-600' :
                          'border-green-300 text-green-600'
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                  {destinationQueue.length > 5 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{destinationQueue.length - 5} more vehicles in queue
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}