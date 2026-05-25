/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/features/auth/mockAuth';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, PlusSignIcon, Upload01Icon, Alert01Icon, Shield01Icon } from '@hugeicons/core-free-icons';

export default function StudentsPage() {
  const { users, importStudents } = useAuthContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState(
    "name,studentId,email\n" +
    "John Doe,COMP-501,john@compssa.org\n" +
    "Mary Jane,COMP-502,mary@compssa.org\n" +
    "Yaw Appiah,COMP-503,yaw@compssa.org"
  );
  const [importResult, setImportResult] = useState<{
    successCount: number;
    errors: string[];
    credentialsCsv?: string;
  } | null>(null);

  // Filter students out of standard list (hiding HOD/EC if needed, or including all)
  const studentList = users.filter(u => u.role === 'Student' || u.role === 'Candidate');

  const filteredStudents = studentList.filter(student => {
    const query = searchQuery.toLowerCase().trim();
    return (
      student.name.toLowerCase().includes(query) ||
      student.studentId.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query)
    );
  });

  const handleBulkImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportResult(null);

    // Basic client parsing
    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length <= 1) {
      alert('The CSV input is empty or missing data rows.');
      return;
    }

    // Check header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIdx = headers.indexOf('name');
    const idIdx = headers.indexOf('studentid');
    const emailIdx = headers.indexOf('email');

    if (nameIdx === -1 || idIdx === -1 || emailIdx === -1) {
      alert('Error: CSV must include a header row with "name, studentId, email" columns.');
      return;
    }

    const compiledStudentsList: Partial<typeof users[0]>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',').map(col => col.trim().replace(/^"|"$/g, ''));
      if (columns.length < 3) continue;

      compiledStudentsList.push({
        name: columns[nameIdx],
        studentId: columns[idIdx],
        email: columns[emailIdx],
        role: 'Student'
      });
    }

    const res = importStudents(compiledStudentsList);
    setImportResult(res);
  };

  const downloadCredentialFile = () => {
    if (!importResult?.credentialsCsv) return;
    const blob = new Blob([importResult.credentialsCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Imported_Student_Credentials.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="students-panel" className="space-y-6 font-sans py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-fade-in select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <h2 className="font-display font-extrabold text-2xl text-slate-900 font-bold">Students Registry</h2>
          <p className="text-xs text-slate-500">Register administrative voters, configure credentials and audit active profiles.</p>
        </div>
        <button
          onClick={() => {
            setImportResult(null);
            setShowImportModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <HugeiconsIcon icon={Upload01Icon} className="h-4.5 w-4.5" />
          <span>Bulk Import CSV</span>
        </button>
      </div>

      {/* Stats and Search bar Row */}
      <div className="flex flex-col sm:flex-row gap-3 select-all">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HugeiconsIcon icon={Search01Icon} className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            required
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-200 bg-white rounded-lg focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            placeholder="Search students by name, ID or email..."
          />
        </div>
        <div className="bg-slate-100 border text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center justify-center shrink-0">
          <span>Student registry count: <strong className="text-slate-900 font-bold ml-1">{studentList.length}</strong></span>
        </div>
      </div>

      {/* Roster Table Grid */}
      <div className="bg-white border rounded-2xl overflow-hidden shadow-3xs select-text">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-mono text-[10px] uppercase">
                <th className="px-6 py-4 font-bold">Student Name</th>
                <th className="px-6 py-4 font-bold">Student ID</th>
                <th className="px-6 py-4 font-bold">Email Reference</th>
                <th className="px-6 py-4 font-bold">Active Role</th>
                <th className="px-6 py-4 font-bold">Portal Password Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No matching student profiles found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/40">
                    <td className="px-6 py-4 font-semibold text-slate-900">{u.name}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{u.studentId}</td>
                    <td className="px-6 py-4 text-slate-500">{u.email}</td>
                    <td className="px-6 py-4 text-slate-550 font-medium">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        u.role === 'Candidate'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.firstLoginPending ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 rounded-full border border-amber-200 font-mono">
                          ● Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold text-green-700 bg-green-50 rounded-full border border-green-200 font-mono">
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

      {/* Bulk CSV Import Modal Sheet - INTUATIVE DESIGN COPIER */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl text-left">
            <h3 className="font-display font-extrabold text-base text-slate-900">Bulk Import Student Profiles</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Provide csv row lines. Format: columns must contain a header row specifying <strong>name, studentId, email</strong>.
            </p>

            {importResult ? (
              <div className="space-y-4 font-sans border-t pt-2">
                {importResult.successCount > 0 && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex flex-col gap-3">
                    <div className="flex gap-2.5 items-center text-green-800 text-xs">
                      <HugeiconsIcon icon={Shield01Icon} className="h-5 w-5 text-green-600" />
                      <span>
                        Successfully loaded <strong>{importResult.successCount}</strong> new students records.
                      </span>
                    </div>

                    <button
                      onClick={downloadCredentialFile}
                      className="inline-flex items-center justify-center gap-1.5 text-xs text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold cursor-pointer"
                    >
                      <span>Download Temporary Credentials CSV</span>
                    </button>
                    <p className="text-[10px] text-green-600 leading-normal">
                      Downloading this sheet provides default secure start passwords corresponding to each imported student ID.
                    </p>
                  </div>
                )}

                {importResult.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-xl space-y-2">
                    <div className="flex gap-2 items-center text-red-800 text-xs font-bold">
                      <HugeiconsIcon icon={Alert01Icon} className="h-4.5 w-4.5 text-red-600" />
                      <span>Validation Errors found ({importResult.errors.length})</span>
                    </div>
                    <div className="max-h-24 overflow-y-auto custom-scrollbar pr-2 text-[10px] space-y-1 font-mono text-red-700">
                      {importResult.errors.map((err, i) => (
                        <div key={i}>• {err}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 bg-slate-950 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Close Portal
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBulkImportSubmit} className="space-y-4">
                <textarea
                  required
                  rows={8}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="block w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50/50 rounded-md focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none font-mono"
                  placeholder="name,studentId,email"
                />

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 border border-slate-200 rounded-md transition-all outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                  >
                    Perform Roster Import
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

