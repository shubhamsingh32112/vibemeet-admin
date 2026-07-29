import React, { useState, useMemo } from 'react';
import { HelpColumnHeader } from '../admin/help/HelpColumnHeader';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
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
  /** Below md: render each row as a card (better touch UX). */
  stackedOnMobile?: boolean;
  /** Map column key → help registry key for ? tooltips on headers. */
  columnHelp?: Record<string, string>;
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
  stackedOnMobile = false,
  columnHelp,
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

      {stackedOnMobile && (
        <div className="md:hidden space-y-3 mb-3">
          {filteredData.length === 0 ? (
            <p className="text-center text-zinc-500 text-sm py-8 border border-zinc-800 rounded-xl bg-zinc-900/50">
              {emptyMessage}
            </p>
          ) : (
            filteredData.map((row) => (
              <div
                key={String(row[keyField])}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={`rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 space-y-2.5 shadow-sm shadow-black/20 ${
                  onRowClick ? 'cursor-pointer active:bg-zinc-800/80' : ''
                }`}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onRowClick(row);
                  }
                }}
              >
                {columns.map((col) => (
                  <div key={col.key} className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-3 text-sm">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 shrink-0 inline-flex items-center gap-1">
                      {columnHelp?.[col.key] ? (
                        <HelpColumnHeader label={col.header || col.key} helpKey={columnHelp[col.key]} />
                      ) : (
                        col.header || col.key
                      )}
                    </span>
                    <div className="text-zinc-200 text-right sm:text-right min-w-0 break-words [&_*]:whitespace-normal">
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      <div
        className={`overflow-auto border border-zinc-800 rounded-xl ${
          stackedOnMobile ? 'hidden md:block' : ''
        }`}
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
                    {columnHelp?.[col.key] ? (
                      <HelpColumnHeader label={col.header} helpKey={columnHelp[col.key]} />
                    ) : (
                      col.header
                    )}
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
