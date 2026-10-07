import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          className="h-12 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between px-4 gap-4"
        >
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="h-3.5 bg-slate-200/80 rounded-md"
              style={{
                width: cIdx === 0 ? '28px' : cIdx === 1 ? '160px' : `${60 + ((rIdx + cIdx) % 4) * 20}px`,
                flexShrink: cIdx === 0 ? 0 : 1,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
