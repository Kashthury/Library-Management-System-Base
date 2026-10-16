import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, CornerDownLeft, Search } from "lucide-react";
import Modal from "../components/common/Modal";
import PageHeader from "../components/common/PageHeader";
import { borrowReturnApi } from "../api/management/borrowReturn";
import { ApiError } from "../lib/api";
import type { Book, BorrowRecord, Student } from "../types";
import { formatCurrency } from "../utils/constants";

const getToday = () => {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

export default function BorrowReturn() {
  const [students, setStudents] = useState<Student[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [modal, setModal] = useState<"borrow" | "return" | null>(null);
  const [studentId, setStudentId] = useState("");
  const [bookId, setBookId] = useState("");
  const [search, setSearch] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [borrowDate, setBorrowDate] = useState(getToday);
  const [dueDate, setDueDate] = useState("");
  const [returnDate, setReturnDate] = useState(getToday);
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = async () => {
    const [s, b, r] = await Promise.all([borrowReturnApi.getStudents(), borrowReturnApi.getBooks(), borrowReturnApi.getRecords()]);
    setStudents(Array.isArray(s) ? s : []);
    setBooks(Array.isArray(b) ? b : []);
    setRecords(Array.isArray(r) ? r : []);
    setPageError("");
  };
  useEffect(() => { load().catch((e: unknown) => setPageError(e instanceof Error ? e.message : String(e))); }, []);

  const submit = async () => {
    try {
      setError("");
      setFieldErrors({});

      if (modal === "borrow") {
        await borrowReturnApi.borrow({ studentId: Number(studentId), bookId: Number(bookId), numberOfBooks: quantity, borrowDate, dueDate });
      }
      else {
        await borrowReturnApi.return({ studentId: Number(studentId), bookId: Number(bookId), numberOfBooks: quantity, returnDate });
      }

      await load();
      setModal(null);
      setStudentId(""); setBookId(""); setQuantity(1);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e));
      setFieldErrors(e instanceof ApiError ? e.fieldErrors ?? {} : {});
    }
  };

  const activeRecords = records.filter((r) => r.returnDate === null && r.numberOfBooks > 0);
  const visibleRecords = [...records].sort((a, b) => b.borrowRecordId - a.borrowRecordId);
  const studentsWithActiveLoans = students.filter((student) =>
    activeRecords.some((record) => record.studentId === student.studentId),
  );
  const returnableRecords = activeRecords.filter((record) => record.studentId === Number(studentId));
  const returnableBooks = books.filter((book) =>
    returnableRecords.some((record) => record.bookId === book.bookId),
  );
  const searchedStudents = students.filter((student) =>
    student.studentName.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const searchedBooks = books.filter((book) =>
    book.bookTitle.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const searchedReturnStudents = studentsWithActiveLoans.filter((student) =>
    student.studentName.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const searchedReturnBooks = returnableBooks.filter((book) =>
    book.bookTitle.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const selectedBorrow = returnableRecords.find((record) => record.bookId === Number(bookId));

  const openModal = (mode: "borrow" | "return") => {
    setStudentId("");
    setBookId("");
    setQuantity(1);
    setBorrowDate(getToday());
    setDueDate("");
    setReturnDate(getToday());
    setError("");
    setFieldErrors({});
    setModal(mode);
  };

  const openReturnForRecord = (record: BorrowRecord) => {
    setStudentId(String(record.studentId));
    setBookId(String(record.bookId));
    setQuantity(record.numberOfBooks);
    setReturnDate(getToday());
    setError("");
    setFieldErrors({});
    setModal("return");
  };

  return (
    <>
      <PageHeader
        title="Borrow / Return"
        description="Manage active book borrowing and returning records."
        action={
          <div className="header-actions">
            <button className="primary-button" onClick={() => openModal("borrow")}><ArrowUpFromLine size={18} /> Borrow Book</button>
            <button className="secondary-button" onClick={() => openModal("return")}><ArrowDownToLine size={18} /> Return Book</button>
          </div>
        }
      />

      {pageError && <div className="error-message" role="alert">{pageError}</div>}
      <div className="info-strip">
        <span>Maximum books per student: <strong>5</strong></span>
        <span>Active borrow records: <strong>{activeRecords.length}</strong></span>
      </div>

      <div className="borrow-search-toolbar">
        <label className="search-box">
          <Search size={18} />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student name or book title..." aria-label="Search by student name or book title" />
        </label>
      </div>

      <div className="table-card">
        <div className="table-scroll borrow-record-scroll">
          <table>
            <thead><tr><th>ID</th><th>Student</th><th>Book</th><th>Borrow Date</th><th>Due Date</th><th>Return Date</th><th>Overdue Days</th><th>Fine</th><th>Total Fine</th><th>Quantity</th><th>Action</th></tr></thead>
            <tbody>
              {visibleRecords.map((record) => {
                const student = students.find((s) => s.studentId === record.studentId);
                const book = books.find((b) => b.bookId === record.bookId);
                const isActive = record.returnDate === null && record.numberOfBooks > 0;
                const query = search.trim().toLowerCase();
                if (query && !student?.studentName.toLowerCase().includes(query) && !book?.bookTitle.toLowerCase().includes(query)) return null;
                return (
                  <tr key={record.borrowRecordId}>
                    <td>#{record.borrowRecordId}</td>
                    <td className="strong">{student?.studentName ?? `Student #${record.studentId}`}</td>
                    <td>{book?.bookTitle ?? `Book #${record.bookId}`}</td>
                    <td>{record.borrowDate}</td>
                    <td>{record.dueDate ?? "Not provided by API"}</td>
                    <td>{record.returnDate ?? "—"}</td>
                    <td><span className={`table-value-badge overdue ${record.overdueDays != null && record.overdueDays > 0 ? "warning" : "neutral"}`}>{record.overdueDays ?? (isActive ? "—" : "Not provided by API")}</span></td>
                    <td><span className={`table-value-badge ${record.fineAmount != null && record.fineAmount > 0 ? "warning" : "neutral"}`}>{record.fineAmount == null ? (isActive ? "—" : "Not provided by API") : formatCurrency(record.fineAmount)}</span></td>
                    <td><span className={`table-value-badge ${student && student.fineAmount > 0 ? "warning" : "neutral"}`}>{student ? formatCurrency(student.fineAmount) : "Not provided by API"}</span></td>
                    <td><span className="table-value-badge quantity">{record.numberOfBooks}</span></td>
                    <td>{isActive ? <button className="return-row-button" onClick={() => openReturnForRecord(record)}><CornerDownLeft size={14} aria-hidden="true" />Return</button> : <span className="borrow-status returned">Returned</span>}</td>
                  </tr>
                );
              })}
              {visibleRecords.length === 0 && <tr><td colSpan={11} className="empty">No borrow records.</td></tr>}
              {visibleRecords.length > 0 && !visibleRecords.some((record) => {
                const student = students.find((s) => s.studentId === record.studentId);
                const book = books.find((b) => b.bookId === record.bookId);
                const query = search.trim().toLowerCase();
                return !query || Boolean(student?.studentName.toLowerCase().includes(query) || book?.bookTitle.toLowerCase().includes(query));
              }) && <tr><td colSpan={11} className="empty">No borrow records match your search.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal !== null} title={modal === "borrow" ? "Borrow Book" : "Return Book"} width="small" onClose={() => setModal(null)}>
        <div className="form-grid">
          <div className="form-field full">
            <label>Student</label>
            <select className={fieldErrors.studentId ? "input-error" : ""} aria-invalid={Boolean(fieldErrors.studentId)} value={studentId} onChange={(e) => { setStudentId(e.target.value); setBookId(""); setQuantity(1); }}>
              <option value="">Select student</option>
              {(modal === "return" ? searchedReturnStudents : searchedStudents).map((s) => <option key={s.studentId} value={s.studentId}>#{s.studentId} - {s.studentName}</option>)}
            </select>
            {fieldErrors.studentId && <span className="field-error">{fieldErrors.studentId}</span>}
          </div>
          <div className="form-field">
            <label>Book</label>
            <select className={fieldErrors.bookId ? "input-error" : ""} aria-invalid={Boolean(fieldErrors.bookId)} value={bookId} onChange={(e) => { setBookId(e.target.value); setQuantity(1); }}>
              <option value="">Select book</option>
              {(modal === "return" ? searchedReturnBooks : searchedBooks).map((b) => {
                const borrowedCount = returnableRecords.find((record) => record.bookId === b.bookId)?.numberOfBooks;
                return <option key={b.bookId} value={b.bookId}>#{b.bookId} - {b.bookTitle} ({modal === "return" ? `${borrowedCount} borrowed` : `${b.availableQuantity} available`})</option>;
              })}
            </select>
            {fieldErrors.bookId && <span className="field-error">{fieldErrors.bookId}</span>}
          </div>
          <div className="form-field">
            <label>Number of Books</label>
            <input className={fieldErrors.numberOfBooks ? "input-error" : ""} aria-invalid={Boolean(fieldErrors.numberOfBooks)} type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            {fieldErrors.numberOfBooks && <span className="field-error">{fieldErrors.numberOfBooks}</span>}
          </div>
          {modal === "borrow" && <>
            <div className="form-field"><label htmlFor="borrow-date">Borrow Date</label><input className={fieldErrors.borrowDate ? "input-error" : ""} aria-invalid={Boolean(fieldErrors.borrowDate)} id="borrow-date" type="date" value={borrowDate} onChange={(e) => setBorrowDate(e.target.value)} />{fieldErrors.borrowDate && <span className="field-error">{fieldErrors.borrowDate}</span>}</div>
            <div className="form-field"><label htmlFor="due-date">Due Date</label><input className={fieldErrors.dueDate ? "input-error" : ""} aria-invalid={Boolean(fieldErrors.dueDate)} id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />{fieldErrors.dueDate && <span className="field-error">{fieldErrors.dueDate}</span>}</div>
          </>}
          {modal === "return" && selectedBorrow && <div className="form-field full"><label>Due Date</label><input value={selectedBorrow.dueDate ?? "Not provided by API"} readOnly /></div>}
          {modal === "return" && <div className="form-field full"><label htmlFor="return-date">Return Date</label><input className={fieldErrors.returnDate ? "input-error" : ""} aria-invalid={Boolean(fieldErrors.returnDate)} id="return-date" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />{fieldErrors.returnDate && <span className="field-error">{fieldErrors.returnDate}</span>}</div>}
          {modal === "return" && selectedBorrow?.fineAmount != null && <div className="form-field full"><label>Fine Recorded</label><input value={formatCurrency(selectedBorrow.fineAmount)} readOnly /></div>}
        </div>
        {error && <div className="error-message" role="alert">{error}</div>}
        <div className="modal-footer">
          <button className="secondary-button" onClick={() => setModal(null)}>Cancel</button>
          <button className="primary-button" onClick={submit}>{modal === "borrow" ? "Borrow Book" : "Return Book"}</button>
        </div>
      </Modal>
    </>
  );
}
