'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

type Student = {
  _id: Id<'users'>;
  name: string;
  studentId: string;
  role: string;
};

type Props = {
  value: string;
  onChange: (userId: string) => void;
  excludeUserIds: Id<'users'>[];
  placeholder?: string;
};

export default function StudentSearchCombobox({
  value,
  onChange,
  excludeUserIds,
  placeholder = 'Search by name or student ID…',
}: Props) {
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(inputValue), 300);
    return () => clearTimeout(t);
  }, [inputValue]);

  const shouldSearch = debouncedSearch.trim().length >= 2;
  const results = useQuery(
    api.users.searchStudents,
    shouldSearch ? { searchText: debouncedSearch, excludeUserIds } : 'skip',
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset display name when value is cleared externally
  useEffect(() => {
    if (!value) setInputValue('');
  }, [value]);

  const handleSelect = (student: Student) => {
    setInputValue(student.name);
    setIsOpen(false);
    setActiveIndex(-1);
    onChange(student._id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    if (value) onChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const list = results ?? [];
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, list.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0 && list[activeIndex]) {
      e.preventDefault();
      handleSelect(list[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const showDropdown = isOpen && shouldSearch;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => { if (inputValue.length >= 2) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="block w-full px-3 py-2 pr-8 text-xs border border-border bg-card rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none font-sans"
        />
        {value && (
          <button
            type="button"
            onClick={() => { setInputValue(''); onChange(''); inputRef.current?.focus(); }}
            aria-label="Clear selection"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground leading-none text-[10px]"
          >
            ✕
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          {results === undefined ? (
            <p className="px-3 py-3 text-xs text-muted-foreground text-center">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-muted-foreground text-center">No eligible students found.</p>
          ) : (
            <ul className="max-h-52 overflow-y-auto py-1">
              {results.map((s, i) => (
                <li
                  key={s._id}
                  onMouseDown={() => handleSelect(s)}
                  className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                    i === activeIndex
                      ? 'bg-primary/8 text-primary'
                      : 'hover:bg-muted/60 text-foreground'
                  }`}
                >
                  <span className="text-xs font-medium truncate">{s.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">{s.studentId}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
