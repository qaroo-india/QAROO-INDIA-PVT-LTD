// The service pages and career tracks the site offers, as links.
//
// The navbar dropdowns and the home page both list these, and both replace
// them with whatever the API returns once it responds. Kept here so the two
// cannot end up listing different things: the earlier copy lived inside
// Navbar.jsx, and the home page's own list had drifted to six of the eight.

export const BUSINESS_LINKS = [
  { label: 'CRM Solutions', path: '/business-solutions/crm-solutions' },
  { label: 'Digital Marketing', path: '/business-solutions/digital-marketing' },
  { label: 'Graphic Design & Branding', path: '/business-solutions/graphic-design-branding' },
  { label: 'Web Development', path: '/business-solutions/web-development' },
  { label: 'Software Development', path: '/business-solutions/software-development' },
  { label: 'UI/UX Design', path: '/business-solutions/ui-ux-design' },
  { label: 'UX Research', path: '/business-solutions/ux-research' },
  { label: 'Business Strategy', path: '/business-solutions/business-strategy' },
];

export const LEARNING_LINKS = [
  { label: 'Data Science & Business Analytics', path: '/learning-programs/data-science-business-analytics' },
  { label: 'Full Stack Development', path: '/learning-programs/full-stack-development' },
  { label: 'UI/UX Design', path: '/learning-programs/ui-ux-design' },
  { label: 'Cyber Security & Ethical Hacking', path: '/learning-programs/cyber-security-ethical-hacking' },
  { label: 'AI & Machine Learning', path: '/learning-programs/ai-machine-learning' },
  { label: 'Graphic Design & Animation', path: '/learning-programs/graphic-design-animation' },
  { label: 'Digital Marketing', path: '/learning-programs/digital-marketing' },
  { label: 'Software Testing', path: '/learning-programs/software-testing' },
];
