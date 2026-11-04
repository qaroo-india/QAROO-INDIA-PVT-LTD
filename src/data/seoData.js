/**
 * Centralized SEO page metadata and Schema.org graph generator.
 * Derived from Qaroo SEO Kit (seo-pages.json & head-tags.html).
 */

export const SEO_PAGES = {
  '/': {
    title: 'Qaroo India | IT Courses & Digital Solutions in Coimbatore',
    description: 'Job-ready IT courses with internships and placement support, plus software, CRM and digital marketing for businesses. Offices in Coimbatore and Chennai.',
    h1: 'IT Courses with Placement Support & Digital Solutions in Coimbatore',
    canonical: 'https://www.qaroo.in/',
    priority: '1.0'
  },
  '/about': {
    title: 'About Qaroo India | IT Training & Software Company',
    description: 'Qaroo India builds software, brands and digital campaigns, and runs career-focused IT training: 6,000+ students trained and 20+ MoUs with organisations.',
    h1: 'About Qaroo India Private Limited',
    canonical: 'https://www.qaroo.in/about',
    priority: '0.6'
  },
  '/contact': {
    title: 'Contact Qaroo India | Coimbatore & Chennai Offices',
    description: 'Visit Qaroo at Sri Ram Towers, P.N.Palayam, Coimbatore (opp. LuLu Hypermarket) or Pallavaram, Chennai. Call +91 90439 27967 or email us.',
    h1: 'Contact Qaroo India',
    canonical: 'https://www.qaroo.in/contact',
    priority: '0.6'
  },
  '/courses': {
    title: 'IT Courses in Coimbatore with Placement Support | Qaroo',
    description: 'Data science, full stack, cyber security, AI & machine learning and UI/UX courses in Coimbatore with live projects, internships and placement support.',
    h1: 'IT Courses in Coimbatore',
    canonical: 'https://www.qaroo.in/courses/',
    breadcrumb: 'Courses',
    priority: '0.9',
    breadcrumbs: [
      { name: 'Home', item: 'https://www.qaroo.in/' },
      { name: 'Courses', item: 'https://www.qaroo.in/courses/' }
    ]
  },
  '/courses/data-science-course-coimbatore': {
    internalSlug: 'data-science-business-analytics',
    courseName: 'Data Science Course',
    title: 'Data Science Course in Coimbatore with Placement | Qaroo',
    description: 'Hands-on data science course in Coimbatore covering Python, machine learning and analytics, with live projects, internship and placement support.',
    h1: 'Data Science Course in Coimbatore',
    canonical: 'https://www.qaroo.in/courses/data-science-course-coimbatore/',
    breadcrumb: 'Data Science',
    priority: '0.9',
    breadcrumbs: [
      { name: 'Home', item: 'https://www.qaroo.in/' },
      { name: 'Courses', item: 'https://www.qaroo.in/courses/' },
      { name: 'Data Science', item: 'https://www.qaroo.in/courses/data-science-course-coimbatore/' }
    ],
    schema: {
      '@type': 'Course',
      name: 'Data Science Course',
      description: 'Hands-on data science course in Coimbatore covering Python, machine learning and analytics, with live projects, internship and placement support.',
      url: 'https://www.qaroo.in/courses/data-science-course-coimbatore/',
      inLanguage: 'en',
      provider: {
        '@type': 'Organization',
        '@id': 'https://www.qaroo.in/#organization',
        name: 'Qaroo India Private Limited',
        sameAs: 'https://www.qaroo.in/'
      }
    }
  },
  '/courses/full-stack-developer-course-coimbatore': {
    internalSlug: 'full-stack-development',
    courseName: 'Full Stack Developer Course',
    title: 'Full Stack Developer Course in Coimbatore | Qaroo',
    description: 'Become a full stack developer: front end, back end and databases through real projects, with internship and placement support. Classes in Coimbatore.',
    h1: 'Full Stack Developer Course in Coimbatore',
    canonical: 'https://www.qaroo.in/courses/full-stack-developer-course-coimbatore/',
    breadcrumb: 'Full Stack Development',
    priority: '0.9',
    breadcrumbs: [
      { name: 'Home', item: 'https://www.qaroo.in/' },
      { name: 'Courses', item: 'https://www.qaroo.in/courses/' },
      { name: 'Full Stack Development', item: 'https://www.qaroo.in/courses/full-stack-developer-course-coimbatore/' }
    ],
    schema: {
      '@type': 'Course',
      name: 'Full Stack Developer Course',
      description: 'Become a full stack developer: front end, back end and databases through real projects, with internship and placement support. Classes in Coimbatore.',
      url: 'https://www.qaroo.in/courses/full-stack-developer-course-coimbatore/',
      inLanguage: 'en',
      provider: {
        '@type': 'Organization',
        '@id': 'https://www.qaroo.in/#organization',
        name: 'Qaroo India Private Limited',
        sameAs: 'https://www.qaroo.in/'
      }
    }
  },
  '/courses/cyber-security-course-coimbatore': {
    internalSlug: 'cyber-security-ethical-hacking',
    courseName: 'Cyber Security Course',
    title: 'Cyber Security Course in Coimbatore | Qaroo',
    description: 'Cyber security course in Coimbatore covering network security, ethical hacking and practical labs, with internship and placement support from Qaroo.',
    h1: 'Cyber Security Course in Coimbatore',
    canonical: 'https://www.qaroo.in/courses/cyber-security-course-coimbatore/',
    breadcrumb: 'Cyber Security',
    priority: '0.9',
    breadcrumbs: [
      { name: 'Home', item: 'https://www.qaroo.in/' },
      { name: 'Courses', item: 'https://www.qaroo.in/courses/' },
      { name: 'Cyber Security', item: 'https://www.qaroo.in/courses/cyber-security-course-coimbatore/' }
    ],
    schema: {
      '@type': 'Course',
      name: 'Cyber Security Course',
      description: 'Cyber security course in Coimbatore covering network security, ethical hacking and practical labs, with internship and placement support from Qaroo.',
      url: 'https://www.qaroo.in/courses/cyber-security-course-coimbatore/',
      inLanguage: 'en',
      provider: {
        '@type': 'Organization',
        '@id': 'https://www.qaroo.in/#organization',
        name: 'Qaroo India Private Limited',
        sameAs: 'https://www.qaroo.in/'
      }
    }
  },
  '/courses/ai-machine-learning-course-coimbatore': {
    internalSlug: 'ai-machine-learning',
    courseName: 'AI & Machine Learning Course',
    title: 'AI & Machine Learning Course in Coimbatore | Qaroo',
    description: 'Learn artificial intelligence and machine learning with Python through real projects. Classroom course in Coimbatore with internship and placement support.',
    h1: 'AI & Machine Learning Course in Coimbatore',
    canonical: 'https://www.qaroo.in/courses/ai-machine-learning-course-coimbatore/',
    breadcrumb: 'AI & Machine Learning',
    priority: '0.9',
    breadcrumbs: [
      { name: 'Home', item: 'https://www.qaroo.in/' },
      { name: 'Courses', item: 'https://www.qaroo.in/courses/' },
      { name: 'AI & Machine Learning', item: 'https://www.qaroo.in/courses/ai-machine-learning-course-coimbatore/' }
    ],
    schema: {
      '@type': 'Course',
      name: 'AI & Machine Learning Course',
      description: 'Learn artificial intelligence and machine learning with Python through real projects. Classroom course in Coimbatore with internship and placement support.',
      url: 'https://www.qaroo.in/courses/ai-machine-learning-course-coimbatore/',
      inLanguage: 'en',
      provider: {
        '@type': 'Organization',
        '@id': 'https://www.qaroo.in/#organization',
        name: 'Qaroo India Private Limited',
        sameAs: 'https://www.qaroo.in/'
      }
    }
  },
  '/courses/ui-ux-design-course-coimbatore': {
    internalSlug: 'ui-ux-design',
    courseName: 'UI/UX Design Course',
    title: 'UI/UX Design Course in Coimbatore | Qaroo',
    description: 'UI/UX design course in Coimbatore: user research, wireframes, prototypes and Figma, ending with a portfolio, internship and placement support.',
    h1: 'UI/UX Design Course in Coimbatore',
    canonical: 'https://www.qaroo.in/courses/ui-ux-design-course-coimbatore/',
    breadcrumb: 'UI/UX Design',
    priority: '0.8',
    breadcrumbs: [
      { name: 'Home', item: 'https://www.qaroo.in/' },
      { name: 'Courses', item: 'https://www.qaroo.in/courses/' },
      { name: 'UI/UX Design', item: 'https://www.qaroo.in/courses/ui-ux-design-course-coimbatore/' }
    ],
    schema: {
      '@type': 'Course',
      name: 'UI/UX Design Course',
      description: 'UI/UX design course in Coimbatore: user research, wireframes, prototypes and Figma, ending with a portfolio, internship and placement support.',
      url: 'https://www.qaroo.in/courses/ui-ux-design-course-coimbatore/',
      inLanguage: 'en',
      provider: {
        '@type': 'Organization',
        '@id': 'https://www.qaroo.in/#organization',
        name: 'Qaroo India Private Limited',
        sameAs: 'https://www.qaroo.in/'
      }
    }
  },
  '/services': {
    title: 'Software, CRM & Digital Marketing Services | Qaroo India',
    description: 'Custom software, web development, CRM, UI/UX and branding, digital marketing and strategy for businesses in Coimbatore, Chennai and across India.',
    h1: 'Digital Solutions for Businesses',
    canonical: 'https://www.qaroo.in/services/',
    breadcrumb: 'Services',
    priority: '0.8',
    breadcrumbs: [
      { name: 'Home', item: 'https://www.qaroo.in/' },
      { name: 'Services', item: 'https://www.qaroo.in/services/' }
    ]
  },
  '/services/software-web-development': {
    internalSlug: 'web-development',
    serviceType: 'Software and web development',
    title: 'Software & Web Development Company in Coimbatore | Qaroo',
    description: 'Custom software, websites and web apps built around your requirements by Qaroo India\'s development team in Coimbatore. Tell us about your project.',
    h1: 'Software & Web Development in Coimbatore',
    canonical: 'https://www.qaroo.in/services/software-web-development/',
    breadcrumb: 'Software & Web Development',
    priority: '0.8',
    breadcrumbs: [
      { name: 'Home', item: 'https://www.qaroo.in/' },
      { name: 'Services', item: 'https://www.qaroo.in/services/' },
      { name: 'Software & Web Development', item: 'https://www.qaroo.in/services/software-web-development/' }
    ],
    schema: {
      '@type': 'Service',
      name: 'Software & Web Development',
      serviceType: 'Software and web development',
      description: 'Custom software, websites and web apps built around your requirements by Qaroo India\'s development team in Coimbatore. Tell us about your project.',
      url: 'https://www.qaroo.in/services/software-web-development/',
      provider: {
        '@id': 'https://www.qaroo.in/#organization'
      },
      areaServed: [
        { '@type': 'City', name: 'Coimbatore' },
        { '@type': 'City', name: 'Chennai' },
        { '@type': 'Country', name: 'India' }
      ]
    }
  },
  '/services/crm-solutions': {
    internalSlug: 'crm-solutions',
    serviceType: 'CRM solutions',
    title: 'CRM Solutions for Businesses in Coimbatore | Qaroo',
    description: 'CRM setup and custom CRM solutions that organise your leads, sales and customer follow-ups. Qaroo India works with businesses in Coimbatore and Chennai.',
    h1: 'CRM Solutions for Growing Businesses',
    canonical: 'https://www.qaroo.in/services/crm-solutions/',
    breadcrumb: 'CRM Solutions',
    priority: '0.8',
    breadcrumbs: [
      { name: 'Home', item: 'https://www.qaroo.in/' },
      { name: 'Services', item: 'https://www.qaroo.in/services/' },
      { name: 'CRM Solutions', item: 'https://www.qaroo.in/services/crm-solutions/' }
    ],
    schema: {
      '@type': 'Service',
      name: 'CRM Solutions',
      serviceType: 'CRM solutions',
      description: 'CRM setup and custom CRM solutions that organise your leads, sales and customer follow-ups. Qaroo India works with businesses in Coimbatore and Chennai.',
      url: 'https://www.qaroo.in/services/crm-solutions/',
      provider: {
        '@id': 'https://www.qaroo.in/#organization'
      },
      areaServed: [
        { '@type': 'City', name: 'Coimbatore' },
        { '@type': 'City', name: 'Chennai' },
        { '@type': 'Country', name: 'India' }
      ]
    }
  },
  '/services/digital-marketing': {
    internalSlug: 'digital-marketing',
    serviceType: 'Digital marketing',
    title: 'Digital Marketing Agency in Coimbatore | Qaroo India',
    description: 'SEO, social media and paid ads that bring real enquiries. Qaroo India is a digital marketing agency in Coimbatore working with businesses across India.',
    h1: 'Digital Marketing Agency in Coimbatore',
    canonical: 'https://www.qaroo.in/services/digital-marketing/',
    breadcrumb: 'Digital Marketing',
    priority: '0.8',
    breadcrumbs: [
      { name: 'Home', item: 'https://www.qaroo.in/' },
      { name: 'Services', item: 'https://www.qaroo.in/services/' },
      { name: 'Digital Marketing', item: 'https://www.qaroo.in/services/digital-marketing/' }
    ],
    schema: {
      '@type': 'Service',
      name: 'Digital Marketing',
      serviceType: 'Digital marketing',
      description: 'SEO, social media and paid ads that bring real enquiries. Qaroo India is a digital marketing agency in Coimbatore working with businesses across India.',
      url: 'https://www.qaroo.in/services/digital-marketing/',
      provider: {
        '@id': 'https://www.qaroo.in/#organization'
      },
      areaServed: [
        { '@type': 'City', name: 'Coimbatore' },
        { '@type': 'City', name: 'Chennai' },
        { '@type': 'Country', name: 'India' }
      ]
    }
  },
  '/services/ui-ux-branding': {
    internalSlug: 'graphic-design-branding',
    serviceType: 'UI/UX design and branding',
    title: 'UI/UX Design & Branding Agency in Coimbatore | Qaroo',
    description: 'UI/UX design, logos and brand identity that make your business memorable. Qaroo India\'s design team works with brands in Coimbatore and Chennai.',
    h1: 'UI/UX Design & Branding in Coimbatore',
    canonical: 'https://www.qaroo.in/services/ui-ux-branding/',
    breadcrumb: 'UI/UX & Branding',
    priority: '0.7',
    breadcrumbs: [
      { name: 'Home', item: 'https://www.qaroo.in/' },
      { name: 'Services', item: 'https://www.qaroo.in/services/' },
      { name: 'UI/UX & Branding', item: 'https://www.qaroo.in/services/ui-ux-branding/' }
    ],
    schema: {
      '@type': 'Service',
      name: 'UI/UX Design & Branding',
      serviceType: 'UI/UX design and branding',
      description: 'UI/UX design, logos and brand identity that make your business memorable. Qaroo India\'s design team works with brands in Coimbatore and Chennai.',
      url: 'https://www.qaroo.in/services/ui-ux-branding/',
      provider: {
        '@id': 'https://www.qaroo.in/#organization'
      },
      areaServed: [
        { '@type': 'City', name: 'Coimbatore' },
        { '@type': 'City', name: 'Chennai' },
        { '@type': 'Country', name: 'India' }
      ]
    }
  },
  '/services/business-strategy': {
    internalSlug: 'business-strategy',
    serviceType: 'Digital and business strategy consulting',
    title: 'Digital Strategy Consulting in Coimbatore | Qaroo India',
    description: 'Digital strategy and growth planning that matches your goals to the right software, design and marketing. Qaroo India, Coimbatore and Chennai.',
    h1: 'Digital & Business Strategy Consulting',
    canonical: 'https://www.qaroo.in/services/business-strategy/',
    breadcrumb: 'Business Strategy',
    priority: '0.7',
    breadcrumbs: [
      { name: 'Home', item: 'https://www.qaroo.in/' },
      { name: 'Services', item: 'https://www.qaroo.in/services/' },
      { name: 'Business Strategy', item: 'https://www.qaroo.in/services/business-strategy/' }
    ],
    schema: {
      '@type': 'Service',
      name: 'Digital & Business Strategy Consulting',
      serviceType: 'Digital and business strategy consulting',
      description: 'Digital strategy and growth planning that matches your goals to the right software, design and marketing. Qaroo India, Coimbatore and Chennai.',
      url: 'https://www.qaroo.in/services/business-strategy/',
      provider: {
        '@id': 'https://www.qaroo.in/#organization'
      },
      areaServed: [
        { '@type': 'City', name: 'Coimbatore' },
        { '@type': 'City', name: 'Chennai' },
        { '@type': 'Country', name: 'India' }
      ]
    }
  }
};

/**
 * Builds breadcrumb structured data for Schema.org
 */
export function buildBreadcrumbSchema(items) {
  if (!items || !items.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: crumb.name,
      item: crumb.item
    }))
  };
}
