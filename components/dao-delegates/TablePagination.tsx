interface TablePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function TablePagination({ page, totalPages, onPageChange }: TablePaginationProps) {
  if (totalPages <= 1) return null;

  const buttonClass =
    'rounded-md border border-border px-3 py-1.5 text-[13px] disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <nav aria-label="Pagination" className="mt-5 flex items-center justify-center gap-4">
      <button
        type="button"
        className={buttonClass}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <span className="text-[13px] text-muted">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className={buttonClass}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
