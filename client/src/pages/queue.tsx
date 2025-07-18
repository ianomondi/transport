import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Clock, Users, AlertCircle, CheckCircle } from "lucide-react";
import { formatTime, formatDate } from "@/lib/utils";
import type { DestinationQueue, Trip } from "@shared/schema";

interface QueueWithTrip extends DestinationQueue {
  trip?: Trip;
}

export default function Queue() {
  const { data: queueData = [], isLoading } = useQuery<QueueWithTrip[]>({
    queryKey: ['/api/queue'],
    refetchInterval: 5000,
  });

  // Group queue entries by destination
  const queueByDestination = queueData.reduce((acc, entry) => {
    const destination = entry.destination;
    if (!acc[destination]) {
      acc[destination] = [];
    }
    acc[destination].push(entry);
    return acc;
  }, {} as Record<string, QueueWithTrip[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'boarding':
        return 'bg-blue-100 text-blue-800';
      case 'departed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-4 w-4" />;
      case 'boarding':
        return <Users className="h-4 w-4" />;
      case 'departed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="p-4">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(2)].map((_, j) => (
                      <div key={j} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-5 bg-gray-200 rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="p-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Queue Management</h1>
          <div className="text-sm text-gray-600">
            {queueData.length} vehicle{queueData.length !== 1 ? 's' : ''} in queue
          </div>
        </div>

        {Object.keys(queueByDestination).length === 0 ? (
          <Card className="material-shadow">
            <CardContent className="p-8 text-center">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles in queue</h3>
              <p className="text-gray-600">When trips are completed, vehicles will appear here waiting for their next turn</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(queueByDestination).map(([destination, entries]) => (
              <Card key={destination} className="material-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    {destination}
                    <Badge variant="outline" className="ml-2">
                      {entries.length} vehicle{entries.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {entries
                      .sort((a, b) => a.queuePosition - b.queuePosition)
                      .map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-medium text-sm">
                              {entry.queuePosition}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {entry.vehicle?.numberPlate ? `${entry.vehicle.numberPlate} (${entry.vehicle.make} ${entry.vehicle.model})` : `Trip #${entry.tripId}`}
                              </div>
                              <div className="text-sm text-gray-600">
                                Driver: {entry.driver?.name || 'Unknown'}
                              </div>
                              {entry.driver?.contact && (
                                <div className="text-xs text-gray-500">
                                  Contact: {entry.driver.contact}
                                </div>
                              )}
                              <div className="text-xs text-gray-500">
                                Arrived: {formatTime(entry.arrivalTime)}
                              </div>
                              {entry.estimatedBoardingTime && (
                                <div className="text-xs text-blue-600">
                                  Est. boarding: {formatTime(entry.estimatedBoardingTime)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${getStatusColor(entry.status)} border-0`}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(entry.status)}
                                <span className="capitalize">{entry.status}</span>
                              </div>
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <BottomNavigation />
    </div>
  );
}