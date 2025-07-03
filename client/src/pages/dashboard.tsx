import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ActiveTripCard } from "@/components/ActiveTripCard";
import { QuickActions } from "@/components/QuickActions";
import { LiveMap } from "@/components/LiveMap";
import { TripStatistics } from "@/components/TripStatistics";
import { RecentTrips } from "@/components/RecentTrips";
import { NewTripModal } from "@/components/NewTripModal";
import { NotificationToast } from "@/components/NotificationToast";
import { QueueStatusCard } from "@/components/QueueStatusCard";
import { useState } from "react";

export default function Dashboard() {
  const [showNewTripModal, setShowNewTripModal] = useState(false);

  return (
    <>
      <AppHeader />
      <main className="pb-20 min-h-screen">
        <ActiveTripCard />
        <QueueStatusCard />
        <QuickActions onNewTrip={() => setShowNewTripModal(true)} />
        <LiveMap />
        <TripStatistics />
        <RecentTrips />
      </main>
      <BottomNavigation />
      <NewTripModal 
        isOpen={showNewTripModal} 
        onClose={() => setShowNewTripModal(false)} 
      />
      <NotificationToast />
    </>
  );
}
