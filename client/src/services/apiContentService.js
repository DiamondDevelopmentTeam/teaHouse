const apiBase = (import.meta.env.VITE_CONTENT_API_BASE_URL || '').replace(/\/$/, '');

async function request(path) {
  if (!apiBase) throw new Error('No content API is configured.');
  const response = await fetch(`${apiBase}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Content request failed (${response.status}).`);
  return response.json();
}

export const apiContentService = {
  isConfigured: Boolean(apiBase),
  getBusiness: () => request('/business'),
  getMenus: () => request('/menus'),
  getEvents: () => request('/events'),
  getNews: () => request('/news'),
  getJournalPosts: () => request('/journal'),
  getJournalPost: (slug) => request(`/journal/${encodeURIComponent(slug)}`),
  getFaqs: () => request('/faqs'),
  getGalleryImages: () => request('/gallery'),
  getTeaRooms: () => request('/tea-rooms'),
};
