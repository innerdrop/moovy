/**
 * Merchant Badge Component
 *
 * Shows merchant loyalty tier badge on store cards and listings.
 * Only displays for PLATA, ORO, DIAMANTE (BRONCE is hidden by default).
 */

"use client";

import React, { useEffect, useState } from "react";
import { Award, Sparkles, Crown } from "lucide-react";

interface MerchantBadgeProps {
  merchantId: string;
  showBronze?: boolean; // Default: false
}

const tierIcons: Record<string, React.ReactElement> = {
  BRONCE: <Award className="w-4 h-4" />,
  PLATA: <Sparkles className="w-4 h-4" />,
  ORO: <Crown className="w-4 h-4" />,
  DIAMANTE: <Crown className="w-4 h-4" />,
};

const tierClasses: Record<string, string> = {
  BRONCE: "hidden",
  PLATA: "bg-slate-100 text-slate-700 border-slate-300",
  ORO: "bg-yellow-100 text-yellow-700 border-yellow-300",
  DIAMANTE: "bg-purple-100 text-purple-700 border-purple-300",
};

export default function MerchantBadge({ merchantId, showBronze = false }: MerchantBadgeProps) {
  const [tier, setTier] = useState<string | null>(null);
  const [badgeText, setBadgeText] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTier = async () => {
      try {
        const response = await fetch(`/api/merchant/tier?merchantId=${merchantId}`);
        if (response.ok) {
          const data = await response.json();
          setTier(data.tier);
          setBadgeText(data.badgeText);
        }
      } catch (err) {
        // Silently fail — badge won't show
      } finally {
        setLoading(false);
      }
    };

    fetchTier();
  }, [merchantId]);

  if (loading || !tier || (!showBronze && tier === "BRONCE")) {
    return null;
  }

  const badgeClass = tierClasses[tier] || "hidden";

  if (badgeClass === "hidden") {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}
    >
      {tierIcons[tier]}
      <span>{badgeText}</span>
    </div>
  );
}
