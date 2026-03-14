'use client';

import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api';
import ProtectedRoute from '@/components/protected_route';

interface Event {
  _id: string;
  title: string;       
  description: string;
  date: string;
  location: string;
  time?: string;
  attendees?: { userId: string | { _id: string }; checkedIn?: boolean }[];
}

export default function StudentDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(typeof window !== 'undefined' ? localStorage.getItem('userId') : null);
  }, []);

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

  const isRegistered = (event: Event) => {
    if (!userId || !event.attendees) return false;
    return event.attendees.some((a: { userId: string | { _id: string } }) => {
      const uid = typeof a.userId === 'object' ? a.userId?._id : a.userId;
      return String(uid) === String(userId);
    });
  };

  const handleRegister = async (eventId: string) => {
    try {
      toast.loading('Registering...', { id: 'reg' });
      await api.post(`/events/register/${eventId}`);
      toast.success('Registered! Check your email for the QR code.', { id: 'reg' });
      // Refresh events to update registration state
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed', { id: 'reg' });
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-neutral-50 p-6 sm:p-8">
        <Toaster position="top-center" />
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-black">Events</h1>
            <p className="text-neutral-600 text-sm mt-1">Discover and register for upcoming campus events.</p>
          </header>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="size-10 border-2 border-neutral-300 border-t-black rounded-full animate-spin" aria-hidden />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const registered = isRegistered(event);
                return (
                  <article key={event._id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col">
                    <div className="p-4 sm:p-5 flex-grow">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${
                        registered ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {registered ? 'Registered' : 'Upcoming'}
                      </span>
                      <h2 className="text-lg font-semibold text-black mb-2">{event.title}</h2>
                      <p className="text-neutral-600 text-sm line-clamp-3 mb-4">
                        {event.description || 'No description.'}
                      </p>
                      <div className="space-y-1.5 text-sm text-neutral-500">
                        <div className="flex items-center gap-2">
                          <span aria-hidden>📅</span>
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-2">
                          <span aria-hidden>📍</span>
                          {event.location}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={() => handleRegister(event._id)}
                        disabled={registered}
                        className={`w-full py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                          registered
                            ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-neutral-800'
                        }`}
                      >
                        {registered ? 'Already registered' : 'Register'}
                      </button>
                    </div>
                  </article>
                );
              })}

              {events.length === 0 && (
                <div className="col-span-full text-center py-16 bg-white rounded-xl border-2 border-dashed border-neutral-200">
                  <p className="text-neutral-500">No events right now.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
