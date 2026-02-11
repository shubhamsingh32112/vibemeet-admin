import React, { useState, useMemo } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T) => React.ReactNode;
  getValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  maxHeight?: string;
  compact?: boolean;
}

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  onRowClick,
  emptyMessage = 'No data available',
  searchPlaceholder = 'Search...',
  searchFields,
  maxHeight = '600px',
  compact = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filteredData = useMemo(() => {
    let result = data;

    // Search filter
    if (search.trim() && searchFields) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        searchFields.some((field) => {
          const val = row[field];
          return val && String(val).toLowerCase().includes(q);
        })
      );
    }

    // Sort
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      result = [...result].sort((a, b) => {
        const aVal = col?.getValue ? col.getValue(a) : a[sortKey];
        const bVal = col?.getValue ? col.getValue(b) : b[sortKey];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        }
        const aStr = String(aVal ?? '');
        const bStr = String(bVal ?? '');
        return sortDir === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return result;
  }, [data, search, searchFields, sortKey, sortDir, columns]);

  const cellPadding = compact ? 'px-3 py-1.5' : 'px-4 py-2.5';

  return (
    <div className="flex flex-col">
      {searchFields && (
        <div className="mb-3">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="ml-3 text-xs text-gray-500">
            {filteredData.length} of {data.length}
          </span>
        </div>
      )}

      <div
        className="overflow-auto border border-gray-700 rounded-lg"
        style={{ maxHeight }}
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-800 border-b border-gray-700">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${cellPadding} text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap ${
                    col.sortable ? 'cursor-pointer hover:text-gray-200 select-none' : ''
                  }`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-blue-400">
                        {sortDir === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-gray-500 text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr
                  key={row[keyField]}
                  className={`bg-gray-900 hover:bg-gray-800/60 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`${cellPadding} text-gray-300 whitespace-nowrap`}
                    >
                      {col.render
                        ? col.render(row)
                        : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
