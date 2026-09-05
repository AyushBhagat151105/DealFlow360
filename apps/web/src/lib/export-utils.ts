export type CsvColumn<T> = {
  header: string;
  accessor: keyof T | ((row: T) => unknown);
};

export function exportToCsv<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
): void {
  if (typeof window === "undefined" || rows.length === 0) return;

  const escapeCell = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = columns.map((col) => escapeCell(col.header)).join(",");

  const rowLines = rows.map((row) =>
    columns
      .map((col) => {
        const val =
          typeof col.accessor === "function" ? col.accessor(row) : row[col.accessor];
        return escapeCell(val);
      })
      .join(","),
  );

  const csvContent = [headerLine, ...rowLines].join("\r\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const cleanFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.setAttribute("download", cleanFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

