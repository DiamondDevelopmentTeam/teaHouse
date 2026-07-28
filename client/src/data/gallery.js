import g02 from '../assets/images/migrated/gallery/2.webp';
import g03 from '../assets/images/migrated/gallery/3.webp';
import g04 from '../assets/images/migrated/gallery/4.webp';
import g05 from '../assets/images/migrated/gallery/5.webp';
import g33 from '../assets/images/migrated/gallery/33.webp';
import g2058 from '../assets/images/migrated/gallery/2058827028243106714.webp';
import g2740 from '../assets/images/migrated/gallery/2740942812757184847.webp';
import g2789 from '../assets/images/migrated/gallery/2789366401045653025.webp';
import g4227 from '../assets/images/migrated/gallery/4227058777923651516-1.webp';
import g4396 from '../assets/images/migrated/gallery/4396187483849297326.webp';
import g4488 from '../assets/images/migrated/gallery/4488287254246933174.webp';
import g5490 from '../assets/images/migrated/gallery/5490830109451980870.webp';
import g6816 from '../assets/images/migrated/gallery/6816507045929823066.webp';
import g8702 from '../assets/images/migrated/gallery/8702723562174302751.webp';
import highTea from '../assets/images/migrated/gallery/high-tea.webp';
import party0 from '../assets/images/migrated/gallery/image000000.webp';
import party1 from '../assets/images/migrated/gallery/image000001.webp';
import bridal1 from '../assets/images/migrated/gallery/image000001-1.webp';
import bridal2 from '../assets/images/migrated/gallery/image000002.webp';
import party3 from '../assets/images/migrated/gallery/image000003.webp';
import birthday0 from '../assets/images/migrated/gallery/imagejpeg_0.webp';
import birthday3 from '../assets/images/migrated/gallery/imagejpeg_3.webp';
import birthday4 from '../assets/images/migrated/gallery/imagejpeg_4.webp';
import catering from '../assets/images/migrated/gallery/IMG_0544.webp';
import sign from '../assets/images/migrated/gallery/Outside-Signage.webp';
import patio from '../assets/images/migrated/gallery/tea-party.webp';

const image = (src, width, height, category, caption, alt) => ({
  src,
  width,
  height,
  category,
  caption,
  alt,
});

export const galleryImages = [
  image(birthday3, 768, 1024, 'Private gatherings', 'Birthday celebration at 1890', 'Guests dressed in pink and black outside 1890 Tea House'),
  image(birthday4, 768, 1024, 'Private gatherings', 'Birthday celebration at the historic house', 'Birthday guests gathered on the patio in front of 1890 Tea House'),
  image(birthday0, 768, 1024, 'Private gatherings', 'A birthday in pink', 'Birthday guests gathered at the Tea House entrance'),
  image(party3, 1200, 1600, 'Events', 'February painting party', 'Guests seated together during a painting party'),
  image(party0, 1200, 1600, 'Events', 'Painting party gathering', 'A full gathering inside 1890 Tea House'),
  image(party1, 1600, 1200, 'Events', 'Creating together', 'Guests enjoying a group painting party'),
  image(bridal1, 1600, 1200, 'Private gatherings', 'Bridal party on the patio', 'A bridal party gathered outside the historic Tea House'),
  image(bridal2, 1200, 1600, 'Private gatherings', 'Bridal celebration', 'A bridal party posed in front of the 1890 Tea House'),
  image(g2058, 1200, 1600, 'Tea Rooms', 'A room made for lingering', 'Private Tea Room with a floral mural, sofa, and set tea table'),
  image(g2789, 1200, 1600, 'Tea Rooms', 'An intimate gathering table', 'A small private room set with a pink tablecloth'),
  image(g4227, 1200, 1600, 'Tea Rooms', 'A quiet private setting', 'Private table with tea service and floral art'),
  image(g6816, 1600, 1200, 'Tea Rooms', 'Tea Room details', 'Private Tea Room table with flowers and a garden mural'),
  image(g5490, 1200, 1600, 'Tea Rooms', 'Tea time', 'Black and pink Tea Room arranged with china'),
  image(g4396, 1200, 1600, 'Historic building', 'Historic interior character', 'Fireplace and equestrian artwork inside the Diamond Suites building'),
  image(g4488, 1504, 1600, 'Tea service', 'Art inspired by tea', 'Colorful painting of a whimsical tea party'),
  image(g33, 800, 1422, 'Tea service', 'Floral china', 'Floral teapot and teacups arranged for service'),
  image(g05, 800, 1422, 'Tea service', 'A rosy pour', 'Pink specialty drink on an outdoor table'),
  image(highTea, 1024, 1536, 'Food and charcuterie', 'Signature charcuterie cup', 'Individual charcuterie cup filled with meats, cheese, fruit, and crackers'),
  image(g2740, 1200, 1600, 'Food and charcuterie', 'A board for sharing', 'Charcuterie board with meats, cheese, olives, bread, and fruit'),
  image(g02, 800, 1422, 'Exterior and patio', 'Tea on the patio', 'Guests enjoying an outdoor table beside the Diamond Suites sign'),
  image(g03, 1200, 1600, 'Exterior and patio', 'Patio service', 'Tea House team member serving tea near the outdoor fountain'),
  image(g04, 800, 1422, 'Exterior and patio', 'A table outdoors', 'Guests seated at a patio table'),
  image(g8702, 1200, 1600, 'Historic building', 'The welcome desk', 'Reception area inside the historic Diamond Suites building'),
  image(catering, 1600, 1200, 'Events', '1890 Tea House catering', 'Tea House catering table with beverage dispensers'),
  image(sign, 1200, 1600, 'Exterior and patio', 'Find us at Diamond Suites', 'Diamond Suites roadside directory with the 1890 Tea House listing'),
  image(patio, 1536, 1024, 'Exterior and patio', 'The patio at 1890', 'Pink, white, and black patio tables outside the historic Tea House'),
];

export const galleryCategories = ['All', ...new Set(galleryImages.map(({ category }) => category))];
