import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
  children?: ReactNode;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
  children,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="mb-4 rounded-full bg-error/10 p-3">
        <svg className="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-base font-medium text-text-primary">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-text-secondary">{message}</p>
      {(onRetry || children) && (
        <div className="mt-5 flex gap-2">
          {onRetry && <Button onClick={onRetry} variant="secondary" size="sm">Try Again</Button>}
          {children}
        </div>
      )}
    </div>
  );
}
