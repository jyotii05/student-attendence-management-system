# AttendEase — Student Attendance Management System

Smart attendance tracking for modern classrooms. A complete, role-based attendance platform built with React, Vite and Tailwind CSS. All data is fictional and stored locally in the browser.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Demo accounts

| Role          | Email                    | Password     |
| ------------- | ------------------------ | ------------ |
| Administrator | admin@attendease.com     | admin123     |
| Faculty       | faculty@attendease.com   | faculty123   |
| Student       | student@attendease.com   | student123   |

Under **Demo Login** on the sign-in page, click a role to fill its credentials, then click **Sign In**.

## Features

- **Role-based access:** separate dashboards and navigation for Admin, Faculty and Student, plus protected routes and guest-only `/login`.
- **Mark Attendance:** pick department, course, semester, division, subject, faculty, date and lecture, then mark each student Present or Absent. Includes Mark All Present, Reset, and validation. Saving updates every percentage, chart, report and alert straight away.
- **Attendance Records:** filter by date range, department, course, semester, division, subject, faculty and status, and search by name, roll number or ID. Editing a record asks for confirmation and keeps an audit trail (original status, who updated it, when).
- **Reports** by student, class, department or subject over any date range, with charts, CSV export and a print layout.
- **Low Attendance Alerts:** a configurable threshold (default 75%), the number of classes needed to recover, severity levels and notifications.
- **Analytics:** trend, department comparison, subject ranking, distribution, monthly or weekly area chart, weekday pattern, and Today / Week / Month / Semester / Custom ranges.
- **Management:** students, faculty, departments, classes and subjects, all with add, edit and delete plus inline validation.
- **Student views:** dashboard, subject cards with "can miss / needs" guidance, attendance calendar, timetable and a full history.
- **Global search** (Ctrl + K), notification centre, settings (profile photo, attendance rules, notification preferences, appearance, change password) and optional dark mode.
- Responsive layout: collapsible sidebar on desktop, drawer on mobile, card-style roll call on phones.

## How attendance % is calculated

```
attended = Present
total    = Present + Absent
%        = attended / total × 100        e.g. 28 / 30 = 93.33%
needed   = ceil((t·total − attended) / (1 − t))   lectures to reach threshold t
```

Below the threshold, a student is flagged **Low Attendance**. The engine lives in `src/utils/attendance.js`.

## Project structure

```
src/
├── components/   Sidebar, Header, StatCard, DataTable, Modal, Toast, AttendanceTable,
│                 AttendanceCalendar, Timetable, Charts, Logo, ui/ (primitives)
├── pages/        Login, Dashboard (admin/faculty/student), Students, StudentProfile, Faculty,
│                 Departments, Classes, Subjects, MarkAttendance, AttendanceRecords, Reports,
│                 LowAttendance, Analytics, Timetable, Calendar, Notifications, Settings, NotFound
├── data/         catalog + deterministic seed generator (≈255 students, 21 faculty, 10 weeks of history)
├── context/      Theme, Toast, Data (localStorage-backed store + live stats), Auth
├── hooks/        useScope (role-aware data), useLowAttendance, useChartTheme, …
├── utils/        attendance engine, dates, CSV, formatting, selectors
├── layouts/      AppLayout, route guards, navigation
└── App.jsx
```

To restore the original sample data, sign in as admin and use **Settings → Security → Reset demo data**.
