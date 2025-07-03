import { Bus, User } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";

export function AppHeader() {
  const { isConnected } = useWebSocket();

  return (
    <header className="bg-blue-600 text-white p-4 material-shadow sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Bus className="h-8 w-8 mr-3" />
          <div>
            <h1 className="text-lg font-medium">TransitTracker</h1>
            <p className="text-sm opacity-90">Driver Dashboard</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`status-indicator ${isConnected ? 'status-active' : 'status-inactive'}`} />
          <button className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
