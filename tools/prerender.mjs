/**
 * tools/prerender.mjs
 * Institutional Post-build Static Pre-rendering Engine for Qaroo India.
 * Generates static HTML snapshots for all SEO pages in dist/
 * so search engine crawlers (Google, Bing, Perplexity, AI bots) see full HTML,
 * headings (H1), paragraphs, and structured data without executing JS.
 * Also generates dist/404.html to eliminate Soft 404 penalties.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEO_PAGES, buildBreadcrumbSchema, buildFAQSchema } from '../src/data/seoData.js';
import { PROGRAMS } from '../src/data/programs.js';
import { BUSINESS_SOLUTIONS } from '../src/data/businessSolutions.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const INDEX_HTML = path.join(DIST, 'index.html');

if (!fs.existsSync(INDEX_HTML)) {
  console.error('[prerender] dist/index.html not found. Run vite build first.');
  process.exit(1);
}

const template = fs.readFileSync(INDEX_HTML, 'utf8');

function renderCourseBody(seo) {
  const prog = PROGRAMS.find((p) => p.slug === seo.internalSlug) || {};
  const highlights = (prog.highlights || []).slice(0, 8);
  const modules = (prog.modules || []).slice(0, 6);
  const tools = (prog.tools || []).slice(0, 10);
  const faq = seo.faqs || prog.faq || [];

  return `
    <div class="page-wrapper">
      <div class="learning-template">
        <div class="lt-hero red-stage" style="padding: 60px 20px; background: linear-gradient(135deg, #172A46 0%, #B3262D 100%); color: #fff;">
          <div class="container" style="max-width: 1140px; margin: 0 auto;">
            <nav aria-label="breadcrumb" style="margin-bottom: 14px;">
              <ol style="display: flex; gap: 8px; list-style: none; padding: 0; margin: 0; font-size: 14px; opacity: 0.85;">
                <li><a href="/" style="color: #fff;">Home</a> /</li>
                <li><a href="/courses" style="color: #fff;">Courses</a> /</li>
                <li aria-current="page" style="color: #F4C430;">${seo.breadcrumb || seo.h1}</li>
              </ol>
            </nav>
            <p style="text-transform: uppercase; letter-spacing: 2px; font-weight: 700; color: #F4C430; margin-bottom: 8px;">Career Training in Coimbatore</p>
            <h1 style="font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; margin: 10px 0;">${seo.h1}</h1>
            <p style="font-size: 1.15rem; max-width: 720px; opacity: 0.9; line-height: 1.6;">${seo.description}</p>
            <div style="margin-top: 24px; display: flex; gap: 14px; flex-wrap: wrap;">
              <a href="/contact" style="background: #F4C430; color: #172A46; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Request Course Details</a>
              <a href="/contact" style="border: 2px solid #F4C430; color: #fff; padding: 10px 22px; border-radius: 8px; font-weight: 600; text-decoration: none;">Download Syllabus</a>
            </div>
          </div>
        </div>

        <section style="padding: 60px 20px; max-width: 1140px; margin: 0 auto;">
          <h2>Key Course Highlights</h2>
          <ul style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-top: 20px; list-style: none; padding: 0;">
            ${highlights.map((h) => `<li style="background: #f8f9fa; padding: 14px 18px; border-radius: 8px; border-left: 4px solid #B3262D;">✓ ${h}</li>`).join('\n')}
          </ul>

          ${tools.length ? `
            <div style="margin-top: 40px;">
              <h3>Tools & Technologies Covered</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px;">
                ${tools.map((t) => `<span style="background: #172A46; color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 14px;">${t}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          ${modules.length ? `
            <div style="margin-top: 40px;">
              <h3>Curriculum & Modules</h3>
              <div style="display: grid; gap: 16px; margin-top: 20px;">
                ${modules.map((m) => `
                  <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px;">
                    <h4 style="margin: 0 0 8px; color: #172A46;">${m.title}</h4>
                    <p style="margin: 0; color: #4a5568; font-size: 14px;">${(m.items || []).join(' • ')}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${faq.length ? `
            <div style="margin-top: 40px;">
              <h3>Frequently Asked Questions</h3>
              <div style="margin-top: 16px;">
                ${faq.map((q) => `
                  <div style="margin-bottom: 20px; background: #fff; border: 1px solid #e2e8f0; padding: 18px; border-radius: 8px;">
                    <h4 style="font-size: 17px; color: #172A46; margin: 0 0 6px;">${q.q}</h4>
                    <p style="color: #4a5568; margin: 0; line-height: 1.6;">${q.a}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div style="margin-top: 50px; background: #f8f9fa; padding: 30px; border-radius: 12px; text-align: center;">
            <h3 style="margin-bottom: 10px;">Ready to advance your career with Qaroo India?</h3>
            <p style="color: #4a5568; max-width: 600px; margin: 0 auto 20px;">Join our upcoming batch in Coimbatore or attend live online classes. Get hands-on mentorship, industry projects, and dedicated placement support.</p>
            <a href="/contact" style="background: #B3262D; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block;">Enroll Now or Speak with an Advisor</a>
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderServiceBody(seo) {
  const sol = BUSINESS_SOLUTIONS.find((s) => s.slug === seo.internalSlug) || {};
  const services = (sol.services || []).slice(0, 8);
  const benefits = (sol.benefits || []).slice(0, 6);
  const faq = seo.faqs || [];

  return `
    <div class="page-wrapper">
      <div class="solution-template">
        <div style="padding: 60px 20px; background: linear-gradient(135deg, #172A46 0%, #B3262D 100%); color: #fff;">
          <div class="container" style="max-width: 1140px; margin: 0 auto;">
            <nav aria-label="breadcrumb" style="margin-bottom: 14px;">
              <ol style="display: flex; gap: 8px; list-style: none; padding: 0; margin: 0; font-size: 14px; opacity: 0.85;">
                <li><a href="/" style="color: #fff;">Home</a> /</li>
                <li><a href="/services" style="color: #fff;">Services</a> /</li>
                <li aria-current="page" style="color: #F4C430;">${seo.breadcrumb || seo.h1}</li>
              </ol>
            </nav>
            <p style="text-transform: uppercase; letter-spacing: 2px; font-weight: 700; color: #F4C430; margin-bottom: 8px;">Business Solution in Coimbatore</p>
            <h1 style="font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; margin: 10px 0;">${seo.h1}</h1>
            <p style="font-size: 1.15rem; max-width: 720px; opacity: 0.9; line-height: 1.6;">${seo.description}</p>
            <div style="margin-top: 24px; display: flex; gap: 14px; flex-wrap: wrap;">
              <a href="/contact" style="background: #F4C430; color: #172A46; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Discuss Your Project</a>
              <a href="/contact" style="border: 2px solid #F4C430; color: #fff; padding: 10px 22px; border-radius: 8px; font-weight: 600; text-decoration: none;">Request a Proposal</a>
            </div>
          </div>
        </div>

        <section style="padding: 60px 20px; max-width: 1140px; margin: 0 auto;">
          <h2>Services & Capabilities</h2>
          <ul style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-top: 20px; list-style: none; padding: 0;">
            ${services.map((s) => `<li style="background: #f8f9fa; padding: 14px 18px; border-radius: 8px; border-left: 4px solid #B3262D;">✓ ${s}</li>`).join('\n')}
          </ul>

          ${benefits.length ? `
            <div style="margin-top: 40px;">
              <h3>Why Work with Qaroo India</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 16px;">
                ${benefits.map((b) => `
                  <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: #fff;">
                    <p style="margin: 0; font-weight: 600; color: #172A46;">${b}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${faq.length ? `
            <div style="margin-top: 40px;">
              <h3>Frequently Asked Questions</h3>
              <div style="margin-top: 16px;">
                ${faq.map((q) => `
                  <div style="margin-bottom: 20px; background: #fff; border: 1px solid #e2e8f0; padding: 18px; border-radius: 8px;">
                    <h4 style="font-size: 17px; color: #172A46; margin: 0 0 6px;">${q.q}</h4>
                    <p style="color: #4a5568; margin: 0; line-height: 1.6;">${q.a}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div style="margin-top: 50px; background: #f8f9fa; padding: 30px; border-radius: 12px; text-align: center;">
            <h3 style="margin-bottom: 10px;">Partner with Qaroo India for your digital transformation</h3>
            <p style="color: #4a5568; max-width: 600px; margin: 0 auto 20px;">Offices in Coimbatore and Chennai. We build custom software, implement CRM workflows, and execute performance marketing campaigns.</p>
            <a href="/contact" style="background: #B3262D; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block;">Get in Touch</a>
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderAboutBody(seo) {
  return `
    <div class="page-wrapper">
      <div style="padding: 60px 20px; background: linear-gradient(135deg, #172A46 0%, #B3262D 100%); color: #fff;">
        <div class="container" style="max-width: 1140px; margin: 0 auto;">
          <p style="text-transform: uppercase; letter-spacing: 2px; font-weight: 700; color: #F4C430; margin-bottom: 8px;">About Us</p>
          <h1 style="font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; margin: 10px 0;">${seo.h1}</h1>
          <p style="font-size: 1.15rem; max-width: 720px; opacity: 0.9; line-height: 1.6;">${seo.description}</p>
        </div>
      </div>
      <section style="padding: 60px 20px; max-width: 1140px; margin: 0 auto;">
        <h2>Building digital solutions. Building careers.</h2>
        <p style="font-size: 1.1rem; line-height: 1.7; color: #333; margin-top: 14px;">
          Qaroo India Private Limited is a premier technology and career training organization headquartered in Coimbatore, Tamil Nadu, with a branch office in Chennai.
          We partner with leading enterprises and academic institutions to deliver scalable software systems, CRM solutions, performance marketing, and job-ready IT learning programs.
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-top: 40px; text-align: center;">
          <div style="background: #f8f9fa; padding: 24px; border-radius: 10px;">
            <p style="font-size: 2.5rem; font-weight: 800; color: #B3262D; margin: 0;">6,000+</p>
            <p style="color: #666; margin: 4px 0 0;">Students Trained</p>
          </div>
          <div style="background: #f8f9fa; padding: 24px; border-radius: 10px;">
            <p style="font-size: 2.5rem; font-weight: 800; color: #B3262D; margin: 0;">20+</p>
            <p style="color: #666; margin: 4px 0 0;">MoUs Signed</p>
          </div>
          <div style="background: #f8f9fa; padding: 24px; border-radius: 10px;">
            <p style="font-size: 2.5rem; font-weight: 800; color: #B3262D; margin: 0;">12+</p>
            <p style="color: #666; margin: 4px 0 0;">CSR Projects</p>
          </div>
          <div style="background: #f8f9fa; padding: 24px; border-radius: 10px;">
            <p style="font-size: 2.5rem; font-weight: 800; color: #B3262D; margin: 0;">2</p>
            <p style="color: #666; margin: 4px 0 0;">Office Locations</p>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderContactBody(seo) {
  return `
    <div class="page-wrapper">
      <div style="padding: 60px 20px; background: linear-gradient(135deg, #172A46 0%, #B3262D 100%); color: #fff;">
        <div class="container" style="max-width: 1140px; margin: 0 auto;">
          <p style="text-transform: uppercase; letter-spacing: 2px; font-weight: 700; color: #F4C430; margin-bottom: 8px;">Contact Us</p>
          <h1 style="font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; margin: 10px 0;">${seo.h1}</h1>
          <p style="font-size: 1.15rem; max-width: 720px; opacity: 0.9; line-height: 1.6;">${seo.description}</p>
        </div>
      </div>
      <section style="padding: 60px 20px; max-width: 1140px; margin: 0 auto;">
        <h2>Our Offices in Tamil Nadu</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-top: 24px;">
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px;">
            <h3 style="color: #172A46; margin-top: 0;">Coimbatore Head Office</h3>
            <p style="color: #4a5568; line-height: 1.6;">
              No 3, 3rd Floor, Sri Ram Towers,<br />
              Near Lakshmi Mills Signal, P.N.Palayam,<br />
              Coimbatore, Tamil Nadu 641037
            </p>
            <p style="margin-top: 14px;"><strong>Phone:</strong> <a href="tel:+919043927967" style="color: #B3262D;">+91 90439 27967</a></p>
            <p><strong>Email:</strong> <a href="mailto:support@qaroo.in" style="color: #B3262D;">support@qaroo.in</a></p>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px;">
            <h3 style="color: #172A46; margin-top: 0;">Chennai Branch Office</h3>
            <p style="color: #4a5568; line-height: 1.6;">
              No. 13/4, Chavadi Street, Pallavaram,<br />
              Chennai, Tamil Nadu 600043
            </p>
            <p style="margin-top: 14px;"><strong>Phone:</strong> <a href="tel:+919043927967" style="color: #B3262D;">+91 90439 27967</a></p>
            <p><strong>Email:</strong> <a href="mailto:support@qaroo.in" style="color: #B3262D;">support@qaroo.in</a></p>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderCoursesHubBody(seo) {
  return `
    <div class="page-wrapper">
      <div style="padding: 60px 20px; background: linear-gradient(135deg, #172A46 0%, #B3262D 100%); color: #fff;">
        <div class="container" style="max-width: 1140px; margin: 0 auto;">
          <p style="text-transform: uppercase; letter-spacing: 2px; font-weight: 700; color: #F4C430; margin-bottom: 8px;">Career Training</p>
          <h1 style="font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; margin: 10px 0;">${seo.h1}</h1>
          <p style="font-size: 1.15rem; max-width: 720px; opacity: 0.9; line-height: 1.6;">${seo.description}</p>
        </div>
      </div>
      <section style="padding: 60px 20px; max-width: 1140px; margin: 0 auto;">
        <h2>Explore Job-Ready IT Courses in Coimbatore</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-top: 24px;">
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px;">
            <h3><a href="/courses/data-science-course-coimbatore" style="color: #172A46; text-decoration: none;">Data Science Course in Coimbatore</a></h3>
            <p style="color: #4a5568;">Python, Machine Learning, Tableau, PowerBI, Deep Learning with live industry projects and placement support.</p>
            <a href="/courses/data-science-course-coimbatore" style="color: #B3262D; font-weight: 700;">View Course Details →</a>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px;">
            <h3><a href="/courses/full-stack-developer-course-coimbatore" style="color: #172A46; text-decoration: none;">Full Stack Developer Course</a></h3>
            <p style="color: #4a5568;">Front-end, back-end, React, Node.js, databases, and API development with live projects and career mentoring.</p>
            <a href="/courses/full-stack-developer-course-coimbatore" style="color: #B3262D; font-weight: 700;">View Course Details →</a>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px;">
            <h3><a href="/courses/cyber-security-course-coimbatore" style="color: #172A46; text-decoration: none;">Cyber Security Course in Coimbatore</a></h3>
            <p style="color: #4a5568;">Network security, ethical hacking, vulnerability assessments, and security labs with certification guidance.</p>
            <a href="/courses/cyber-security-course-coimbatore" style="color: #B3262D; font-weight: 700;">View Course Details →</a>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px;">
            <h3><a href="/courses/ai-machine-learning-course-coimbatore" style="color: #172A46; text-decoration: none;">AI & Machine Learning Course</a></h3>
            <p style="color: #4a5568;">Artificial Intelligence, machine learning models, neural networks, PyTorch, and NLP through practical projects.</p>
            <a href="/courses/ai-machine-learning-course-coimbatore" style="color: #B3262D; font-weight: 700;">View Course Details →</a>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px;">
            <h3><a href="/courses/ui-ux-design-course-coimbatore" style="color: #172A46; text-decoration: none;">UI/UX Design Course in Coimbatore</a></h3>
            <p style="color: #4a5568;">User research, wireframing, Figma design systems, interactive prototyping, and design portfolio building.</p>
            <a href="/courses/ui-ux-design-course-coimbatore" style="color: #B3262D; font-weight: 700;">View Course Details →</a>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderServicesHubBody(seo) {
  return `
    <div class="page-wrapper">
      <div style="padding: 60px 20px; background: linear-gradient(135deg, #172A46 0%, #B3262D 100%); color: #fff;">
        <div class="container" style="max-width: 1140px; margin: 0 auto;">
          <p style="text-transform: uppercase; letter-spacing: 2px; font-weight: 700; color: #F4C430; margin-bottom: 8px;">Business Solutions</p>
          <h1 style="font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; margin: 10px 0;">${seo.h1}</h1>
          <p style="font-size: 1.15rem; max-width: 720px; opacity: 0.9; line-height: 1.6;">${seo.description}</p>
        </div>
      </div>
      <section style="padding: 60px 20px; max-width: 1140px; margin: 0 auto;">
        <h2>Enterprise Services for Growing Businesses</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-top: 24px;">
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px;">
            <h3><a href="/services/software-web-development" style="color: #172A46; text-decoration: none;">Software & Web Development</a></h3>
            <p style="color: #4a5568;">Custom web applications, enterprise software, and scalable APIs engineered for high reliability.</p>
            <a href="/services/software-web-development" style="color: #B3262D; font-weight: 700;">Explore Development →</a>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px;">
            <h3><a href="/services/crm-solutions" style="color: #172A46; text-decoration: none;">CRM Solutions</a></h3>
            <p style="color: #4a5568;">Custom CRM architecture, sales automation, and lead management systems that streamline follow-ups.</p>
            <a href="/services/crm-solutions" style="color: #B3262D; font-weight: 700;">Explore CRM Solutions →</a>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px;">
            <h3><a href="/services/digital-marketing" style="color: #172A46; text-decoration: none;">Digital Marketing</a></h3>
            <p style="color: #4a5568;">Search engine optimization (SEO), performance ads, and organic social media campaigns.</p>
            <a href="/services/digital-marketing" style="color: #B3262D; font-weight: 700;">Explore Marketing →</a>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px;">
            <h3><a href="/services/ui-ux-branding" style="color: #172A46; text-decoration: none;">UI/UX & Branding</a></h3>
            <p style="color: #4a5568;">Brand identity, logos, design systems, and user experience design that make your business stand out.</p>
            <a href="/services/ui-ux-branding" style="color: #B3262D; font-weight: 700;">Explore Design & Branding →</a>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px;">
            <h3><a href="/services/business-strategy" style="color: #172A46; text-decoration: none;">Digital & Business Strategy Consulting</a></h3>
            <p style="color: #4a5568;">Growth roadmaps, digital transformation consulting, and technology architecture for scale.</p>
            <a href="/services/business-strategy" style="color: #B3262D; font-weight: 700;">Explore Strategy Consulting →</a>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderHomeBody(seo) {
  return `
    <div class="page-wrapper">
      <section class="qhero" style="padding: 70px 20px; background: linear-gradient(135deg, #172A46 0%, #B3262D 100%); color: #fff;">
        <div class="container" style="max-width: 1140px; margin: 0 auto;">
          <p style="text-transform: uppercase; letter-spacing: 2px; font-weight: 700; color: #F4C430; margin-bottom: 8px;">Coimbatore • Chennai</p>
          <h1 style="font-size: clamp(2rem, 4.5vw, 3.2rem); font-weight: 800; margin: 12px 0;">${seo.h1}</h1>
          <p style="font-size: 1.2rem; max-width: 740px; opacity: 0.92; line-height: 1.6;">${seo.description}</p>
          <div style="margin-top: 26px; display: flex; gap: 14px; flex-wrap: wrap;">
            <a href="/services" style="background: #F4C430; color: #172A46; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Explore Business Solutions</a>
            <a href="/courses" style="border: 2px solid #fff; color: #fff; padding: 10px 22px; border-radius: 8px; font-weight: 600; text-decoration: none;">Explore IT Courses</a>
          </div>
        </div>
      </section>
      <section style="padding: 50px 20px; max-width: 1140px; margin: 0 auto;">
        <h2>Practical IT Training with Direct Placement Support</h2>
        <p style="color: #4a5568; font-size: 1.05rem; line-height: 1.7;">
          Qaroo India provides classroom and online career training in Data Science, Full Stack Web Development, Cyber Security, Artificial Intelligence, and UI/UX Design in Coimbatore.
          Our students build real portfolio projects, complete internships, and receive dedicated placement support.
        </p>
      </section>
    </div>
  `;
}

function render404Body() {
  return `
    <div class="page-wrapper">
      <section style="padding: 100px 20px; text-align: center; background: #172A46; color: #fff;">
        <span style="font-size: 6rem; font-weight: 800; opacity: 0.25; display: block;">404</span>
        <h1 style="font-size: 2.2rem; font-weight: 800; margin-top: -20px;">Page Not Found</h1>
        <p style="max-width: 500px; margin: 16px auto; opacity: 0.8; font-size: 1.05rem;">The page you are looking for doesn't exist or has moved. Return to the homepage to explore courses and services.</p>
        <div style="margin-top: 24px;">
          <a href="/" style="background: #F4C430; color: #172A46; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Back to Home</a>
        </div>
      </section>
    </div>
  `;
}

let generatedCount = 0;

for (const [routePath, seo] of Object.entries(SEO_PAGES)) {
  let bodyHtml = '';
  if (routePath === '/') bodyHtml = renderHomeBody(seo);
  else if (routePath === '/about') bodyHtml = renderAboutBody(seo);
  else if (routePath === '/contact') bodyHtml = renderContactBody(seo);
  else if (routePath === '/courses') bodyHtml = renderCoursesHubBody(seo);
  else if (routePath === '/services') bodyHtml = renderServicesHubBody(seo);
  else if (routePath.startsWith('/courses/')) bodyHtml = renderCourseBody(seo);
  else if (routePath.startsWith('/services/')) bodyHtml = renderServiceBody(seo);

  // Build route-specific JSON-LD scripts
  let extraScripts = '';
  if (seo.breadcrumbs) {
    const breadcrumbSchema = buildBreadcrumbSchema(seo.breadcrumbs);
    extraScripts += `\n  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`;
  }
  if (seo.schema) {
    extraScripts += `\n  <script type="application/ld+json">${JSON.stringify(seo.schema)}</script>`;
  }
  if (seo.faqs) {
    const faqSchema = buildFAQSchema(seo.faqs);
    extraScripts += `\n  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`;
  }

  // Inject meta tags and body into template
  let pageHtml = template;
  pageHtml = pageHtml.replace(/<title>.*?<\/title>/i, `<title>${seo.title}</title>`);
  pageHtml = pageHtml.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${seo.description}" />`);
  pageHtml = pageHtml.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="${seo.canonical}" />`);
  pageHtml = pageHtml.replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${seo.title}" />`);
  pageHtml = pageHtml.replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${seo.description}" />`);
  pageHtml = pageHtml.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${seo.canonical}" />`);
  pageHtml = pageHtml.replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${seo.title}" />`);
  pageHtml = pageHtml.replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${seo.description}" />`);

  if (extraScripts) {
    pageHtml = pageHtml.replace('</head>', `${extraScripts}\n</head>`);
  }

  if (bodyHtml) {
    pageHtml = pageHtml.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
  }

  let targetDir;
  let targetFile;

  if (routePath === '/') {
    targetDir = DIST;
    targetFile = path.join(DIST, 'index.html');
  } else {
    const rel = routePath.replace(/^\//, '');
    targetDir = path.join(DIST, rel);
    targetFile = path.join(targetDir, 'index.html');
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetFile, pageHtml, 'utf8');
  generatedCount++;

  if (routePath === '/about') {
    fs.writeFileSync(path.join(DIST, 'about.html'), pageHtml, 'utf8');
  }
  if (routePath === '/contact') {
    fs.writeFileSync(path.join(DIST, 'contact.html'), pageHtml, 'utf8');
  }
}

// Generate real dist/404.html to eliminate Soft 404 penalties on Vercel
const notFoundHtml = template
  .replace(/<title>.*?<\/title>/i, '<title>Page Not Found (404) | Qaroo India</title>')
  .replace(/<meta name="description" content=".*?" \/>/i, '<meta name="description" content="The page you requested could not be found." />')
  .replace('<div id="root"></div>', `<div id="root">${render404Body()}</div>`);

fs.writeFileSync(path.join(DIST, '404.html'), notFoundHtml, 'utf8');
console.log(`[prerender] Successfully generated pre-rendered static HTML for ${generatedCount} SEO routes + 404.html in dist/`);
