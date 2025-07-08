import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Mail, Calendar, Download, Settings as SettingsIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const [emailSettings, setEmailSettings] = useState({
    backOfficeEmail: localStorage.getItem('backOfficeEmail') || '',
    dailyReportsEnabled: localStorage.getItem('dailyReportsEnabled') === 'true',
  });
  
  const { toast } = useToast();

  const saveEmailSettings = () => {
    localStorage.setItem('backOfficeEmail', emailSettings.backOfficeEmail);
    localStorage.setItem('dailyReportsEnabled', emailSettings.dailyReportsEnabled.toString());
    toast({
      title: "Settings Saved",
      description: "Email settings have been updated successfully",
    });
  };

  const sendTestReportMutation = useMutation({
    mutationFn: (email: string) => 
      apiRequest('POST', '/api/reports/email', { email }),
    onSuccess: () => {
      toast({
        title: "Test Report Sent",
        description: "Daily report has been sent to the specified email",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send test report. Please check your email address and try again.",
        variant: "destructive",
      });
    },
  });

  const downloadReportMutation = useMutation({
    mutationFn: () => 
      fetch('/api/reports/daily').then(res => res.json()),
    onSuccess: (data) => {
      // Create a simple CSV download
      const csvContent = [
        'Date,Total Revenue,Total Expenses,Net Income,Total Trips,Passengers',
        `${data.date},$${data.totalRevenue},$${data.totalExpenses},$${data.netIncome},${data.totalTrips},${data.totalPassengers}`
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transit-report-${data.date}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Report Downloaded",
        description: "Daily report has been downloaded as CSV",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <AppHeader />
      <main className="pb-20 min-h-screen">
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-6">
            <SettingsIcon className="h-6 w-6 text-gray-600" />
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>

          {/* Email Reporting Settings */}
          <Card className="material-shadow mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Email Reporting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="backOfficeEmail">Back Office Email</Label>
                <Input
                  id="backOfficeEmail"
                  type="email"
                  placeholder="admin@company.com"
                  value={emailSettings.backOfficeEmail}
                  onChange={(e) => setEmailSettings(prev => ({
                    ...prev,
                    backOfficeEmail: e.target.value
                  }))}
                  className="mt-1"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Email address where daily reports will be sent
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dailyReports">Daily Reports</Label>
                  <p className="text-sm text-gray-600">
                    Automatically send daily reports at end of day
                  </p>
                </div>
                <Switch
                  id="dailyReports"
                  checked={emailSettings.dailyReportsEnabled}
                  onCheckedChange={(checked) => setEmailSettings(prev => ({
                    ...prev,
                    dailyReportsEnabled: checked
                  }))}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button onClick={saveEmailSettings} className="flex-1">
                  Save Settings
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => sendTestReportMutation.mutate(emailSettings.backOfficeEmail)}
                  disabled={!emailSettings.backOfficeEmail || sendTestReportMutation.isPending}
                  className="flex-1"
                >
                  {sendTestReportMutation.isPending ? "Sending..." : "Send Test Report"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Management */}
          <Card className="material-shadow mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Report Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => downloadReportMutation.mutate()}
                  disabled={downloadReportMutation.isPending}
                  className="justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloadReportMutation.isPending ? "Downloading..." : "Download Today's Report (CSV)"}
                </Button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Daily Report Features</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Complete trip summaries with revenue details</li>
                  <li>• Expense tracking by category</li>
                  <li>• Net income calculations</li>
                  <li>• Passenger statistics and averages</li>
                  <li>• Professional HTML email format</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* App Information */}
          <Card className="material-shadow">
            <CardHeader>
              <CardTitle>About Transit Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Version:</strong> 1.0.0</p>
                <p><strong>Last Updated:</strong> July 2025</p>
                <p><strong>Database:</strong> PostgreSQL with real-time sync</p>
                <p><strong>Features:</strong> Trip tracking, expense management, analytics, email reporting</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <BottomNavigation />
    </>
  );
}