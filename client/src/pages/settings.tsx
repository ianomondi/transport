import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  MapPin, 
  Shield, 
  Smartphone, 
  User, 
  HelpCircle, 
  LogOut,
  Settings as SettingsIcon
} from "lucide-react";

export default function Settings() {
  return (
    <>
      <AppHeader />
      <main className="pb-20 min-h-screen">
        <div className="p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>
          
          <div className="space-y-4">
            {/* Profile Section */}
            <Card className="material-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Driver Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">John Doe</p>
                    <p className="text-sm text-gray-600">Driver ID: #12345</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="material-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Bell className="h-5 w-5 mr-2 text-green-600" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-600">Receive real-time alerts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Trip Alerts</p>
                    <p className="text-sm text-gray-600">Get notified about trip updates</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Passenger Updates</p>
                    <p className="text-sm text-gray-600">Alerts for boarding/alighting</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Location Settings */}
            <Card className="material-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <MapPin className="h-5 w-5 mr-2 text-red-600" />
                  Location Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">GPS Tracking</p>
                    <p className="text-sm text-gray-600">Enable real-time location</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">High Accuracy</p>
                    <p className="text-sm text-gray-600">Use GPS for precise location</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Background Tracking</p>
                    <p className="text-sm text-gray-600">Track location during trips</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* App Settings */}
            <Card className="material-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <SettingsIcon className="h-5 w-5 mr-2 text-purple-600" />
                  App Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Offline Mode</p>
                    <p className="text-sm text-gray-600">Work without internet</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Auto-sync</p>
                    <p className="text-sm text-gray-600">Sync data automatically</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Analytics</p>
                    <p className="text-sm text-gray-600">Help improve the app</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Support & Help */}
            <Card className="material-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <HelpCircle className="h-5 w-5 mr-2 text-orange-600" />
                  Support & Help
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="ghost" className="w-full justify-start">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Privacy Policy
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help Center
                </Button>
              </CardContent>
            </Card>

            {/* Logout */}
            <Card className="material-shadow">
              <CardContent className="pt-6">
                <Button variant="destructive" className="w-full">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </>
  );
}
