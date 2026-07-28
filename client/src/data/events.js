import classicCarImage from '../assets/images/migrated/events/classic-car-event.webp';
import { business, businessAddress } from './business.js';

export const events = [
  {
    id: 'classic-car-event-2026',
    title: 'Classic Car Event',
    start: '2026-08-01T16:00:00-04:00',
    end: '2026-08-01T21:00:00-04:00',
    dateDisplay: 'Saturday, August 1, 2026',
    timeDisplay: '4:00pm–9:00pm',
    location: `${business.name}, ${businessAddress}`,
    description:
      'Enjoy an evening of classic cars, delicious food, sweet treats, and 1950s nostalgia. Bring the whole family for vintage cars, music, fun, and unforgettable memories in a charming historic setting. Guests are invited to dress in their favorite 1950s attire.',
    offer: '$2.50 banana split special',
    image: classicCarImage,
    imageAlt:
      'Classic Car Event poster with a vintage car, tea service, and August 1, 2026 event details',
    width: 1092,
    height: 1194,
  },
];

export function eventStatus(event, now = new Date()) {
  const start = new Date(event.start);
  const end = new Date(event.end || event.start);
  if (now > end) return 'past';
  if (now >= start && now <= end) return 'happening now';
  return 'upcoming';
}
