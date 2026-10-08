// Static academic catalog for the fictional institution.

export const INSTITUTION = {
  name: 'Vidyanagar College of Arts, Science & Commerce',
  short: 'Vidyanagar College',
  city: 'Pune, Maharashtra',
};

export const DEPARTMENTS = [
  { id: 'dept-it', code: 'IT', name: 'Information Technology', course: 'BSc IT', block: 'A Block', established: 2004 },
  { id: 'dept-cs', code: 'CS', name: 'Computer Science', course: 'BCA', block: 'A Block', established: 2008 },
  { id: 'dept-com', code: 'COM', name: 'Commerce', course: 'BCom', block: 'C Block', established: 1992 },
  { id: 'dept-mgt', code: 'MGT', name: 'Management', course: 'BMS', block: 'D Block', established: 2010 },
  { id: 'dept-arts', code: 'ART', name: 'Arts', course: 'BA', block: 'B Block', established: 1989 },
  { id: 'dept-sci', code: 'SCI', name: 'Science', course: 'BSc', block: 'E Block', established: 1995 },
];

export const COURSES = ['BSc IT', 'BCA', 'BCom', 'BMS', 'BA', 'BSc'];
export const SEMESTERS = [1, 2, 3, 4, 5, 6];
export const DIVISIONS = ['A', 'B', 'C'];
export const GENDERS = ['Female', 'Male', 'Other'];
export const WEEKDAYS = [
  { id: 1, short: 'Mon', name: 'Monday' },
  { id: 2, short: 'Tue', name: 'Tuesday' },
  { id: 3, short: 'Wed', name: 'Wednesday' },
  { id: 4, short: 'Thu', name: 'Thursday' },
  { id: 5, short: 'Fri', name: 'Friday' },
  { id: 6, short: 'Sat', name: 'Saturday' },
];

export const DESIGNATIONS = ['Head of Department', 'Professor', 'Associate Professor', 'Assistant Professor', 'Visiting Faculty'];

export const DEMO_ACCOUNTS = [
  { role: 'admin', label: 'Administrator', email: 'admin@attendease.com', password: 'admin123' },
  { role: 'faculty', label: 'Faculty', email: 'faculty@attendease.com', password: 'faculty123' },
  { role: 'student', label: 'Student', email: 'student@attendease.com', password: 'student123' },
];

export const ROLE_META = {
  admin: { label: 'Administrator', cls: 'bg-brand-soft text-brand-600 dark:text-blue-300' },
  faculty: { label: 'Faculty', cls: 'bg-brand-soft text-brand-600 dark:text-blue-300' },
  student: { label: 'Student', cls: 'bg-brand-soft text-brand-600 dark:text-blue-300' },
};

export const deptByCourse = (course) => DEPARTMENTS.find((d) => d.course === course);
