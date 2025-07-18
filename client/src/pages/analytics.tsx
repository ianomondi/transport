import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Users, MapPin, Clock, Route, DollarSign, Star, Award, Zap, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import type { Analytics } from "@shared/schema";

export default function Analytics() {
  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ['/api/analytics/today'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: routes, isLoading: routesLoading } = useQuery<{ route: string; count: number; avgPassengers: number }[]>({
    queryKey: ['/api/analytics/routes'],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: drivers, isLoading: driversLoading } = useQuery<{ driverId: number; driverName: string; trips: number; passengers: number; revenue: number }[]>({
    queryKey: ['/api/analytics/drivers'],
    refetchInterval: 60000,
  });

  const { data: hourlyFlow, isLoading: hourlyLoading } = useQuery<{ hour: number; passengers: number }[]>({
    queryKey: ['/api/analytics/hourly'],
    refetchInterval: 30000,
  });

  const isLoading = analyticsLoading || routesLoading || driversLoading || hourlyLoading;

  // Prepare chart data
  const hourlyChartData = hourlyFlow?.filter(h => h.passengers > 0).map(h => ({
    hour: h.hour === 0 ? '12 AM' : h.hour < 12 ? `${h.hour} AM` : h.hour === 12 ? '12 PM' : `${h.hour - 12} PM`,
    passengers: h.passengers,
    hourNum: h.hour
  })).sort((a, b) => a.hourNum - b.hourNum) || [];

  const routeColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const pieChartData = routes?.slice(0, 5).map((route, index) => ({
    name: route.route,
    value: route.count,
    color: routeColors[index] || '#6B7280'
  })) || [];

  // Calculate peak hour
  const peakHour = hourlyFlow?.reduce((peak, current) => 
    current.passengers > peak.passengers ? current : peak
  , { hour: 0, passengers: 0 });

  const peakHourText = peakHour?.hour === 0 ? '12 AM' : 
    peakHour?.hour && peakHour.hour < 12 ? `${peakHour.hour} AM` : 
    peakHour?.hour === 12 ? '12 PM' : 
    peakHour?.hour ? `${peakHour.hour - 12} PM` : 'N/A';

  // Calculate efficiency metrics
  const totalRevenue = drivers?.reduce((sum, driver) => sum + driver.revenue, 0) || 0;
  const topDriver = drivers?.[0];
  const efficiencyScore = analytics?.totalTrips && analytics.totalTrips > 0 ? 
    Math.round((analytics.totalPassengers / analytics.totalTrips) * 20) : 0;

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
            <div className="space-y-6">
              {/* Key Performance Indicators */}
              <div className="space-y-4">
                {/* Top Row: Trips and Passengers */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="material-shadow">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                        <Route className="h-6 w-6 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{analytics?.totalTrips || 0}</p>
                      <p className="text-sm text-gray-600">Trips Today</p>
                    </CardContent>
                  </Card>

                  <Card className="material-shadow">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">{analytics?.totalPassengers || 0}</p>
                      <p className="text-sm text-gray-600">Passengers</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Bottom Row: Miles and Revenue */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="material-shadow">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-2">
                        <MapPin className="h-6 w-6 text-orange-600" />
                      </div>
                      <p className="text-2xl font-bold text-orange-600">
                        {parseFloat(analytics?.totalDistance || "0").toFixed(1)}
                      </p>
                      <p className="text-sm text-gray-600">Miles</p>
                    </CardContent>
                  </Card>

                  <Card className="material-shadow">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                        <DollarSign className="h-6 w-6 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-purple-600">${totalRevenue.toFixed(0)}</p>
                      <p className="text-sm text-gray-600">Revenue</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Hourly Passenger Flow Chart */}
              <Card className="material-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    Hourly Passenger Flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hourlyChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={hourlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="passengers" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-2" />
                      <p>No passenger data for today</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Popular Routes and Driver Performance */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Popular Routes */}
                <Card className="material-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <MapPin className="h-5 w-5 mr-2 text-green-600" />
                      Popular Routes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {routes && routes.length > 0 ? (
                      <div className="space-y-4">
                        {routes.slice(0, 5).map((route, index) => (
                          <div key={route.route} className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{route.route}</p>
                              <div className="flex items-center mt-1">
                                <Progress 
                                  value={(route.count / (routes[0]?.count || 1)) * 100} 
                                  className="h-2 flex-1 mr-2"
                                />
                                <span className="text-xs text-gray-500">
                                  {route.count} trips
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Route className="h-12 w-12 mx-auto mb-2" />
                        <p>No route data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Drivers */}
                <Card className="material-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Award className="h-5 w-5 mr-2 text-yellow-600" />
                      Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {drivers && drivers.length > 0 ? (
                      <div className="space-y-4">
                        {drivers.slice(0, 5).map((driver, index) => (
                          <div key={driver.driverId} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                index === 1 ? 'bg-gray-100 text-gray-800' :
                                index === 2 ? 'bg-orange-100 text-orange-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{driver.driverName}</p>
                                <p className="text-xs text-gray-500">
                                  {driver.trips} trips • {driver.passengers} passengers
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              ${driver.revenue.toFixed(0)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Star className="h-12 w-12 mx-auto mb-2" />
                        <p>No driver data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Insights and Recommendations */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Performance Metrics */}
                <Card className="material-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Target className="h-5 w-5 mr-2 text-purple-600" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Passengers per Trip</span>
                      <span className="font-semibold">
                        {parseFloat(analytics?.averagePassengersPerTrip || "0").toFixed(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Peak Hour</span>
                      <span className="font-semibold text-blue-600">{peakHourText}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Efficiency Score</span>
                      <div className="flex items-center">
                        <Progress value={efficiencyScore} className="w-16 h-2 mr-2" />
                        <span className="font-semibold text-green-600">{efficiencyScore}%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Drivers</span>
                      <span className="font-semibold">{drivers?.length || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Smart Insights */}
                <Card className="material-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                      Smart Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {routes && routes.length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-900">Most Popular Route</p>
                        <p className="text-xs text-blue-700">{routes[0].route}</p>
                        <p className="text-xs text-blue-600 mt-1">
                          {routes[0].count} trips • Avg {routes[0].avgPassengers.toFixed(1)} passengers
                        </p>
                      </div>
                    )}
                    
                    {topDriver && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-green-900">Top Performer</p>
                        <p className="text-xs text-green-700">{topDriver.driverName}</p>
                        <p className="text-xs text-green-600 mt-1">
                          {topDriver.trips} trips completed today
                        </p>
                      </div>
                    )}
                    
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm font-medium text-orange-900">Optimization Tip</p>
                      <p className="text-xs text-orange-700">
                        {analytics?.totalTrips && analytics.totalTrips > 0 
                          ? `Consider scheduling more vehicles during ${peakHourText} for peak demand`
                          : "Start tracking trips to receive optimization recommendations"
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <BottomNavigation />
    </>
  );
}
