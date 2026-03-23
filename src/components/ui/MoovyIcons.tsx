/**
 * MoovyIcons.tsx
 * Custom SVG icons for Moovy's visual identity
 * 24x24 viewBox with currentColor for flexible styling
 * Minimalist, clean design with 2px stroke consistency
 */

interface IconProps {
  className?: string;
}

// Lightning bolt hitting a coin/circle (instant payment)
export function MoovyIconInstantPay({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Lightning bolt */}
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
      {/* Subtle circle around impact */}
      <circle cx="12" cy="16" r="5" opacity="0.3" />
    </svg>
  );
}

// Balanced scale or handshake with heart (fair commissions)
export function MoovyIconFairFees({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Scale/balance */}
      <line x1="12" y1="5" x2="12" y2="19" />
      <path d="M6 15L2 19" />
      <path d="M18 15L22 19" />
      <path d="M3 13h18" />
      <path d="M8 10L16 10" />
      {/* Heart accent in center */}
      <path
        d="M12 14c.5 0 1-.2 1.2-.5l.3-.5.3.5c.2.3.7.5 1.2.5"
        opacity="0.5"
      />
    </svg>
  );
}

// Chat bubble with person silhouette (human support)
export function MoovyIconHumanSupport({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Chat bubble */}
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      {/* Person silhouette inside */}
      <circle cx="12" cy="8" r="1.5" />
      <path d="M11 11h2c.5 0 .8.5.8 1v2c0 .5-.3 1-.8 1h-2c-.5 0-.8-.5-.8-1v-2c0-.5.3-1 .8-1z" />
    </svg>
  );
}

// Map pin with snowflake (Ushuaia local identity)
export function MoovyIconLocal({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Map pin */}
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
      {/* Snowflake inside pin - simplified */}
      <g opacity="0.6">
        <line x1="12" y1="7" x2="12" y2="13" />
        <line x1="9" y1="10" x2="15" y2="10" />
        <line x1="10" y1="8" x2="14" y2="12" />
        <line x1="14" y1="8" x2="10" y2="12" />
      </g>
    </svg>
  );
}

// Motorcycle/scooter in motion (delivery)
export function MoovyIconDelivery({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Front wheel */}
      <circle cx="18" cy="18" r="2" />
      {/* Back wheel */}
      <circle cx="5" cy="18" r="2" />
      {/* Frame */}
      <path d="M5 16V8c0-1 .5-2 1.5-2h8c1 0 1.5 1 1.5 2v8" />
      {/* Seat/body */}
      <path d="M10 8c0 .5.5 1 1 1s1-.5 1-1" />
      {/* Handlebar */}
      <path d="M18 8v2" />
      <line x1="16" y1="7" x2="20" y2="7" />
      {/* Motion lines */}
      <line x1="2" y1="15" x2="4" y2="15" opacity="0.5" />
      <line x1="1" y1="18" x2="3" y2="18" opacity="0.5" />
    </svg>
  );
}

// Shield with checkmark (security/trust)
export function MoovyIconShield({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Shield */}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      {/* Checkmark */}
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

// Storefront with awning (store)
export function MoovyIconStore({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Awning/roof */}
      <path d="M3 9h18" />
      <path d="M3 9L5 5h14l2 4" />
      {/* Door frame */}
      <rect x="6" y="9" width="12" height="10" rx="1" />
      {/* Door */}
      <line x1="12" y1="9" x2="12" y2="19" />
      {/* Window left */}
      <rect x="6" y="11" width="4" height="3" rx="0.5" />
      {/* Window right */}
      <rect x="14" y="11" width="4" height="3" rx="0.5" />
      {/* Door handle */}
      <circle cx="15" cy="14" r="0.5" />
    </svg>
  );
}

// Shopping bag with motion lines (cart/shopping)
export function MoovyIconCart({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Bag */}
      <path d="M9 2h6a1 1 0 0 1 1 1v2h3a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h3V3a1 1 0 0 1 1-1z" />
      {/* Handle */}
      <path d="M9 3v2h6V3" />
      {/* Motion lines */}
      <line x1="3" y1="8" x2="1" y2="8" opacity="0.5" />
      <line x1="4" y1="12" x2="2" y2="12" opacity="0.5" />
    </svg>
  );
}

// Star with sparkle (quality/rating)
export function MoovyIconStar({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Star */}
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      {/* Sparkles */}
      <circle cx="18" cy="8" r="1" opacity="0.6" />
      <circle cx="8" cy="6" r="1" opacity="0.6" />
    </svg>
  );
}

// Clock with speed lines (fast delivery)
export function MoovyIconClock({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Clock circle */}
      <circle cx="12" cy="13" r="8" />
      {/* Hour hand */}
      <line x1="12" y1="13" x2="12" y2="9" />
      {/* Minute hand */}
      <line x1="12" y1="13" x2="15" y2="13" />
      {/* Speed lines */}
      <line x1="18" y1="10" x2="20" y2="8" opacity="0.6" />
      <line x1="19" y1="14" x2="21" y2="14" opacity="0.6" />
      <line x1="18" y1="18" x2="20" y2="20" opacity="0.6" />
    </svg>
  );
}

// Percentage sign in a circle (commissions)
export function MoovyIconPercentage({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Circle background */}
      <circle cx="12" cy="12" r="10" />
      {/* Percentage symbol */}
      <circle cx="8" cy="8" r="1.5" />
      <line x1="16" y1="16" x2="8" y2="8" />
      <circle cx="16" cy="16" r="1.5" />
    </svg>
  );
}

// Upward trending arrow (business growth)
export function MoovyIconGrowth({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Base line */}
      <line x1="3" y1="18" x2="21" y2="18" />
      {/* Trend line */}
      <polyline points="3 18 8 14 12 16 18 8" />
      {/* Arrow head */}
      <path d="M21 8h-4v4" />
    </svg>
  );
}
