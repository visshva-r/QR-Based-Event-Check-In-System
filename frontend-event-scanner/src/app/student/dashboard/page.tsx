'use client';

import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api';
import ProtectedRoute from '@/components/protected_route';
import TicketPass, { TicketPassData } from '@/components/ticket_pass';
import { formatEventWhen } from '@/lib/format';

interface EventCard {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  time?: string;
  capacity: number;
  registeredCount: number;
  seatsRemaining: number;
  waitlistCount: number;
  isRegistered: boolean;
  isWaitlisted: boolean;
  isCheckedIn: boolean;
  waitlistPosition: number | null;
}

export default function StudentDashboard() {
  const [events, setEvents] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<TicketPassData | null>(null);
  const [ticketLoading, setTicketLoading] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch {
      toast.error('Could not load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRegister = async (eventId: string) => {
    setBusyId(eventId);
    try {
      const res = await api.post(`/events/register/${eventId}`);
      if (res.data.status === 'waitlisted') {
        toast.success(res.data.message);
      } else if (res.data.emailSent === false) {
        toast.success("You're in. Pass is below. Email didn't send.");
      } else {
        toast.success('You’re in. Your pass is on this page.');
      }
      await fetchEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not register');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (eventId: string) => {
    setBusyId(eventId);
    try {
      const res = await api.post(`/events/unregister/${eventId}`);
      toast.success(res.data.message || 'Done');
      await fetchEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not cancel');
    } finally {
      setBusyId(null);
    }
  };

  const openTicket = async (eventId: string) => {
    setTicketLoading(eventId);
    try {
      const res = await api.get(`/events/${eventId}/ticket`);
      setTicket(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Pass not available');
    } finally {
      setTicketLoading(null);
    }
  };

  const passes = events.filter((e) => e.isRegistered);
  const waiting = events.filter((e) => e.isWaitlisted);
  const browse = events.filter((e) => !e.isRegistered && !e.isWaitlisted);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f3efe6] px-5 sm:px-8 py-10">
        <Toaster position="top-center" />
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <p className="text-sm text-stone-500">Loading your passes…</p>
          ) : (
            <>
              <section className="mb-14">
                <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Your passes</h1>
                <p className="text-sm text-stone-600 mt-2">Keep these on your phone at the door. Email is extra.</p>
                {passes.length === 0 ? (
                  <p className="mt-8 text-sm text-stone-500 border border-dashed border-stone-400 px-4 py-8">
                    No passes yet. Claim a seat from the list below.
                  </p>
                ) : (
                  <ul className="mt-6 divide-y divide-stone-300 border border-stone-300 bg-[#faf6ee]">
                    {passes.map((event) => (
                      <li key={event._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                        <div>
                          <p className="font-medium text-stone-900">{event.title}</p>
                          <p className="text-sm text-stone-500">
                            {event.location} · {formatEventWhen(event.date, event.time)}
                            {event.isCheckedIn ? ' · scanned' : ''}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openTicket(event._id)}
                            disabled={ticketLoading === event._id}
                            className="px-3 py-1.5 text-sm bg-stone-900 text-white hover:bg-stone-800"
                          >
                            {ticketLoading === event._id ? 'Opening…' : 'Open pass'}
                          </button>
                          {!event.isCheckedIn && (
                            <button
                              type="button"
                              onClick={() => handleCancel(event._id)}
                              disabled={busyId === event._id}
                              className="px-3 py-1.5 text-sm border border-stone-400 text-stone-600 hover:border-stone-900"
                            >
                              Drop
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {waiting.length > 0 && (
                <section className="mb-14">
                  <h2 className="text-lg font-semibold text-stone-900">Waiting</h2>
                  <p className="text-sm text-stone-500 mt-1">If someone drops, you move up and get a pass.</p>
                  <ul className="mt-4 divide-y divide-stone-300 border border-stone-300">
                    {waiting.map((event) => (
                      <li key={event._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#faf6ee]">
                        <div>
                          <p className="font-medium text-stone-900">{event.title}</p>
                          <p className="text-sm text-stone-500">#{event.waitlistPosition} in line</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCancel(event._id)}
                          disabled={busyId === event._id}
                          className="px-3 py-1.5 text-sm border border-stone-400 text-stone-600"
                        >
                          Leave line
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <h2 className="text-lg font-semibold text-stone-900">Campus events</h2>
                {browse.length === 0 && passes.length + waiting.length > 0 ? (
                  <p className="mt-4 text-sm text-stone-500">You’re on everything that’s open right now.</p>
                ) : browse.length === 0 ? (
                  <p className="mt-4 text-sm text-stone-500">Nothing posted yet. Check with event staff.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-stone-300 border border-stone-300">
                    {browse.map((event) => (
                      <li key={event._id} className="px-4 py-4 bg-[#faf6ee] flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-stone-900">{event.title}</p>
                          <p className="text-sm text-stone-600 mt-1 line-clamp-2">{event.description || 'Details at the door.'}</p>
                          <p className="text-sm text-stone-500 mt-2">
                            {event.location} · {formatEventWhen(event.date, event.time)} · {event.seatsRemaining} of {event.capacity} seats left
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRegister(event._id)}
                          disabled={busyId === event._id}
                          className="px-3 py-1.5 text-sm bg-stone-900 text-white hover:bg-stone-800 shrink-0"
                        >
                          {event.seatsRemaining === 0 ? 'Join waitlist' : 'Take a seat'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {ticket && (
        <div className="fixed inset-0 bg-stone-900/70 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <TicketPass ticket={ticket} onClose={() => setTicket(null)} />
        </div>
      )}
    </ProtectedRoute>
  );
}
