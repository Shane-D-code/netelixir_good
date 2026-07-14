import React, { useState, useMemo } from 'react';
import { classNames } from '../../utils/formatters';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  sortable?: boolean;
  searchable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export default function Table<T extends Record<string, any>>({
  data,
  columns,
  sortable = true,
  searchable = false,
  pagination = false,
  pageSize = 10,
  className,
}: TableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [page, setPage] = useState(0);

  const filteredData = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  const totalPages = pagination ? Math.ceil(sortedData.length / pageSize) : 1;
  const pagedData = pagination
    ? sortedData.slice(page * pageSize, (page + 1) * pageSize)
    : sortedData;

  const handleSort = (key: keyof T) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'));
      if (sortDir === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDirection }) => (
    <svg className="ml-1 h-3 w-3 flex-shrink-0" viewBox="0 0 12 12" fill="currentColor">
      <path
        d="M6 2L9.5 5.5H2.5L6 2Z"
        opacity={active && dir === 'asc' ? 1 : 0.3}
      />
      <path
        d="M6 10L2.5 6.5H9.5L6 10Z"
        opacity={active && dir === 'desc' ? 1 : 0.3}
      />
    </svg>
  );

  return (
    <div className={classNames('w-full', className)}>
      {searchable && (
        <div className="mb-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'var(--text-tertiary, #7A7060)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-secondary, rgba(255,255,255,0.03))',
                border: '1px solid var(--border, rgba(200,168,107,0.15))',
                color: 'var(--text-primary, #F5F0E8)',
              }}
            />
          </div>
        </div>
      )}

      <div className="w-full overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border, rgba(200,168,107,0.15))' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border, rgba(200,168,107,0.15))' }}>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={classNames(
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap',
                    sortable && col.sortable !== false && 'cursor-pointer select-none hover:opacity-80'
                  )}
                  style={{ color: 'var(--text-tertiary, #7A7060)' }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <span className="inline-flex items-center">
                    {col.label}
                    {sortable && col.sortable !== false && (
                      <SortIcon active={sortKey === col.key} dir={sortDir} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm"
                  style={{ color: 'var(--text-tertiary, #7A7060)' }}
                >
                  No data available
                </td>
              </tr>
            ) : (
              pagedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="transition-colors hover:opacity-90"
                  style={{
                    borderBottom:
                      rowIdx < pagedData.length - 1
                        ? '1px solid var(--border, rgba(200,168,107,0.08))'
                        : undefined,
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="px-4 py-3 whitespace-nowrap"
                      style={{ color: 'var(--text-primary, #F5F0E8)' }}
                    >
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs" style={{ color: 'var(--text-tertiary, #7A7060)' }}>
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sortedData.length)} of{' '}
            {sortedData.length}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                color: 'var(--text-secondary, #B8B0A0)',
                border: '1px solid var(--border, rgba(200,168,107,0.15))',
                background: 'transparent',
              }}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className="h-8 w-8 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor:
                    i === page ? 'var(--accent, #C8A86B)' : 'transparent',
                  color:
                    i === page ? '#fff' : 'var(--text-secondary, #B8B0A0)',
                  border:
                    i === page
                      ? 'none'
                      : '1px solid var(--border, rgba(200,168,107,0.15))',
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                color: 'var(--text-secondary, #B8B0A0)',
                border: '1px solid var(--border, rgba(200,168,107,0.15))',
                background: 'transparent',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
