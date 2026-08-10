import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeStyles = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
};

export function LoadingSpinner({ size = "md", className, label }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 animate-fade-in", className)} role="status">
      <div className="relative">
        <svg
          className={cn("animate-spin text-accent-primary", sizeStyles[size])}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path
            className="opacity-80"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            d="M12 2a10 10 0 0 1 10 10"
          />
        </svg>
      </div>
      {label && <span className="text-sm text-text-secondary">{label}</span>}
    </div>
  );
}
