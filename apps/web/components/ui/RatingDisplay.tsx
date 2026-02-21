import React from "react";
import { Star } from "lucide-react";

export interface RatingDisplayProps {
  /** The rating value out of 5 */
  rating: number;
  /** Optional string or number to show alongside the stars (e.g. "120 reviews") */
  count?: string | number;
  /** Visual mapping size for the lucide-react stars */
  size?: number;
  /** Tailwind color classes. Defaults to text-yellow-400 */
  activeColor?: string;
  inactiveColor?: string;
  showNumericRating?: boolean;
}

/**
 * A read-only component designed to display a fractionally-accurate star rating.
 */
export function RatingDisplay({
  rating,
  count,
  size = 18,
  activeColor = "text-yellow-400",
  inactiveColor = "text-gray-300",
  showNumericRating = false,
}: RatingDisplayProps) {
  // Clamp rating between 0 and 5
  const normalizedRating = Math.max(0, Math.min(5, rating));

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={`${normalizedRating} out of 5 stars`}
      title={`${normalizedRating} Stars`}
    >
      {showNumericRating && (
        <span className="font-semibold text-gray-900">{normalizedRating.toFixed(1)}</span>
      )}

      <div className="flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((index) => {
          // Calculate the visual fill percentage for this specific star
          const fillPercentage = Math.max(0, Math.min(100, (normalizedRating - index + 1) * 100));

          return (
            <div key={index} className="relative inline-flex" style={{ width: size, height: size }}>
              {/* Background (Empty) Star */}
              <Star
                size={size}
                className={`absolute left-0 top-0 fill-current ${inactiveColor}`}
                strokeWidth={0} // Using pure fill for cleaner visual aesthetic as requested
              />

              {/* Foreground (Filled) Star clipped dynamically by width */}
              <div
                className="absolute left-0 top-0 overflow-hidden"
                style={{ width: `${fillPercentage}%` }}
              >
                <Star size={size} className={`fill-current ${activeColor}`} strokeWidth={0} />
              </div>
            </div>
          );
        })}
      </div>

      {count !== undefined && <span className="ml-1 text-sm text-gray-500">({count})</span>}
    </div>
  );
}
