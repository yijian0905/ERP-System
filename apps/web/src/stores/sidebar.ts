import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  /** Whether the sidebar is collapsed */
  isCollapsed: boolean;
  /** Whether the sidebar is open on mobile */
  isMobileOpen: boolean;
  /** Currently hovered menu item (for tooltips in collapsed mode) */
  hoveredItem: string | null;
  /** Expanded menu groups */
  expandedGroups: string[];
}

interface SidebarActions {
  /** Toggle sidebar collapsed state */
  toggle: () => void;
  /** Set collapsed state explicitly */
  setCollapsed: (collapsed: boolean) => void;
  /** Toggle mobile sidebar */
  toggleMobile: () => void;
  /** Set mobile open state */
  setMobileOpen: (open: boolean) => void;
  /** Set hovered item */
  setHoveredItem: (item: string | null) => void;
  /** Toggle menu group expansion */
  toggleGroup: (groupId: string) => void;
  /** Expand a menu group */
  expandGroup: (groupId: string) => void;
  /** Collapse a menu group */
  collapseGroup: (groupId: string) => void;
  /** Reset sidebar state */
  reset: () => void;
}

type SidebarStore = SidebarState & SidebarActions;

const initialState: SidebarState = {
  isCollapsed: false,
  isMobileOpen: false,
  hoveredItem: null,
  expandedGroups: [],
};

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      ...initialState,

      toggle: () =>
        set((state) => ({
          isCollapsed: !state.isCollapsed,
          // Collapse all groups when collapsing sidebar
          expandedGroups: state.isCollapsed ? state.expandedGroups : [],
        })),

      setCollapsed: (collapsed) =>
        set({
          isCollapsed: collapsed,
          expandedGroups: collapsed ? [] : undefined,
        }),

      toggleMobile: () =>
        set((state) => ({
          isMobileOpen: !state.isMobileOpen,
        })),

      setMobileOpen: (open) =>
        set({
          isMobileOpen: open,
        }),

      setHoveredItem: (item) =>
        set({
          hoveredItem: item,
        }),

      toggleGroup: (groupId) =>
        set((state) => ({
          expandedGroups: state.expandedGroups.includes(groupId)
            ? state.expandedGroups.filter((id) => id !== groupId)
            : [...state.expandedGroups, groupId],
        })),

      expandGroup: (groupId) =>
        set((state) => ({
          expandedGroups: state.expandedGroups.includes(groupId)
            ? state.expandedGroups
            : [...state.expandedGroups, groupId],
        })),

      collapseGroup: (groupId) =>
        set((state) => ({
          expandedGroups: state.expandedGroups.filter((id) => id !== groupId),
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'erp-sidebar',
      partialize: (state) => ({
        isCollapsed: state.isCollapsed,
        expandedGroups: state.expandedGroups,
      }),
    }
  )
);

/**
 * Sidebar width constants
 */
export const SIDEBAR_WIDTH = {
  expanded: 256,
  collapsed: 64,
} as const;

/**
 * Hook to get current sidebar width
 */
export function useSidebarWidth(): number {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  return isCollapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded;
}
