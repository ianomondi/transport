import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface TripStatusBadgeProps {
  status: string;
  className?: string;
}

export function TripStatusBadge({ status, className = "" }: TripStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          icon: Clock,
          className: 'bg-orange-500 hover:bg-orange-600 text-white',
          label: 'In Progress'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          className: 'bg-green-500 hover:bg-green-600 text-white',
          label: 'Completed'
        };
      case 'cancelled':
        return {
          icon: XCircle,
          className: 'bg-red-500 hover:bg-red-600 text-white',
          label: 'Cancelled'
        };
      default:
        return {
          icon: Clock,
          className: 'bg-gray-500 hover:bg-gray-600 text-white',
          label: status
        };
    }
  };

  const { icon: Icon, className: statusClassName, label } = getStatusConfig();

  return (
    <Badge className={`${statusClassName} ${className} flex items-center space-x-1`}>
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </Badge>
  );
}