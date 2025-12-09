import { ChevronDown, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type ExportFormat } from '@/lib/export';

interface ExportDropdownProps {
  /** Callback when export format is selected */
  onExport: (format: ExportFormat) => void | Promise<void>;
  /** Whether export is in progress */
  isExporting?: boolean;
  /** Custom label for the button */
  label?: string;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Disable the dropdown */
  disabled?: boolean;
  /** Available export formats (defaults to all) */
  formats?: ExportFormat[];
}

const formatConfig: Record<ExportFormat, { label: string; icon: typeof FileText; description: string }> = {
  csv: {
    label: 'CSV',
    icon: FileText,
    description: 'Comma-separated values',
  },
  xlsx: {
    label: 'Excel',
    icon: FileSpreadsheet,
    description: 'Microsoft Excel format',
  },
  json: {
    label: 'JSON',
    icon: FileText,
    description: 'JavaScript Object Notation',
  },
};

export function ExportDropdown({
  onExport,
  isExporting = false,
  label = 'Export',
  variant = 'outline',
  disabled = false,
  formats = ['csv', 'xlsx', 'json'],
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setIsOpen(false);
    await onExport(format);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} disabled={disabled || isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? 'Exporting...' : label}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {formats.map((format) => {
          const config = formatConfig[format];
          const Icon = config.icon;
          return (
            <DropdownMenuItem
              key={format}
              onClick={() => handleExport(format)}
              className="cursor-pointer"
            >
              <Icon className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>{config.label}</span>
                <span className="text-xs text-muted-foreground">{config.description}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

