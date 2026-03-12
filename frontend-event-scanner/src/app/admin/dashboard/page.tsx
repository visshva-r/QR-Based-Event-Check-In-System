'use client';

import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api';

interface Attendee {
  userId: string;
  checkedIn: boolean;
  _id: string;
}

interface Event {
  _id: string;
  title: string;
  attendees: Attendee[];
}

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (err) {
      toast.error('Failed to load attendee data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Optional: Refresh every 10 seconds to show live scans
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toaster position="top-center" />
      
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
          <button 
            onClick={() => window.location.href = '/admin/scanner'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Open Scanner 📷
          </button>
        </div>

        {loading ? (
          <p>Loading records...</p>
        ) : (
          <div className="space-y-10">
            {events.map((event) => (
              <div key={event._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-100 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800">{event.title}</h2>
                  <p className="text-sm text-gray-500">Total Registrations: {event.attendees.length}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-sm uppercase">
                        <th className="px-6 py-4 font-semibold">Student ID</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {event.attendees.map((attendee) => (
                        <tr key={attendee._id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-gray-600">
                            {attendee.userId}
                          </td>
                          <td className="px-6 py-4">
                            {attendee.checkedIn ? (
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                Checked In
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button className="text-gray-400 hover:text-gray-600">Details</button>
                          </td>
                        </tr>
                      ))}
                      {event.attendees.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-10 text-center text-gray-400">
                            No students registered for this event yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}