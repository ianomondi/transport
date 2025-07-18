import { useState } from "react";
import { Plus, Car, Receipt, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FloatingActionButtonProps {
  onNewTrip: () => void;
  onNewExpense: () => void;
}

export function FloatingActionButton({ onNewTrip, onNewExpense }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleTripClick = () => {
    onNewTrip();
    setIsOpen(false);
  };

  const handleExpenseClick = () => {
    onNewExpense();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {/* Action Menu */}
      {isOpen && (
        <div className="mb-4 space-y-2">
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur">
            <CardContent className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-blue-700 hover:bg-blue-50"
                onClick={handleTripClick}
              >
                <Car className="h-5 w-5 mr-3" />
                Start Trip
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-green-700 hover:bg-green-50"
                onClick={handleExpenseClick}
              >
                <Receipt className="h-5 w-5 mr-3" />
                Add Expense
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main FAB */}
      <Button
        onClick={toggleMenu}
        className={`
          h-14 w-14 rounded-full shadow-lg transition-all duration-200 
          ${isOpen 
            ? 'bg-red-500 hover:bg-red-600 rotate-45' 
            : 'bg-blue-500 hover:bg-blue-600'
          }
        `}
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Plus className="h-6 w-6 text-white" />
        )}
      </Button>
    </div>
  );
}