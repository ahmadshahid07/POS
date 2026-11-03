import { create } from 'zustand';

export type CorbelView =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'purchases'
  | 'orders'
  | 'customers'
  | 'finance'
  | 'analytics'
  | 'messages'
  | 'settings'
  | 'automations'
  | 'workspace';

export type CorbelTheme = 'light' | 'dark';

export interface KanbanCard {
  id: string;
  tag: string;
  tagType: 'copy' | 'buying' | 'store' | 'photo' | 'design' | 'ops';
  title: string;
  checklistDone: number;
  checklistTotal: number;
  assignee: {
    initials: string;
    name: string;
  };
  dueDate: string;
  dueUrgent?: boolean;
  commentsCount?: number;
  columnId: 'todo' | 'inprogress' | 'review' | 'done';
}

interface CorbelState {
  theme: CorbelTheme;
  activeView: CorbelView;
  dashboardSubTab: 'overview' | 'online' | 'instore';
  analyticsRange: '7D' | '30D' | '90D' | '12M';
  analyticsChannel: 'all' | 'online' | 'instore';
  analyticsVsPrevious: boolean;
  activeProject: 'spring-launch' | 'retail-plan';
  assigneeFilter: string | null;
  liveUsersCount: number;
  isSearchOpen: boolean;
  isNotificationsOpen: boolean;
  isAddCardOpen: boolean;
  targetColumnForNewCard: 'todo' | 'inprogress' | 'review' | 'done';
  kanbanCards: KanbanCard[];

  // Actions
  setTheme: (theme: CorbelTheme) => void;
  toggleTheme: () => void;
  setActiveView: (view: CorbelView) => void;
  setDashboardSubTab: (tab: 'overview' | 'online' | 'instore') => void;
  setAnalyticsRange: (range: '7D' | '30D' | '90D' | '12M') => void;
  setAnalyticsChannel: (channel: 'all' | 'online' | 'instore') => void;
  toggleAnalyticsVsPrevious: () => void;
  setActiveProject: (proj: 'spring-launch' | 'retail-plan') => void;
  setAssigneeFilter: (filter: string | null) => void;
  setSearchOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
  setAddCardOpen: (open: boolean, col?: 'todo' | 'inprogress' | 'review' | 'done') => void;
  addKanbanCard: (card: Omit<KanbanCard, 'id'>) => void;
  moveKanbanCard: (cardId: string, toColumn: 'todo' | 'inprogress' | 'review' | 'done') => void;
}

export const useCorbelStore = create<CorbelState>((set) => ({
  theme: 'light',
  activeView: 'dashboard',
  dashboardSubTab: 'overview',
  analyticsRange: '30D',
  analyticsChannel: 'all',
  analyticsVsPrevious: true,
  activeProject: 'spring-launch',
  assigneeFilter: null,
  liveUsersCount: 1284,
  isSearchOpen: false,
  isNotificationsOpen: false,
  isAddCardOpen: false,
  targetColumnForNewCard: 'todo',

  kanbanCards: [
    {
      id: 'k1',
      tag: 'Copy',
      tagType: 'copy',
      title: 'Write product stories for 8 new pieces',
      checklistDone: 0,
      checklistTotal: 8,
      assignee: { initials: 'AP', name: 'Alex Patel' },
      dueDate: 'Due in 12 days',
      commentsCount: 2,
      columnId: 'todo',
    },
    {
      id: 'k2',
      tag: 'Buying',
      tagType: 'buying',
      title: 'Order sage towel colourway',
      checklistDone: 0,
      checklistTotal: 1,
      assignee: { initials: 'JD', name: 'Jordan Doe' },
      dueDate: 'Due in 6 days',
      columnId: 'todo',
    },
    {
      id: 'k3',
      tag: 'Store',
      tagType: 'store',
      title: 'Store display visual guidelines & props',
      checklistDone: 0,
      checklistTotal: 3,
      assignee: { initials: 'PS', name: 'Priya Sharma' },
      dueDate: 'Due in 15 days',
      columnId: 'todo',
    },
    {
      id: 'k4',
      tag: 'Photo',
      tagType: 'photo',
      title: 'Photo shoot: bath mat + throws',
      checklistDone: 2,
      checklistTotal: 4,
      assignee: { initials: 'MR', name: 'Marcus Rivera' },
      dueDate: 'Due in 3 days',
      commentsCount: 6,
      columnId: 'inprogress',
    },
    {
      id: 'k5',
      tag: 'Design',
      tagType: 'design',
      title: 'Landing page design',
      checklistDone: 3,
      checklistTotal: 6,
      assignee: { initials: 'AP', name: 'Alex Patel' },
      dueDate: 'Due in 9 days',
      commentsCount: 3,
      columnId: 'inprogress',
    },
    {
      id: 'k6',
      tag: 'Design',
      tagType: 'design',
      title: 'Packaging inserts, print proof',
      checklistDone: 3,
      checklistTotal: 3,
      assignee: { initials: 'MR', name: 'Marcus Rivera' },
      dueDate: 'Due tomorrow',
      dueUrgent: true,
      commentsCount: 1,
      columnId: 'review',
    },
    {
      id: 'k7',
      tag: 'Ops',
      tagType: 'ops',
      title: 'Confirm launch date with suppliers',
      checklistDone: 2,
      checklistTotal: 2,
      assignee: { initials: 'LT', name: 'Lucas Taylor' },
      dueDate: 'Oct 19',
      columnId: 'done',
    },
    {
      id: 'k8',
      tag: 'Buying',
      tagType: 'buying',
      title: 'Pick hero product',
      checklistDone: 1,
      checklistTotal: 1,
      assignee: { initials: 'MR', name: 'Marcus Rivera' },
      dueDate: 'Oct 14',
      commentsCount: 5,
      columnId: 'done',
    },
  ],

  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setActiveView: (activeView) => set({ activeView }),
  setDashboardSubTab: (dashboardSubTab) => set({ dashboardSubTab }),
  setAnalyticsRange: (analyticsRange) => set({ analyticsRange }),
  setAnalyticsChannel: (analyticsChannel) => set({ analyticsChannel }),
  toggleAnalyticsVsPrevious: () => set((state) => ({ analyticsVsPrevious: !state.analyticsVsPrevious })),
  setActiveProject: (activeProject) => set({ activeProject }),
  setAssigneeFilter: (assigneeFilter) => set({ assigneeFilter }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  setNotificationsOpen: (isNotificationsOpen) => set({ isNotificationsOpen }),
  setAddCardOpen: (isAddCardOpen, targetCol) =>
    set({ isAddCardOpen, targetColumnForNewCard: targetCol || 'todo' }),
  addKanbanCard: (card) =>
    set((state) => ({
      kanbanCards: [
        ...state.kanbanCards,
        {
          ...card,
          id: 'card-' + Date.now(),
        },
      ],
      isAddCardOpen: false,
    })),
  moveKanbanCard: (cardId, toColumn) =>
    set((state) => ({
      kanbanCards: state.kanbanCards.map((c) =>
        c.id === cardId ? { ...c, columnId: toColumn } : c
      ),
    })),
}));

if (typeof window !== 'undefined') {
  (window as any).useCorbelStore = useCorbelStore;
}
