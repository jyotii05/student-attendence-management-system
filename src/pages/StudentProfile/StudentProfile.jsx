import { Link, useParams } from 'react-router-dom';
import { UserX } from 'lucide-react';
import StudentProfileView from './StudentProfileView';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useScope } from '../../hooks/useScope';

export default function StudentProfile() {
  const { id } = useParams();
  const { role } = useAuth();
  const { studentsById } = useData();
  const scope = useScope();
  const student = studentsById[id];
  const visible = student && (scope.isAll || scope.classIds.has(student.classId));

  if (!visible)
    return (
      <div className="card">
        <EmptyState
          icon={UserX}
          title="Student not found"
          message="This student doesn’t exist, was deleted, or isn’t in one of your classes."
          action={
            <Link to="/students" className="btn btn-primary">
              Back to Students
            </Link>
          }
        />
      </div>
    );

  return <StudentProfileView student={student} canEdit={role === 'admin'} />;
}
