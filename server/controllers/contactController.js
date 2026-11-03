import ContactMessage from '../models/ContactMessage.js';
import { pageOf } from '../utils/pagination.js';
import { escapeRegex } from '../utils/escapeRegex.js';

const SOURCES = ['contact', 'brochure'];

const submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, interest, subject, message, source, resource } = req.body || {};
    // A brochure request carries no message of its own - the document taken is
    // the point of it - so the message is only required of the contact form.
    const from = SOURCES.includes(source) ? source : 'contact';
    if (!name || !email || (from === 'contact' && !message)) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required' });
    }
    if (from === 'brochure' && !phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    // Bounded before storage. This endpoint is public and the JSON body limit is
    // 15MB, so without caps a single submission can store a 15MB document - and
    // the admin message list loads every record at once.
    const msg = await ContactMessage.create({
      name: String(name).slice(0, 120),
      email: String(email).slice(0, 200),
      phone: String(phone || '').slice(0, 40),
      interest: String(interest || '').slice(0, 120),
      subject: String(subject || '').slice(0, 200),
      message: String(message || '').slice(0, 5000),
      source: from,
      resource: from === 'brochure' ? String(resource || '').slice(0, 160) : '',
    });
    res.status(201).json({
      success: true,
      message:
        from === 'brochure'
          ? 'Thank you. Your brochure is on its way.'
          : 'Message received. We will get back to you soon.',
      data: { message: msg },
    });
  } catch (err) {
    next(err);
  }
};

const listMessages = async (req, res, next) => {
  try {
    const { status, search, interest, from, to, source } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (source && source !== 'all') query.source = source;
    if (interest && interest !== 'all') {
      query.interest = { $regex: `^${escapeRegex(interest)}$`, $options: 'i' };
    }
    const fromDate = from && !Number.isNaN(Date.parse(from)) ? new Date(`${from}T00:00:00.000Z`) : null;
    const toDate = to && !Number.isNaN(Date.parse(to)) ? new Date(`${to}T23:59:59.999Z`) : null;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = fromDate;
      if (toDate) query.createdAt.$lte = toDate;
    }
    if (search) {
      query.$or = [
        { name: { $regex: escapeRegex(search), $options: 'i' } },
        { email: { $regex: escapeRegex(search), $options: 'i' } },
        { subject: { $regex: escapeRegex(search), $options: 'i' } },
        { interest: { $regex: escapeRegex(search), $options: 'i' } },
        { message: { $regex: escapeRegex(search), $options: 'i' } },
      ];
    }
    const { limit, skip } = pageOf(req);
    const total = await ContactMessage.countDocuments(query);
    const messages = await ContactMessage.find(query).sort('-createdAt').skip(skip).limit(limit);
    const interests = await ContactMessage.distinct('interest');
    res.json({ success: true, count: messages.length, total, data: { messages, interests } });
  } catch (err) {
    next(err);
  }
};

const getMessage = async (req, res, next) => {
  try {
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, data: { message: msg } });
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    msg.status = msg.status === 'read' ? 'new' : 'read';
    await msg.save();
    res.json({ success: true, message: msg.status === 'read' ? 'Marked as read' : 'Marked as new', data: { message: msg } });
  } catch (err) {
    next(err);
  }
};

const resolveMessage = async (req, res, next) => {
  try {
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    msg.status = 'resolved';
    await msg.save();
    res.json({ success: true, message: 'Message resolved', data: { message: msg } });
  } catch (err) {
    next(err);
  }
};

const saveRemarks = async (req, res, next) => {
  try {
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    msg.remarks = String(req.body?.remarks ?? '').slice(0, 2000);
    await msg.save();
    res.json({ success: true, message: 'Remarks saved', data: { message: msg } });
  } catch (err) {
    next(err);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    await msg.deleteOne();
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
};

export { submitContact, listMessages, getMessage, markRead, resolveMessage, saveRemarks, deleteMessage };
