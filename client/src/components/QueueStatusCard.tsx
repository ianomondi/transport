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
      <Card className="material-shadow border-l-4 border-l-orange-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-600" />
              Queue at {queuePosition.destination}
            </h3>
            <Badge variant="outline" className="border-orange-300 text-orange-600">
              Position #{queuePosition.queuePosition}
            </Badge>
          </div>

          <div className="space-y-3">
            {isFirst ? (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-sm font-medium text-green-800">
                    You're first in line!
                  </p>
                </div>
                <p className="text-xs text-green-700 mb-3">
                  Your vehicle arrived first at this destination. You can now proceed to pick up passengers.
                </p>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => updateStatusMutation.mutate('boarding')}
                  disabled={updateStatusMutation.isPending}
                >
                  Start Boarding Passengers
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-orange-800">
                    {vehiclesAhead} vehicle{vehiclesAhead !== 1 ? 's' : ''} ahead
                  </p>
                  <span className="text-xs text-orange-600 font-medium">
                    ~{vehiclesAhead * 5}min wait
                  </span>
                </div>
                <p className="text-xs text-orange-700">
                  Queue position is based on arrival time at destination. Please wait for your turn.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded">
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Arrived: {formatTime(queuePosition.arrivalTime)}
              </span>
              {queuePosition.estimatedBoardingTime && !isFirst && (
                <span className="text-blue-600 font-medium">
                  ETA: {formatTime(queuePosition.estimatedBoardingTime)}
                </span>
              )}
            </div>

            {queuePosition.status === 'boarding' && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <Users className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-sm font-medium text-blue-800">
                    Currently boarding passengers
                  </p>
                </div>
                <p className="text-xs text-blue-700 mb-3">
                  Complete boarding and depart when ready.
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
                <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Current Queue ({destinationQueue.length} vehicles)
                </h3>
                <div className="space-y-2">
                  {destinationQueue.slice(0, 5).map((item, index) => (
                    <div 
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded ${
                        item.id === queuePosition.id 
                          ? 'bg-blue-50 border border-blue-200' 
                          : index === 0 
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          index === 0 ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                        }`}>
                          {item.queuePosition}
                        </span>
                        <div>
                          <span className="text-sm font-medium">
                            Trip #{item.tripId}
                            {item.id === queuePosition.id && ' (You)'}
                          </span>
                          <p className="text-xs text-gray-500">
                            Arrived: {formatTime(item.arrivalTime)}
                          </p>
                        </div>
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

            {/* Queue Information */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800 font-medium mb-1">ℹ️ Queue Information</p>
              <p className="text-xs text-blue-700">
                • Queue position is automatically assigned based on arrival time<br/>
                • First to arrive = First in queue<br/>
                • Average boarding time: 5 minutes per vehicle
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}