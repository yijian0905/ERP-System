

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface FilterOption {
    value: string;
    label: string;
}

interface FilterSelectProps {
    value?: string;
    onChange?: (value: string) => void;
    options: FilterOption[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function FilterSelect({
    value,
    onChange,
    options,
    placeholder = 'Select option',
    className,
    disabled,
}: FilterSelectProps) {
    return (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={className}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
