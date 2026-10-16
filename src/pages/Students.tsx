import { useEffect, useState } from "react";
import { AlertTriangle, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Modal from "../components/common/Modal";
import PageHeader from "../components/common/PageHeader";
import { studentsApi } from "../api/management/students";
import { ApiError } from "../lib/api";
import type { Gender, Student, StudentInput } from "../types";
import { formatCurrency } from "../utils/constants";

const emptyForm: StudentInput = { studentName: "", age: 0, gender: "" as Gender, course: "" };

function normalizeGender(value: string): Gender {
  return value.trim().toUpperCase().startsWith("F") ? "F" : "M";
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<"ALL" | Gender>("ALL");
  const [modal, setModal] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [selected, setSelected] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [isLoadingStudent, setIsLoadingStudent] = useState(false);
  const [form, setForm] = useState<StudentInput>(emptyForm);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [pageError, setPageError] = useState("");

  const load = async () => {
    const response = await studentsApi.getAll();
    setStudents(Array.isArray(response) ? response : []);
    setPageError("");
  };

  useEffect(() => { load().catch((e: unknown) => setPageError(e instanceof Error ? e.message : String(e))); }, []);

  const filtered = students.filter((s) =>
    (gender === "ALL" || s.gender === gender) &&
    `${s.studentName} ${s.course} ${s.studentId}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setError("");
    setFieldErrors({});
    setSuccess("");
    setForm(emptyForm);
    setModal("add");
  };

  const openEdit = (student: Student) => {
    setError("");
    setFieldErrors({});
    setSuccess("");
    setSelected(student);
    setForm({
      studentName: student.studentName,
      age: student.age,
      gender: normalizeGender(student.gender),
      course: student.course,
    });
    setModal("edit");
  };

  const openView = async (studentId: number) => {
    setError("");
    setViewingStudent(null);
    setIsLoadingStudent(true);
    setModal("view");

    try {
      setViewingStudent(await studentsApi.getById(studentId));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoadingStudent(false);
    }
  };

  const saveStudent = async () => {
    try {
      setError("");
      setFieldErrors({});

      const action = modal === "add" ? "Added" : "Updated";
      if (modal === "add") await studentsApi.create(form);
      if (modal === "edit" && selected) await studentsApi.update(selected.studentId, form);

      await load();
      setModal(null);
      setSuccess(`Successfully ${action} student record.`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e));
      setFieldErrors(e instanceof ApiError ? e.fieldErrors ?? {} : {});
    }
  };

  const removeStudent = async () => {
    if (!selected) return;
    try {
      setError("");
      await studentsApi.remove(selected.studentId);
      await load();
      setModal(null);
      setSuccess("Successfully deleted student record.");
      setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const filterGender = async (value: "ALL" | Gender) => {
    setGender(value);
    if (value === "ALL") {
      await load();
    } else {
      const response = await studentsApi.getByGender(value);
      setStudents(Array.isArray(response) ? response : []);
    }
  };

  return (
    <>
      <PageHeader
        title="Student Management"
        description="Register, search, update, delete and manage student fines."
        action={<button className="primary-button" onClick={openAdd}><Plus size={18} /> Register Student</button>}
      />

      {pageError && <div className="error-message" role="alert">{pageError}</div>}
      <div className="toolbar student-toolbar">
        <div className="search-box student-search">
          <Search size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, ID or course..." />
        </div>
        <select className="student-gender-filter" value={gender} onChange={(e) => filterGender(e.target.value as "ALL" | Gender)}>
          <option value="ALL">All Genders</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
      </div>

      {success && <div className="success-message" role="status">{success}</div>}

      <div className="table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Student Name</th><th>Age</th><th>Gender</th><th>Course</th><th>Fine Amount</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={student.studentId}>
                  <td>#{student.studentId}</td>
                  <td className="strong">{student.studentName}</td>
                  <td>{student.age}</td>
                  <td><span className={`gender-badge ${student.gender === "M" ? "male" : "female"}`}>{student.gender}</span></td>
                  <td>{student.course}</td>
                  <td>{formatCurrency(student.fineAmount)}</td>
                  <td>
                    <div className="actions">
                      <button className="action-button" title="View Student" aria-label={`View ${student.studentName}`} onClick={() => openView(student.studentId)}><Eye size={16} /></button>
                      <button className="action-button" title="Edit" onClick={() => openEdit(student)}><Pencil size={16} /></button>
                      <button className="action-button danger" title="Delete" onClick={() => { setSelected(student); setError(""); setModal("delete"); }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="empty">No students found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal === "add" || modal === "edit"} title={modal === "add" ? "Register Student" : "Update Student"} onClose={() => setModal(null)}>
        <StudentForm form={form} setForm={setForm} error={error} fieldErrors={fieldErrors} onSave={saveStudent} onCancel={() => setModal(null)} />
      </Modal>

      <Modal open={modal === "view"} title="Student Details" onClose={() => setModal(null)}>
        {isLoadingStudent && <div className="loading">Loading student...</div>}
        {error && <div className="error-message">{error}</div>}
        {viewingStudent && !isLoadingStudent && (
          <div className="student-details">
            <div className="student-detail"><span>Student ID</span><b>:</b><strong>#{viewingStudent.studentId}</strong></div>
            <div className="student-detail"><span>Student Name</span><b>:</b><strong>{viewingStudent.studentName}</strong></div>
            <div className="student-detail"><span>Age</span><b>:</b><strong>{viewingStudent.age}</strong></div>
            <div className="student-detail"><span>Gender</span><b>:</b><strong>{viewingStudent.gender === "M" ? "Male" : "Female"}</strong></div>
            <div className="student-detail"><span>Course</span><b>:</b><strong>{viewingStudent.course}</strong></div>
            <div className="student-detail"><span>Total Fine</span><b>:</b><strong>{formatCurrency(viewingStudent.fineAmount)}</strong></div>
          </div>
        )}
        <div className="modal-footer">
          <button className="secondary-button" onClick={() => setModal(null)}>Close</button>
        </div>
      </Modal>

      <Modal open={modal === "delete"} title="Delete student record?" width="small" onClose={() => setModal(null)}>
        <div className="delete-confirmation">
          <div className="delete-confirmation-icon" aria-hidden="true"><AlertTriangle size={21} /></div>
          <div className="delete-confirmation-copy">
            <p>This will permanently remove <strong>{selected?.studentName}</strong> from the student records.</p>
            <span>This action cannot be undone.</span>
          </div>
        </div>
        {error && <div className="error-message" role="alert">{error}</div>}
        <div className="modal-footer delete-confirmation-footer">
          <button className="secondary-button" onClick={() => setModal(null)}>Cancel</button>
          <button className="danger-button" onClick={removeStudent}><Trash2 size={16} /> Delete record</button>
        </div>
      </Modal>

    </>
  );
}

function StudentForm({ form, setForm, error, fieldErrors, onSave, onCancel }: {
  form: StudentInput;
  setForm: React.Dispatch<React.SetStateAction<StudentInput>>;
  error: string;
  fieldErrors: Record<string, string>;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="form-grid">
        <div className="form-field full">
          <label>Student Name</label>
          <input className={fieldErrors.studentName ? "input-error" : ""} aria-invalid={Boolean(fieldErrors.studentName)} value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} />
          {fieldErrors.studentName && <span className="field-error">{fieldErrors.studentName}</span>}
        </div>
        <div className="form-field">
          <label>Age</label>
          <input className={fieldErrors.age ? "input-error" : ""} aria-invalid={Boolean(fieldErrors.age)} type="number" value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} />
          {fieldErrors.age && <span className="field-error">{fieldErrors.age}</span>}
        </div>
        <div className="form-field">
          <label>Gender</label>
          <select className={fieldErrors.gender ? "input-error" : ""} aria-invalid={Boolean(fieldErrors.gender)} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}>
            <option value="" disabled>Select gender</option>
            <option value="M">Male (M)</option>
            <option value="F">Female (F)</option>
          </select>
          {fieldErrors.gender && <span className="field-error">{fieldErrors.gender}</span>}
        </div>
        <div className="form-field full">
          <label>Course</label>
          <input className={fieldErrors.course ? "input-error" : ""} aria-invalid={Boolean(fieldErrors.course)} value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
          {fieldErrors.course && <span className="field-error">{fieldErrors.course}</span>}
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="modal-footer">
        <button className="secondary-button" onClick={onCancel}>Cancel</button>
        <button className="primary-button" onClick={onSave}>Save Student</button>
      </div>
    </>
  );
}
