import { contentService } from './contentService.js';
import { FORM_TYPES, submitForm } from './formSubmission.ts';

export async function getSiteContent() {
  return {
    business: contentService.getBusiness(),
    menus: contentService.getMenus(),
    events: contentService.getEvents(),
    news: contentService.getNews(),
    journal: contentService.getJournalPosts(),
    faqs: contentService.getFaqs(),
    gallery: contentService.getGalleryImages(),
    teaRooms: contentService.getTeaRooms(),
  };
}

export function submitInquiry(type, payload) {
  const formType = type === 'large-party'
    ? FORM_TYPES.RESERVATION
    : type === 'event'
      ? FORM_TYPES.EVENT
      : type === 'contact'
        ? FORM_TYPES.CONTACT
        : FORM_TYPES.GENERAL;
  return submitForm({ ...payload, formType });
}
