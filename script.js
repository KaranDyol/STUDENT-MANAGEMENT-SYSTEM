// Data stores
let students = [];
let events = [];
let attendance = []; // { date, studentId, status }
let fees = [];       // { studentId, total, paid, status, remarks }
let marks = [];      // { studentId, subject, exam, obtained, total }

let editingStudentId = null;
let editingEventId = null;

// Section switching
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.dataset.target;
    document.querySelectorAll(".section").forEach(sec => {
      sec.classList.toggle("active", sec.id === target);
    });
  });
});

// Filter chips (visual only)
document.querySelectorAll(".toggle-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".toggle-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
  });
});

// Helper: find student by ID
function findStudentById(id) {
  return students.find(s => s.id.toLowerCase() === id.toLowerCase());
}

// Update stats
function updateStats() {
  document.getElementById("statTotalStudents").textContent = students.length;
  const today = document.getElementById("attendanceDate").value || new Date().toISOString().slice(0, 10);
  const todayRecords = attendance.filter(a => a.date === today);
  if (!todayRecords.length) {
    document.getElementById("statAttendanceToday").textContent = "0%";
    return;
  }
  const present = todayRecords.filter(a => a.status === "Present").length;
  const percent = Math.round((present / todayRecords.length) * 100);
  document.getElementById("statAttendanceToday").textContent = percent + "%";
}

// Render students
function renderStudents() {
  const tbody = document.getElementById("studentsTbody");
  const search = document.getElementById("studentSearch").value.toLowerCase();
  tbody.innerHTML = "";
  students
    .filter(st => {
      return (
        st.id.toLowerCase().includes(search) ||
        st.name.toLowerCase().includes(search) ||
        st.className.toLowerCase().includes(search)
      );
    })
    .forEach(st => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${st.id}</td>
        <td>${st.name}</td>
        <td>${st.className}</td>
        <td>${st.phone || "-"}</td>
        <td>
          <span class="badge ${st.status === "Active" ? "success" : "danger"}">${st.status}</span>
        </td>
        <td>
          <div class="table-actions">
            <button class="icon-btn" data-id="${st.id}" data-action="edit">✎ Edit</button>
            <button class="icon-btn danger" data-id="${st.id}" data-action="delete">🗑 Del</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  updateStats();
  renderFees();
  renderMarks();
  renderAttendanceStudents();
}

// Student form handlers
document.getElementById("studentForm").addEventListener("submit", e => {
  e.preventDefault();
  const id = document.getElementById("studentId").value.trim();
  const name = document.getElementById("studentName").value.trim();
  const className = document.getElementById("studentClass").value;
  const phone = document.getElementById("studentPhone").value.trim();
  const email = document.getElementById("studentEmail").value.trim();
  const status = document.getElementById("studentStatus").value;
  const notes = document.getElementById("studentNotes").value.trim();

  if (!id || !name || !className) return;

  if (editingStudentId && editingStudentId.toLowerCase() === id.toLowerCase()) {
    const st = findStudentById(editingStudentId);
    if (st) {
      st.name = name;
      st.className = className;
      st.phone = phone;
      st.email = email;
      st.status = status;
      st.notes = notes;
    }
  } else {
    if (findStudentById(id)) {
      alert("Student ID already exists. Use another ID or edit existing.");
      return;
    }
    students.push({ id, name, className, phone, email, status, notes });
  }

  editingStudentId = null;
  document.getElementById("studentFormMode").textContent = "Mode: Add new";
  document.getElementById("studentDeleteBtn").style.display = "none";
  e.target.reset();
  renderStudents();
});

document.getElementById("studentResetBtn").addEventListener("click", () => {
  editingStudentId = null;
  document.getElementById("studentFormMode").textContent = "Mode: Add new";
  document.getElementById("studentDeleteBtn").style.display = "none";
  document.getElementById("studentForm").reset();
});

document.getElementById("btnAddStudent").addEventListener("click", () => {
  document.getElementById("studentsSection").scrollIntoView({ behavior: "smooth" });
  document.getElementById("studentId").focus();
});

document.getElementById("studentDeleteBtn").addEventListener("click", () => {
  if (!editingStudentId) return;
  if (!confirm("Delete this student and related records?")) return;
  students = students.filter(s => s.id !== editingStudentId);
  attendance = attendance.filter(a => a.studentId !== editingStudentId);
  fees = fees.filter(f => f.studentId !== editingStudentId);
  marks = marks.filter(m => m.studentId !== editingStudentId);
  editingStudentId = null;
  document.getElementById("studentFormMode").textContent = "Mode: Add new";
  document.getElementById("studentDeleteBtn").style.display = "none";
  document.getElementById("studentForm").reset();
  renderStudents();
  renderAttendance();
  renderFees();
  renderMarks();
});

document.getElementById("studentSearch").addEventListener("input", renderStudents);

document.getElementById("studentsTbody").addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (action === "edit") {
    const st = findStudentById(id);
    if (!st) return;
    editingStudentId = st.id;
    document.getElementById("studentId").value = st.id;
    document.getElementById("studentName").value = st.name;
    document.getElementById("studentClass").value = st.className;
    document.getElementById("studentPhone").value = st.phone || "";
    document.getElementById("studentEmail").value = st.email || "";
    document.getElementById("studentStatus").value = st.status;
    document.getElementById("studentNotes").value = st.notes || "";
    document.getElementById("studentFormMode").textContent = "Mode: Edit (" + st.id + ")";
    document.getElementById("studentDeleteBtn").style.display = "inline-flex";
    document.getElementById("studentsSection").scrollIntoView({ behavior: "smooth" });
  } else if (action === "delete") {
    if (!confirm("Delete this student and related records?")) return;
    students = students.filter(s => s.id !== id);
    attendance = attendance.filter(a => a.studentId !== id);
    fees = fees.filter(f => f.studentId !== id);
    marks = marks.filter(m => m.studentId !== id);
    renderStudents();
    renderAttendance();
    renderFees();
    renderMarks();
  }
});

