'use client';

import { formatEventWhen, shortTicketId } from '@/lib/format';

export type TicketPassData = {
  qrCode: string;
  ticketId: string;
  checkedIn: boolean;
  holder?: { name?: string; email?: string; studentId?: string };
  event: {
    title: string;
    location: string;
    date: string;
    time?: string;
  };
};

export default function TicketPass({ ticket, onClose }: { ticket: TicketPassData; onClose?: () => void }) {
  return (
    <div className="w-full max-w-sm bg-[#faf6ee] border border-stone-400">
      <div className="bg-stone-900 text-[#faf6ee] px-4 py-2 flex justify-between items-center font-mono text-[11px] tracking-[0.18em]">
        <span>GATE</span>
        <span>{ticket.checkedIn ? 'USED' : 'ADMIT ONE'}</span>
      </div>
      <div className="p-5">
        <p className="font-mono text-[11px] text-stone-500 tracking-wider">
          PASS {shortTicketId(ticket.ticketId)}
        </p>
        <h2 className="text-2xl font-semibold text-stone-900 mt-1 leading-tight">{ticket.event.title}</h2>
        <p className="text-sm text-stone-800 mt-3">{ticket.holder?.name || 'Student'}</p>
        {ticket.holder?.studentId && (
          <p className="text-xs text-stone-500 font-mono mt-0.5">{ticket.holder.studentId}</p>
        )}
        <p className="text-sm text-stone-600 mt-3">
          {ticket.event.location}
          <br />
          {formatEventWhen(ticket.event.date, ticket.event.time)}
        </p>
        <div className="my-4 border-t border-dashed border-stone-400" />
        <img src={ticket.qrCode} alt="" className="w-48 h-48 mx-auto bg-white p-1" />
        <p className="text-center text-xs text-stone-500 mt-3">
          {ticket.checkedIn ? 'Already scanned at the door' : 'Show this at the door.'}
        </p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full py-2.5 text-sm border border-stone-400 hover:bg-stone-900 hover:text-white"
          >
            Put pass away
          </button>
        )}
      </div>
    </div>
  );
}
