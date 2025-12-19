import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onFocus, onBlur, onChange, onWheel, step, ...props }, ref) => {
    // Store original value for number inputs to restore if user doesn't make changes
    const originalValueRef = React.useRef<string>('');
    const hasChangedRef = React.useRef<boolean>(false);

    // Check if this is a price field (has decimal step like 0.01)
    const isPriceField = step !== undefined && String(step).includes('.');

    // Clear number input on focus, store original value
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (type === 'number') {
        originalValueRef.current = e.target.value;
        hasChangedRef.current = false;
        e.target.value = '';
        // Trigger onChange to update parent state
        const event = new Event('input', { bubbles: true });
        e.target.dispatchEvent(event);
      }
      onFocus?.(e);
    };

    // Restore original value on blur if no changes were made
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (type === 'number' && !hasChangedRef.current && e.target.value === '') {
        e.target.value = originalValueRef.current;
        // Trigger onChange to update parent state
        const event = new Event('input', { bubbles: true });
        e.target.dispatchEvent(event);
      }
      onBlur?.(e);
    };

    // Track if user made any changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (type === 'number') {
        hasChangedRef.current = true;
      }
      onChange?.(e);
    };

    // Handle mouse wheel to increment/decrement number values
    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
      // Only apply to number inputs that are not price fields
      if (type === 'number' && !isPriceField) {
        e.preventDefault();
        const input = e.currentTarget;
        const currentValue = parseFloat(input.value) || 0;
        const stepValue = step ? parseFloat(String(step)) : 1;
        const minValue = props.min !== undefined ? parseFloat(String(props.min)) : -Infinity;
        const maxValue = props.max !== undefined ? parseFloat(String(props.max)) : Infinity;

        // Scroll up = increment, scroll down = decrement
        const delta = e.deltaY < 0 ? stepValue : -stepValue;
        const newValue = Math.min(Math.max(currentValue + delta, minValue), maxValue);

        // Use native setter to properly trigger React's onChange
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;

        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(input, String(newValue));
          // Dispatch input event that React listens to
          const inputEvent = new Event('input', { bubbles: true });
          input.dispatchEvent(inputEvent);
        }

        // Mark as changed
        hasChangedRef.current = true;
      }
      onWheel?.(e);
    };


    return (
      <input
        type={type}
        step={step}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          // Hide number input spinners and focus ring
          type === 'number' && '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-0',
          className
        )}
        ref={ref}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        onWheel={handleWheel}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
