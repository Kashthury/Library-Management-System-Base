import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Search } from "lucide-react";
import Modal from "../components/common/Modal";
import PageHeader from "../components/common/PageHeader";
import { borrowReturnApi } from "../api/management/borrowReturn";
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

      if (!Number.isInteger(quantity) || quantity <= 0) throw new Error("Number of books must be a positive whole number");

      if (modal === "borrow") {
        if (!borrowDate || !dueDate) throw new Error("Borrow date and due date are required");
        if (dueDate < borrowDate) throw new Error("Due date cannot be earlier than borrow date");
        await borrowReturnApi.borrow({ studentId: Number(studentId), bookId: Number(bookId), numberOfBooks: quantity, borrowDate, dueDate });
      }
      else {
        if (!returnDate) throw new Error("Return date is required");
        if (selectedBorrow?.borrowDate && returnDate < selectedBorrow.borrowDate) throw new Error("Return date cannot be earlier than borrow date");
        await borrowReturnApi.return({ studentId: Number(studentId), bookId: Number(bookId), numberOfBooks: quantity, returnDate });
      }

      await load();
      setModal(null);
      setStudentId(""); setBookId(""); setQuantity(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operation failed");
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
    setModal(mode);
  };

  const openReturnForRecord = (record: BorrowRecord) => {
    setStudentId(String(record.studentId));
    setBookId(String(record.bookId));
    setQuantity(record.numberOfBooks);
    setReturnDate(getToday());
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
                    <td>{record.overdueDays ?? (isActive ? "—" : "Not provided by API")}</td>
                    <td>{record.fineAmount == null ? (isActive ? "—" : "Not provided by API") : formatCurrency(record.fineAmount)}</td>
                    <td>{student ? formatCurrency(student.fineAmount) : "Not provided by API"}</td>
                    <td>{record.numberOfBooks}</td>
                    <td>{isActive ? <button className="secondary-button" onClick={() => openReturnForRecord(record)}>Return</button> : "Returned"}</td>
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
            <select value={studentId} onChange={(e) => { setStudentId(e.target.value); setBookId(""); setQuantity(1); }}>
              <option value="">Select student</option>
              {(modal === "return" ? searchedReturnStudents : searchedStudents).map((s) => <option key={s.studentId} value={s.studentId}>#{s.studentId} - {s.studentName}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Book</label>
            <select value={bookId} onChange={(e) => { setBookId(e.target.value); setQuantity(1); }}>
              <option value="">Select book</option>
              {(modal === "return" ? searchedReturnBooks : searchedBooks).map((b) => {
                const borrowedCount = returnableRecords.find((record) => record.bookId === b.bookId)?.numberOfBooks;
                return <option key={b.bookId} value={b.bookId}>#{b.bookId} - {b.bookTitle} ({modal === "return" ? `${borrowedCount} borrowed` : `${b.availableQuantity} available`})</option>;
              })}
            </select>
          </div>
          <div className="form-field">
            <label>Number of Books</label>
            <input type="number" min="1" max={modal === "return" ? selectedBorrow?.numberOfBooks ?? 1 : 5} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
          {modal === "borrow" && <>
            <div className="form-field"><label htmlFor="borrow-date">Borrow Date</label><input id="borrow-date" type="date" value={borrowDate} onChange={(e) => setBorrowDate(e.target.value)} required /></div>
            <div className="form-field"><label htmlFor="due-date">Due Date</label><input id="due-date" type="date" min={borrowDate} value={dueDate} onChange={(e) => setDueDate(e.target.value)} required /></div>
          </>}
          {modal === "return" && selectedBorrow && <div className="form-field full"><label>Due Date</label><input value={selectedBorrow.dueDate ?? "Not provided by API"} readOnly /></div>}
          {modal === "return" && <div className="form-field full"><label htmlFor="return-date">Return Date</label><input id="return-date" type="date" min={selectedBorrow?.borrowDate} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} required /></div>}
          {modal === "return" && selectedBorrow?.fineAmount != null && <div className="form-field full"><label>Fine Recorded</label><input value={formatCurrency(selectedBorrow.fineAmount)} readOnly /></div>}
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
