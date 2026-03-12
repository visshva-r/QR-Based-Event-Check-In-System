'use client';

import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api';

export default function StudentDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toaster />
      <h1 className="text-2xl font-bold">Student Dashboard</h1>
      <p className="mt-4">If you see this, the export error is fixed!</p>
      
      <div className="mt-8">
        {loading ? <p>Loading events...</p> : (
          events.map((event: any) => (
            <div key={event._id} className="p-4 border mb-2 bg-white rounded shadow">
              {event.name}
            </div>
          ))
        )}
      </div>
    </div>
  );
}