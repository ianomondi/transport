import { useLocation } from "wouter";
import { Home, Route, BarChart3, Settings, Users } from "lucide-react";
import { Link } from "wouter";

export function BottomNavigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/trips", icon: Route, label: "Trips" },
    { path: "/queue", icon: Users, label: "Queue" },
    { path: "/analytics", icon: BarChart3, label: "Stats" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div className="max-w-sm mx-auto">
        <div className="flex">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location === path;
            return (
              <Link key={path} href={path} className="flex-1">
                <button className="flex-1 py-3 px-4 text-center ripple-effect w-full">
                  <Icon className={`h-5 w-5 mx-auto mb-1 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <p className={`text-xs ${isActive ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                    {label}
                  </p>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
