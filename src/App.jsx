import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './layouts/guards';
import Login from './pages/Login/Login';
import NotFound from './pages/NotFound/NotFound';

const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Students = lazy(() => import('./pages/Students/Students'));
const StudentProfile = lazy(() => import('./pages/StudentProfile/StudentProfile'));
const MyAttendance = lazy(() => import('./pages/StudentProfile/MyAttendance'));
const Faculty = lazy(() => import('./pages/Faculty/Faculty'));
const FacultyProfile = lazy(() => import('./pages/Faculty/FacultyProfile'));
const Departments = lazy(() => import('./pages/Departments/Departments'));
const Classes = lazy(() => import('./pages/Classes/Classes'));
const Subjects = lazy(() => import('./pages/Subjects/Subjects'));
const MarkAttendance = lazy(() => import('./pages/MarkAttendance/MarkAttendance'));
const AttendanceRecords = lazy(() => import('./pages/AttendanceRecords/AttendanceRecords'));
const Reports = lazy(() => import('./pages/Reports/Reports'));
const LowAttendance = lazy(() => import('./pages/LowAttendance/LowAttendance'));
const Analytics = lazy(() => import('./pages/Analytics/Analytics'));
const Timetable = lazy(() => import('./pages/Timetable/Timetable'));
const Calendar = lazy(() => import('./pages/Calendar/Calendar'));
const Notifications = lazy(() => import('./pages/Notifications/Notifications'));
const Settings = lazy(() => import('./pages/Settings/Settings'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentProfile />} />
          <Route path="/my-attendance" element={<MyAttendance />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/faculty/:id" element={<FacultyProfile />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/attendance" element={<Navigate to="/attendance/mark" replace />} />
          <Route path="/attendance/mark" element={<MarkAttendance />} />
          <Route path="/attendance/records" element={<AttendanceRecords />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/alerts" element={<LowAttendance />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound standalone />} />
    </Routes>
  );
}
