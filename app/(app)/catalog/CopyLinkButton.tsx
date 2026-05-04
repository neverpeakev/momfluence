"use client";

import { useState } from "react";

export default function CopyLinkButton({ destinationUrl }: { destinationUrl: string }) {
  const [copied, setCopied] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(destinationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShowFallback(true);
    }
  }

  if (showFallback) {
    return (
      <div className="space-y-1">
        <input
          readOnly
          value={destinationUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="input text-xs"
        />
        <p className="text-xs text-navy-500">Tap to select, then copy.</p>
      </div>
    );
  }

  return (
    <button onClick={copy} className="btn-ghost w-full">
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
