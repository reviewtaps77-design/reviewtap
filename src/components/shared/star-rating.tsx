'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value?: number;
  rating?: number;
  onChange?: (value: number) => void;
  onRatingChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  readonly?: boolean;
  label?: string;
  className?: string;
}

const sizeMap = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-12 w-12',
};

export function StarRating({
  value,
  rating,
  onChange,
  onRatingChange,
  size = 'md',
  readonly = false,
  label,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const currentValue = value ?? rating ?? 0;
  const handleChange = (val: number) => {
    if (onChange) onChange(val);
    if (onRatingChange) onRatingChange(val);
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {label && <p className="text-sm font-medium text-muted-foreground">{label}</p>}
      <div className="flex gap-1.5 justify-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = (hoverValue || currentValue) >= star;
          return (
            <button
              key={star}
              type="button"
              disabled={readonly}
              className={cn(
                'transition-transform focus:outline-none p-1 rounded-md',
                !readonly && 'cursor-pointer hover:scale-115 active:scale-95 transition-all duration-150'
              )}
              onClick={() => handleChange(star)}
              onMouseEnter={() => !readonly && setHoverValue(star)}
              onMouseLeave={() => !readonly && setHoverValue(0)}
              aria-label={`${star} star`}
            >
              <Star
                className={cn(
                  sizeMap[size],
                  'transition-colors duration-150',
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                    : 'fill-transparent text-gray-300 hover:text-gray-400'
                )}
              />
            </button>
          );
        })}
      </div>
      {currentValue > 0 && (
        <p className="text-xs font-semibold text-gray-600 tracking-wide">
          {currentValue} / 5 Stars
        </p>
      )}
    </div>
  );
}
