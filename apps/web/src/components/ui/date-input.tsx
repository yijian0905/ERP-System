import { Calendar } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * Segmented Date Input Component
 * Features:
 * 1. Format: DD / MM / YYYY
 * 2. Auto-focus to next segment when filled
 * 3. Backspace auto-jumps to previous segment
 * 4. Outputs standard YYYY-MM-DD format to parent
 */
interface DateInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minDate?: string;
  maxDate?: string;
  error?: boolean;
}

export function DateInput({
  value,
  onChange,
  disabled = false,
  className,
  error = false,
}: DateInputProps) {
  // Internal state for day, month, year segments
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // Refs for focus control
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state when external value (YYYY-MM-DD) changes
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      setYear(y || '');
      setMonth(m || '');
      setDay(d || '');
    } else {
      setDay('');
      setMonth('');
      setYear('');
    }
  }, [value]);

  // Try to combine and output date
  const updateParent = (d: string, m: string, y: string) => {
    // Only update parent when all fields are complete
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      onChange?.(`${y}-${m}-${d}`);
    } else if (d === '' && m === '' && y === '') {
      onChange?.(''); // Allow clearing
    }
  };

  // Handle day input
  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (val.length > 2) val = val.slice(0, 2);

    // Simple validation: day cannot exceed 31
    if (parseInt(val) > 31) val = '31';
    if (parseInt(val) === 0 && val.length === 2) val = '01';

    setDay(val);
    updateParent(val, month, year);

    // Auto-focus: when 2 digits entered, jump to month
    if (val.length === 2) {
      monthRef.current?.focus();
    }
  };

  // Handle month input
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2);

    if (parseInt(val) > 12) val = '12';
    if (parseInt(val) === 0 && val.length === 2) val = '01';

    setMonth(val);
    updateParent(day, val, year);

    // Auto-focus: when 2 digits entered, jump to year
    if (val.length === 2) {
      yearRef.current?.focus();
    }
  };

  // Handle year input
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);

    setYear(val);
    updateParent(day, month, val);
  };

  // Handle Backspace key (UX enhancement)
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentField: string,
    prevRef: React.RefObject<HTMLInputElement> | null
  ) => {
    // If current field is empty and Backspace pressed, jump to previous field
    if (e.key === 'Backspace' && !currentField && prevRef) {
      e.preventDefault(); // Prevent deleting last char of previous field
      prevRef.current?.focus();
    }
    // Allow Tab and Arrow keys for navigation
    if (e.key === 'ArrowLeft' && prevRef) {
      const input = e.target as HTMLInputElement;
      if (input.selectionStart === 0) {
        e.preventDefault();
        prevRef.current?.focus();
      }
    }
    if (e.key === 'ArrowRight') {
      const input = e.target as HTMLInputElement;
      if (input.selectionStart === input.value.length) {
        e.preventDefault();
        if (e.currentTarget === dayRef.current) {
          monthRef.current?.focus();
        } else if (e.currentTarget === monthRef.current) {
          yearRef.current?.focus();
        }
      }
    }
  };

  // Handle container click - focus the day input
  const handleContainerClick = () => {
    if (!disabled) {
      dayRef.current?.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={cn(
        'date-input-field flex items-center gap-0.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
        'transition-all cursor-text',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        disabled && 'cursor-not-allowed opacity-50',
        error && 'border-destructive focus-within:ring-destructive',
        className
      )}
    >
      {/* Day (DD) */}
      <input
        ref={dayRef}
        type="text"
        inputMode="numeric"
        placeholder="DD"
        value={day}
        onChange={handleDayChange}
        onKeyDown={(e) => handleKeyDown(e, day, null)}
        disabled={disabled}
        className={cn(
          'w-6 text-center bg-transparent outline-none font-mono border-0',
          'placeholder:text-muted-foreground/50',
          disabled && 'cursor-not-allowed'
        )}
        maxLength={2}
      />
      <span className="text-muted-foreground/60 select-none">/</span>

      {/* Month (MM) */}
      <input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        placeholder="MM"
        value={month}
        onChange={handleMonthChange}
        onKeyDown={(e) => handleKeyDown(e, month, dayRef)}
        disabled={disabled}
        className={cn(
          'w-7 text-center bg-transparent outline-none font-mono border-0',
          'placeholder:text-muted-foreground/50',
          disabled && 'cursor-not-allowed'
        )}
        maxLength={2}
      />
      <span className="text-muted-foreground/60 select-none">/</span>

      {/* Year (YYYY) */}
      <input
        ref={yearRef}
        type="text"
        inputMode="numeric"
        placeholder="YYYY"
        value={year}
        onChange={handleYearChange}
        onKeyDown={(e) => handleKeyDown(e, year, monthRef)}
        disabled={disabled}
        className={cn(
          'w-10 text-center bg-transparent outline-none font-mono border-0',
          'placeholder:text-muted-foreground/50',
          disabled && 'cursor-not-allowed'
        )}
        maxLength={4}
      />

      {/* Calendar icon */}
      <Calendar className="ml-auto h-4 w-4 text-muted-foreground/60 shrink-0" />
    </div>
  );
}

export default DateInput;
