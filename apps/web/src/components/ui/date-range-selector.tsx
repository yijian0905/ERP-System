import { Calendar, ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * Date Range Selector Component
 * Features:
 * 1. Preset date ranges dropdown (This Week, This Month, This Quarter, This Year, etc.)
 * 2. Custom Date button that opens a popover with date inputs
 * 3. Returns the selected date range for filtering data
 */

export interface DateRange {
    startDate: string; // YYYY-MM-DD format
    endDate: string;   // YYYY-MM-DD format
    preset?: string;   // Optional preset key for display
}

export interface PresetOption {
    value: string;
    label: string;
}

interface DateRangeSelectorProps {
    /** The currently selected date range */
    value?: DateRange;
    /** Callback when date range changes */
    onChange?: (dateRange: DateRange) => void;
    /** Preset options to show in dropdown */
    presets?: PresetOption[];
    /** Show custom date button (default: true) */
    showCustomDate?: boolean;
    /** CSS class for the container */
    className?: string;
}

// Default preset options
const DEFAULT_PRESETS: PresetOption[] = [
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'this_year', label: 'This Year' },
    { value: 'last_year', label: 'Last Year' },
];

/**
 * Calculate date range from preset value
 */
function getDateRangeFromPreset(preset: string): { startDate: string; endDate: string } {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Helper to format date as YYYY-MM-DD
    const formatDate = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    switch (preset) {
        case 'this_week': {
            // Start from Monday of current week
            const startOfWeek = new Date(today);
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday start
            startOfWeek.setDate(day - diff);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return { startDate: formatDate(startOfWeek), endDate: formatDate(endOfWeek) };
        }
        case 'last_week': {
            const startOfLastWeek = new Date(today);
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            startOfLastWeek.setDate(day - diff - 7);
            const endOfLastWeek = new Date(startOfLastWeek);
            endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
            return { startDate: formatDate(startOfLastWeek), endDate: formatDate(endOfLastWeek) };
        }
        case 'this_month': {
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0);
            return { startDate: formatDate(startOfMonth), endDate: formatDate(endOfMonth) };
        }
        case 'last_month': {
            const startOfLastMonth = new Date(year, month - 1, 1);
            const endOfLastMonth = new Date(year, month, 0);
            return { startDate: formatDate(startOfLastMonth), endDate: formatDate(endOfLastMonth) };
        }
        case 'this_quarter': {
            const currentQuarter = Math.floor(month / 3);
            const startOfQuarter = new Date(year, currentQuarter * 3, 1);
            const endOfQuarter = new Date(year, currentQuarter * 3 + 3, 0);
            return { startDate: formatDate(startOfQuarter), endDate: formatDate(endOfQuarter) };
        }
        case 'last_quarter': {
            const lastQuarter = Math.floor(month / 3) - 1;
            const lastQuarterYear = lastQuarter < 0 ? year - 1 : year;
            const adjustedQuarter = lastQuarter < 0 ? 3 : lastQuarter;
            const startOfLastQuarter = new Date(lastQuarterYear, adjustedQuarter * 3, 1);
            const endOfLastQuarter = new Date(lastQuarterYear, adjustedQuarter * 3 + 3, 0);
            return { startDate: formatDate(startOfLastQuarter), endDate: formatDate(endOfLastQuarter) };
        }
        case 'this_year': {
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year, 11, 31);
            return { startDate: formatDate(startOfYear), endDate: formatDate(endOfYear) };
        }
        case 'last_year': {
            const startOfLastYear = new Date(year - 1, 0, 1);
            const endOfLastYear = new Date(year - 1, 11, 31);
            return { startDate: formatDate(startOfLastYear), endDate: formatDate(endOfLastYear) };
        }
        default: {
            // Default to this month
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0);
            return { startDate: formatDate(startOfMonth), endDate: formatDate(endOfMonth) };
        }
    }
}

/**
 * Format a date range for display
 */
function formatDateRangeForDisplay(startDate: string, endDate: string): string {
    if (!startDate || !endDate) return 'Select dates';

    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatOptions: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    };

    const startStr = start.toLocaleDateString('en-US', formatOptions);
    const endStr = end.toLocaleDateString('en-US', formatOptions);

    return `${startStr} - ${endStr}`;
}

