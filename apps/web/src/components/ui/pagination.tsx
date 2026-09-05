import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  disabled?: boolean;
}

export function TablePagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className,
  disabled = false,
}: TablePaginationProps) {
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-pencil-gray/30 text-xs",
        className,
      )}
    >
      <div className="text-forest-ink/60 font-mono">
        {total === 0 ? (
          "0 results"
        ) : (
          <>
            Showing <span className="font-semibold text-forest-ink">{startItem}</span> to{" "}
            <span className="font-semibold text-forest-ink">{endItem}</span> of{" "}
            <span className="font-semibold text-forest-ink">{total}</span> items
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-forest-ink/70">
            <span>Rows:</span>
            <select
              value={pageSize}
              disabled={disabled}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              aria-label="Rows per page"
              className="h-7 px-2 py-0.5 rounded border border-pencil-gray/60 bg-cream-paper text-forest-ink font-medium focus:outline-none focus:ring-1 focus:ring-forest-ink text-xs cursor-pointer disabled:opacity-50"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="text-forest-ink/70 font-mono text-xs">
          Page <span className="font-semibold text-forest-ink">{page}</span> of{" "}
          <span className="font-semibold text-forest-ink">{safeTotalPages}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-xs"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(1)}
            title="First page"
            className="border-pencil-gray/60 text-forest-ink hover:bg-whisper-gray"
          >
            <ChevronsLeft className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
            title="Previous page"
            className="border-pencil-gray/60 text-forest-ink hover:bg-whisper-gray"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            disabled={disabled || page >= safeTotalPages}
            onClick={() => onPageChange(page + 1)}
            title="Next page"
            className="border-pencil-gray/60 text-forest-ink hover:bg-whisper-gray"
          >
            <ChevronRight className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            disabled={disabled || page >= safeTotalPages}
            onClick={() => onPageChange(safeTotalPages)}
            title="Last page"
            className="border-pencil-gray/60 text-forest-ink hover:bg-whisper-gray"
          >
            <ChevronsRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
