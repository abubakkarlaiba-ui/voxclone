import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "glass" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
}

const variantStyles = {
  default:
    "bg-bg-card border border-border-primary",
  glass:
    "glass",
  elevated:
    "bg-bg-tertiary border border-border-secondary shadow-lg",
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({ children, className, variant = "default", padding = "md", onClick }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl transition-all duration-200",
        variantStyles[variant],
        paddingStyles[padding],
        onClick && "cursor-pointer card-hover",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4";
}

export function CardTitle({ children, className, as: Tag = "h3" }: CardTitleProps) {
  return (
    <Tag className={cn("text-base font-semibold text-text-primary", className)}>
      {children}
    </Tag>
  );
}

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p className={cn("text-sm text-text-secondary", className)}>
      {children}
    </p>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn(className)}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div
      className={cn(
        "mt-4 flex items-center gap-2 border-t border-border-primary pt-4",
        className
      )}
    >
      {children}
    </div>
  );
}