// Events
function renderEvents() {
  const tbody = document.getElementById("eventsTbody");
  const search = document.getElementById("eventSearch").value.toLowerCase();
  tbody.innerHTML = "";
  events
    .filter(ev => {
      return (
        ev.id.toLowerCase().includes(search) ||
        ev.title.toLowerCase().includes(search) ||
        (ev.date || "").includes(search)
      );
    })
    .forEach(ev => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${ev.id}</td>
        <td>${ev.title}</td>
        <td>${ev.date || "-"}</td>
        <td>${ev.venue || "-"}</td>
        <td>
          <div class="table-actions">
            <button class="icon-btn" data-id="${ev.id}" data-action="edit">✎ Edit</button>
            <button class="icon-btn danger" data-id="${ev.id}" data-action="delete">🗑 Del</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
}

document.getElementById("eventForm").addEventListener("submit", e => {
  e.preventDefault();
  const id = document.getElementById("eventId").value.trim();
  const title = document.getElementById("eventTitle").value.trim();
  const date = document.getElementById("eventDate").value;
  const venue = document.getElementById("eventVenue").value.trim();
  const description = document.getElementById("eventDescription").value.trim();
  if (!id || !title) return;

  if (editingEventId && editingEventId.toLowerCase() === id.toLowerCase()) {
    const ev = events.find(ev => ev.id === editingEventId);
    if (ev) {
      ev.title = title;
      ev.date = date;
      ev.venue = venue;
      ev.description = description;
    }
  } else {
    const existing = events.find(ev => ev.id.toLowerCase() === id.toLowerCase());
    if (existing) {
      alert("Event ID already exists.");
      return;
    }
    events.push({ id, title, date, venue, description });
  }

  editingEventId = null;
  document.getElementById("eventFormMode").textContent = "Mode: Add new";
  document.getElementById("eventDeleteBtn").style.display = "none";
  e.target.reset();
  renderEvents();
});

document.getElementById("eventsTbody").addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (action === "edit") {
    const ev = events.find(ev => ev.id === id);
    if (!ev) return;
    editingEventId = ev.id;
    document.getElementById("eventId").value = ev.id;
    document.getElementById("eventTitle").value = ev.title;
    document.getElementById("eventDate").value = ev.date || "";
    document.getElementById("eventVenue").value = ev.venue || "";
    document.getElementById("eventDescription").value = ev.description || "";
    document.getElementById("eventFormMode").textContent = "Mode: Edit (" + ev.id + ")";
    document.getElementById("eventDeleteBtn").style.display = "inline-flex";
  } else if (action === "delete") {
    if (!confirm("Delete this event?")) return;
    events = events.filter(ev => ev.id !== id);
    renderEvents();
  }
});

document.getElementById("eventSearch").addEventListener("input", renderEvents);

