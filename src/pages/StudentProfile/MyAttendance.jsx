import StudentProfileView from './StudentProfileView';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';

export default function MyAttendance() {
  const { profile } = useAuth();
  if (!profile) return <EmptyState title="No student record linked" message="Your account isn’t linked to a student record." />;
  return <StudentProfileView student={profile} self />;
}
