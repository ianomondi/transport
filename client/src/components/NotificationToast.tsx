import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { queryClient } from "@/lib/queryClient";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

export function NotificationToast() {
  const { toasts, toast } = useToast();
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'trip_auto_completed':
        toast({
          title: "Trip Completed Automatically",
          description: `You've reached your destination and been added to the queue at ${lastMessage.trip.destination}. Position: #${lastMessage.queuePosition.queuePosition}`,
          duration: 8000,
        });
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['/api/trips/active'] });
        queryClient.invalidateQueries({ queryKey: ['/api/trips/recent'] });
        queryClient.invalidateQueries({ queryKey: ['/api/queue/position'] });
        break;

      case 'queue_updated':
        toast({
          title: "Queue Status Updated",
          description: `Queue position updated for ${lastMessage.queue.destination}`,
          duration: 5000,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
        break;

      case 'trip_ended':
        if (lastMessage.queuePosition) {
          toast({
            title: "Added to Queue",
            description: `Position #${lastMessage.queuePosition.queuePosition} at ${lastMessage.queuePosition.destination}`,
            duration: 6000,
          });
        }
        break;

      case 'passenger_update':
        toast({
          title: "Passenger Count Updated",
          description: `Current passengers: ${lastMessage.newPassengerCount}`,
          duration: 3000,
        });
        break;

      default:
        break;
    }
  }, [lastMessage, toast]);

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
