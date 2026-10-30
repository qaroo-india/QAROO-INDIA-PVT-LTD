import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import JobTemplate from './JobTemplate.jsx';
import { careerApi } from '../../api/careerApi.js';
import { Shimmer, ErrorState, EmptyState } from '../../components/ui/States';

/**
 * Loads one vacancy by slug and hands it to the template. Drafts are filtered
 * out server-side, so an unpublished role 404s here for visitors.
 */
export default function JobDetail() {
  const { slug } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setJob(null);

    careerApi
      .getBySlug(slug, { credentials: 'omit' })
      .then((res) => {
        if (!active) return;
        setJob(res?.data?.job || null);
      })
      .catch((err) => {
        if (active) setError(err?.message || 'We could not load this role.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <Shimmer />;

  if (error) {
    return (
      <Container className="page-section">
        <ErrorState title="Could not load this role" text={error} />
        <p style={{ textAlign: 'center' }}>
          <Link to="/careers" className="btn-eduact-outline">
            View all open positions
          </Link>
        </p>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container className="page-section">
        <EmptyState
          title="This role is no longer open"
          text="It may have been filled or taken down. Our other open positions are listed on the careers page."
        />
        <p style={{ textAlign: 'center' }}>
          <Link to="/careers" className="btn-eduact-outline">
            View all open positions
          </Link>
        </p>
      </Container>
    );
  }

  return <JobTemplate job={job} />;
}
