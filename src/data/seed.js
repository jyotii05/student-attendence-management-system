// Deterministic generator for realistic, fictional demo data.
// All names, IDs, phone numbers and emails are invented.

import { DEPARTMENTS } from './catalog';
import { addDays, todayISO, weekdayOf } from '../utils/date';
import { LECTURE_SLOTS } from '../utils/attendance';

export const SEED_VERSION = 4;

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MALE = ['Aarav', 'Rohan', 'Aditya', 'Rahul', 'Arjun', 'Vihaan', 'Siddharth', 'Karan', 'Omkar', 'Yash', 'Pranav', 'Harsh', 'Nikhil', 'Tejas', 'Saurabh', 'Varun', 'Kunal', 'Ishaan', 'Atharva', 'Manish', 'Akash', 'Gaurav', 'Rishi', 'Sahil', 'Dhruv', 'Parth', 'Aniket', 'Shreyas', 'Vedant', 'Kabir', 'Ayaan', 'Zaid', 'Farhan', 'Jay', 'Mihir', 'Soham', 'Raj', 'Chinmay'];
const FEMALE = ['Priya', 'Ananya', 'Sneha', 'Pooja', 'Riya', 'Isha', 'Kavya', 'Aditi', 'Neha', 'Shruti', 'Tanvi', 'Sakshi', 'Mrunal', 'Diya', 'Simran', 'Anjali', 'Bhavna', 'Ishita', 'Nidhi', 'Pallavi', 'Rutuja', 'Sanika', 'Gauri', 'Meera', 'Aisha', 'Zoya', 'Krutika', 'Prachi', 'Vaishnavi', 'Komal', 'Swara', 'Janhavi'];
const LAST = ['Mehta', 'Patil', 'Sharma', 'Deshmukh', 'Kulkarni', 'Joshi', 'Shah', 'Patel', 'Iyer', 'Nair', 'Reddy', 'Gupta', 'Verma', 'Singh', 'Chavan', 'Pawar', 'Jadhav', 'Shinde', 'More', 'Gaikwad', 'Bhosale', 'Naik', 'Menon', 'Banerjee', 'Mukherjee', 'Das', 'Kapoor', 'Malhotra', 'Agarwal', 'Jain', 'Thakur', 'Sawant', 'Kamat', 'Fernandes', "D'Souza", 'Khan', 'Shaikh', 'Ansari', 'Bhatt', 'Trivedi', 'Desai', 'Kadam', 'Salunkhe', 'Gokhale', 'Apte', 'Ranade'];

// Faculty per department. The first entry is the Head of Department.
const FACULTY = {
  'dept-it': [
    ['Dr. Kavita Rao', 'F', 'Head of Department', 'PhD (Computer Science)'],
    ['Prof. Rajesh Mehta', 'M', 'Associate Professor', 'M.Tech (Software Systems)'],
    ['Prof. Neha Gupta', 'F', 'Assistant Professor', 'MCA, NET'],
    ['Prof. Sameer Kulkarni', 'M', 'Assistant Professor', 'M.Sc IT'],
    ['Prof. Pooja Nair', 'F', 'Assistant Professor', 'M.E. (Computer)'],
    ['Prof. Imran Shaikh', 'M', 'Visiting Faculty', 'M.Tech (Networks)'],
  ],
  'dept-cs': [
    ['Dr. Anil Deshpande', 'M', 'Head of Department', 'PhD (Data Science)'],
    ['Prof. Sunita Verma', 'F', 'Associate Professor', 'MCA, SET'],
    ['Prof. Arjun Patil', 'M', 'Assistant Professor', 'M.Sc CS'],
    ['Prof. Ritu Bansal', 'F', 'Assistant Professor', 'M.Tech (CSE)'],
    ['Prof. Karan Malhotra', 'M', 'Assistant Professor', 'MCA'],
  ],
  'dept-com': [
    ['Dr. Meera Iyer', 'F', 'Head of Department', 'PhD (Accountancy)'],
    ['Prof. Vivek Agarwal', 'M', 'Professor', 'M.Com, CA'],
    ['Prof. Shalini Saxena', 'F', 'Assistant Professor', 'M.Com, LLB'],
    ['Prof. Nikhil Jain', 'M', 'Assistant Professor', 'M.Com, NET'],
  ],
  'dept-mgt': [
    ['Dr. Sanjay Kapoor', 'M', 'Head of Department', 'PhD (Management)'],
    ['Prof. Ayesha Khan', 'F', 'Assistant Professor', 'MBA (HR)'],
  ],
  'dept-arts': [
    ['Dr. Farah Siddiqui', 'F', 'Head of Department', 'PhD (English Literature)'],
    ['Prof. Manoj Tiwari', 'M', 'Associate Professor', 'MA (History)'],
  ],
  'dept-sci': [
    ['Dr. Ramesh Pillai', 'M', 'Head of Department', 'PhD (Physics)'],
    ['Prof. Deepa Menon', 'F', 'Assistant Professor', 'M.Sc (Chemistry)'],
  ],
};

