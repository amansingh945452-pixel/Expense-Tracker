"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

export function CustomButton({
  children,
  className = "",
  ...props
}: CustomButtonProps) {
  return (
    <Button
      className={`w-full font-medium transition-all shadow-md active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}