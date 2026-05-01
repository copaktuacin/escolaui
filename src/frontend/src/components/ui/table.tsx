"use client";

import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

/* ── Table shell ───────────────────────────────────────────────────────── */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto rounded-xl border border-border/50 shadow-card"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

/* ── Sticky header ─────────────────────────────────────────────────────── */
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "sticky top-0 z-10 bg-muted/80 backdrop-blur-sm [&_tr]:border-b",
        className,
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border/40 transition-colors duration-150",
        "hover:bg-muted/30 data-[state=selected]:bg-primary/5",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-3 text-left align-middle",
        "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        "whitespace-nowrap",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 py-3 align-middle whitespace-nowrap",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

/* ── SortableHeader ────────────────────────────────────────────────────── */
interface SortableHeaderProps extends React.ComponentProps<"th"> {
  sorted?: "asc" | "desc" | false;
  onSort?: () => void;
}

function SortableHeader({
  children,
  sorted,
  onSort,
  className,
  ...props
}: SortableHeaderProps) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-3 text-left align-middle",
        "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        "whitespace-nowrap select-none",
        onSort &&
          "cursor-pointer hover:text-foreground transition-colors duration-150",
        className,
      )}
      onClick={onSort}
      aria-sort={
        sorted === "asc"
          ? "ascending"
          : sorted === "desc"
            ? "descending"
            : "none"
      }
      {...props}
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        <ArrowUpDown
          className={cn(
            "w-3 h-3 flex-shrink-0 transition-colors",
            sorted ? "text-primary" : "text-muted-foreground/50",
          )}
        />
      </span>
    </th>
  );
}

/* ── Pagination ────────────────────────────────────────────────────────── */
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function TablePagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/20",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">
        Page <span className="font-semibold text-foreground">{page}</span> of{" "}
        <span className="font-semibold text-foreground">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-md border border-border/60 bg-background hover:bg-accent disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Previous page"
          data-ocid="table.pagination_prev"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum = i + 1;
          if (totalPages > 5) {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
            pageNum = start + i;
          }
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "min-w-8 h-8 px-2 rounded-md text-xs font-medium border transition-colors",
                pageNum === page
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "border-border/60 bg-background hover:bg-accent text-foreground",
              )}
              data-ocid={`table.page.${pageNum}`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-md border border-border/60 bg-background hover:bg-accent disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Next page"
          data-ocid="table.pagination_next"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  SortableHeader,
  TablePagination,
};
