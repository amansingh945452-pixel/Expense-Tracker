"use client";

import React from "react";

export function Carousel({ items = [] }: { items?: React.ReactNode[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto pb-4 no-scrollbar">
      <div className="flex gap-4 min-w-max">
        {items.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </div>
    </div>
  );
}

export function Card({
  card,
}: {
  card: { title?: string; category?: string; src?: string; content?: React.ReactNode };
  index?: number;
  layout?: boolean;
}) {
  if (!card) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-5 text-white shadow-xl min-w-[260px] transition-all hover:border-white/20">
      {card.category && (
        <span className="text-xs uppercase tracking-wider text-slate-400 block mb-1 font-semibold">
          {card.category}
        </span>
      )}
      {card.title && (
        <h3 className="text-2xl font-bold tracking-tight text-white">
          {card.title}
        </h3>
      )}
      {card.content && (
        <div className="mt-3 text-sm text-slate-300 leading-relaxed">
          {card.content}
        </div>
      )}
    </div>
  );
}