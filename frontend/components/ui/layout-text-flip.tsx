"use client";

import React from "react";

export function LayoutTextFlip({ words }: { words: string[] }) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span className="inline-block transition-all duration-500 font-bold text-primary">
      {words[index]}
    </span>
  );
}