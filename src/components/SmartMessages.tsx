"use client";

import { Lightbulb } from "lucide-react";

interface SmartMessagesProps {
  messages: string[];
}

export default function SmartMessages({ messages }: SmartMessagesProps) {
  if (messages.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-eon-dark/70 uppercase tracking-wide flex items-center gap-2">
        <Lightbulb size={16} className="text-eon-accent" />
        Smart Insights
      </h3>
      {messages.map((msg, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-4 bg-gradient-to-r from-eon-accent/5 to-transparent rounded-xl border border-eon-accent/10"
        >
          <div className="w-2 h-2 rounded-full bg-eon-accent mt-2 shrink-0" />
          <p className="text-sm text-eon-dark leading-relaxed">{msg}</p>
        </div>
      ))}
    </div>
  );
}
