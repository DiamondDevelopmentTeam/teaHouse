export const business = {
  name: '1890 Tea House',
  legalName: '1890 Tea House',
  description:
    'A modern tea house, restaurant, and gathering place in the historic Diamond Suites building in downtown Ocala.',
  phone: '352-244-8368',
  phoneHref: 'tel:+13522448368',
  email: 'ashley@1890teahouse.com',
  address: {
    street: '917 E Silver Springs Blvd',
    locality: 'Ocala',
    region: 'FL',
    postalCode: '34470',
    country: 'US',
  },
  hours: [
    { label: 'Monday–Tuesday', days: ['Monday', 'Tuesday'], display: 'Closed', opens: null, closes: null },
    { label: 'Wednesday–Thursday', days: ['Wednesday', 'Thursday'], display: '11:00am–7:00pm', opens: '11:00', closes: '19:00' },
    { label: 'Friday–Saturday', days: ['Friday', 'Saturday'], display: '11:00am–9:00pm', opens: '11:00', closes: '21:00' },
    { label: 'Sunday', days: ['Sunday'], display: '11:00am–4:00pm', opens: '11:00', closes: '16:00' },
  ],
  reservationUrl:
    import.meta.env.VITE_RESERVATION_URL ||
    'https://tables.toasttab.com/restaurants/d470b089-02bc-4930-8828-ada15babda58/findTime',
  applicationUrl: '/server-application',
  directionsUrl:
    'https://www.google.com/maps/search/?api=1&query=1890+Tea+House+917+E+Silver+Springs+Blvd+Ocala+FL+34470',
  socials: [
    { label: 'Instagram', href: 'https://www.instagram.com/1890teahouse/' },
    { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61582592901231' },
    { label: 'TikTok', href: 'https://www.tiktok.com/@1890.tea.house' },
    { label: 'Yelp', href: 'https://www.yelp.com/biz/1890-tea-house-ocala?osq=1890+Tea+House' },
  ],
};

// Owner confirmation requested: the source Contact page lists 352-244-8367,
// while the source footer and reservation page consistently list 352-244-8368.
// The repeated 352-244-8368 value is canonical here.
//
// Owner confirmation requested: the source Contact page says Monday–Thursday
// 11am–7pm, while the repeated footer schedule says Monday–Tuesday closed and
// Wednesday–Thursday 11am–7pm. The repeated footer schedule is canonical here.

export const businessAddress = `${business.address.street}, ${business.address.locality}, ${business.address.region} ${business.address.postalCode}`;

export const navigation = [
  { label: 'About', to: '/about', type: 'route' },
  { label: 'Menus', to: '/menus', type: 'route' },
  { label: 'Events', to: '/events', type: 'route' },
  { label: 'Reservations', to: '/reservations', type: 'route' },
  { label: 'Tea Rooms', to: '/tea-rooms', type: 'route' },
  { label: 'News', to: '/news', type: 'route' },
  { label: 'Gallery', to: '/gallery', type: 'route' },
  { label: 'FAQs', to: '/faqs', type: 'route' },
  { label: 'Journal', to: '/journal', type: 'route' },
  { label: 'Contact', to: '/contact', type: 'route' },
  { label: 'Careers', to: '/careers', type: 'route' },
  { label: 'Join Our Team', to: '/server-application', type: 'route' },
];

export const primaryNavigation = [
  { label: 'Our Story', to: '/about', type: 'route' },
  { label: 'Tea & Dining', to: '/menus', type: 'route' },
  { label: 'Gatherings', to: '/reservations', type: 'route' },
  { label: 'Visit', to: '/contact', type: 'route' },
];

export const footerNavigationGroups = [
  {
    label: 'Explore',
    items: [
      { label: 'Home', to: '/', type: 'route' },
      { label: 'About', to: '/about', type: 'route' },
      { label: 'Menus', to: '/menus', type: 'route' },
      { label: 'News', to: '/news', type: 'route' },
      { label: 'Gallery', to: '/gallery', type: 'route' },
      { label: 'Journal', to: '/journal', type: 'route' },
    ],
  },
  {
    label: 'Plan Your Visit',
    items: [
      { label: 'Reservations', to: '/reservations', type: 'route' },
      { label: 'Tea Rooms', to: '/tea-rooms', type: 'route' },
      { label: 'Events', to: '/events', type: 'route' },
      { label: 'FAQs', to: '/faqs', type: 'route' },
      { label: 'Contact', to: '/contact', type: 'route' },
    ],
  },
  {
    label: 'Work With Us',
    items: [
      { label: 'Careers', to: '/careers', type: 'route' },
      { label: 'Server Application', to: '/server-application', type: 'route' },
    ],
  },
];
