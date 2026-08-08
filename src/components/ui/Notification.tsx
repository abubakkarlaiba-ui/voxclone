"use client";

import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationProps {
  type: NotificationType;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
  className?: string;
}

const typeConfig: Record<NotificationType, { container: string; icon: ReactNode }> = {
  success: {
    container: "border-success/20 bg-success/5 text-success",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    container: "border-error/20 bg-error/5 text-error",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  warning: {
    container: "border-warning/20 bg-warning/5 text-warning",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
  },
  info: {
    container: "border-accent-primary/20 bg-accent-primary/5 text-accent-primary",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export function Notification({
  type,
  message,
  onClose,
  autoClose = true,
  duration = 5000,
  className,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  if (!isVisible) return null;

  const { container, icon } = typeConfig[type];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3.5 shadow-lg animate-slide-in-right",
        container,
        className
      )}
      role="alert"
    >
      <div className="flex-shrink-0">{icon}</div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      {onClose && (
        <button
          onClick={() => { setIsVisible(false); onClose(); }}
          className="flex-shrink-0 rounded-lg p-1 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

interface NotificationContainerProps {
  notifications: Array<{ id: string; type: NotificationType; message: string }>;
  onDismiss: (id: string) => void;
}

export function NotificationContainer({ notifications, onDismiss }: NotificationContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex max-w-sm flex-col gap-2">
      {notifications.map((n) => (
        <Notification key={n.id} type={n.type} message={n.message} onClose={() => onDismiss(n.id)} />
      ))}
    </div>
  );
}
