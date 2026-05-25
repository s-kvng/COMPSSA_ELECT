'use client';

import React, { useState } from 'react';
import { useIsMounted } from '@/hooks/useIsMounted';
import { createPortal } from 'react-dom';
import { useAuthContext } from '@/features/auth/mockAuth';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Search01Icon,
  Upload01Icon,
  Alert01Icon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';

export default function StudentsPage() {
  const { users, importStudents } = useAuthContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState(
    'name,studentId,email\nJohn Doe,COMP-501,john@compssa.org\nMary Jane,COMP-502,mary@compssa.org\nYaw Appiah,COMP-503,yaw@compssa.org'
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    errors: string[];
    credentialsCsv?: string;
  } | null>(null);
  const isMounted = useIsMounted();

  const studentList = users.filter((u) => u.role === 'Student' || u.role === 'Candidate');

  const filteredStudents = studentList.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  const handleBulkImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParseError(null);
    setImportResult(null);

    const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) {
      setParseError('CSV is empty or has no data rows below the header.');
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const nameIdx = headers.indexOf('name');
    const idIdx = headers.indexOf('studentid');
    const emailIdx = headers.indexOf('email');

    if (nameIdx === -1 || idIdx === -1 || emailIdx === -1) {
      setParseError('Header row must contain "name", "studentId", and "email" columns.');
      return;
    }

    const compiled: Partial<typeof users[0]>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 3) continue;
      compiled.push({ name: cols[nameIdx], studentId: cols[idIdx], email: cols[emailIdx], role: 'Student' });
    }

    setImportResult(importStudents(compiled));
  };

  const downloadCredentialFile = () => {
    if (!importResult?.credentialsCsv) return;
    const blob = new Blob([importResult.credentialsCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Imported_Student_Credentials.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closeModal = () => {
    setShowImportModal(false);
    setParseError(null);
    setImportResult(null);
  };

  return (
    <div className="space-y-6 font-sans py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-fade-in select-none">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div className="space-y-1">
          <h2 className="font-sans font-bold text-2xl text-foreground">Students Registry</h2>
          <p className="text-xs text-muted-foreground">
            Register administrative voters, configure credentials and audit active profiles.
          </p>
        </div>
        <button
          onClick={() => { setImportResult(null); setParseError(null); setShowImportModal(true); }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0"
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
          Registry count: <strong className="text-foreground ml-1">{studentList.length}</strong>
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
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-muted-foreground text-xs">
                    No matching student profiles found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-foreground">{u.name}</td>
                    <td className="px-5 py-3.5 font-mono text-muted-foreground">{u.studentId}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        u.role === 'Candidate'
                          ? 'bg-[#fef3c7] text-[#92400e] border-[#fcd34d]'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.firstLoginPending ? (
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

      {/* Bulk import modal — portal so it covers full viewport */}
      {showImportModal && isMounted && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div>
              <h3 className="font-sans font-bold text-base text-foreground">Bulk Import Students</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Paste CSV rows below. Header must include{' '}
                <code className="font-mono text-primary text-[11px]">name, studentId, email</code>.
              </p>
            </div>

            {importResult ? (
              <div className="space-y-4">
                {importResult.successCount > 0 && (
                  <div className="bg-[#d1fae5] border border-[#6ee7b7] p-4 rounded-xl space-y-3">
                    <div className="flex gap-2.5 items-center text-[#065f46] text-xs">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-5 w-5 shrink-0" />
                      <span>
                        <strong>{importResult.successCount}</strong> student{importResult.successCount > 1 ? 's' : ''} imported successfully.
                      </span>
                    </div>
                    <button
                      onClick={downloadCredentialFile}
                      className="w-full py-2 text-xs font-semibold text-white rounded-lg transition-all"
                      style={{ backgroundColor: 'var(--color-success)' }}
                    >
                      Download Credentials CSV
                    </button>
                    <p className="text-[10px] text-[#047857] leading-relaxed">
                      Contains the default login passwords for each imported student.
                    </p>
                  </div>
                )}

                {importResult.errors.length > 0 && (
                  <div className="bg-destructive/8 border border-destructive/20 p-4 rounded-xl space-y-2">
                    <div className="flex gap-2 items-center text-destructive text-xs font-semibold">
                      <HugeiconsIcon icon={Alert01Icon} className="h-4 w-4 shrink-0" />
                      {importResult.errors.length} validation error{importResult.errors.length > 1 ? 's' : ''}
                    </div>
                    <div className="max-h-28 overflow-y-auto no-scrollbar text-[10px] space-y-1 font-mono text-destructive/80">
                      {importResult.errors.map((err, i) => (
                        <div key={i}>• {err}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2.5 text-sm font-medium text-foreground border border-border rounded-xl hover:bg-muted transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBulkImportSubmit} className="space-y-4">
                {parseError && (
                  <div className="flex gap-2 items-start p-3 bg-destructive/8 border border-destructive/20 rounded-xl text-xs text-destructive">
                    <HugeiconsIcon icon={Alert01Icon} className="h-4 w-4 shrink-0 mt-0.5" />
                    {parseError}
                  </div>
                )}

                <textarea
                  required
                  rows={8}
                  value={csvText}
                  onChange={(e) => { setCsvText(e.target.value); setParseError(null); }}
                  className="block w-full px-3 py-2.5 text-xs border border-border bg-input rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none font-mono leading-relaxed"
                  placeholder="name,studentId,email"
                />

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2.5 text-sm font-medium text-foreground border border-border rounded-xl hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition-all"
                  >
                    Import Students
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
