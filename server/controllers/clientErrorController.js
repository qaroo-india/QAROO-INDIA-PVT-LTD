import ClientError from '../models/ClientError.js';

// Extra is arbitrary, so bound it on the wire and again before storage instead
// of allowing documents of unbounded size.
const CAP_EXTRA = 5000;

const boundedExtra = (extra) => {
  if (extra === undefined || extra === null) return {};
  let serialized;
  try {
    serialized = JSON.stringify(extra);
  } catch {
    return {};
  }
  if (serialized.length > CAP_EXTRA) return {};
  return extra;
};

export const reportClientError = async (req, res, next) => {
  try {
    const { message, stack, url, userAgent, extra } = req.body || {};
    if (!message) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }
    await ClientError.create({
      message: String(message).slice(0, 2000),
      stack: String(stack || '').slice(0, 8000),
      url: String(url || '').slice(0, 2000),
      userAgent: String(userAgent || '').slice(0, 500),
      extra: boundedExtra(extra),
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const listClientErrors = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 500);
    const errors = await ClientError.find().sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ success: true, count: errors.length, data: errors });
  } catch (err) {
    next(err);
  }
};