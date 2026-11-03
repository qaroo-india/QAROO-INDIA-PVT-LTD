// Single source of truth for Qaroo India Public Limited contact details.
// Import this everywhere contact info is shown instead of hardcoding it,
// so a change (number, email, office) only needs to be made in one place.

export const COMPANY = {
  name: 'Qaroo India Private Limited',
  email: 'support@qaroo.in',
  phones: ['+91 90439 27967', '+91 90439 97967'],
  primaryPhone: '+91 90439 27967',
  chennaiPhone: '+91 99449 91217',
  // WhatsApp line. Deliberately its own field: it is a different number from
  // primaryPhone, so the floating chat button must not fall back to that.
  whatsapp: '+91 98944 68201',
  offices: [
    {
      title: 'Head Office - Coimbatore',
      lines: ['No.3A, 3rd Floor, Sri Ram Towers,', 'Lakshmi Mills Junction, P N Palayam,', 'Coimbatore - 641 037'],
      phone: '',
    },
    {
      title: 'Branch Office - Chennai',
      lines: ['No.13/4, Chavadi Street,', 'Pallavaram, Chennai - 600 043'],
      phone: '+91 99449 91217',
    },
  ],
  hours: { days: 'Monday - Saturday', time: '9:00 AM - 6:00 PM IST' },
};