// [name, weekly lectures, faculty index within department]
const SUBJECTS = {
  'dept-it': {
    5: [['Web Development', 5, 1], ['Database Management Systems', 5, 2], ['Python Programming', 4, 3], ['Operating Systems', 4, 4], ['Computer Networks', 4, 5]],
    3: [['Data Structures', 5, 0], ['Software Engineering', 5, 1], ['Java Programming', 4, 3], ['Applied Mathematics', 4, 0], ['Computer Graphics', 4, 5]],
    1: [['Programming in C', 5, 2], ['Digital Electronics', 5, 4], ['Communication Skills', 4, 0], ['Discrete Mathematics', 4, 3], ['Fundamentals of IT', 4, 5]],
  },
  'dept-cs': {
    1: [['Computer Fundamentals', 5, 0], ['C Programming', 5, 2], ['Mathematics I', 4, 1], ['Business Communication', 4, 3], ['Office Automation', 4, 4]],
    3: [['Data Structures using C++', 5, 2], ['Object Oriented Programming', 5, 4], ['Database Systems', 4, 1], ['Operating Systems', 4, 3], ['Statistics', 4, 0]],
    5: [['Java Programming', 5, 3], ['Software Engineering', 5, 1], ['Computer Networks', 4, 0], ['Web Technologies', 4, 2], ['Cloud Computing', 4, 4]],
  },
  'dept-com': {
    3: [['Corporate Accounting', 5, 1], ['Business Law', 5, 2], ['Business Economics', 4, 3], ['Income Tax', 4, 0], ['Marketing Management', 4, 2]],
    5: [['Cost Accounting', 5, 1], ['Auditing', 5, 0], ['Financial Management', 4, 3], ['Banking & Insurance', 4, 2], ['E-Commerce', 4, 3]],
  },
  'dept-mgt': {
    3: [['Organizational Behaviour', 5, 0], ['Business Statistics', 5, 1], ['Human Resource Management', 4, 0], ['Consumer Behaviour', 4, 1], ['Business Research Methods', 4, 0]],
  },
  'dept-arts': {
    1: [['English Literature', 5, 0], ['Indian History', 5, 1], ['Political Science', 4, 1], ['Sociology', 4, 0], ['Psychology', 4, 0]],
  },
  'dept-sci': {
    3: [['Mechanics', 5, 0], ['Organic Chemistry', 5, 1], ['Calculus', 4, 0], ['Environmental Science', 4, 1], ['Computational Methods', 4, 0]],
  },
};

// [department, semester, division, room, size]
const CLASSES = [
  ['dept-it', 1, 'A', 'A-101', 22],
  ['dept-it', 3, 'A', 'A-203', 21],
  ['dept-it', 5, 'A', 'A-301', 24],
  ['dept-it', 5, 'B', 'A-302', 22],
  ['dept-cs', 1, 'A', 'A-104', 21],
  ['dept-cs', 3, 'A', 'A-205', 20],
  ['dept-cs', 5, 'A', 'A-305', 21],
  ['dept-com', 3, 'A', 'C-201', 24],
  ['dept-com', 5, 'A', 'C-301', 23],
  ['dept-mgt', 3, 'A', 'D-202', 20],
  ['dept-arts', 1, 'A', 'B-102', 19],
  ['dept-sci', 3, 'A', 'E-204', 18],
];

