import { ChevronDown, Search, User, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Employee type definition
export interface Employee {
  id: string;
  name: string;
  department: string;
  title?: string;
  avatar?: string;
}

interface AssigneeSelectorProps {
  employees: Employee[];
  value: string | null; // employee id
  onChange: (employeeId: string | null) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

/**
 * AssigneeSelector - A smart component that automatically switches UI patterns
 * based on the number of employees (N):
 * - N ≤ 20: Simple dropdown
 * - 21 ≤ N ≤ 100: Searchable dropdown
 * - 101 ≤ N ≤ 500: Searchable dropdown with grouped options
 * - N > 500: People Picker Modal
 */
export function AssigneeSelector({
  employees,
  value,
  onChange,
  placeholder = 'Select assignee',
  label,
  className,
}: AssigneeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGroupedOpen, setIsGroupedOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(
    new Set()
  );

  const employeeCount = employees.length;
  const selectedEmployee = employees.find((emp) => emp.id === value);

  // Determine UI mode based on employee count
  const uiMode = useMemo(() => {
    if (employeeCount <= 20) return 'simple';
    if (employeeCount <= 100) return 'searchable';
    if (employeeCount <= 500) return 'grouped';
    return 'modal';
  }, [employeeCount]);

  // Sort employees by name
  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  // Filter employees by search query
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return sortedEmployees;
    const query = searchQuery.toLowerCase();
    return sortedEmployees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(query) ||
        emp.department.toLowerCase().includes(query) ||
        emp.title?.toLowerCase().includes(query)
    );
  }, [sortedEmployees, searchQuery]);

  // Group employees by department
  const groupedEmployees = useMemo(() => {
    const groups: Record<string, Employee[]> = {};
    filteredEmployees.forEach((emp) => {
      if (!groups[emp.department]) {
        groups[emp.department] = [];
      }
      groups[emp.department].push(emp);
    });
    return groups;
  }, [filteredEmployees]);

  // Get unique departments for filter
  const departments = useMemo(() => {
    return Array.from(new Set(employees.map((emp) => emp.department))).sort();
  }, [employees]);

  // Filter by department in modal
  const modalFilteredEmployees = useMemo(() => {
    let filtered = filteredEmployees;
    if (departmentFilter) {
      filtered = filtered.filter((emp) => emp.department === departmentFilter);
    }
    return filtered;
  }, [filteredEmployees, departmentFilter]);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Toggle department expansion
  const toggleDepartment = (department: string) => {
    setExpandedDepartments((prev) => {
      const next = new Set(prev);
      if (next.has(department)) {
        next.delete(department);
      } else {
        next.add(department);
      }
      return next;
    });
  };

  // Handle selection
  // Note: Radix Select doesn't allow empty string values, so we use "__unassigned__" as a special value
  const handleSelect = (selectedValue: string) => {
    const employeeId = selectedValue === '__unassigned__' ? null : selectedValue;
    onChange(employeeId);
    if (uiMode === 'modal') {
      setIsModalOpen(false);
      setSearchQuery('');
      setDepartmentFilter('');
    }
  };

  // Mode 1: Simple Dropdown (N ≤ 20)
  if (uiMode === 'simple') {
    return (
      <div className={cn('grid gap-2', className)}>
        {label && <Label>{label}</Label>}
        <Select
          value={value || '__unassigned__'}
          onValueChange={handleSelect}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__unassigned__">Unassigned</SelectItem>
            {sortedEmployees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Mode 2: Searchable Dropdown (21 ≤ N ≤ 100)
  if (uiMode === 'searchable') {
    return (
      <div className={cn('grid gap-2', className)}>
        {label && <Label>{label}</Label>}
        <Select
          value={value || '__unassigned__'}
          onValueChange={handleSelect}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <ScrollArea className="max-h-[300px]">
              <SelectItem value="__unassigned__">Unassigned</SelectItem>
              {filteredEmployees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name} ({emp.department})
                </SelectItem>
              ))}
              {filteredEmployees.length === 0 && (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No employees found
                </div>
              )}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Mode 3: Grouped Dropdown (101 ≤ N ≤ 500)
  // Use custom dropdown implementation since Radix Select doesn't support nested items
  if (uiMode === 'grouped') {
    return (
      <div className={cn('grid gap-2 relative', className)}>
        {label && <Label>{label}</Label>}
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          onClick={() => setIsGroupedOpen(!isGroupedOpen)}
        >
          <span className="truncate">
            {selectedEmployee
              ? `${selectedEmployee.name} (${selectedEmployee.department})`
              : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 opacity-50 transition-transform',
              isGroupedOpen && 'rotate-180'
            )}
          />
        </Button>

        {isGroupedOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsGroupedOpen(false)}
            />
            {/* Dropdown Content */}
            <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8"
                  />
                </div>
              </div>
              <ScrollArea className="max-h-[400px]">
                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelect('__unassigned__');
                      setIsGroupedOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                      !value && 'bg-accent'
                    )}
                  >
                    Unassigned
                  </button>
                  {Object.entries(groupedEmployees).map(([dept, emps]) => (
                    <div key={dept}>
                      <button
                        type="button"
                        onClick={() => toggleDepartment(dept)}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-accent rounded-sm"
                      >
                        <span>{dept}</span>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform',
                            expandedDepartments.has(dept) && 'rotate-180'
                          )}
                        />
                      </button>
                      {expandedDepartments.has(dept) && (
                        <div className="ml-2">
                          {emps.map((emp) => (
                            <button
                              key={emp.id}
                              type="button"
                              onClick={() => {
                                handleSelect(emp.id);
                                setIsGroupedOpen(false);
                              }}
                              className={cn(
                                'w-full flex items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                                value === emp.id && 'bg-accent'
                              )}
                            >
                              {emp.name} ({emp.department})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {Object.keys(groupedEmployees).length === 0 && (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No employees found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </div>
    );
  }

  // Mode 4: People Picker Modal (N > 500)
  return (
    <div className={cn('grid gap-2', className)}>
      {label && <Label>{label}</Label>}
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start"
        onClick={() => setIsModalOpen(true)}
      >
        {selectedEmployee ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-xs">
                {getInitials(selectedEmployee.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">
              {selectedEmployee.name} ({selectedEmployee.department})
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Assignee</DialogTitle>
            <DialogDescription>
              Search and filter employees to assign
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, department, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Department Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant={departmentFilter === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDepartmentFilter('')}
              >
                All Departments
              </Button>
              {departments.map((dept) => (
                <Button
                  key={dept}
                  type="button"
                  variant={departmentFilter === dept ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDepartmentFilter(dept)}
                >
                  {dept}
                </Button>
              ))}
            </div>

            {/* Employee List */}
            <ScrollArea className="flex-1 border rounded-md">
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => handleSelect('__unassigned__')}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors text-left',
                    !value && 'bg-accent'
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">Unassigned</div>
                    <div className="text-sm text-muted-foreground">
                      No assignee selected
                    </div>
                  </div>
                </button>

                {modalFilteredEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => handleSelect(emp.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors text-left',
                      value === emp.id && 'bg-accent'
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getInitials(emp.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{emp.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {emp.department}
                        {emp.title && ` • ${emp.title}`}
                      </div>
                    </div>
                    {value === emp.id && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))}

                {modalFilteredEmployees.length === 0 && (
                  <div className="py-12 text-center">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No employees found matching your search
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

