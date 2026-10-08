import { useEffect, useState } from 'react';
import { PencilLine, Save, ArrowRight, History } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import ConfirmDialog from '../../components/Modal/ConfirmDialog';
import Avatar from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/Badge';
import { Field, Textarea } from '../../components/ui/Field';
import { StatusToggle } from '../../components/AttendanceTable/AttendanceTable';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { STATUS, slotLabel } from '../../utils/attendance';
import { formatDate, formatDateTime } from '../../utils/date';
import { classLabel } from '../../utils/format';

/** Edit a single attendance record, with a confirmation step and audit trail. */
export default function EditAttendanceModal({ row, onClose }) {
  const { studentsById, subjectsById, facultyById, classesById, updateRecord } = useData();
  const { user } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (row) {
      setStatus(row.status);
      setReason('');
      setError('');
    }
  }, [row]);

  if (!row) return null;
  const st = studentsById[row.studentId];
  const s = row.session;
  const edit = s.edits?.[row.studentId];

  const trySave = () => {
    if (status === row.status) return setError('Choose a different status to update this record.');
    setConfirm(true);
  };
  const doSave = () => {
    updateRecord(s.id, row.studentId, status, user, reason.trim());
    toast.success('Attendance updated', `${st?.name}: ${STATUS[row.status].label} → ${STATUS[status].label}`);
    setConfirm(false);
    onClose();
  };

  const Row = ({ label, children }) => (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-ink-3">{label}</span>
      <span className="text-right font-semibold text-ink">{children}</span>
    </div>
  );

  return (
    <>
      <Modal
        open={!!row}
        onClose={onClose}
        icon={PencilLine}
        title="Edit Attendance"
        description="Changes are recorded with your name and the time of the update."
        footer={
          <>
            <button className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={trySave}>
              <Save className="h-4 w-4" /> Save changes
            </button>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <Avatar name={st?.name} size="lg" />
          <div>
            <p className="font-bold text-ink">{st?.name}</p>
            <p className="text-xs text-ink-3">
              {st?.id} · Roll {st?.rollNo}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-line bg-surface-2 px-4 py-1">
          <p className="pt-3 text-[11px] font-bold tracking-wider text-ink-3 uppercase">Original record</p>
          <div className="divide-y divide-line">
            <Row label="Date">{formatDate(s.date, { weekday: 'short' })}</Row>
            <Row label="Lecture">
              Lecture {s.slot} · {slotLabel(s.slot)}
            </Row>
            <Row label="Subject">{subjectsById[s.subjectId]?.name}</Row>
            <Row label="Class">{classLabel(classesById[s.classId])}</Row>
            <Row label="Faculty">{facultyById[s.facultyId]?.name || s.markedBy}</Row>
            <Row label="Current status">
              <StatusBadge status={row.status} />
            </Row>
            <Row label="Marked by">
              {s.markedBy}
              <span className="block text-[11px] font-normal text-ink-3">{formatDateTime(s.markedAt)}</span>
            </Row>
            {edit && (
              <Row label="Last updated by">
                {edit.by}
                <span className="block text-[11px] font-normal text-ink-3">{formatDateTime(edit.at)}</span>
              </Row>
            )}
          </div>
        </div>

        {edit && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-brand">
            <History className="h-3.5 w-3.5" /> Originally marked {STATUS[edit.from]?.label}
            {edit.reason ? ` · “${edit.reason}”` : ''}
          </p>
        )}

        <div className="mt-5">
          <p className="label">Change status to</p>
          <StatusToggle
            value={status}
            onChange={(k) => {
              setStatus(k);
              setError('');
            }}
          />
          {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
          {status !== row.status && (
            <p className="mt-3 flex items-center gap-2 text-sm">
              <StatusBadge status={row.status} /> <ArrowRight className="h-4 w-4 text-ink-3" /> <StatusBadge status={status} />
            </p>
          )}
        </div>
        <Field label="Reason (optional)" className="mt-4">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Student was present in the lab during roll call" />
        </Field>
      </Modal>

      <ConfirmDialog
        open={confirm}
        title="Confirm attendance change"
        message={`Change ${st?.name}'s attendance for ${subjectsById[s.subjectId]?.name} on ${formatDate(s.date)} from ${STATUS[row.status].label} to ${STATUS[status]?.label}?`}
        confirmLabel="Yes, update"
        onCancel={() => setConfirm(false)}
        onConfirm={doSave}
      />
    </>
  );
}
