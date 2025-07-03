import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Analytics } from "@shared/schema";

export function TripStatistics() {
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ['/api/analytics/today'],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="px-4 mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Today's Statistics</h3>
        <Card className="animate-pulse">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-8 mx-auto"></div>
              </div>
              <div className="text-center">
                <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-8 mx-auto"></div>
              </div>
              <div className="text-center">
                <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-8 mx-auto"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 mb-4">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Today's Statistics</h3>
      <Card className="material-shadow">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {analytics?.totalTrips || 0}
              </p>
              <p className="text-xs text-gray-600">Trips</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {analytics?.totalPassengers || 0}
              </p>
              <p className="text-xs text-gray-600">Passengers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {parseFloat(analytics?.totalDistance || "0").toFixed(1)}
              </p>
              <p className="text-xs text-gray-600">Miles</p>
            </div>
          </div>
          
          <div className="analytics-chart">
            {analytics?.hourlyData && analytics.hourlyData.length > 0 ? (
              analytics.hourlyData.map((data, index) => (
                <div
                  key={index}
                  className="chart-bar"
                  style={{ 
                    height: `${Math.max(20, (data.passengers / Math.max(...analytics.hourlyData.map(d => d.passengers), 1)) * 100)}%` 
                  }}
                />
              ))
            ) : (
              [...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="chart-bar"
                  style={{ height: `${Math.random() * 60 + 20}%` }}
                />
              ))
            )}
          </div>
          
          <p className="text-xs text-gray-600 text-center mt-2">Hourly passenger flow</p>
        </CardContent>
      </Card>
    </div>
  );
}
