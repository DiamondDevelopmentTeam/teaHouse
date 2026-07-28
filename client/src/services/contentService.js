import { apiContentService } from './apiContentService.js';
import { staticContentService } from './staticContentService.js';

// Pages render from the static snapshot today. These methods form the seam where
// a future authenticated server can hydrate content from Microsoft Graph or Lists.
export const contentService = {
  ...staticContentService,
  async refresh(resource, ...args) {
    const remoteMethod = apiContentService[resource];
    const localMethod = staticContentService[resource];
    if (!apiContentService.isConfigured || !remoteMethod) return localMethod?.(...args);
    try {
      return await remoteMethod(...args);
    } catch (error) {
      console.warn('Remote content unavailable; using bundled content.', error);
      return localMethod?.(...args);
    }
  },
};