// Named demo students placed in specific classes, with hand-tuned attendance.
const FEATURED = [
  { name: 'Priya Patil', gender: 'Female', cls: 'dept-it-5A', demo: true, base: 0.9, subj: { 'Web Development': 0.95, 'Database Management Systems': 0.85, 'Python Programming': 0.92, 'Operating Systems': 0.81, 'Computer Networks': 0.89 } },
  { name: 'Rahul Sharma', gender: 'Male', cls: 'dept-it-5A', base: 0.78, subj: { 'Database Management Systems': 0.64, 'Operating Systems': 0.7 } },
  { name: 'Aarav Mehta', gender: 'Male', cls: 'dept-it-5A', base: 0.93 },
  { name: 'Ananya Deshmukh', gender: 'Female', cls: 'dept-it-5A', base: 0.96 },
  { name: 'Rohan Sharma', gender: 'Male', cls: 'dept-it-5B', base: 0.71 },
  { name: 'Sneha Joshi', gender: 'Female', cls: 'dept-it-5B', base: 0.91 },
  { name: 'Aditya Kulkarni', gender: 'Male', cls: 'dept-cs-5A', base: 0.86 },
  { name: 'Rahul Shah', gender: 'Male', cls: 'dept-cs-5A', base: 0.69 },
];

const HOLIDAYS = ['08-15', '10-02']; // Independence Day, Gandhi Jayanti
const TERM_DAYS = 70;

const pad = (n, w = 2) => String(n).padStart(w, '0');

function academicYear() {
  const d = new Date();
  return d.getMonth() >= 5 ? d.getFullYear() : d.getFullYear() - 1;
}

