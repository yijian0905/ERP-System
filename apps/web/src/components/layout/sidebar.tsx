import * as Collapsible from '@radix-ui/react-collapsible';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LogOut,
  Moon,
  Power,
  Settings,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  type NavGroup,
  type NavItem,
  navigationConfig,
  filterNavigationByPermissions,
} from '@/config/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { usePermissionsStore } from '@/stores/permissions';
import { SIDEBAR_WIDTH, useSidebarStore } from '@/stores/sidebar';

/**
 * Logo component for the sidebar header
 */
function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all',
          collapsed ? 'h-9 w-9' : 'h-10 w-10'
        )}
      >
        <svg
          className={cn('transition-all', collapsed ? 'h-5 w-5' : 'h-6 w-6')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
      {!collapsed && (
        <span className="text-lg font-bold text-sidebar-foreground">
          ERP System
        </span>
      )}
    </div>
  );
}

/**
 * Single navigation item component
 */
function NavItemComponent({
  item,
  collapsed,
  isActive,
  depth = 0,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
  depth?: number;
}) {
  const Icon = item.icon;

  const content = (
    <Link
      to={item.href}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive && 'sidebar-item-active',
        depth > 0 && 'ml-6',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 shrink-0 transition-colors',
          isActive
            ? 'text-sidebar-primary'
            : 'text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground'
        )}
      />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.title}</span>
          {item.badge && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.title}
          {item.badge && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
              {item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

/**
 * Navigation item with children (collapsible)
 */
function NavItemWithChildren({
  item,
  collapsed,
  currentPath,
}: {
  item: NavItem;
  collapsed: boolean;
  currentPath: string;
}) {
  const { expandedGroups, toggleGroup } = useSidebarStore();
  const isExpanded = expandedGroups.includes(item.id);
  const isChildActive = item.children?.some((child) => child.href === currentPath);
  const isActive = item.href === currentPath;

  const Icon = item.icon;

  // Auto-expand if child is active
  useEffect(() => {
    if (isChildActive && !isExpanded && !collapsed) {
      toggleGroup(item.id);
    }
  }, [isChildActive, isExpanded, collapsed, toggleGroup, item.id]);

  if (collapsed) {
    return (
      <DropdownMenu>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'group flex w-full items-center justify-center rounded-lg p-2 text-sm font-medium transition-all',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  (isActive || isChildActive) && 'sidebar-item-active'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isActive || isChildActive
                      ? 'text-sidebar-primary'
                      : 'text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground'
                  )}
                />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">{item.title}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent side="right" align="start" className="w-48">
          <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.children?.map((child) => (
            <DropdownMenuItem key={child.id} asChild>
              <Link
                to={child.href}
                className={cn(
                  'flex items-center gap-2',
                  child.href === currentPath && 'bg-accent'
                )}
              >
                <child.icon className="h-4 w-4" />
                {child.title}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Collapsible.Root open={isExpanded} onOpenChange={() => toggleGroup(item.id)}>
      <Collapsible.Trigger asChild>
        <button
          className={cn(
            'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            (isActive || isChildActive) && 'sidebar-item-active'
          )}
        >
          <Icon
            className={cn(
              'h-5 w-5 shrink-0 transition-colors',
              isActive || isChildActive
                ? 'text-sidebar-primary'
                : 'text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground'
            )}
          />
          <span className="flex-1 truncate text-left">{item.title}</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-sidebar-foreground/50 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="mt-1 space-y-1">
          {item.children?.map((child) => (
            <NavItemComponent
              key={child.id}
              item={child}
              collapsed={false}
              isActive={child.href === currentPath}
              depth={1}
            />
          ))}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

/**
 * Navigation group component
 */
function NavGroupComponent({
  group,
  collapsed,
  currentPath,
}: {
  group: NavGroup;
  collapsed: boolean;
  currentPath: string;
}) {
  return (
    <div className="space-y-1">
      {!collapsed && (
        <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          {group.title}
        </h3>
      )}
      <nav className="space-y-1">
        {group.items.map((item) =>
          item.children && item.children.length > 0 ? (
            <NavItemWithChildren
              key={item.id}
              item={item}
              collapsed={collapsed}
              currentPath={currentPath}
            />
          ) : (
            <NavItemComponent
              key={item.id}
              item={item}
              collapsed={collapsed}
              isActive={item.href === currentPath}
            />
          )
        )}
      </nav>
    </div>
  );
}

/**
 * User menu component at the bottom of the sidebar
 */
function UserMenu({ collapsed }: { collapsed: boolean }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Check if running in Electron
  const [isElectron, setIsElectron] = useState(false);

  // Initialize isDark based on current DOM state
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Check for Electron environment on mount
  useEffect(() => {
    // Check if electronAPI is available
    setIsElectron(typeof window !== 'undefined' && !!window.electronAPI);
  }, []);

  // Sync isDark state with DOM changes (e.g., from theme provider or system preference)
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const hasDark = document.documentElement.classList.contains('dark');
          setIsDark(hasDark);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    // Initial sync
    setIsDark(document.documentElement.classList.contains('dark'));

    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const newValue = !prev;
      document.documentElement.classList.toggle('dark', newValue);
      return newValue;
    });
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate({ to: '/login' });
  }, [logout, navigate]);

  const handleExitApp = useCallback(() => {
    if (window.electronAPI?.quitApp) {
      window.electronAPI.quitApp();
    }
  }, []);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  // Common menu items for consistency
  const menuItems = (
    <>
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <Sparkles className="h-4 w-4 mr-2" />
          Upgrade Plan
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme}>
          {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <HelpCircle className="h-4 w-4 mr-2" />
          Help
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </DropdownMenuItem>
        {isElectron && (
          <DropdownMenuItem onClick={handleExitApp} className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
            <Power className="h-4 w-4 mr-2" />
            Exit App
          </DropdownMenuItem>
        )}
      </DropdownMenuGroup>
    </>
  );

  if (collapsed) {
    return (
      <DropdownMenu>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">
            {user?.name || 'User'}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent
          side="right"
          align="end"
          className="w-64 p-2"
          sideOffset={10}
        >
          <DropdownMenuLabel className="font-normal p-0 mb-2">
            <div className="flex items-center gap-3 px-2 py-2 text-left text-sm bg-sidebar-accent/50 rounded-md">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">{user?.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {menuItems}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="group flex w-full items-center gap-3 rounded-lg p-2 text-left transition-all hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent">
          <Avatar className="h-9 w-9 border border-sidebar-border">
            <AvatarImage src={user?.avatar || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium text-sidebar-foreground group-hover:text-sidebar-accent-foreground transiton-colors">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate group-hover:text-sidebar-accent-foreground/70 transition-colors">{user?.tier || 'Free'} Plan</p>
          </div>
          <ChevronRight className="h-4 w-4 text-sidebar-foreground/50 group-data-[state=open]:rotate-90 transition-transform" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="center"
        className="w-[--radix-dropdown-menu-trigger-width] min-w-[16rem] p-2 mb-2"
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal p-0 mb-2">
          <div className="flex items-center gap-3 px-2 py-2 text-left text-sm">
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-semibold text-lg">{user?.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {menuItems}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Main Sidebar component
 */
export function Sidebar() {
  const location = useLocation();
  const { isCollapsed, toggle } = useSidebarStore();
  const { tier, hasFeature } = useAuthStore();
  const currentUserPermissions = usePermissionsStore((state) => state.currentUserPermissions);
  const currentPath = location.pathname;

  // Filter navigation based on user permissions, tier, and features
  const filteredNavigation = useMemo(() => {
    const userTier = tier || 'L1';
    const features: Record<string, boolean> = {
      multiWarehouse: hasFeature('multiWarehouse'),
      advancedReports: hasFeature('advancedReports'),
      demandForecasting: hasFeature('demandForecasting'),
      aiChatAssistant: hasFeature('aiChatAssistant'),
    };

    return filterNavigationByPermissions(
      navigationConfig,
      userTier,
      features,
      currentUserPermissions
    );
  }, [tier, hasFeature, currentUserPermissions]);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
          isCollapsed ? 'sidebar-collapsed' : ''
        )}
        style={{
          width: isCollapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded,
        }}
      >
        {/* Header */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-sidebar-border px-4',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {/* Logo - clickable to expand when collapsed */}
          {isCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button onClick={toggle} className="focus:outline-none">
                  <Logo collapsed={isCollapsed} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          ) : (
            <Logo collapsed={isCollapsed} />
          )}

          {/* Collapse button - only shown when expanded */}
          {!isCollapsed && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggle}
                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Collapse sidebar</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <div className={cn('space-y-6', isCollapsed ? 'px-2' : 'px-3')}>
            {filteredNavigation.map((group) => (
              <NavGroupComponent
                key={group.id}
                group={group}
                collapsed={isCollapsed}
                currentPath={currentPath}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Footer with user menu */}
        <div
          className={cn(
            'shrink-0 border-t border-sidebar-border',
            isCollapsed ? 'p-2' : 'p-3'
          )}
        >
          <UserMenu collapsed={isCollapsed} />
        </div>
      </aside>
    </TooltipProvider>
  );
}
