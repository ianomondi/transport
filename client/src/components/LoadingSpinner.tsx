import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  className?: string;
  text?: string;
}

export function LoadingSpinner({ className = "", text = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
}