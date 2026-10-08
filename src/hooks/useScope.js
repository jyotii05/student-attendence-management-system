import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

/**
 * Role-aware slice of the data:
 *  admin   → everything
 *  faculty → assigned subjects, the classes they teach and those classes' students
 *  student → own class, own subjects, only themselves
 */
export function useScope() {
  const { role, profile } = useAuth();
  const { subjects, classes, students, sessions } = useData();

  return useMemo(() => {
    if (role === 'faculty' && profile) {
      const mySubjects = subjects.filter((s) => s.facultyId === profile.id);
      const subjectIds = new Set(mySubjects.map((s) => s.id));
      const myClasses = classes.filter(
        (c) => c.classTeacherId === profile.id || mySubjects.some((s) => s.course === c.course && s.semester === c.semester),
      );
      const classIds = new Set(myClasses.map((c) => c.id));
      return {
        isAll: false,
        subjects: mySubjects,
        subjectIds,
        classes: myClasses,
        classIds,
        students: students.filter((s) => classIds.has(s.classId)),
        sessions: sessions.filter((s) => subjectIds.has(s.subjectId)),
      };
    }
    if (role === 'student' && profile) {
      const mySubjects = subjects.filter((s) => s.course === profile.course && s.semester === profile.semester);
      return {
        isAll: false,
        subjects: mySubjects,
        subjectIds: new Set(mySubjects.map((s) => s.id)),
        classes: classes.filter((c) => c.id === profile.classId),
        classIds: new Set([profile.classId]),
        students: [profile],
        sessions: sessions.filter((s) => s.classId === profile.classId),
      };
    }
    return {
      isAll: true,
      subjects,
      subjectIds: new Set(subjects.map((s) => s.id)),
      classes,
      classIds: new Set(classes.map((c) => c.id)),
      students,
      sessions,
    };
  }, [role, profile, subjects, classes, students, sessions]);
}
