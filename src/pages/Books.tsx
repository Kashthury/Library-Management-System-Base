import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import Modal from "../components/common/Modal";
import PageHeader from "../components/common/PageHeader";
import { booksApi } from "../api/management/books";
import { ApiError } from "../lib/api";
import type { Book, BookInput } from "../types";

const emptyBook: BookInput = { bookTitle: "", author: "", category: "", availableQuantity: 1 };

export default function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BookInput>(emptyBook);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [pageError, setPageError] = useState("");

  const load = async () => {
    const response = await booksApi.getAll();
    setBooks(Array.isArray(response) ? response : []);
    setPageError("");
  };
  useEffect(() => { load().catch((e: unknown) => setPageError(e instanceof Error ? e.message : String(e))); }, []);

  const filteredBooks = books.filter((book) =>
    `${book.bookTitle} ${book.author} ${book.category}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  const save = async () => {
    try {
      await booksApi.create(form);
      await load();
      setOpen(false);
      setForm(emptyBook);
      setError("");
      setFieldErrors({});
      setSuccess("Successfully added book record.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e));
      setFieldErrors(e instanceof ApiError ? e.fieldErrors ?? {} : {});
    }
  };

  return (
    <>
      <PageHeader
        title="Book Management"
        description="Register books and view the current library inventory."
        action={<button className="primary-button" onClick={() => { setOpen(true); setError(""); setFieldErrors({}); }}><Plus size={18} /> Register Book</button>}
      />

      {pageError && <div className="error-message" role="alert">{pageError}</div>}
      {success && <div className="success-message" role="status">{success}</div>}

      <div className="toolbar book-toolbar">
        <div className="search-box book-search">
          <Search size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search book title, author or category..." aria-label="Search books by title, author, or category" />
        </div>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table>
            <thead><tr><th>ID</th><th>Book Title</th><th>Author</th><th>Category</th><th>Available Quantity</th></tr></thead>
            <tbody>
              {filteredBooks.map((book) => (
                <tr key={book.bookId}>
                  <td>#{book.bookId}</td>
                  <td className="strong">{book.bookTitle}</td>
                  <td>{book.author}</td>
                  <td><span className="category-badge">{book.category}</span></td>
                  <td><span className={book.availableQuantity === 0 ? "stock-zero" : "stock"}>{book.availableQuantity}</span></td>
                </tr>
              ))}
              {filteredBooks.length === 0 && <tr><td colSpan={5} className="empty">No books match your search or category filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} title="Register Book" onClose={() => setOpen(false)}>
        <div className="form-grid">
          <div className="form-field full"><label>Book Title</label><input className={fieldErrors.bookTitle ? "input-error" : ""} aria-invalid={Boolean(fieldErrors.bookTitle)} value={form.bookTitle} onChange={(e) => setForm({ ...form, bookTitle: e.target.value })} />{fieldErrors.bookTitle && <span className="field-error">{fieldErrors.bookTitle}</span>}</div>
          <div className="form-field"><label>Author</label><input className={fieldErrors.author ? "input-error" : ""} aria-invalid={Boolean(fieldErrors.author)} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />{fieldErrors.author && <span className="field-error">{fieldErrors.author}</span>}</div>
          <div className="form-field"><label>Category</label><input className={fieldErrors.category ? "input-error" : ""} aria-invalid={Boolean(fieldErrors.category)} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />{fieldErrors.category && <span className="field-error">{fieldErrors.category}</span>}</div>
          <div className="form-field"><label>Available Quantity</label><input className={fieldErrors.availableQuantity ? "input-error" : ""} aria-invalid={Boolean(fieldErrors.availableQuantity)} type="number" value={form.availableQuantity} onChange={(e) => setForm({ ...form, availableQuantity: Number(e.target.value) })} />{fieldErrors.availableQuantity && <span className="field-error">{fieldErrors.availableQuantity}</span>}</div>
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="modal-footer">
          <button className="secondary-button" onClick={() => setOpen(false)}>Cancel</button>
          <button className="primary-button" onClick={save}>Save Book</button>
        </div>
      </Modal>
    </>
  );
}
