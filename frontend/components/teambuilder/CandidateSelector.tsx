// frontend/components/teambuilder/CandidateSelector.tsx
import Image from 'next/image';
import React, { useMemo, useState } from 'react';

import { ITeambuilderUser } from '@/services/teambuilder/types';

interface CandidateSelectorProps {
  candidates: ITeambuilderUser[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export const CandidateSelector: React.FC<CandidateSelectorProps> = ({
  candidates,
  selectedIds,
  onChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // ---------------------------------------------------------------------------
  // Filtering Logic
  // ---------------------------------------------------------------------------
  const filteredCandidates = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    return candidates.filter(
      (c) =>
        c.username.toLowerCase().includes(lowerTerm) ||
        (c.name && c.name.toLowerCase().includes(lowerTerm)) ||
        c.email.toLowerCase().includes(lowerTerm)
    );
  }, [candidates, searchTerm]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const toggleCandidate = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAllFiltered = () => {
    const visibleIds = filteredCandidates.map((c) => c.id);
    // Merge unique IDs
    const newSelection = Array.from(new Set([...selectedIds, ...visibleIds]));
    onChange(newSelection);
  };

  const deselectAllFiltered = () => {
    const visibleIds = filteredCandidates.map((c) => c.id);
    // Remove visible IDs from selection
    onChange(selectedIds.filter((sid) => !visibleIds.includes(sid)));
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Select Candidates
          <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {selectedIds.length} selected
          </span>
        </h3>

        <div className="w-full md:w-auto flex gap-2">
          <input
            type="text"
            placeholder="Search users..."
            className="border border-gray-300 rounded px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4 text-sm">
        <button
          onClick={selectAllFiltered}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Select All Visible
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={deselectAllFiltered}
          className="text-gray-500 hover:text-gray-700"
        >
          Deselect All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
        {filteredCandidates.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No candidates found.
          </div>
        ) : (
          filteredCandidates.map((user) => {
            const isSelected = selectedIds.includes(user.id);
            return (
              <div
                key={user.id}
                onClick={() => toggleCandidate(user.id)}
                className={`
                  cursor-pointer flex items-center p-3 rounded border transition-all duration-200
                  ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }
                `}
              >
                {/* Checkbox Visual */}
                <div
                  className={`
                    w-5 h-5 rounded border mr-3 flex items-center justify-center flex-shrink-0
                    ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-gray-300 bg-white'
                    }
                  `}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                    </svg>
                  )}
                </div>

                {/* Avatar / Initials */}
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold mr-3 flex-shrink-0 overflow-hidden">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.username}
                      width={40}
                      height={40}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (user.name || user.username).substring(0, 2).toUpperCase()
                  )}
                </div>

                {/* Text Info */}
                <div className="overflow-hidden">
                  <p className="font-medium text-gray-900 truncate">
                    {user.name || user.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};