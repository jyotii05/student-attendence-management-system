import {
  LayoutDashboard,
  GraduationCap,
  UsersRound,
  Building2,
  School,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  FileChartColumn,
  TriangleAlert,
  ChartNoAxesCombined,
  CalendarDays,
  CalendarClock,
  Bell,
  Settings,
  UserCheck,
} from 'lucide-react';

/** Which roles may open each route. Used by both the sidebar and the route guard. */
export const ROUTE_ROLES = {
  '/dashboard': ['admin', 'faculty', 'student'],
  '/students': ['admin', 'faculty'],
  '/faculty': ['admin', 'faculty'],
  '/departments': ['admin'],
  '/classes': ['admin', 'faculty'],
  '/subjects': ['admin', 'faculty', 'student'],
  '/attendance/mark': ['admin', 'faculty'],
  '/attendance/records': ['admin', 'faculty'],
  '/reports': ['admin', 'faculty'],
  '/alerts': ['admin', 'faculty'],
  '/analytics': ['admin'],
  '/timetable': ['admin', 'faculty', 'student'],
  '/calendar': ['admin', 'faculty', 'student'],
  '/my-attendance': ['student'],
  '/notifications': ['admin', 'faculty', 'student'],
  '/settings': ['admin', 'faculty', 'student'],
};

const NAV = {
  admin: [
    { section: 'Overview', items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    {
      section: 'Management',
      items: [
        { to: '/students', label: 'Students', icon: GraduationCap },
        { to: '/faculty', label: 'Faculty', icon: UsersRound },
        { to: '/departments', label: 'Departments', icon: Building2 },
        { to: '/classes', label: 'Classes', icon: School },
        { to: '/subjects', label: 'Subjects', icon: BookOpen },
      ],
    },
    {
      section: 'Attendance',
      items: [
        { to: '/attendance/mark', label: 'Mark Attendance', icon: ClipboardCheck },
        { to: '/attendance/records', label: 'Attendance Records', icon: ClipboardList },
        { to: '/reports', label: 'Attendance Reports', icon: FileChartColumn },
        { to: '/alerts', label: 'Low Attendance', icon: TriangleAlert, badge: 'low' },
        { to: '/calendar', label: 'Calendar', icon: CalendarDays },
        { to: '/timetable', label: 'Timetable', icon: CalendarClock },
      ],
    },
    { section: 'Analytics', items: [{ to: '/analytics', label: 'Attendance Analytics', icon: ChartNoAxesCombined }] },
    {
      section: 'System',
      items: [
        { to: '/notifications', label: 'Notifications', icon: Bell, badge: 'unread' },
        { to: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ],
  faculty: [
    { section: 'Overview', items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    {
      section: 'Teaching',
      items: [
        { to: '/classes', label: 'My Classes', icon: School },
        { to: '/subjects', label: 'My Subjects', icon: BookOpen },
        { to: '/students', label: 'Students', icon: GraduationCap },
        { to: '/timetable', label: 'Timetable', icon: CalendarClock },
      ],
    },
    {
      section: 'Attendance',
      items: [
        { to: '/attendance/mark', label: 'Mark Attendance', icon: ClipboardCheck },
        { to: '/attendance/records', label: 'Attendance Records', icon: ClipboardList },
        { to: '/reports', label: 'Reports', icon: FileChartColumn },
        { to: '/alerts', label: 'Low Attendance', icon: TriangleAlert, badge: 'low' },
        { to: '/calendar', label: 'Calendar', icon: CalendarDays },
      ],
    },
    {
      section: 'System',
      items: [
        { to: '/notifications', label: 'Notifications', icon: Bell, badge: 'unread' },
        { to: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ],
  student: [
    { section: 'Overview', items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    {
      section: 'My Academics',
      items: [
        { to: '/my-attendance', label: 'My Attendance', icon: UserCheck },
        { to: '/calendar', label: 'Attendance Calendar', icon: CalendarDays },
        { to: '/timetable', label: 'Timetable', icon: CalendarClock },
        { to: '/subjects', label: 'My Subjects', icon: BookOpen },
      ],
    },
    {
      section: 'System',
      items: [
        { to: '/notifications', label: 'Notifications', icon: Bell, badge: 'unread' },
        { to: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ],
};

export const navFor = (role) => NAV[role] || [];

export function canAccess(role, pathname) {
  const base = Object.keys(ROUTE_ROLES)
    .filter((p) => pathname === p || pathname.startsWith(p + '/'))
    .sort((a, b) => b.length - a.length)[0];
  return base ? ROUTE_ROLES[base].includes(role) : true;
}

export const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/faculty': 'Faculty',
  '/departments': 'Departments',
  '/classes': 'Classes',
  '/subjects': 'Subjects',
  '/attendance/mark': 'Mark Attendance',
  '/attendance/records': 'Attendance Records',
  '/reports': 'Reports',
  '/alerts': 'Low Attendance',
  '/analytics': 'Analytics',
  '/timetable': 'Timetable',
  '/calendar': 'Calendar',
  '/my-attendance': 'My Attendance',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
};
