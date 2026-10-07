import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex overflow-hidden select-none">
      {/* 1. Chap Yon Panel (Sidebar Skeleton) */}
      <aside className="w-64 border-r border-slate-200/80 bg-white flex-col justify-between p-5 hidden md:flex shrink-0 animate-pulse">
        <div className="space-y-6">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 bg-slate-200 rounded-md w-28" />
              <div className="h-2.5 bg-slate-100 rounded-md w-20" />
            </div>
          </div>

          {/* Tuman tanlash selektori skeleton */}
          <div className="h-11 bg-slate-100 rounded-2xl border border-slate-200/60" />

          {/* Navigatsiya menyulari */}
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center space-x-3 px-3 py-2.5 rounded-2xl bg-slate-50/70">
                <div className="w-5 h-5 rounded-lg bg-slate-200 shrink-0" />
                <div className="h-3.5 bg-slate-200 rounded-md flex-1" style={{ width: `${60 + (i % 3) * 15}%` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Profil qismi */}
        <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-slate-200 shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="h-3 bg-slate-200 rounded w-20" />
            <div className="h-2.5 bg-slate-100 rounded w-16" />
          </div>
        </div>
      </aside>

      {/* 2. Asosiy Qism (Main Content Skeleton) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Yuqori Header */}
        <header className="h-16 bg-white/90 border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between shrink-0">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-slate-200 rounded-md w-20 animate-pulse" />
            <div className="h-3 bg-slate-100 rounded w-3" />
            <div className="h-4 bg-slate-200 rounded-md w-28 animate-pulse" />
          </div>

          {/* O'ng tomon: Search va Notif */}
          <div className="flex items-center space-x-3">
            <div className="w-40 sm:w-64 h-9 bg-slate-100 rounded-xl border border-slate-200/60 animate-pulse hidden sm:block" />
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/60 animate-pulse" />
            <div className="w-9 h-9 rounded-xl bg-slate-200 animate-pulse" />
          </div>
        </header>

        {/* Sahifa tanasi */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto animate-pulse">
          {/* Sarlavha va tugmalar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 bg-slate-200 rounded-xl w-64" />
              <div className="h-3.5 bg-slate-100 rounded-lg w-80 max-w-full" />
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-10 bg-slate-200 rounded-xl w-32" />
              <div className="h-10 bg-slate-200 rounded-xl w-36" />
            </div>
          </div>

          {/* E'lon / Status kartasi */}
          <div className="h-20 bg-slate-100/80 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded-md w-60" />
                <div className="h-3 bg-slate-100 rounded-md w-48" />
              </div>
            </div>
            <div className="h-7 bg-slate-200 rounded-xl w-28 hidden sm:block" />
          </div>

          {/* 4 ta KPI Stat Kartochkalari */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100" />
                  <div className="h-5 bg-slate-100 rounded-lg w-14" />
                </div>
                <div className="space-y-2">
                  <div className="h-7 bg-slate-200 rounded-lg w-28" />
                  <div className="h-3.5 bg-slate-100 rounded-md w-40" />
                </div>
              </div>
            ))}
          </div>

          {/* Grafik va Diagramma bloklari */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 space-y-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-5 bg-slate-200 rounded-md w-44" />
                  <div className="h-3 bg-slate-100 rounded-md w-32" />
                </div>
                <div className="h-8 bg-slate-100 rounded-xl w-24" />
              </div>
              <div className="h-64 bg-slate-50 rounded-2xl border border-slate-100 flex items-end justify-between p-6 gap-3">
                {[40, 65, 30, 85, 55, 90, 45, 70, 60, 75, 50, 80].map((h, idx) => (
                  <div
                    key={idx}
                    className="w-full bg-slate-200 rounded-t-lg transition-all"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-5 shadow-2xs flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="h-5 bg-slate-200 rounded-md w-36" />
                <div className="h-3 bg-slate-100 rounded-md w-28" />
              </div>
              {/* Doirasimon placeholder */}
              <div className="w-44 h-44 rounded-full border-12 border-slate-100 border-t-slate-200 mx-auto" />
              <div className="space-y-2 pt-2">
                <div className="h-3 bg-slate-100 rounded-md w-full" />
                <div className="h-3 bg-slate-100 rounded-md w-3/4" />
              </div>
            </div>
          </div>

          {/* Jadval skeleton */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="h-5 bg-slate-200 rounded-md w-48" />
              <div className="h-8 bg-slate-100 rounded-xl w-32" />
            </div>
            <div className="space-y-2 pt-2">
              {[1, 2, 3, 4].map((row) => (
                <div
                  key={row}
                  className="h-12 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between px-4"
                >
                  <div className="flex items-center space-x-3 w-1/3">
                    <div className="w-7 h-7 rounded-lg bg-slate-200 shrink-0" />
                    <div className="h-3.5 bg-slate-200 rounded w-28" />
                  </div>
                  <div className="h-3.5 bg-slate-100 rounded w-20 hidden sm:block" />
                  <div className="h-5 bg-slate-200 rounded-md w-16" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
