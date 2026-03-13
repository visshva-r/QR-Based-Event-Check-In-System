'use client';

import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api';
import ProtectedRoute from '@/components/protected_route';

// Matches your backend JSON structure perfectly
interface Event {
  _id: string;
  title: string;       
  description: string;
  date: string;
  location: string;
  time?: string;
}

export default function StudentDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch events on page load
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events'); 
        setEvents(res.data);
      } catch (err) {
        toast.error('Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Registration handler
  const handleRegister = async (eventId: string) => {
    try {
      toast.loading('Registering...', { id: 'reg' });
      const res = await api.post(`/events/register/${eventId}`);
      toast.success('Registered! Check your email for the QR code.', { id: 'reg' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed', { id: 'reg' });
    }
  };

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <Toaster position="top-center" />
      
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-500 mt-2">Discover and register for upcoming campus events.</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div key={event._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Upcoming
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h2>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {event.description}
                  </p>
                  
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className="mr-2">📅</span>
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        month: 'long', day: 'numeric', year: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">📍</span>
                      {event.location}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={() => handleRegister(event._id)}
                    className="w-full bg-blue-600 text-white font-semibold py-2 rounded-xl hover:bg-blue-700 transition-all active:scale-95"
                  >
                    Register Now
                  </button>
                </div>
              </div>
            ))}

            {events.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 text-lg">No events found at the moment.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}