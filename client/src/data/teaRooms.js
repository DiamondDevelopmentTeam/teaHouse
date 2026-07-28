import roomOne from '../assets/images/migrated/rooms/room-one.webp';
import roomTwo from '../assets/images/migrated/rooms/room-two.webp';
import roomThree from '../assets/images/migrated/rooms/room-three.webp';

export const teaRooms = [
  {
    id: 'private-tea-room',
    label: 'Private Tea Room',
    description:
      'A beautifully styled setting for afternoon tea, birthdays, bridal showers, book clubs, and unrushed conversation.',
    uses: ['Afternoon tea', 'Small celebrations', 'Private gatherings'],
    image: roomOne,
    imageAlt: 'A private room at 1890 Tea House with tea service set for guests',
    width: 1600,
    height: 1200,
  },
  {
    id: 'gathering-room',
    label: 'Gathering Space',
    description:
      'An intimate room for friends, families, or colleagues to share food, tea, and time together.',
    uses: ['Birthdays', 'Book clubs', 'Business gatherings'],
    image: roomTwo,
    imageAlt: 'An intimate private gathering room at 1890 Tea House',
    width: 1200,
    height: 1600,
  },
  {
    id: 'patio',
    label: 'Outdoor Patio',
    description:
      'A welcoming, garden-like outdoor setting available when weather and availability allow.',
    uses: ['Casual lunches', 'Tea outdoors', 'Seasonal gatherings'],
    image: roomThree,
    imageAlt: 'The pink, black, and white outdoor patio at 1890 Tea House',
    width: 1200,
    height: 1600,
  },
];
