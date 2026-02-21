import React, { useState, useRef, useEffect } from "react";
import { Star } from "lucide-react";

export interface StarRatingProps {
  /** The maximum number of stars (defaults to 5) */
  totalStars?: number;
  /** The current rating value */
  value?: number;
  /** Callback fired when the rating changes */
  onChange?: (rating: number) => void;
  /** If true, the component is read-only and no hover/click events trigger */
  readOnly?: boolean;
  /** Size of each star */
  size?: number;
  /** Active (filled) color class */
  activeColor?: string;
  /** Inactive (empty) color class */
  inactiveColor?: string;
  /** Allow half star selections */
  allowHalf?: boolean;
}

export function StarRating({
  totalStars = 5,
  value = 0,
  onChange,
  readOnly = false,
  size = 24,
  activeColor = "text-yellow-400",
  inactiveColor = "text-gray-300",
  allowHalf = true,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive the active value to render: hover takes priority for preview
  const activeRating = hoverValue !== null ? hoverValue : value;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>, starIndex: number) => {
    if (readOnly) return;

    if (!allowHalf) {
      setHoverValue(starIndex);
      return;
    }

    // Determine if we are hovering the left or right half of the star
    // We use the currentTarget's bounding rect
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const percentFilled = (e.clientX - left) / width;

    // If mouse is on left half, it's a half star (.5). If right, it's a full star.
    if (percentFilled <= 0.5) {
      setHoverValue(starIndex - 0.5);
    } else {
      setHoverValue(starIndex);
    }
  };

  const handlePointerLeave = () => {
    if (readOnly) return;
    setHoverValue(null);
  };

  const handleClick = () => {
    if (readOnly || !onChange || hoverValue === null) return;
    onChange(hoverValue);
  };

  return (
    <div
      ref={containerRef}
      className={`inline-flex items-center gap-1 ${readOnly ? "opacity-90" : "cursor-pointer"}`}
      onPointerLeave={handlePointerLeave}
      role="radiogroup"
      aria-label="Star Rating"
    >
      {Array.from({ length: totalStars }, (_, i) => i + 1).map((starIndex) => {
        // Calculate fill constraints just like RatingDisplay
        const fillPercentage = Math.max(0, Math.min(100, (activeRating - starIndex + 1) * 100));

        // Slightly enlarge the star currently being hovered (if not readOnly)
        const isHoveringThisStar =
          !readOnly && hoverValue !== null && Math.ceil(hoverValue) === starIndex;

        return (
          <div
            key={starIndex}
            className={`relative inline-flex transition-transform duration-200 ${
              isHoveringThisStar ? "scale-110" : "scale-100"
            }`}
            style={{ width: size, height: size }}
            onPointerMove={(e) => handlePointerMove(e, starIndex)}
            onClick={handleClick}
            role="radio"
            aria-checked={activeRating >= starIndex}
            tabIndex={readOnly ? -1 : 0}
          >
            {/* Background Star */}
            <Star
              size={size}
              className={`absolute left-0 top-0 fill-current transition-colors duration-200 ${inactiveColor}`}
              strokeWidth={0}
            />

            {/* Foreground Star Clipped */}
            <div
              className="absolute left-0 top-0 overflow-hidden transition-all duration-200"
              style={{ width: `${fillPercentage}%` }}
            >
              <Star size={size} className={`fill-current ${activeColor}`} strokeWidth={0} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
