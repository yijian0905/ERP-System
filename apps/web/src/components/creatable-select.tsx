import { AnimatePresence, motion, useAnimation, type Easing } from 'framer-motion';
import { Check, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useUser } from '@/stores/auth';

interface CreatableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onCreate?: (newValue: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  allowCreate?: boolean;
}

/**
 * CreatableSelect - A select component with Liquid Wave Fusion animation
 * that allows admin/manager users to create new options inline.
 * 
 * In idle state: looks exactly like a normal Select + Button
 * During animation: shows liquid wave fusion effect
 * In expanded state: shows a normal Input field
 */
export function CreatableSelect({
  options,
  value,
  onChange,
  onCreate,
  placeholder = 'Select an option',
  label,
  className,
  allowCreate,
}: CreatableSelectProps) {
  const user = useUser();
  const [status, setStatus] = useState<'idle' | 'expanding' | 'expanded'>(
    'idle'
  );
  const [newValue, setNewValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation controllers for liquid wave effect
  const waveControls = useAnimation();
  const fillControls = useAnimation();

  // Check if user can create new options (admin or manager)
  const canCreate =
    allowCreate !== undefined
      ? allowCreate
      : user?.role === 'ADMIN' || user?.role === 'MANAGER';

  // Focus input when expanded
  useEffect(() => {
    if (status === 'expanded' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status]);

  // Get container width for animation
  const getContainerWidth = () => {
    return containerRef.current?.offsetWidth || 300;
  };

  // Start the liquid wave animation
  const startAnimation = async () => {
    const containerWidth = getContainerWidth();
    const buttonWidth = 36;
    
    setStatus('expanding');

    const easing: Easing = [0.4, 0, 0.2, 1];
    const transition = { duration: 0.5, ease: easing };
    const moveDistance = -(containerWidth - buttonWidth);

    await Promise.all([
      // Wave lump animation - travels from right to left with bulge effect
      waveControls.start({
        x: moveDistance,
        opacity: [0, 1, 1, 0],
        scale: [0.8, 1.15, 1.15, 0.8],
        transition: { ...transition, times: [0, 0.1, 0.9, 1] },
      }),
      // Fill layer expands to full width
      fillControls.start({
        width: containerWidth,
        transition: transition,
      }),
    ]);

    setStatus('expanded');
  };

  // Reset to idle state
  const handleReset = () => {
    setStatus('idle');
    setNewValue('');
    waveControls.set({ x: 0, opacity: 0 });
    fillControls.set({ width: 36 });
  };

  // Handle creating a new option
  const handleCreate = () => {
    if (!newValue.trim()) return;

    const trimmedValue = newValue.trim();

    if (options.includes(trimmedValue)) {
      return;
    }

    if (onCreate) {
      onCreate(trimmedValue);
    }

    onChange(trimmedValue);
    handleReset();
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleReset();
    }
  };

  const isDuplicate = newValue.trim() !== '' && options.includes(newValue.trim());

  return (
    <div className={cn('grid gap-2', className)}>
      {label && <Label>{label}</Label>}

      <div ref={containerRef} className="relative">
        {/* Idle State: Normal Select + Button - exactly like other form fields */}
        {status === 'idle' && (
          <div className="flex gap-2">
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
                {options.length === 0 && (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    No options available
                  </div>
                )}
              </SelectContent>
            </Select>
            {canCreate && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={startAnimation}
                title="Create new option"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Expanding State: Liquid Wave Animation */}
        {status === 'expanding' && (
          <>
            {/* SVG Gooey Filter */}
            <svg className="absolute w-0 h-0" aria-hidden="true">
              <defs>
                <filter id="gooey-creatable">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                  <feColorMatrix
                    in="blur"
                    mode="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                    result="goo"
                  />
                  <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                </filter>
              </defs>
            </svg>

            {/* Gooey Animation Container */}
            <div
              className="absolute inset-0 pointer-events-none overflow-visible"
              style={{
                filter: 'url(#gooey-creatable)',
                margin: '-20px',
                padding: '20px',
              }}
            >
              {/* Left blob (select area) */}
              <motion.div
                className="absolute bg-background rounded-md ring-2 ring-ring"
                style={{
                  height: 36,
                  width: `calc(100% - 44px)`,
                  left: 20,
                  top: 20,
                }}
                animate={{ scaleX: 0.97 }}
                transition={{ duration: 0.2 }}
              />

              {/* Right blob (button that expands) */}
              <motion.div
                className="absolute bg-background rounded-md ring-2 ring-ring"
                style={{
                  height: 36,
                  width: 36,
                  right: 20,
                  top: 20,
                }}
                animate={fillControls}
              />

              {/* Wave Lump - traveling bulge */}
              <motion.div
                className="absolute bg-background rounded-full"
                style={{
                  width: 36,
                  height: 50,
                  right: 20,
                  top: 13,
                  opacity: 0,
                }}
                animate={waveControls}
              />
            </div>

            {/* Placeholder content during animation */}
            <div className="h-9 opacity-0">placeholder</div>
          </>
        )}

        {/* Expanded State: Normal Input field - exactly like other form fields */}
        {status === 'expanded' && (
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Enter new value..."
                onKeyDown={handleKeyDown}
                className="pr-10"
              />
              <AnimatePresence>
                {newValue.trim() && !isDuplicate && (
                  <motion.button
                    type="button"
                    onClick={handleCreate}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Check className="h-4 w-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleReset}
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* Duplicate warning */}
        <AnimatePresence>
          {status === 'expanded' && isDuplicate && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-amber-600 dark:text-amber-400 mt-1"
            >
              This value already exists
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
