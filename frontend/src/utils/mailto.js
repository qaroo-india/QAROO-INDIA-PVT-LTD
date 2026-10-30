export const mailtoHref = (email) => {
  const clean = String(email || '').trim().replace(/^mailto:/i, '');
  if (!clean) return '#';
  return `mailto:${clean}`;
};