document.getElementById("eventResetBtn").addEventListener("click", () => {
  editingEventId = null;
  document.getElementById("eventFormMode").textContent = "Mode: Add new";
  document.getElementById("eventDeleteBtn").style.display = "none";
  document.getElementById("eventForm").reset();
});

document.getElementById("btnAddEvent").addEventListener("click", () => {
  document.getElementById("eventsSection").scrollIntoView({ behavior: "smooth" });
  document.getElementById("eventId").focus();
});

document.getElementById("eventDeleteBtn").addEventListener("click", () => {
  if (!editingEventId) return;
  if (!confirm("Delete this event?")) return;
  events = events.filter(ev => ev.id !== editingEventId);
  editingEventId = null;
  document.getElementById("eventFormMode").textContent = "Mode: Add new";
  document.getElementById("eventDeleteBtn").style.display = "none";
  document.getElementById("eventForm").reset();
  renderEvents();
});

function quickEventTag(tag) {
  const desc = document.getElementById("eventDescription");
  desc.value = desc.value ? desc.value + " [" + tag + "]" : "[" + tag + "]";
  desc.focus();
}

// Attendance
function renderAttendanceStudents() {
  const tbody = document.getElementById("attendanceStudentsTbody");
  const selectedClass = document.getElementById("attendanceClass").value;
  tbody.innerHTML = "";
  students
    .filter(st => !selectedClass || st.className === selectedClass)
    .forEach(st => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${st.id}</td>
        <td>${st.name}</td>
        <td>${st.className}</td>
        <td>
          <select data-id="${st.id}" class="attendance-status">
            <option value="">--</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Leave">Leave</option>
          </select>
        </td>
      `;
      tbody.appendChild(tr);
    });
}

function renderAttendance() {
  const tbody = document.getElementById("attendanceTbody");
  tbody.innerHTML = "";
  attendance.forEach(rec => {
    const st = findStudentById(rec.studentId);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${rec.date}</td>
      <td>${rec.studentId}</td>
      <td>${st ? st.name : "-"}</td>
      <td>${st ? st.className : "-"}</td>
      <td>
        <span class="badge ${
          rec.status === "Present"
            ? "success"
            : rec.status === "Absent"
            ? "danger"
            : "warning"
        }">${rec.status}</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
  updateStats();
}

document.getElementById("attendanceClass").addEventListener("change", renderAttendanceStudents);

document.getElementById("btnMarkAttendance").addEventListener("click", () => {
  document.getElementById("attendanceSection").scrollIntoView({ behavior: "smooth" });
  if (!document.getElementById("attendanceDate").value) {
    document.getElementById("attendanceDate").value = new Date().toISOString().slice(0, 10);
  }
});

document.getElementById("attendanceSaveBtn").addEventListener("click", () => {
  const date = document.getElementById("attendanceDate").value || new Date().toISOString().slice(0, 10);
  document.getElementById("attendanceDate").value = date;
  document.querySelectorAll(".attendance-status").forEach(sel => {
    const status = sel.value;
    if (!status) return;
    const studentId = sel.dataset.id;
    const existing = attendance.find(a => a.date === date && a.studentId === studentId);
    if (existing) {
      existing.status = status;
    } else {
      attendance.push({ date, studentId, status });
    }
  });
  alert("Attendance saved for " + date);
  renderAttendance();
});

document.getElementById("attendanceClearBtn").addEventListener("click", () => {
  document.querySelectorAll(".attendance-status").forEach(sel => (sel.value = ""));
});

// Fees
function renderFees() {
  const tbody = document.getElementById("feesTbody");
  const search = document.getElementById("feeSearch").value.toLowerCase();
  tbody.innerHTML = "";
  fees
    .filter(f => {
      const st = findStudentById(f.studentId);
      const name = st ? st.name.toLowerCase() : "";
      return (
        f.studentId.toLowerCase().includes(search) ||
        name.includes(search) ||
        f.status.toLowerCase().includes(search)
      );
    })
    .forEach(f => {
      const st = findStudentById(f.studentId);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${f.studentId}</td>
        <td>${st ? st.name : "-"}</td>
        <td>${st ? st.className : "-"}</td>
        <td>${f.total || 0}</td>
        <td>${f.paid || 0}</td>
        <td>
          <span class="badge ${
            f.status === "Paid"
              ? "success"
              : f.status === "Pending"
              ? "danger"
              : "warning"
          }">${f.status}</span>
        </td>
      `;
      tbody.appendChild(tr);
    });
}

