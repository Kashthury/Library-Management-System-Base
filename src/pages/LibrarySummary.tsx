import { useEffect, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/common/StatCard";
import { librarySummaryApi } from "../api/management/librarySummary";
import type { LibrarySummary as Summary } from "../types";

export default function LibrarySummary() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    librarySummaryApi.get()
      .then((response) => setSummary(response ?? null))
      .catch((e: unknown) => setPageError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <>
      <PageHeader title="Library Summary" description="Dynamically calculated from current students, books and borrow records." />

      {pageError && <div className="error-message" role="alert">{pageError}</div>}
      <div className="stats-grid">
        <StatCard label="Total Students" value={summary?.totalStudents ?? "—"} />
        <StatCard label="Male Students" value={summary?.totalMaleStudents ?? "—"} />
        <StatCard label="Female Students" value={summary?.totalFemaleStudents ?? "—"} />
        <StatCard label="Currently Borrowed" value={summary?.totalBooksCurrentlyBorrowed ?? "—"} />
        <StatCard label="Registered Books" value={summary?.totalRegisteredBooks ?? "—"} />
        <StatCard label="Available Books" value={summary?.totalAvailableBooks ?? "—"} />
        <StatCard label="Borrowed Books" value={summary?.totalBorrowedBooks ?? "—"} />
      </div>

      <div className="summary-section">
        <h2>Students by Current Borrowed Books</h2>
        <div className="borrow-count-grid">
          <StatCard label="0 Books" value={summary?.studentsBorrowing0Books ?? "—"} />
          <StatCard label="1 Book" value={summary?.studentsBorrowing1Book ?? "—"} />
          <StatCard label="2 Books" value={summary?.studentsBorrowing2Books ?? "—"} />
          <StatCard label="3 Books" value={summary?.studentsBorrowing3Books ?? "—"} />
          <StatCard label="4 Books" value={summary?.studentsBorrowing4Books ?? "—"} />
          <StatCard label="5 Books" value={summary?.studentsBorrowing5Books ?? "—"} />
        </div>
      </div>
    </>
  );
}
