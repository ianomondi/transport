import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, Timer } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { DestinationQueue, Location } from "@shared/schema";

export default function Queue() {
  const { data: locations = [], isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
  });

  const { data: popularLocations = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations/popular'],
  });

  // Get queue data for popular destinations
  const destinationQueues = useQuery({
    queryKey: ['/api/queue/all'],
    queryFn: async () => {
      const destinations = popularLocations.map(loc => loc.name);
      const queuePromises = destinations.map(dest => 
        fetch(`/api/queue/${encodeURIComponent(dest)}`, { credentials: 'include' })
          .then(r => r.json())
          .catch(() => [])
      );
      const results = await Promise.all(queuePromises);
      
      return destinations.map((dest, index) => ({
        destination: dest,
        queue: results[index] || []
      }));
    },
    enabled: popularLocations.length > 0,
    refetchInterval: 15000,
  });

  return (
    <>
      <AppHeader />
      <main className="pb-20 min-h-screen">
        <div className="p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Queue Management</h2>
          
          {locationsLoading || destinationQueues.isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Queue Overview Statistics */}
              <Card className="material-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Timer className="h-5 w-5 mr-2 text-blue-600" />
                    Queue Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {destinationQueues.data?.reduce((total, dest) => total + dest.queue.length, 0) || 0}
                      </p>
                      <p className="text-xs text-gray-600">Total Vehicles</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {destinationQueues.data?.filter(dest => dest.queue.length > 0).length || 0}
                      </p>
                      <p className="text-xs text-gray-600">Active Queues</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {destinationQueues.data?.reduce((total, dest) => {
                          const avgWait = dest.queue.length > 0 ? (dest.queue.length - 1) * 5 : 0;
                          return Math.max(total, avgWait);
                        }, 0) || 0}
                      </p>
                      <p className="text-xs text-gray-600">Max Wait (min)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Destination Queues */}
              {destinationQueues.data?.map(({ destination, queue }) => (
                <Card key={destination} className="material-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-red-600" />
                        <span>{destination}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {queue.length} vehicle{queue.length !== 1 ? 's' : ''}
                        </Badge>
                        {queue.length > 0 && (
                          <Badge 
                            variant="outline"
                            className="border-orange-300 text-orange-600"
                          >
                            ~{(queue.length - 1) * 5}min wait
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {queue.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No vehicles in queue</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Destination is available for immediate boarding
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {queue.map((vehicle: DestinationQueue, index: number) => (
                          <div 
                            key={vehicle.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              index === 0 
                                ? 'bg-green-50 border-green-200' 
                                : index === 1
                                ? 'bg-yellow-50 border-yellow-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                index === 0 
                                  ? 'bg-green-500 text-white' 
                                  : index === 1
                                  ? 'bg-yellow-500 text-white'
                                  : 'bg-gray-400 text-white'
                              }`}>
                                {vehicle.queuePosition}
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  Trip #{vehicle.tripId}
                                  {vehicle.driverId && (
                                    <span className="text-gray-500 ml-2">
                                      ({vehicle.driverId})
                                    </span>
                                  )}
                                </p>
                                <div className="flex items-center space-x-3 text-xs text-gray-600">
                                  <span>Arrived: {formatTime(vehicle.arrivalTime)}</span>
                                  {vehicle.estimatedBoardingTime && (
                                    <span className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>ETA: {formatTime(vehicle.estimatedBoardingTime)}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <Badge 
                                variant="outline"
                                className={`text-xs ${
                                  vehicle.status === 'waiting' 
                                    ? 'border-orange-300 text-orange-600' 
                                    : vehicle.status === 'boarding'
                                    ? 'border-blue-300 text-blue-600'
                                    : 'border-green-300 text-green-600'
                                }`}
                              >
                                {vehicle.status}
                              </Badge>
                              {index === 0 && vehicle.status === 'waiting' && (
                                <span className="text-xs font-medium text-green-600">
                                  Ready to board
                                </span>
                              )}
                              {index > 0 && (
                                <span className="text-xs text-gray-500">
                                  ~{(index) * 5}min wait
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Tips for Queue Management */}
              <Card className="material-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Queue Management Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <p>Queue position is automatically assigned based on arrival time at destination</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <p>First vehicle in queue should start boarding when ready</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <p>Average boarding time is 5 minutes per vehicle</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <p>Update your status to help other drivers plan their time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <BottomNavigation />
    </>
  );
}