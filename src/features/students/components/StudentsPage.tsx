'use client';

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, Upload01Icon } from '@hugeicons/core-free-icons';

export default function StudentsPage() {
  const users = useQuery(api.users.getStudents);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = (users ?? []).filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.studentId.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-sans py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-fade-in select-none">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div className="space-y-1">
          <h2 className="font-sans font-bold text-2xl text-foreground">Students Registry</h2>
          <p className="text-xs text-muted-foreground">
            Registered department voters, candidates and EC members.
          </p>
        </div>
        <button
          disabled
          title="Bulk import coming soon"
          className="bg-primary/40 text-primary-foreground/60 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm cursor-not-allowed shrink-0"
        >
          <HugeiconsIcon icon={Upload01Icon} className="h-4 w-4" />
          Bulk Import CSV
        </button>
      </div>

      {/* Search + count */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HugeiconsIcon icon={Search01Icon} className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 text-xs border border-border bg-input rounded-lg focus:ring-1 focus:ring-primary/20 focus:border-primary outline-none font-sans"
            placeholder="Search by name, ID or email…"
          />
        </div>
        <div className="bg-muted border border-border text-muted-foreground text-xs font-semibold px-4 py-2 rounded-lg flex items-center justify-center shrink-0">
          Registry count: <strong className="text-foreground ml-1">{users?.length ?? '—'}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden select-text">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-muted-foreground font-mono text-[10px] uppercase">
                <th className="px-5 py-3.5 font-bold">Student Name</th>
                <th className="px-5 py-3.5 font-bold">Student ID</th>
                <th className="px-5 py-3.5 font-bold">Email</th>
                <th className="px-5 py-3.5 font-bold">Role</th>
                <th className="px-5 py-3.5 font-bold">Password Setup</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users === undefined ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center">
                    <div className="flex justify-center">
                      <div className="h-5 w-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-muted-foreground text-xs">
                    No matching student profiles found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-foreground">{u.name}</td>
                    <td className="px-5 py-3.5 font-mono text-muted-foreground">{u.studentId}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        u.role === 'candidate'
                          ? 'bg-[#fef3c7] text-[#92400e] border-[#fcd34d]'
                          : u.role === 'ec'
                          ? 'bg-primary/8 text-primary border-primary/20'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.isFirstLogin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-[#92400e] bg-[#fef3c7] rounded-full border border-[#fcd34d] font-mono">
                          ● Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-[#065f46] bg-[#d1fae5] rounded-full border border-[#6ee7b7] font-mono">
                          ✓ Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
