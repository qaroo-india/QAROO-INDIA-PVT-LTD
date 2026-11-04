/**
 * Centralized SEO page metadata and Schema.org graph generator.
 * Fully aligned with Qaroo Master SEO Strategy Blueprint.
 */

export const SEO_PAGES = {
  '/': {
    title: 'Qaroo India | IT Courses & Digital Solutions in Coimbatore',
    description: 'Job-ready IT courses with internships and placement support, plus software, CRM and digital marketing for businesses. Offices in Coimbatore and Chennai.',
    h1: 'IT Courses with Placement Support & Digital Solutions in Coimbatore',
    canonical: 'https://www.qaroo.in/',
    priority: '1.0',
    faqs: [
      {
        q: 'What services and programs does Qaroo India offer?',
        a: 'Qaroo India operates two premier divisions: career-ready IT training programs (Data Science, Full Stack, Cyber Security, AI/ML, UI/UX) and enterprise digital solutions (Software development, CRM systems, digital marketing, UI/UX branding, and business consulting).'
      },
      {
        q: 'Where are Qaroo India offices located?',
        a: 'Our Head Office is in Coimbatore at Sri Ram Towers, 3rd Floor, near Lakshmi Mills Signal, P.N. Palayam. Our branch office is in Chennai at No. 13/4, Chavadi Street, Pallavaram.'
      },
      {
        q: 'Do your IT training programs provide placement support?',
        a: 'Yes, Qaroo India provides dedicated placement assistance with 20+ MoUs, mock interviews, portfolio development, and direct hiring partner referrals.'
      }
    ]
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
    faqs: [
      { q: 'Who is eligible to join the Data Science course in Coimbatore?', a: 'Graduates, students, and working professionals from any stream (Engineering, B.Sc, BCA, B.Com, MBA) with analytical interest can join. No prior programming background is required.' },
      { q: 'Does this course include placement assistance?', a: 'Yes, Qaroo India provides 100% placement support, including resume workshops, mock technical interviews, and referrals to hiring companies in Coimbatore, Chennai, and Bangalore.' },
      { q: 'What is the duration and schedule of the course?', a: 'The course workload is 120+ hours (typically 3 to 6 months) with flexible weekday and weekend batches available in both classroom and live online modes.' },
      { q: 'Will I work on real-world projects and get an internship certificate?', a: 'Yes, learners build practical capstone projects with real datasets and receive an official internship completion certificate.' }
    ],
    schema: {
      '@type': 'Course',
      name: 'Data Science Course in Coimbatore',
      description: 'Hands-on data science course in Coimbatore covering Python, machine learning and analytics, with live projects, internship and placement support.',
      url: 'https://www.qaroo.in/courses/data-science-course-coimbatore/',
      inLanguage: 'en',
      courseCode: 'QAR-DS-101',
      educationalCredentialAwarded: 'Certification in Data Science & Business Analytics',
      provider: {
        '@type': 'EducationalOrganization',
        '@id': 'https://www.qaroo.in/#organization',
        name: 'Qaroo India Private Limited',
        sameAs: 'https://www.qaroo.in/'
      },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: ['onsite', 'online'],
        courseWorkload: 'PT120H'
      },
      offers: {
        '@type': 'Offer',
        category: 'Paid',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: 'https://www.qaroo.in/courses/data-science-course-coimbatore/'
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
    faqs: [
      { q: 'What technologies are covered in the Full Stack Developer course?', a: 'The curriculum covers HTML5, CSS3, JavaScript (ES6+), React.js, Node.js, Express, MongoDB, REST APIs, Git, and cloud deployment.' },
      { q: 'Is there internship and job placement assistance?', a: 'Yes, students receive dedicated placement support with interview scheduling across leading IT firms in Coimbatore, Chennai, and Bangalore.' },
      { q: 'Can non-computer science students enroll?', a: 'Yes, our training starts from fundamentals and guides learners step-by-step through practical software development practices.' },
      { q: 'Are classes held online or in the classroom?', a: 'Both options are available: classroom batches at our Coimbatore head office (P.N. Palayam) and interactive live online sessions.' }
    ],
    schema: {
      '@type': 'Course',
      name: 'Full Stack Developer Course in Coimbatore',
      description: 'Become a full stack developer: front end, back end and databases through real projects, with internship and placement support. Classes in Coimbatore.',
      url: 'https://www.qaroo.in/courses/full-stack-developer-course-coimbatore/',
      inLanguage: 'en',
      courseCode: 'QAR-FSD-102',
      educationalCredentialAwarded: 'Certification in Full Stack Development',
      provider: {
        '@type': 'EducationalOrganization',
        '@id': 'https://www.qaroo.in/#organization',
        name: 'Qaroo India Private Limited',
        sameAs: 'https://www.qaroo.in/'
      },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: ['onsite', 'online'],
        courseWorkload: 'PT120H'
      },
      offers: {
        '@type': 'Offer',
        category: 'Paid',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: 'https://www.qaroo.in/courses/full-stack-developer-course-coimbatore/'
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
    faqs: [
      { q: 'What will I learn in the Cyber Security course in Coimbatore?', a: 'You will learn network security, ethical hacking, vulnerability assessments, penetration testing, cryptography, and defensive security measures in hands-on labs.' },
      { q: 'Do you prepare students for industry certifications?', a: 'Yes, our syllabus aligns with recognized certifications such as CEH (Certified Ethical Hacker) and CompTIA Security+.' },
      { q: 'What are the career paths after completing this course?', a: 'Graduates can work as Cyber Security Analysts, Penetration Testers, SOC Analysts, and Information Security Consultants.' }
    ],
    schema: {
      '@type': 'Course',
      name: 'Cyber Security Course in Coimbatore',
      description: 'Cyber security course in Coimbatore covering network security, ethical hacking and practical labs, with internship and placement support from Qaroo.',
      url: 'https://www.qaroo.in/courses/cyber-security-course-coimbatore/',
      inLanguage: 'en',
      courseCode: 'QAR-SEC-103',
      educationalCredentialAwarded: 'Certification in Cyber Security & Ethical Hacking',
      provider: {
        '@type': 'EducationalOrganization',
        '@id': 'https://www.qaroo.in/#organization',
        name: 'Qaroo India Private Limited',
        sameAs: 'https://www.qaroo.in/'
      },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: ['onsite', 'online'],
        courseWorkload: 'PT120H'
      },
      offers: {
        '@type': 'Offer',
        category: 'Paid',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: 'https://www.qaroo.in/courses/cyber-security-course-coimbatore/'
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
    faqs: [
      { q: 'What topics are included in the AI & Machine Learning course?', a: 'The course covers Python programming, supervised and unsupervised machine learning, deep learning with PyTorch/TensorFlow, computer vision, and NLP.' },
      { q: 'Are there prerequisites for this program?', a: 'Basic mathematics and logical thinking are helpful. We teach Python programming and data handling from scratch.' },
      { q: 'Does the program include live industry projects?', a: 'Yes, students build end-to-end AI applications, predictive models, and image/text classifiers that can be showcased on GitHub.' }
    ],
    schema: {
      '@type': 'Course',
      name: 'AI & Machine Learning Course in Coimbatore',
      description: 'Learn artificial intelligence and machine learning with Python through real projects. Classroom course in Coimbatore with internship and placement support.',
      url: 'https://www.qaroo.in/courses/ai-machine-learning-course-coimbatore/',
      inLanguage: 'en',
      courseCode: 'QAR-AIML-104',
      educationalCredentialAwarded: 'Certification in Artificial Intelligence & Machine Learning',
      provider: {
        '@type': 'EducationalOrganization',
        '@id': 'https://www.qaroo.in/#organization',
        name: 'Qaroo India Private Limited',
        sameAs: 'https://www.qaroo.in/'
      },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: ['onsite', 'online'],
        courseWorkload: 'PT120H'
      },
      offers: {
        '@type': 'Offer',
        category: 'Paid',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: 'https://www.qaroo.in/courses/ai-machine-learning-course-coimbatore/'
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
    faqs: [
      { q: 'What design tools are taught in the UI/UX course?', a: 'You will master Figma, FigJam, wireframing tools, interactive prototyping, and design systems.' },
      { q: 'Do I need drawing or graphic design skills to join?', a: 'No, UI/UX is focused on user research, user psychology, information architecture, and digital interfaces. Anyone with an eye for usability can excel.' },
      { q: 'Will I have a complete design portfolio by the end of the course?', a: 'Yes, each student completes 2 to 3 comprehensive case studies published on Behance/Dribbble with recruiter-ready documentation.' }
    ],
    schema: {
      '@type': 'Course',
      name: 'UI/UX Design Course in Coimbatore',
      description: 'UI/UX design course in Coimbatore: user research, wireframes, prototypes and Figma, ending with a portfolio, internship and placement support.',
      url: 'https://www.qaroo.in/courses/ui-ux-design-course-coimbatore/',
      inLanguage: 'en',
      courseCode: 'QAR-UIUX-105',
      educationalCredentialAwarded: 'Certification in UI/UX Product Design',
      provider: {
        '@type': 'EducationalOrganization',
        '@id': 'https://www.qaroo.in/#organization',
        name: 'Qaroo India Private Limited',
        sameAs: 'https://www.qaroo.in/'
      },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: ['onsite', 'online'],
        courseWorkload: 'PT120H'
      },
      offers: {
        '@type': 'Offer',
        category: 'Paid',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: 'https://www.qaroo.in/courses/ui-ux-design-course-coimbatore/'
      }
    }
  },
  '/courses/digital-marketing-course-coimbatore': {
    internalSlug: 'digital-marketing',
    courseName: 'Digital Marketing Course',
    title: 'Digital Marketing Course in Coimbatore with Placement | Qaroo',
    description: 'Master SEO, Google Ads, social media marketing, content strategy, and performance analytics with hands-on campaigns and placement support.',
    h1: 'Digital Marketing Course in Coimbatore',
    canonical: 'https://www.qaroo.in/courses/digital-marketing-course-coimbatore/',
    breadcrumb: 'Digital Marketing Course',
    priority: '0.8',
    breadcrumbs: [
      { name: 'Home', item: 'https://www.qaroo.in/' },
      { name: 'Courses', item: 'https://www.qaroo.in/courses/' },
      { name: 'Digital Marketing', item: 'https://www.qaroo.in/courses/digital-marketing-course-coimbatore/' }
    ],
    faqs: [
      { q: 'What modules are taught in the Digital Marketing course?', a: 'Modules cover Search Engine Optimization (SEO), Google Search & Display Ads, Meta Ads (Facebook & Instagram), Email Marketing, Google Analytics, and Lead Generation.' },
      { q: 'Will I run real ad campaigns during the course?', a: 'Yes, students plan and execute live advertising campaigns to gain real-world performance marketing experience.' }
    ],
    schema: {
      '@type': 'Course',
      name: 'Digital Marketing Course in Coimbatore',
      description: 'Master SEO, Google Ads, social media marketing, content strategy, and performance analytics with hands-on campaigns and placement support.',
      url: 'https://www.qaroo.in/courses/digital-marketing-course-coimbatore/',
      inLanguage: 'en',
      courseCode: 'QAR-DM-106',
      educationalCredentialAwarded: 'Certification in Digital Marketing & Growth Analytics',
      provider: {
        '@type': 'EducationalOrganization',
        '@id': 'https://www.qaroo.in/#organization',
        name: 'Qaroo India Private Limited',
        sameAs: 'https://www.qaroo.in/'
      },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: ['onsite', 'online'],
        courseWorkload: 'PT90H'
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
    faqs: [
      { q: 'What types of software does Qaroo India develop?', a: 'We build custom web applications, SaaS platforms, enterprise portals, e-commerce stores, and internal business tools tailored to your operational requirements.' },
      { q: 'Where is your software development team located?', a: 'Our primary engineering hub is located at Sri Ram Towers, P.N. Palayam, Coimbatore, with branch presence in Chennai.' },
      { q: 'Do you provide ongoing support and maintenance after launch?', a: 'Yes, we offer comprehensive post-launch SLA support, security updates, server monitoring, and feature iteration.' }
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
    faqs: [
      { q: 'What CRM platforms does Qaroo India work with?', a: 'We implement and customize leading CRM platforms (HubSpot, Zoho, Salesforce) as well as develop bespoke, proprietary CRM systems for specialized business workflows.' },
      { q: 'How does a custom CRM benefit our sales team?', a: 'It eliminates manual data entry, automates lead assignment and follow-up reminders, and provides management with real-time pipeline visibility.' }
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
    faqs: [
      { q: 'What digital marketing services do you offer in Coimbatore?', a: 'We provide search engine optimization (SEO), Google Ads (PPC), social media marketing, lead generation campaigns, and content strategy.' },
      { q: 'How long does it take to see SEO results for my business?', a: 'Targeted local SEO results typically begin showing noticeable improvements in rankings and enquiries within 6 to 12 weeks.' }
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
    faqs: [
      { q: 'What does your branding and design package include?', a: 'We deliver complete brand identity guidelines, logo design, typography, color palettes, marketing collateral, and full digital UI/UX design systems.' }
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
    faqs: [
      { q: 'Who are your business strategy consulting services designed for?', a: 'We consult for startups, growing SMEs, and established organizations looking to digitize operations, scale sales pipelines, and adopt modern software architectures.' }
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

/**
 * Builds FAQPage structured data for Schema.org
 */
export function buildFAQSchema(faqs) {
  if (!faqs || !faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a
      }
    }))
  };
}
