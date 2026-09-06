// frontend/app/teambuilder/page.tsx
'use client';

import { format } from 'date-fns'; // You might need to install date-fns: npm install date-fns
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { teambuilderService } from '@/services/teambuilder';
import { IBuilderSession } from '@/services/teambuilder/types';


export default function TeamBuilderDashboard() {
  const [sessions, setSessions] = useState<IBuilderSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await teambuilderService.getSessions();
        setSessions(data);
      } catch (err) {
        setError('Failed to load sessions. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Builder Sessions</h1>
          <p className="text-gray-600 mt-1">
            Manage your team generation history and create new groups.
          </p>
        </div>
        {/* The "New Session" button is already in the layout, but having a prominent one here is good UX too */}
        <Link href="/teambuilder/create">
           <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
             </svg>
             Start New Session
           </button>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">No sessions yet</h3>
          <p className="text-gray-500 mt-1 mb-6 max-w-sm mx-auto">
            Get started by creating a new session to generate teams based on skills and compatibility.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <Link key={session.id} href={`/teambuilder/${session.id}`}>
              <div className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                    {session.name}
                  </h2>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                    ${session.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                      session.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' : 
                      'bg-gray-100 text-gray-800'}`}>
                    {session.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">
                  {session.description || "No description provided."}
                </p>
                
                <div className="border-t border-gray-100 pt-4 mt-2 space-y-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Candidates</span>
                     <span className="font-medium">{session.candidates_count}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Teams Created</span>
                     <span className="font-medium">{session.teams?.length || 0}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Date</span>
                     <span className="font-medium">
                       {session.created_at ? format(new Date(session.created_at), 'MMM d, yyyy') : '-'}
                     </span>
                   </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}