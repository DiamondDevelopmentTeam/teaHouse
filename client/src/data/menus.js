import afternoonTeaImage from '../assets/images/migrated/menus/afternoon-tea.webp';
import allDayImage from '../assets/images/migrated/menus/all-day.webp';
import boardImage from '../assets/images/migrated/menus/charcuterie-board.webp';
import cupsImage from '../assets/images/migrated/menus/charcuterie-cups.webp';
import kidsImage from '../assets/images/migrated/menus/kids.webp';
import nonAlcoholicImage from '../assets/images/migrated/menus/non-alcoholic.webp';
import wineImage from '../assets/images/migrated/menus/wine.webp';

const pdf = (name) => `${import.meta.env.BASE_URL}menus/${name}.pdf`;

export const menus = [
  {
    id: 'all-day',
    title: 'All Day Menu',
    description: 'Savory lunch favorites, pastries, fruit, and desserts.',
    image: allDayImage,
    imageAlt: 'All Day Menu with à la carte savory items and desserts',
    width: 563,
    height: 1613,
    pdf: pdf('all-day'),
  },
  {
    id: 'charcuterie-board',
    title: 'Build Your Own Charcuterie Board',
    description: 'Choose artisanal meats, cheeses, crackers, and accompaniments.',
    image: boardImage,
    imageAlt: 'Build Your Own Charcuterie Board menu with choices and board sizes',
    width: 698,
    height: 2000,
    pdf: pdf('charcuterie-board'),
  },
  {
    id: 'charcuterie-cups',
    title: 'Charcuterie Cups',
    description: 'Individual savory and sweet pairings for adults and children.',
    image: cupsImage,
    imageAlt: 'Charcuterie Cups menu with four individual cup choices',
    width: 563,
    height: 1613,
    pdf: pdf('charcuterie-cups'),
  },
  {
    id: 'afternoon-tea',
    title: 'Afternoon Tea Experience',
    description: 'A three-tier service of savories, fresh bakes, confections, and tea.',
    image: afternoonTeaImage,
    imageAlt: 'Afternoon Tea Experience three-tier menu',
    width: 698,
    height: 2000,
    pdf: pdf('afternoon-tea'),
  },
  {
    id: 'kids',
    title: 'Kids Menu',
    description: 'Familiar favorites and a children’s charcuterie cup.',
    image: kidsImage,
    imageAlt: 'Kids Menu with sandwiches, chicken tenders, fries, fruit, and charcuterie',
    width: 1294,
    height: 2000,
    pdf: pdf('kids'),
  },
  {
    id: 'non-alcoholic',
    title: 'Tea, Coffee & Non-Alcoholic Drinks',
    description: 'Coffee, tea by the pot, sodas, and bottled water.',
    image: nonAlcoholicImage,
    imageAlt: 'Non-alcoholic drink menu with coffee, tea, soda, and water',
    width: 698,
    height: 2000,
    pdf: pdf('non-alcoholic'),
  },
  {
    id: 'wine',
    title: 'Wine, Beer & Specialty Drinks',
    description: 'Wine by the glass or bottle, bottled beer, mimosas, sangria, and rosé.',
    image: wineImage,
    imageAlt: 'Wine, beer, and specialty drinks menu',
    width: 563,
    height: 1613,
    pdf: pdf('wine'),
  },
];

export const menuSections = [
  {
    title: 'All Day Savories',
    items: [
      ['Smoked Salmon on Toast', '$14'],
      ['Bacon Egg Salad Croissant', '$11'],
      ['Chicken Salad Croissant', '$11'],
      ['Tuna Salad Croissant', '$11'],
      ['Cucumber & Dill Sando', '$9'],
      ['Chicken Pesto Pasta Salad', '$9'],
      ['Perfect Pasta Salad', '$7'],
      ['Chicken Caesar Salad Wrap', '$10'],
      ['Hummus-Stuffed Mini Peppers', '$7'],
      ['Veggie Wrap Supreme', '$10'],
      ['Cucumber Salad', '$7'],
      ['Chicken Tenders & Fries', '$13'],
      ['Sausage & Cheese Muffin or Croissant', '$11'],
      ['Ham & Cheese Croissant or Muffin', '$11'],
      ['Turkey & Cheese Croissant or Muffin', '$11'],
    ],
    note: 'Add bacon to any croissant or muffin for $1.50.',
  },
  {
    title: 'Desserts & Fresh Bakes',
    items: [
      ['Scones', '$5'],
      ['Macarons, three-pack', '$3'],
      ['Red Velvet Cake Roll', '$2.50'],
      ['Fruit Salad', '$5'],
      ['Yogurt Parfait', '$6'],
      ['Cheesecake-Stuffed Strawberries', '$6'],
      ['Cheesecake Slices', '$7'],
      ['Pumpkin Cake Roll', '$2.50'],
      ['Cinnamon Swirls', '$2'],
      ['Mini Dessert Shooter', '$5'],
      ['Jumbo Cookie', '$4'],
      ['Tiramisu Truffle Balls', '$7'],
      ['Pastry Blossom Apple Berry', '$5'],
    ],
  },
  {
    title: 'Charcuterie Cups',
    items: [
      ['Classic Ocala', '$10'],
      ['The Tea House Bite', '$13'],
      ['Kids Picnic', '$9'],
      ['The Sweet Meadow', '$10'],
    ],
  },
  {
    title: 'Afternoon Tea',
    items: [
      ['Three-tier Afternoon Tea Experience, includes tea', '$60'],
      ['Basket of scones and a pot of tea', '$29.95'],
    ],
    note:
      'The three-tier service includes martini crostini, smoked salmon tartine, chicken salad canapés, cucumber and dill sando, warm scones with strawberry jam, lemon curd and butter, and three confections. Clotted cream is available upon request.',
  },
  {
    title: 'Tea & Coffee',
    items: [
      ['Regular brewed coffee, hot or iced', '$3.75'],
      ['Espresso', '$3'],
      ['Cappuccino', '$4.75'],
      ['Latte', '$4.75'],
      ['Latte Macchiato', '$4.75'],
      ['Cold Brew', '$4.75'],
      ['Decaffeinated Coffee', '$3.75'],
      ['Tea, hot or iced, per pot', '$4.75'],
    ],
    note:
      'Tea selections: Earl Grey, Darjeeling, Green Tea, Chamomile, Chai, Jasmine, Matcha, English Breakfast, and Decaffeinated Breakfast.',
  },
  {
    title: 'Kids',
    items: [
      ['Chicken Tenders and French Fries', '$11'],
      ['Grilled Cheese Sandwich', '$6'],
      ['Quesadilla', '$6'],
      ['Kids Picnic Charcuterie Cup', '$9'],
      ['Side of Fries', '$4'],
      ['Bowl of Fruit', '$5'],
    ],
  },
];

export const allergyNotice =
  'Our kitchen handles nuts, dairy, gluten, and other common allergens. Please notify your server of any allergies or dietary restrictions before ordering.';
