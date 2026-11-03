import { Breadcrumb } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Seo from '../../components/Seo.jsx';
import FeatureLine from '../../components/FeatureLine';
import Icon from '../../components/Icon';
import ApplyForm from './ApplyForm.jsx';
import { COMPANY } from '../../data/company.js';
import './Careers.css';
import PageHero from '../../components/PageHero';
import PageBackdrop from '../../components/PageBackdrop.jsx';
import LinedSection from '../../components/LinedSection.jsx';
import { SITE_URL } from '../../data/site.js';

const SITE = SITE_URL;

/** Only render a block when the posting actually fills it. */
function ListBlock({ heading, items }) {
  if (!items || !items.length) return null;
  return (
    <section className="job-block reveal">
      <h2>{heading}</h2>
      <ul className="feature-list">
        {items.map((item) => (
          <FeatureLine key={item} label={item} />
        ))}
      </ul>
    </section>
  );
}

function StackBlock({ heading, groups, note }) {
  if (!groups || !groups.length) return null;
  return (
    <section className="job-block reveal">
      <h2>{heading}</h2>
      <div className="job-stack">
        {groups.map((group) => (
          <div key={group.title} className="job-stack__group">
            <h3>{group.title}</h3>
            <ul>
              {(group.items || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {note ? <p className="job-note">{note}</p> : null}
    </section>
  );
}

/**
 * Presentational template for one vacancy. Takes a plain job object so it can
 * render from the API, from seed data, or from an admin preview.
 */
export default function JobTemplate({ job }) {
  const title = job.pageName || job.title;
  const path = `/careers/${job.slug}`;

  // schema.org JobPosting. Only fields we genuinely have are emitted - no
  // invented salary or expiry.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description: job.overview || job.seoDescription || '',
    datePosted: job.createdAt ? new Date(job.createdAt).toISOString().slice(0, 10) : undefined,
    employmentType: job.employmentType || 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: COMPANY.name,
      sameAs: SITE,
      logo: `${SITE}/logos/qaroo-logo.jpg`,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || 'Coimbatore',
        addressRegion: 'Tamil Nadu',
        addressCountry: 'IN',
      },
    },
    ...(job.experience ? { experienceRequirements: job.experience } : {}),
    ...(job.qualifications?.length ? { educationRequirements: job.qualifications.join(', ') } : {}),
    ...(job.requiredSkills?.length ? { skills: job.requiredSkills.join(', ') } : {}),
    url: `${SITE}${path}`,
  };

  return (
    <div className="careers-page">
      <PageBackdrop />

      <Seo
        title={job.seoTitle || `${title} - Careers at ${COMPANY.name}`}
        description={job.seoDescription || job.overview?.slice(0, 160) || ''}
        path={path}
        jsonLd={jsonLd}
        jsonLdId="job-posting"
      />

      <PageHero padding="56px 0 72px">
        <Breadcrumb style={{ marginBottom: '14px' }}>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }} style={{ color: 'rgba(255,255,255,0.6)' }}>
            Home
          </Breadcrumb.Item>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/careers' }} style={{ color: 'rgba(255,255,255,0.6)' }}>
            Careers
          </Breadcrumb.Item>
          <Breadcrumb.Item active style={{ color: '#fff' }}>
            {title}
          </Breadcrumb.Item>
        </Breadcrumb>

        <span className="eyebrow">{job.department || 'Open Position'}</span>
        <h1
          style={{
            fontFamily: 'var(--heading-font)',
            fontWeight: 800,
            color: '#fff',
            fontSize: 'clamp(1.9rem, 3.6vw, 2.7rem)',
            marginTop: '10px',
          }}
        >
          {title}
        </h1>

        <ul className="job-facts">
          {job.jobType ? (
            <li>
              <Icon name="briefcase" size={15} />
              {job.jobType}
            </li>
          ) : null}
          {job.experience ? (
            <li>
              <Icon name="chart" size={15} />
              {job.experience}
            </li>
          ) : null}
          {job.location ? (
            <li>
              <Icon name="map-pin" size={15} />
              {job.location}
            </li>
          ) : null}
        </ul>

        <a href="#apply" className="btn-eduact-secondary" style={{ marginTop: '22px' }}>
          Apply Now
          <Icon name="arrow-right" size={16} strokeWidth={2} />
        </a>
      </PageHero>

      <LinedSection maxWidth="880px">
        {job.overview ? (
          <section className="job-block reveal">
            <h2>Job Overview</h2>
            {job.overview.split('\n\n').map((para) => (
              <p key={para.slice(0, 40)}>{para}</p>
            ))}
          </section>
        ) : null}

        <ListBlock heading="Key Responsibilities" items={job.responsibilities} />
        <ListBlock heading="Training Areas" items={job.trainingAreas} />
        <StackBlock heading="Technical Stack" groups={job.techStack} note={job.note} />
        <ListBlock heading="Required Skills" items={job.requiredSkills} />
        <ListBlock heading="Preferred Skills" items={job.preferredSkills} />
        <ListBlock heading="Accounting Knowledge" items={job.knowledgeAreas} />
        <ListBlock heading="Qualification" items={job.qualifications} />
        <ListBlock heading="Ideal Candidate" items={job.idealCandidate} />
        <ListBlock heading="Benefits" items={job.benefits} />

        <section className="job-block job-apply reveal" id="apply">
          <h2>Apply for this role</h2>
          <p>
            Your application goes straight to our team. Fields marked{' '}
            <span aria-hidden="true">*</span> are required.
          </p>
          <ApplyForm jobSlug={job.slug} jobTitle={title} />
        </section>

        <p className="job-back">
          <Link to="/careers">
            <Icon name="arrow-right" size={15} strokeWidth={2} style={{ transform: 'rotate(180deg)' }} />
            All open positions
          </Link>
        </p>
      </LinedSection>
    </div>
  );
}
