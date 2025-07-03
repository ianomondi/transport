import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, MapPin, Clock } from "lucide-react";
import type { Analytics } from "@shared/schema";

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ['/api/analytics/today'],
  });

  return (
    <>
      <AppHeader />
      <main className="pb-20 min-h-screen">
        <div className="p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics Dashboard</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Today's Statistics */}
              <Card className="material-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    Today's Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
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
                </CardContent>
              </Card>

              {/* Hourly Passenger Flow */}
              <Card className="material-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Users className="h-5 w-5 mr-2 text-green-600" />
                    Hourly Passenger Flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="analytics-chart">
                    {analytics?.hourlyData?.map((data, index) => (
                      <div
                        key={index}
                        className="chart-bar"
                        style={{ 
                          height: `${Math.max(10, (data.passengers / Math.max(...analytics.hourlyData.map(d => d.passengers), 1)) * 100)}%` 
                        }}
                      />
                    )) || [...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className="chart-bar"
                        style={{ height: `${Math.random() * 80 + 20}%` }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 text-center mt-2">
                    Past 7 hours
                  </p>
                </CardContent>
              </Card>

              {/* Average Metrics */}
              <Card className="material-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Clock className="h-5 w-5 mr-2 text-purple-600" />
                    Average Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Passengers per Trip</span>
                      <span className="font-semibold">
                        {parseFloat(analytics?.averagePassengersPerTrip || "0").toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Trip Efficiency</span>
                      <span className="font-semibold text-green-600">Good</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Peak Hours</span>
                      <span className="font-semibold">8-10 AM, 5-7 PM</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Route Insights */}
              <Card className="material-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <MapPin className="h-5 w-5 mr-2 text-red-600" />
                    Route Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Most Popular Route</p>
                      <p className="text-xs text-gray-600">Central Station → Airport Terminal</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Busiest Stop</p>
                      <p className="text-xs text-gray-600">Downtown Hub</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Optimization Tip</p>
                      <p className="text-xs text-gray-600">Consider adding more stops near Mall District</p>
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
