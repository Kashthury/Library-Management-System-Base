import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import Modal from "../components/common/Modal";
import PageHeader from "../components/common/PageHeader";
import { borrowReturnApi } from "../api/management/borrowReturn";
import type { Book, BorrowRecord, Student } from "../types";

const getToday = () => {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

export default function BorrowReturn() {
  const [students, setStudents] = useState<Student[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [modal, setModal] = useState<"borrow" | "return" | null>(null);
  const [studentId, setStudentId] = useState("");
  const [bookId, setBookId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [borrowDate, setBorrowDate] = useState(getToday);
  const [returnDate, setReturnDate] = useState(getToday);
  const [error, setError] = useState("");

  const load = async () => {
    const [s, b, r] = await Promise.all([borrowReturnApi.getStudents(), borrowReturnApi.getBooks(), borrowReturnApi.getRecords()]);
    setStudents(s); setBooks(b); setRecords(r);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    try {
      setError("");
      if (!studentId || !bookId) throw new Error("Student and book are required");
      if (quantity <= 0) throw new Error("Number of books must be greater than 0");

      if (modal === "borrow") await borrowReturnApi.borrow({ studentId: Number(studentId), bookId: Number(bookId), numberOfBooks: quantity, borrowDate });
      else await borrowReturnApi.return({ studentId: Number(studentId), bookId: Number(bookId), numberOfBooks: quantity, returnDate });

      await load();
      setModal(null);
      setStudentId(""); setBookId(""); setQuantity(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operation failed");
    }
  };

  const activeRecords = records.filter((r) => r.returnDate === null && r.numberOfBooks > 0);
  const studentsWithActiveLoans = students.filter((student) =>
    activeRecords.some((record) => record.studentId === student.studentId),
  );
  const returnableRecords = activeRecords.filter((record) => record.studentId === Number(studentId));
  const returnableBooks = books.filter((book) =>
    returnableRecords.some((record) => record.bookId === book.bookId),
  );
  const selectedBorrow = returnableRecords.find((record) => record.bookId === Number(bookId));

  const openModal = (mode: "borrow" | "return") => {
    setStudentId("");
    setBookId("");
    setQuantity(1);
    setBorrowDate(getToday());
    setReturnDate(getToday());
    setError("");
    setModal(mode);
  };

  const openReturnForRecord = (record: BorrowRecord) => {
    setStudentId(String(record.studentId));
    setBookId(String(record.bookId));
    setQuantity(record.numberOfBooks);
    setError("");
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

      <div className="info-strip">
        <span>Maximum books per student: <strong>5</strong></span>
        <span>Active borrow records: <strong>{activeRecords.length}</strong></span>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table>
            <thead><tr><th>Record ID</th><th>Student</th><th>Book</th><th>Borrow Date</th><th>Quantity</th><th>Action</th></tr></thead>
            <tbody>
              {activeRecords.map((record) => {
                const student = students.find((s) => s.studentId === record.studentId);
                const book = books.find((b) => b.bookId === record.bookId);
                return (
                  <tr key={record.borrowRecordId}>
                    <td>#{record.borrowRecordId}</td>
                    <td className="strong">{student?.studentName ?? `Student #${record.studentId}`}</td>
                    <td>{book?.bookTitle ?? `Book #${record.bookId}`}</td>
                    <td>{record.borrowDate}</td>
                    <td>{record.numberOfBooks}</td>
                    <td><button className="secondary-button" onClick={() => openReturnForRecord(record)}>Return</button></td>
                  </tr>
                );
              })}
              {activeRecords.length === 0 && <tr><td colSpan={5} className="empty">No active borrow records.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal !== null} title={modal === "borrow" ? "Borrow Book" : "Return Book"} width="small" onClose={() => setModal(null)}>
        <div className="form-grid">
          <div className="form-field full">
            <label>Student</label>
            <select value={studentId} onChange={(e) => { setStudentId(e.target.value); setBookId(""); setQuantity(1); }}>
              <option value="">Select student</option>
              {(modal === "return" ? studentsWithActiveLoans : students).map((s) => <option key={s.studentId} value={s.studentId}>#{s.studentId} - {s.studentName}</option>)}
            </select>
          </div>
          <div className="form-field full">
            <label>Book</label>
            <select value={bookId} onChange={(e) => { setBookId(e.target.value); setQuantity(1); }}>
              <option value="">Select book</option>
              {(modal === "return" ? returnableBooks : books).map((b) => {
                const borrowedCount = returnableRecords.find((record) => record.bookId === b.bookId)?.numberOfBooks;
                return <option key={b.bookId} value={b.bookId}>#{b.bookId} - {b.bookTitle} ({modal === "return" ? `${borrowedCount} borrowed` : `${b.availableQuantity} available`})</option>;
              })}
            </select>
          </div>
          <div className="form-field">
            <label>Number of Books</label>
            <input type="number" min="1" max={modal === "return" ? selectedBorrow?.numberOfBooks ?? 1 : 5} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
          {modal === "borrow" && (
            <div className="form-field">
              <label htmlFor="borrow-date">Borrow Date</label>
              <input id="borrow-date" type="date" value={borrowDate} onChange={(e) => setBorrowDate(e.target.value)} />
            </div>
          )}
          {modal === "return" && (
            <div className="form-field">
              <label htmlFor="return-date">Return Date</label>
              <input id="return-date" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
            </div>
          )}
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="modal-footer">
          <button className="secondary-button" onClick={() => setModal(null)}>Cancel</button>
          <button className="primary-button" onClick={submit}>{modal === "borrow" ? "Borrow Book" : "Return Book"}</button>
        </div>
      </Modal>
    </>
  );
}