document.getElementById("feeForm").addEventListener("submit", e => {
  e.preventDefault();
  const studentId = document.getElementById("feeStudentId").value.trim();
  const st = findStudentById(studentId);
  if (!st) {
    alert("Student not found. Please add the student first.");
    return;
  }
  const total = parseFloat(document.getElementById("feeTotal").value || "0");
  const paid = parseFloat(document.getElementById("feePaid").value || "0");
  const status = document.getElementById("feeStatus").value;
  const remarks = document.getElementById("feeRemarks").value.trim();

  const existing = fees.find(f => f.studentId.toLowerCase() === studentId.toLowerCase());
  if (existing) {
    existing.total = total;
    existing.paid = paid;
    existing.status = status;
    existing.remarks = remarks;
  } else {
    fees.push({ studentId, total, paid, status, remarks });
  }
  renderFees();
  alert("Fee record saved / updated.");
});

document.getElementById("feeResetBtn").addEventListener("click", () => {
  document.getElementById("feeForm").reset();
});

document.getElementById("feeSearch").addEventListener("input", renderFees);

// Marks
function renderMarks() {
  const tbody = document.getElementById("marksTbody");
  const search = document.getElementById("marksSearch").value.toLowerCase();
  tbody.innerHTML = "";
  marks
    .filter(m => {
      const st = findStudentById(m.studentId);
      const name = st ? st.name.toLowerCase() : "";
      return (
        m.studentId.toLowerCase().includes(search) ||
        name.includes(search) ||
        m.subject.toLowerCase().includes(search)
      );
    })
    .forEach(m => {
      const st = findStudentById(m.studentId);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.studentId}</td>
        <td>${st ? st.name : "-"}</td>
        <td>${st ? st.className : "-"}</td>
        <td>${m.subject}</td>
        <td>${m.exam}</td>
        <td>${m.obtained}</td>
        <td>${m.total}</td>
      `;
      tbody.appendChild(tr);
    });
}

document.getElementById("marksForm").addEventListener("submit", e => {
  e.preventDefault();
  const studentId = document.getElementById("marksStudentId").value.trim();
  const st = findStudentById(studentId);
  if (!st) {
    alert("Student not found. Please add the student first.");
    return;
  }
  const subject = document.getElementById("marksSubject").value.trim();
  const exam = document.getElementById("marksExam").value.trim();
  const obtained = parseFloat(document.getElementById("marksObtained").value || "0");
  const total = parseFloat(document.getElementById("marksTotal").value || "0");

  const existing = marks.find(
    m =>
      m.studentId.toLowerCase() === studentId.toLowerCase() &&
      m.subject.toLowerCase() === subject.toLowerCase() &&
      m.exam.toLowerCase() === exam.toLowerCase()
  );
  if (existing) {
    existing.obtained = obtained;
    existing.total = total;
  } else {
    marks.push({ studentId, subject, exam, obtained, total });
  }
  renderMarks();
  alert("Marks saved / updated.");
});

document.getElementById("marksResetBtn").addEventListener("click", () => {
  document.getElementById("marksForm").reset();
});

document.getElementById("marksSearch").addEventListener("input", renderMarks);

// Excel export
function exportTableToExcel(tableId, filename) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
  XLSX.writeFile(wb, filename || "data.xlsx");
}

// Print view
function printTable(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const newWin = window.open("", "_blank");
  newWin.document.write(`
    <html>
    <head>
      <title>Print - ${tableId}</title>
      <style>
        table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; }
        th, td { border: 1px solid #000; padding: 6px; font-size: 12px; }
        th { background: #f3f4f6; }
      </style>
    </head>
    <body>
      ${table.outerHTML}
    </body>
    </html>
  `);
  newWin.document.close();
  newWin.focus();
  newWin.print();
}

// Make export/print global
window.exportTableToExcel = exportTableToExcel;
window.printTable = printTable;

/* SMART AI CHAT SECTION */

// Elements
const aiToggle = document.getElementById("aiChatToggle");
const aiBox = document.getElementById("aiChatbox");
const aiCloseBtn = document.getElementById("aiChatCloseBtn");
const aiBody = document.getElementById("aiChatBody");
const aiInput = document.getElementById("aiUserInput");
const aiSendBtn = document.getElementById("aiSendBtn");

// Open / close
aiToggle.addEventListener("click", () => {
  aiBox.classList.add("open");
  aiInput.focus();
  if (!aiBody.dataset.initialized) {
    aiBody.dataset.initialized = "1";
    addBotMessage(
      "Hi, I am SMART AI. You can ask anything about students, fees, attendance, events or marks in this website."
    );
    addBotMessage(
      "Examples: 'How to add a student?', 'Show fee status help', 'How to export to Excel?', 'How to mark attendance?'."
    );
  }
});

aiCloseBtn.addEventListener("click", () => {
  aiBox.classList.remove("open");
});

// Helpers to add messages
function addUserMessage(text) {
  if (!text.trim()) return;
  const div = document.createElement("div");
  div.className = "ai-msg user";
  div.textContent = text;
  aiBody.appendChild(div);
  aiBody.scrollTop = aiBody.scrollHeight;
}

function addBotMessage(text) {
  const div = document.createElement("div");
  div.className = "ai-msg bot";
  div.textContent = text;
  aiBody.appendChild(div);
  aiBody.scrollTop = aiBody.scrollHeight;
}

// Rule-based answers
function getAiAnswer(question) {
  const q = question.toLowerCase();

  if (q.includes("hello") || q.includes("hi")) {
    return "Hello! Ask anything about students, attendance, events, fees or marks in SMART CAMPUS HUB.";
  }
  if (q.includes("what can you do") || q.includes("help")) {
    return "I can guide you how to use each section: add/search/update/delete students, manage events, mark attendance, update fees and marks, and export or print tables.";
  }

  if (q.includes("add student")) {
    return "Go to the Students section, fill Student ID, Name, Class and other fields, then click Save. The student appears in the Student list table.";
  }
  if (q.includes("search student") || q.includes("find student")) {
    return "Use the search box in the Students section. You can search by name, ID or class to filter the student table.";
  }
  if (q.includes("delete student")) {
    return "In the Student list table, click Del next to the student, or click Edit then use the Delete student button in the form.";
  }

  if (q.includes("mark attendance") || q.includes("attendance")) {
    return "Open the Attendance section, choose a date and class, set Present/Absent/Leave for each student, then click Save attendance. You can see history in the Attendance log table.";
  }

  if (q.includes("fee") || q.includes("fees")) {
    return "In the Fees section, enter an existing Student ID, fill total fee, paid amount and status, then click Save / Update. All fee records are shown in the Fee records table and can be exported to Excel or printed.";
  }

  if (q.includes("mark sheet") || q.includes("marks")) {
    return "Go to the Marks section, enter Student ID, Subject, Exam name, Marks obtained and Total marks, then click Save / Update. Marks will show in the Marks sheet table.";
  }

  if (q.includes("excel") || q.includes("export")) {
    return "Every table has an 'Export to Excel' button that uses SheetJS to download the visible data as an .xlsx file.";
  }
  if (q.includes("print")) {
    return "Click the 'Print view' button above a table to open a clean printable page and use your browser's print dialog.";
  }

  if (q.includes("how many students") || q.includes("total students")) {
    return "Right now there are " + students.length + " students saved in this browser session.";
  }
  if (q.includes("today attendance") || q.includes("attendance today")) {
    return "Today’s attendance percentage shown in the sidebar is " +
      document.getElementById("statAttendanceToday").textContent + ".";
  }

  const matchId = q.match(/stu[0-9]+/i);
  if (matchId) {
    const st = findStudentById(matchId[0]);
    if (st) {
      return "Student " + st.id + " is " + st.name + " in " + st.className +
        " with status " + st.status + ". Phone: " + (st.phone || "not set") + ".";
    } else {
      return "I could not find any student with ID " + matchId[0] + " in the current data.";
    }
  }

  return "This is an on-page assistant, not a full internet AI. Try asking about how to use students, attendance, events, fees, marks, Excel export or print in this website.";
}

// Send handler
function handleAiSend() {
  const text = aiInput.value.trim();
  if (!text) return;
  addUserMessage(text);
  aiInput.value = "";
  setTimeout(() => {
    const answer = getAiAnswer(text);
    addBotMessage(answer);
  }, 300);
}

aiSendBtn.addEventListener("click", handleAiSend);
aiInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleAiSend();
  }
});

// Init
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("attendanceDate").value = new Date().toISOString().slice(0, 10);
  renderStudents();
  renderEvents();
  renderAttendanceStudents();
  renderAttendance();
  renderFees();
  renderMarks();
});
