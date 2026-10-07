import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
  showQuickJumper?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize = 10,
  onPageChange,
  className = '',
  showQuickJumper = true,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const [jumpPage, setJumpPage] = useState<string>('');

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Smart page numbers calculation matching Image 4
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPage, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onPageChange(p);
      setJumpPage('');
    }
  };

  return (
    <div
      className={`border-t border-slate-100 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white select-none ${className}`}
    >
      {/* Chap tomon: 1-10 / 2552 */}
      <div className="text-xs font-semibold text-slate-500 font-mono tracking-tight">
        {startItem}-{endItem} / {totalItems}
      </div>

      {/* O'ng tomon: < Oldingi, 1, 2, 3... Keyingi >, Sahifa */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
        {/* Oldingi */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Oldingi</span>
        </button>

        {/* Sahifalar */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-7 h-7 flex items-center justify-center text-xs text-slate-400 font-bold"
                >
                  ...
                </span>
              );
            }

            const pageNum = Number(p);
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[30px] h-7 px-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                  isActive
                    ? 'bg-[#163D5C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Keyingi */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
        >
          <span>Keyingi</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Sahifa tezkor o'tish */}
        {showQuickJumper && totalPages > 1 && (
          <form onSubmit={handleJump} className="ml-1 sm:ml-2 flex items-center gap-1">
            <input
              type="text"
              placeholder="Sahifa"
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value.replace(/\D/g, ''))}
              className="w-16 px-2 py-1 text-xs border border-slate-200 rounded-lg text-center text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#163D5C] focus:ring-1 focus:ring-[#163D5C]"
            />
          </form>
        )}
      </div>
    </div>
  );
};
