import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ActiveTripCard } from "@/components/ActiveTripCard";
import { QuickActions } from "@/components/QuickActions";
import { LiveMap } from "@/components/LiveMap";
import { TripStatistics } from "@/components/TripStatistics";
import { RecentTrips } from "@/components/RecentTrips";
import { ExpenseModal } from "@/components/ExpenseModal";
import { NewTripModal } from "@/components/NewTripModal";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { NotificationToast } from "@/components/NotificationToast";
import { QueueStatusCard } from "@/components/QueueStatusCard";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [, setLocation] = useLocation();

  const handleNewTrip = () => {
    setShowNewTripModal(true);
  };

  return (
    <>
      <AppHeader />
      <main className="pb-20 min-h-screen">
        <ActiveTripCard />
        <QueueStatusCard />
        <LiveMap />
        <TripStatistics />
        <RecentTrips />
        
        {/* Help tip for new users */}
        <div className="px-4 mb-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Tap the + button to add trips or track expenses
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <BottomNavigation />
      
      <FloatingActionButton 
        onNewTrip={handleNewTrip}
        onNewExpense={() => setShowExpenseModal(true)}
      />
      
      <ExpenseModal 
        isOpen={showExpenseModal} 
        onClose={() => setShowExpenseModal(false)} 
      />
      
      <NewTripModal 
        isOpen={showNewTripModal} 
        onClose={() => setShowNewTripModal(false)} 
      />
      
      <NotificationToast />
    </>
  );
}
