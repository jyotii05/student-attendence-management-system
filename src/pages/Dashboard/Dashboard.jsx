import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import FacultyDashboard from './FacultyDashboard';
import StudentDashboard from './StudentDashboard';

export default function Dashboard() {
  const { role } = useAuth();
  if (role === 'student') return <StudentDashboard />;
  if (role === 'faculty') return <FacultyDashboard />;
  return <AdminDashboard />;
}
