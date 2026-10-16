interface StatCardProps {
  label: string;
  value: string | number;
  tone?: "blue" | "violet" | "pink" | "teal" | "green" | "amber" | "indigo";
  description?: string;
}

const tones: Record<string, StatCardProps["tone"]> = {
  "Total Students": "blue",
  "Male Students": "indigo",
  "Female Students": "pink",
  "Currently Borrowed": "violet",
  "Registered Books": "teal",
  "Available Books": "green",
  "Borrowed Books": "amber",
  "0 Books": "green",
  "1 Book": "teal",
  "2 Books": "blue",
  "3 Books": "violet",
  "4 Books": "amber",
  "5 Books": "pink",
};

const descriptions: Record<string, string> = {
  "Total Students": "Students registered in the library",
  "Male Students": "Registered male students",
  "Female Students": "Registered female students",
  "Currently Borrowed": "Books currently on loan",
  "Registered Books": "Books in the library collection",
  "Available Books": "Copies ready to be borrowed",
  "Borrowed Books": "Copies currently on loan",
  "0 Books": "Students with no active loans",
  "1 Book": "Students with one active loan",
  "2 Books": "Students with two active loans",
  "3 Books": "Students with three active loans",
  "4 Books": "Students with four active loans",
  "5 Books": "Students at the borrowing limit",
};

export default function StatCard({ label, value, tone = tones[label] ?? "blue", description = descriptions[label] }: StatCardProps) {
  return (
    <div className={`stat-card stat-card-${tone}`}>
      <div className="stat-card-copy">
        <span>{label}</span>
        {description && <p className="stat-card-description">{description}</p>}
      </div>
      <strong className="stat-card-value-badge">{value}</strong>
    </div>
  );
}
