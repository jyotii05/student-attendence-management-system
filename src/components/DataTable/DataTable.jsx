import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

/**
 * Reusable table with sorting, pagination and a professional empty state.
 * columns: [{ key, header, render?, sort?: (row) => value, align?, className?, headerClassName? }]
 */
export default function DataTable({ columns, rows, rowKey = 'id', pageSize = 10, empty = {}, onRowClick, initialSort, footer, minWidth = 760, dense }) {
  const [sort, setSort] = useState(initialSort || null);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [rows]);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sort) return rows;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = col.sort(a);
      const vb = col.sort(b);
      if (va == null) return 1;
      if (vb == null) return -1;
      return (va > vb ? 1 : va < vb ? -1 : 0) * dir;
    });
  }, [rows, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pages);
  const slice = sorted.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (c) => {
    if (!c.sort) return;
    setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: c.key, dir: 'asc' }));
  };

  if (!rows.length) {
    return (
      <div className="card">
        <EmptyState {...empty} />
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-base" style={{ minWidth }}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''} ${c.headerClassName || ''}`}>
                  {c.sort ? (
                    <button onClick={() => toggleSort(c)} className="inline-flex items-center gap-1 uppercase hover:text-brand">
                      {c.header}
                      {sort?.key === c.key ? (
                        sort.dir === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-brand" /> : <ChevronDown className="h-3.5 w-3.5 text-brand" />
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr
                key={typeof rowKey === 'function' ? rowKey(row) : row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`${dense ? '!py-2.5' : ''} ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''} ${c.className || ''}`}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-ink-3 sm:flex-row">
        <span>
          Showing <b className="text-ink-2">{(current - 1) * pageSize + 1}</b>–<b className="text-ink-2">{Math.min(current * pageSize, sorted.length)}</b> of{' '}
          <b className="text-ink-2">{sorted.length.toLocaleString('en-IN')}</b>
          {footer}
        </span>
        {pages > 1 && <Pagination page={current} pages={pages} onChange={setPage} />}
      </div>
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  const nums = [];
  const push = (n) => nums.push(n);
  if (pages <= 7) for (let i = 1; i <= pages; i++) push(i);
  else {
    push(1);
    if (page > 3) push('…l');
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) push(i);
    if (page < pages - 2) push('…r');
    push(pages);
  }
  const btn = 'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold transition-colors';
  return (
    <nav className="flex items-center gap-1" aria-label="Pagination">
      <button className={`${btn} text-ink-2 hover:bg-hover disabled:opacity-40`} disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {nums.map((n) =>
        typeof n === 'string' ? (
          <span key={n} className="px-1 text-ink-3">
            …
          </span>
        ) : (
          <button key={n} onClick={() => onChange(n)} className={`${btn} ${n === page ? 'bg-brand-600 text-white' : 'text-ink-2 hover:bg-hover'}`}>
            {n}
          </button>
        ),
      )}
      <button className={`${btn} text-ink-2 hover:bg-hover disabled:opacity-40`} disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
