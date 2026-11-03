import MOU from '../models/MOU.js';
import CSRProject from '../models/CSRProject.js';

const getStats = async (req, res, next) => {
  try {
    const [mouCount, csrCount] = await Promise.all([
      MOU.countDocuments({ status: 'published' }),
      CSRProject.countDocuments({ status: 'published' }),
    ]);

    res.json({
      success: true,
      data: {
        mouCount,
        csrCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

export { getStats };