export function DateRangeSelector({
    value,
    onChange,
    presets = DEFAULT_PRESETS,
    showCustomDate = true,
    className,
}: DateRangeSelectorProps) {
    // State for preset popover
    const [isPresetOpen, setIsPresetOpen] = useState(false);
    // State for custom date popover
    const [isCustomOpen, setIsCustomOpen] = useState(false);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Current selected preset
    const [selectedPreset, setSelectedPreset] = useState(value?.preset || 'this_month');

    // Sync custom dates when value changes
    useEffect(() => {
        if (value?.startDate && value?.endDate && !value?.preset) {
            setCustomStartDate(value.startDate);
            setCustomEndDate(value.endDate);
        }
    }, [value]);

    // Get the display label for the dropdown
    const selectedLabel = useMemo(() => {
        const preset = presets.find(p => p.value === (value?.preset || selectedPreset));
        return preset?.label || 'Select Range';
    }, [presets, selectedPreset, value?.preset]);

    // Check if custom dates are valid
    const isCustomValid = useMemo(() => {
        if (!customStartDate || !customEndDate) return false;
        return new Date(customStartDate) <= new Date(customEndDate);
    }, [customStartDate, customEndDate]);

    // Handle preset selection
    const handlePresetChange = useCallback((presetValue: string) => {
        setSelectedPreset(presetValue);
        const range = getDateRangeFromPreset(presetValue);
        onChange?.({
            ...range,
            preset: presetValue,
        });
        setIsPresetOpen(false);
    }, [onChange]);

    // Handle custom date apply
    const handleApplyCustom = useCallback(() => {
        if (isCustomValid) {
            setSelectedPreset(''); // Clear preset when using custom
            onChange?.({
                startDate: customStartDate,
                endDate: customEndDate,
            });
            setIsCustomOpen(false);
        }
    }, [isCustomValid, customStartDate, customEndDate, onChange]);

    // Format custom date display
    const customDateDisplay = useMemo(() => {
        if (!value?.preset && value?.startDate && value?.endDate) {
            return formatDateRangeForDisplay(value.startDate, value.endDate);
        }
        return 'Custom Date';
    }, [value]);

    return (
        <div className={cn('flex gap-2', className)}>
            {/* Preset Dropdown - Styled like a button */}
            <Popover open={isPresetOpen} onOpenChange={setIsPresetOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="flex items-center gap-2 min-w-[120px] justify-between"
                    >
                        <span>{selectedLabel}</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="start">
                    <div className="flex flex-col">
                        {presets.map((preset) => (
                            <button
                                key={preset.value}
                                onClick={() => handlePresetChange(preset.value)}
                                className={cn(
                                    'flex items-center w-full px-3 py-2 text-sm rounded-md text-left',
                                    'hover:bg-accent hover:text-accent-foreground',
                                    'transition-colors cursor-pointer',
                                    (value?.preset || selectedPreset) === preset.value &&
                                    'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                                )}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Custom Date Button with Popover */}
            {showCustomDate && (
                <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant={!value?.preset && value?.startDate ? 'default' : 'outline'}
                            className={cn(
                                'flex items-center gap-2',
                                !value?.preset && value?.startDate && 'bg-primary text-primary-foreground'
                            )}
                        >
                            <Calendar className="h-4 w-4" />
                            <span className="hidden sm:inline">{customDateDisplay}</span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">Custom Date Range</h4>
                                <p className="text-xs text-muted-foreground">
                                    Select a start and end date for your custom range.
                                </p>
                            </div>

                            {/* Start Date */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Start Date</label>
                                <DateInput
                                    value={customStartDate}
                                    onChange={setCustomStartDate}
                                    onComplete={() => {
                                        // Auto-focus to end date when start date is complete
                                        // We need to focus the day input of end date
                                        const endDateContainer = document.querySelector('[data-end-date-input]');
                                        if (endDateContainer) {
                                            const dayInput = endDateContainer.querySelector('input');
                                            dayInput?.focus();
                                        }
                                    }}
                                    onEnterPress={handleApplyCustom}
                                    className="w-full"
                                />
                            </div>

                            {/* End Date */}
                            <div className="space-y-2" data-end-date-input>
                                <label className="text-sm font-medium">End Date</label>
                                <DateInput
                                    value={customEndDate}
                                    onChange={setCustomEndDate}
                                    onEnterPress={handleApplyCustom}
                                    className="w-full"
                                    error={!!(customStartDate && customEndDate && !isCustomValid)}
                                />
                                {customStartDate && customEndDate && !isCustomValid && (
                                    <p className="text-xs text-destructive">
                                        End date must be after start date
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCustomOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleApplyCustom}
                                    disabled={!isCustomValid}
                                >
                                    Apply Range
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
}

export default DateRangeSelector;

