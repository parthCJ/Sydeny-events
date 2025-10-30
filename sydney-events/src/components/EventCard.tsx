'use client';

import { useState } from 'react';
import { Calendar, MapPin, Tag, ExternalLink } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import EmailModal from './EmailModal';

interface Event {
  id: string;
  title: string;
  description?: string;
  venue?: string;
  address?: string;
  startDate: Date | string;
  endDate?: Date | string;
  imageUrl?: string;
  ticketUrl: string;
  price?: string;
  category?: string;
  organizer?: string;
}

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleGetTickets = async (email: string) => {
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, eventId: event.id }),
      });
    } catch (error) {
      console.error('Error saving email:', error);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
        {/* Image */}
        <div className="relative h-48 bg-gray-200">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
              <Calendar className="w-16 h-16 text-white opacity-50" />
            </div>
          )}
          {event.category && (
            <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-md">
              {event.category}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
            {event.title}
          </h3>

          {event.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>
                {formatDate(event.startDate)} at {formatTime(event.startDate)}
              </span>
            </div>

            {event.venue && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="line-clamp-1">{event.venue}</span>
              </div>
            )}

            {event.price && (
              <div className="flex items-center text-sm text-gray-600">
                <Tag className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="font-semibold">{event.price}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowEmailModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            GET TICKETS
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSubmit={handleGetTickets}
        ticketUrl={event.ticketUrl}
        eventTitle={event.title}
      />
    </>
  );
}
