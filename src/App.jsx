import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import NavigationBar from './components/Navbar';
import Footer from './components/Footer';
import ClickSpark from './components/ClickSpark';
import AdminRoutes from './admin/AdminRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import ToastProvider from './context/ToastContext';
import NetworkStatus from './components/NetworkStatus';
import CookieConsent from './components/CookieConsent';
import { Shimmer } from './components/ui/States';
import { trackPageView } from './utils/analytics';
import { installGlobalHandlers } from './utils/crashReporter';
import { COMPANY } from './data/company.js';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const BusinessSolutions = lazy(() => import('./pages/BusinessSolutions'));
const BusinessSolutionDetail = lazy(() => import('./pages/business/BusinessSolutionDetail'));
const LearningPrograms = lazy(() => import('./pages/LearningPrograms'));
const CourseDetailPage = lazy(() => import('./pages/learning/CourseDetailPage'));
const CSRProjects = lazy(() => import('./pages/CSRProjects'));
const MOUDirectory = lazy(() => import('./pages/MOUDirectory'));
const Careers = lazy(() => import('./pages/Careers'));
const JobDetail = lazy(() => import('./pages/careers/JobDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const SitemapPage = lazy(() => import('./pages/SitemapPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageWrapper({ children }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return <div className="page-wrapper" key={pathname}>{children}</div>;
}

function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    installGlobalHandlers();
  }, []);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  // Marks the public site so its styling can differ from the admin panel,
  // which shares the same document. Used for the capitalised text.
  useEffect(() => {
    document.body.classList.toggle('public-site', !isAdmin);
    return () => document.body.classList.remove('public-site');
  }, [isAdmin]);

  useEffect(() => {
    const toTop = document.getElementById('to-top');
    const progress = document.getElementById('scroll-progress');
    // Scroll events fire far faster than the screen refreshes, and reading
    // scrollHeight forces layout. Coalescing into one frame means at most one
    // layout read and one style write per paint instead of per event, and the
    // listener is passive so it never blocks the scroll itself.
    let frame = 0;
    let atTop = null;

    const render = () => {
      frame = 0;
      const y = window.scrollY;
      const past = y > 500;
      if (past !== atTop) {
        atTop = past;
        if (toTop) toTop.classList.toggle('show', past);
      }
      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
        progress.style.transform = `scaleX(${pct})`;
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    render();

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });

    const observe = () => {
      document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => io.observe(el));
    };
    observe();

    // Re-observe after route changes
    const observer = new MutationObserver(observe);
    observer.observe(document.getElementById('root'), { childList: true, subtree: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      io.disconnect();
      observer.disconnect();
    };
  }, []);

  if (isAdmin) {
    return <AdminRoutes />;
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <ClickSpark
          sparkColor="#F4C430"
          sparkSize={12}
          sparkRadius={20}
          sparkCount={8}
          duration={450}
          easing="ease-out"
        >
          <NetworkStatus />
          <div id="scroll-progress" />
          {/* First thing in the tab order, so a keyboard or screen-reader user
              can jump past the navigation instead of walking every link on
              every page. Only visible while focused. */}
          <a className="skip-link" href="#main-content">Skip to main content</a>
          <NavigationBar />
          <main id="main-content">
            <Suspense
              fallback={
                <Shimmer />
              }
            >
            <Routes>
              <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
              <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
              <Route path="/business-solutions" element={<PageWrapper><BusinessSolutions /></PageWrapper>} />
              <Route path="/business-solutions/:slug" element={<PageWrapper><BusinessSolutionDetail /></PageWrapper>} />
              <Route path="/learning-programs" element={<PageWrapper><LearningPrograms /></PageWrapper>} />
              <Route path="/learning-programs/:slug" element={<PageWrapper><CourseDetailPage /></PageWrapper>} />
              <Route path="/csr-projects" element={<PageWrapper><CSRProjects /></PageWrapper>} />
              <Route path="/mou-directory" element={<PageWrapper><MOUDirectory /></PageWrapper>} />
              <Route path="/careers" element={<PageWrapper><Careers /></PageWrapper>} />
              <Route path="/careers/:slug" element={<PageWrapper><JobDetail /></PageWrapper>} />
              <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />
              <Route path="/privacy-policy" element={<PageWrapper><PrivacyPolicy /></PageWrapper>} />
              <Route path="/terms" element={<PageWrapper><Terms /></PageWrapper>} />
              <Route path="/sitemap" element={<PageWrapper><SitemapPage /></PageWrapper>} />
              <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
            </Routes>
          </Suspense>
          </main>
          <Footer />
          <button
            id="to-top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Back to top"
          >
            ↑
          </button>
          <a
            className="wa-fab"
            href={`https://wa.me/${COMPANY.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi Qaroo India, I would like to know more about your services.')}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
          >
            <svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor" aria-hidden="true">
              <path d="M16.04 3C9.4 3 4 8.4 4 15.04c0 2.12.56 4.2 1.62 6.03L4 29l8.14-1.58a12 12 0 0 0 3.9.66h.01C21.7 28.08 27.1 22.68 27.1 16.04 27.1 12.74 25.78 9.6 23.4 7.22A12 12 0 0 0 16.04 3Zm0 2.2c2.75 0 5.34 1.07 7.28 3.02 1.95 1.95 3.01 4.53 3.01 7.28 0 5.69-4.63 10.31-10.33 10.31-1.93 0-3.81-.52-5.46-1.51l-.39-.23-4.24.83.86-4.13-.25-.4a10.19 10.19 0 0 1-1.56-5.42C5.96 9.83 10.58 5.2 16.04 5.2Zm-4.73 3.42c-.23 0-.6.09-.91.42-.31.34-1.2 1.17-1.2 2.86 0 1.68 1.22 3.31 1.4 3.54.17.23 2.4 3.83 5.91 5.32 2.93 1.25 3.52.88 4.16.83.64-.06 2.06-.84 2.35-1.65.29-.82.29-1.52.2-1.66-.08-.15-.31-.23-.65-.4-.34-.17-2.05-1.01-2.37-1.13-.31-.11-.54-.17-.77.17-.22.34-.87 1.13-1.07 1.36-.2.23-.4.26-.74.09-.34-.17-1.44-.53-2.75-1.69a10.3 10.3 0 0 1-1.9-2.37c-.2-.34-.02-.52.15-.69.15-.15.34-.4.51-.6.17-.2.22-.34.34-.57.11-.23.06-.43-.03-.6-.08-.17-.75-1.82-1.03-2.49-.27-.65-.55-.57-.76-.58-.2-.01-.42-.01-.64-.01Z" />
            </svg>
          </a>
        </ClickSpark>
        <CookieConsent />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
