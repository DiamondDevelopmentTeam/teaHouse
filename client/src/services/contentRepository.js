import { contentService } from './contentService.js';
import { inquiryService } from './inquiryService.js';

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
  if (type === 'large-party') return inquiryService.submitLargeParty(payload);
  if (type === 'employment') return inquiryService.submitEmployment(payload);
  return inquiryService.submitContact(payload);
}
