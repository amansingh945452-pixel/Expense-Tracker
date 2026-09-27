"use client";

import React from "react";

export function CloudShader({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-h-screen w-full bg-slate-950 text-white ${className}`}>
      {children}
    </div>
  );
}