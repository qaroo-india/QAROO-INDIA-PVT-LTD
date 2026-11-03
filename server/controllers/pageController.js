import PageContent from '../models/PageContent.js';
import { PAGE_CONTENT } from '../data/seedData.js';

const PAGES = ['home', 'about', 'business', 'learning', 'csr', 'contact', 'mou', 'footer', 'careers'];

const getPageContent = async (req, res, next) => {
  try {
    const { page } = req.params;
    if (!PAGES.includes(page)) {
      return res.status(400).json({ success: false, message: 'Invalid page key' });
    }
    const existing = await PageContent.findOne({ page });
    if (existing) {
      res.json({ success: true, data: { content: existing } });
      return;
    }
    // No write-on-read: GET stays side-effect free. Return the shipped seed
    // defaults (or an empty object) shaped like a document so every consumer
    // keeps the same response envelope.
    res.json({
      success: true,
      data: { content: { page, data: PAGE_CONTENT[page] || {}, updatedBy: null } },
    });
  } catch (err) {
    next(err);
  }
};

const updatePageContent = async (req, res, next) => {
  try {
    const { page } = req.params;
    if (!PAGES.includes(page)) {
      return res.status(400).json({ success: false, message: 'Invalid page key' });
    }
    const { data } = req.body || {};
    let content = await PageContent.findOne({ page });
    if (!content) {
      content = await PageContent.create({ page, data: data || {}, updatedBy: req.admin._id });
    } else {
      content.data = data || {};
      content.updatedBy = req.admin._id;
      await content.save();
    }
    res.json({ success: true, message: `${page} content updated`, data: { content } });
  } catch (err) {
    next(err);
  }
};

const listPageKeys = async (req, res) => {
  res.json({ success: true, data: { pages: PAGES } });
};

export { getPageContent, updatePageContent, listPageKeys };
