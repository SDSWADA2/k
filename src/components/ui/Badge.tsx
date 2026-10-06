import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "secondary";
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
}

const variantMap = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-1 ring-red-200",
  info: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  secondary: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  size = "md",
  children,
  className,
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        variantMap[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
