import type { Book, BookInput } from "../../types";
import { copy, database, wait } from "./store";

/** Book management API methods. */
export const booksApi = {
  async getAll(): Promise<Book[]> {
    return wait(database.books.map(copy));
  },

  async create(input: BookInput): Promise<Book> {
    const book: Book = {
      bookId: Math.max(0, ...database.books.map((item) => item.bookId)) + 1,
      ...input,
    };
    database.books.push(book);
    return wait(copy(book));
  },
};
