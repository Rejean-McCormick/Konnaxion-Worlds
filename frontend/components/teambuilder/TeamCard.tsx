// frontend/components/teambuilder/TeamCard.tsx
import Image from 'next/image';
import React from 'react';

import { ITeam } from '@/services/teambuilder/types';

interface TeamCardProps {
  team: ITeam;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team }) => {
  // Helper to get initials if no avatar
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  // Helper for role badge colors
  const getRoleBadgeStyle = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('lead') || r.includes('specialist')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h4 className="font-semibold text-gray-800">{team.name}</h4>
        <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
          {team.members.length} members
        </span>
      </div>

      {/* Metrics (Optional: Only show if specific stats exist) */}
      {(team.metrics.avg_skill || team.metrics.diversity_score) && (
        <div className="px-4 py-2 border-b border-gray-100 bg-slate-50 flex gap-4 text-xs text-gray-600">
          {team.metrics.avg_skill && (
            <span>Avg Skill: <strong>{team.metrics.avg_skill}</strong></span>
          )}
          {team.metrics.diversity_score && (
            <span>Diversity: <strong>{team.metrics.diversity_score}</strong></span>
          )}
        </div>
      )}

      {/* Members List */}
      <div className="p-4 flex-1 overflow-y-auto">
        <ul className="space-y-3">
          {team.members.map((member) => (
            <li key={member.id} className="flex items-start gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold border border-indigo-200 overflow-hidden">
                {member.user.avatar_url ? (
                  <Image
                    src={member.user.avatar_url}
                    alt={member.user.username}
                    width={40}
                    height={40}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(member.user.name || member.user.username)
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {member.user.name || member.user.username}
                  </p>
                  
                  {member.suggested_role && (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${getRoleBadgeStyle(member.suggested_role)}`}>
                      {member.suggested_role}
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 mt-0.5">
                   {member.user.email}
                </p>
                
                {/* Match Reason (Debug/Transparency) */}
                {member.match_reason && (
                  <p className="text-[10px] text-gray-400 mt-1 italic leading-tight">
                    "{member.match_reason}"
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Footer / Actions (Placeholder) */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
         <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
            View Details
         </button>
      </div>
    </div>
  );
};