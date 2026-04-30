import { faqRepository } from '../repositories/help.repository';

class HelpService {
  async faq() {
    const snapshot = await faqRepository.collection().orderBy('category').get();
    return snapshot.docs.map((doc) => doc.data());
  }
}

export const helpService = new HelpService();