export function generateSeed() {
  const rnd = mulberry32(20241108);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const between = (a, b) => a + rnd() * (b - a);
  const phone = () => pick(['98', '97', '96', '91', '88', '87', '70', '77']) + String(Math.floor(rnd() * 1e8)).padStart(8, '0');
  const now = Date.now();
  const today = todayISO();
  const termStart = addDays(today, -TERM_DAYS);
  const acadYear = academicYear();

  // ---------- Departments & Faculty ----------
  const faculty = [];
  const facultyIndex = {}; // deptId -> [facultyId]
  let fseq = 101;
  for (const dept of DEPARTMENTS) {
    facultyIndex[dept.id] = [];
    for (const [name, g, designation, qualification] of FACULTY[dept.id]) {
      const id = `FAC${fseq++}`;
      const handle = name.replace(/^(Dr|Prof)\.\s*/, '').toLowerCase().replace(/[^a-z ]/g, '').split(' ');
      faculty.push({
        id,
        name,
        gender: g === 'F' ? 'Female' : 'Male',
        department: dept.name,
        designation,
        qualification,
        email: `${handle[0]}.${handle[handle.length - 1]}@attendease.com`,
        phone: phone(),
        experience: Math.round(between(4, 22)),
        joined: `${2026 - Math.round(between(2, 16))}-0${1 + Math.floor(rnd() * 8)}-1${Math.floor(rnd() * 9)}`,
        status: 'Active',
        createdAt: now,
      });
      facultyIndex[dept.id].push(id);
    }
  }
  // Demo faculty uses the login email
  const mehta = faculty.find((f) => f.name === 'Prof. Rajesh Mehta');
  mehta.email = 'faculty@attendease.com';

  const departments = DEPARTMENTS.map((d) => ({
    ...d,
    hodId: facultyIndex[d.id][0],
    description: `Department of ${d.name} offering the ${d.course} undergraduate programme.`,
  }));
  const deptById = Object.fromEntries(departments.map((d) => [d.id, d]));

  // ---------- Subjects ----------
  const subjects = [];
  for (const deptId of Object.keys(SUBJECTS)) {
    const dept = deptById[deptId];
    for (const sem of Object.keys(SUBJECTS[deptId])) {
      SUBJECTS[deptId][sem].forEach(([name, weekly, fIdx], i) => {
        subjects.push({
          id: `SUB-${dept.code}${sem}0${i + 1}`,
          code: `${dept.code}${sem}0${i + 1}`,
          name,
          department: dept.name,
          course: dept.course,
          semester: Number(sem),
          facultyId: facultyIndex[deptId][fIdx],
          weeklyLectures: weekly,
          credits: weekly >= 5 ? 4 : 3,
          type: /Programming|Web|Python|Java|C\+\+|Database|Computational|Office/.test(name) ? 'Theory + Lab' : 'Theory',
          status: 'Active',
          createdAt: now,
        });
      });
    }
  }

  // ---------- Classes ----------
  const classes = CLASSES.map(([deptId, sem, div, room, size]) => {
    const dept = deptById[deptId];
    const teachers = facultyIndex[deptId];
    return {
      id: `${deptId}-${sem}${div}`,
      course: dept.course,
      department: dept.name,
      semester: sem,
      division: div,
      room,
      capacity: 60,
      size,
      classTeacherId: teachers[(sem + div.charCodeAt(0)) % teachers.length],
      academicYear: `${acadYear}–${String(acadYear + 1).slice(2)}`,
      createdAt: now,
    };
  });

  // ---------- Timetable (greedy, avoids faculty clashes) ----------
  const timetable = [];
  const busy = new Set();
  for (const cls of classes) {
    const subs = subjects.filter((s) => s.course === cls.course && s.semester === cls.semester);
    const remaining = Object.fromEntries(subs.map((s) => [s.id, s.weeklyLectures]));
    const taken = new Set();
    const perDay = {};
    const place = (s, day, slot) => {
      remaining[s.id]--;
      perDay[`${s.id}-${day}`] = (perDay[`${s.id}-${day}`] || 0) + 1;
      busy.add(`${s.facultyId}-${day}-${slot}`);
      taken.add(`${day}-${slot}`);
      timetable.push({
        id: `${cls.id}-${day}-${slot}`,
        classId: cls.id,
        day,
        slot,
        subjectId: s.id,
        room: s.type === 'Theory + Lab' && slot >= 3 ? `Computer Lab ${1 + (day % 3)}` : cls.room,
      });
    };
    const free = (s, day, slot) => remaining[s.id] > 0 && !busy.has(`${s.facultyId}-${day}-${slot}`) && (perDay[`${s.id}-${day}`] || 0) < 2;
    // Main pass: four lectures Mon–Fri, two on Saturday
    for (let day = 1; day <= 6; day++) {
      for (const slot of day === 6 ? [1, 2] : [1, 2, 3, 4]) {
        const s = subs
          .filter((x) => free(x, day, slot))
          .sort((a, b) => remaining[b.id] - remaining[a.id] || rnd() - 0.5)[0];
        if (s) place(s, day, slot);
      }
    }
    // Leftover pass: fit remaining lectures into any open slot (incl. lecture 5)
    for (const s of subs) {
      for (let day = 1; day <= 5 && remaining[s.id] > 0; day++) {
        for (const slot of [1, 2, 3, 4, 5]) {
          if (remaining[s.id] > 0 && !taken.has(`${day}-${slot}`) && free(s, day, slot)) place(s, day, slot);
        }
      }
    }
  }

  // ---------- Students ----------
  const students = [];
  const profiles = {}; // studentId -> attendance behaviour
  const usedNames = new Set(FEATURED.map((f) => f.name));
  let seq = 1;
  for (const cls of classes) {
    const dept = departments.find((d) => d.name === cls.department);
    const admissionYear = acadYear - Math.floor((cls.semester - 1) / 2);
    const featured = FEATURED.filter((f) => f.cls === cls.id);
    const roster = featured.map((f) => ({ name: f.name, gender: f.gender, featured: f }));
    while (roster.length < cls.size) {
      const female = rnd() < 0.5;
      const name = `${pick(female ? FEMALE : MALE)} ${pick(LAST)}`;
      if (usedNames.has(name)) continue;
      usedNames.add(name);
      roster.push({ name, gender: female ? 'Female' : 'Male' });
    }
    roster.sort((a, b) => a.name.localeCompare(b.name));
    roster.forEach((r, i) => {
      const id = `STU${admissionYear}${pad(seq++, 3)}`;
      const [first, ...rest] = r.name.toLowerCase().replace(/[^a-z ]/g, '').split(' ');
      const birthYear = admissionYear - 18 + (rnd() < 0.3 ? -1 : 0);
      students.push({
        id,
        name: r.name,
        rollNo: `${dept.code}${cls.semester}${cls.division}-${pad(i + 1)}`,
        email: r.featured?.demo ? 'student@attendease.com' : `${first}.${rest.join('')}${pad(seq % 100)}@students.attendease.com`,
        phone: phone(),
        gender: r.gender,
        dob: `${birthYear}-${pad(1 + Math.floor(rnd() * 12))}-${pad(1 + Math.floor(rnd() * 28))}`,
        course: cls.course,
        department: cls.department,
        semester: cls.semester,
        division: cls.division,
        classId: cls.id,
        admissionYear,
        guardian: `${pick(MALE)} ${r.name.split(' ').slice(-1)[0]}`,
        address: pick(['Kothrud', 'Aundh', 'Baner', 'Hadapsar', 'Viman Nagar', 'Shivajinagar', 'Pimpri', 'Wakad', 'Karve Nagar', 'Deccan']) + ', Pune',
        status: 'Active',
        createdAt: now - Math.floor(rnd() * 90) * 86400000,
      });
      let base;
      if (r.featured) base = r.featured.base;
      else {
        const u = rnd();
        base = u < 0.07 ? between(0.56, 0.72) : u < 0.24 ? between(0.72, 0.83) : between(0.83, 0.98);
      }
      profiles[id] = { base, subj: r.featured?.subj || {}, mod: {} };
    });
  }

  // ---------- Attendance sessions ----------
  const subjectById = Object.fromEntries(subjects.map((s) => [s.id, s]));
  const facultyById = Object.fromEntries(faculty.map((f) => [f.id, f]));
  const studentsByClass = {};
  for (const s of students) (studentsByClass[s.classId] ||= []).push(s.id);
  const ttByClassDay = {};
  for (const t of timetable) (ttByClassDay[`${t.classId}-${t.day}`] ||= []).push(t);

  const sessions = [];
  for (let d = termStart; d <= today; d = addDays(d, 1)) {
    const wd = weekdayOf(d);
    if (wd === 0 || HOLIDAYS.includes(d.slice(5))) continue;
    for (const cls of classes) {
      const lectures = (ttByClassDay[`${cls.id}-${wd}`] || []).filter((t) => d < today || t.slot === 1);
      for (const t of lectures) {
        const sub = subjectById[t.subjectId];
        const records = {};
        for (const sid of studentsByClass[cls.id]) {
          const pr = profiles[sid];
          let p = pr.subj[sub.name];
          if (p == null) {
            if (pr.mod[sub.id] == null) pr.mod[sub.id] = between(-0.06, 0.05);
            p = pr.base + pr.mod[sub.id];
          }
          if (wd === 6) p -= 0.03;
          const r = rnd();
          records[sid] = r < p ? 'P' : 'A';
        }
        const slot = LECTURE_SLOTS.find((s) => s.id === t.slot);
        const [h, m] = slot.end.split(':').map(Number);
        const markedAt = new Date(`${d}T00:00:00`);
        markedAt.setHours(h, m + Math.floor(rnd() * 20));
        sessions.push({
          id: `${cls.id}_${d}_${t.slot}`,
          date: d,
          slot: t.slot,
          classId: cls.id,
          subjectId: sub.id,
          facultyId: sub.facultyId,
          records,
          markedBy: facultyById[sub.facultyId].name,
          markedAt: markedAt.getTime(),
        });
      }
    }
  }

  // A handful of realistic corrections, so edit history is visible from the start
  const recent = sessions.filter((s) => s.date >= addDays(today, -6) && s.date < today);
  for (let i = 0; i < 8 && recent.length; i++) {
    const s = recent[Math.floor(rnd() * recent.length)];
    const absentees = Object.keys(s.records).filter((k) => s.records[k] === 'A');
    if (!absentees.length) continue;
    const sid = absentees[0];
    const to = 'P';
    const by = s.markedBy;
    const at = s.markedAt + (30 + Math.floor(rnd() * 600)) * 60000;
    s.records[sid] = to;
    s.edits = { ...(s.edits || {}), [sid]: { from: 'A', to, by, at, reason: rnd() < 0.5 ? 'Marked absent by mistake' : 'Present in lab, roll call missed' } };
    s.updatedBy = by;
    s.updatedAt = at;
  }

  // ---------- Users ----------
  const priya = students.find((s) => s.name === 'Priya Patil');
  const users = [
    { id: 'u-admin', email: 'admin@attendease.com', password: 'admin123', role: 'admin', name: 'Dr. Vikram Desai', title: 'Principal & System Administrator', phone: '9820012345', avatar: null },
    { id: 'u-faculty', email: 'faculty@attendease.com', password: 'faculty123', role: 'faculty', name: mehta.name, title: `${mehta.designation}, Information Technology`, phone: mehta.phone, avatar: null, linkedId: mehta.id },
    { id: 'u-student', email: 'student@attendease.com', password: 'student123', role: 'student', name: priya.name, title: `${priya.course} · Semester ${priya.semester} · Div ${priya.division}`, phone: priya.phone, avatar: null, linkedId: priya.id },
  ];

  // ---------- Notifications ----------
  const H = 3600000;
  const notifications = [
    { id: 'n1', type: 'attendance', title: 'Attendance successfully marked', message: 'Web Development · BSc IT Sem 5 Div A — 22 of 24 students present.', time: now - 0.4 * H, read: false, audience: ['admin', 'faculty'] },
    { id: 'n2', type: 'alert', title: 'Low attendance warning', message: '12 students in BSc IT have attendance below 75% this month.', time: now - 1.5 * H, read: false, audience: ['admin', 'faculty'] },
    { id: 'n3', type: 'alert', title: 'Your attendance in Operating Systems is close to 75%', message: 'Attend the next few lectures to stay above the minimum requirement.', time: now - 2 * H, read: false, audience: ['student'] },
    { id: 'n4', type: 'update', title: 'Attendance updated', message: 'Prof. Rajesh Mehta changed Rahul Sharma from Absent to Present in Web Development.', time: now - 5 * H, read: false, audience: ['admin', 'faculty'] },
    { id: 'n5', type: 'schedule', title: 'Timetable updated', message: 'Saturday lectures for Semester 5 now start at 9:00 AM.', time: now - 9 * H, read: true, audience: ['admin', 'faculty', 'student'] },
    { id: 'n6', type: 'schedule', title: 'New class assigned', message: 'You have been assigned Software Engineering for BSc IT Semester 3 Div A.', time: now - 26 * H, read: false, audience: ['faculty'] },
    { id: 'n7', type: 'report', title: 'Report generated', message: 'Monthly attendance report for September is ready to download.', time: now - 30 * H, read: true, audience: ['admin'] },
    { id: 'n8', type: 'attendance', title: 'Attendance recorded', message: 'You were marked Present in Python Programming.', time: now - 28 * H, read: true, audience: ['student'] },
    { id: 'n9', type: 'system', title: 'Scheduled maintenance', message: 'AttendEase will be unavailable on Sunday 1:00 – 2:00 AM for upgrades.', time: now - 50 * H, read: true, audience: ['admin', 'faculty', 'student'] },
    { id: 'n10', type: 'system', title: 'New semester configured', message: `Academic year ${acadYear}–${String(acadYear + 1).slice(2)} odd semester is now active.`, time: now - 120 * H, read: true, audience: ['admin'] },
  ];

  const settings = {
    threshold: 75,
    workingDays: [1, 2, 3, 4, 5, 6],
    notifyLowAttendance: true,
    notifyUpdates: true,
    notifySystem: true,
    termStart,
  };

  return { departments, faculty, subjects, classes, timetable, students, sessions, users, notifications, settings };
}
