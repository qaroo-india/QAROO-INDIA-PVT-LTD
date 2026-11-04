import { useState, useEffect } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { COMPANY } from '../data/company.js';
import { learningApi } from '../api/learningApi.js';
import { businessSolutionApi } from '../api/businessSolutionApi.js';

import { BUSINESS_LINKS, LEARNING_LINKS } from '../data/catalog.js';

const DEFAULT_NAVBAR = {
  businessTitle: 'Business Solutions',
  businessLinks: BUSINESS_LINKS,
  learningTitle: 'Learnings',
  learningLinks: LEARNING_LINKS,
  csrTitle: 'CSR Projects',
  csrLinks: [
    { label: 'CSR Projects Overview', path: '/csr-projects' },
    { label: '📋 MOU Directory', path: '/mou-directory' },
  ],
  navLinks: [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Careers', path: '/careers' },
    { label: 'Contact', path: '/contact' },
  ],
  phone: COMPANY.primaryPhone,
  ctaText: 'Talk to an Expert',
  ctaPath: '/contact',
};

const splitHalf = (arr = []) => {
  const mid = Math.ceil(arr.length / 2);
  return [arr.slice(0, mid), arr.slice(mid)];
};

export default function NavigationBar() {
  const [navLinks, setNavLinks] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const location = useLocation();

  const cfg = navLinks || DEFAULT_NAVBAR;

  useEffect(() => {
    // Passive + rAF, and the state only changes when the threshold is actually
    // crossed, so scrolling does not queue a React update per event.
    let frame = 0;
    let past = false;

    const render = () => {
      frame = 0;
      const next = window.scrollY > 20;
      if (next !== past) {
        past = next;
        setScrolled(next);
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    render();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Load dynamic learning programs + business solutions for the dropdowns.
  useEffect(() => {
    let active = true;
    Promise.all([
      learningApi.list({}, { credentials: 'omit' }).catch(() => null),
      businessSolutionApi.list({}, { credentials: 'omit' }).catch(() => null),
    ]).then(([lres, bres]) => {
      if (!active) return;
      const programs = (lres?.data?.programs || [])
        .filter((p) => p.status === 'published')
        .map((p) => ({ label: p.title || p.pageName, path: `/learning-programs/${p.slug}` }));
      const solutions = (bres?.data?.solutions || [])
        .filter((s) => s.status === 'published')
        .map((s) => ({ label: s.pageName || s.title, path: `/business-solutions/${s.slug}` }));
      // Only override when we have real data; otherwise keep defaults.
      if (programs.length === 0 && solutions.length === 0) return;
      setNavLinks({
        ...DEFAULT_NAVBAR,
        learningLinks: programs.length ? programs : DEFAULT_NAVBAR.learningLinks,
        businessLinks: solutions.length ? solutions : DEFAULT_NAVBAR.businessLinks,
      });
    });
    return () => { active = false; };
  }, []);


  const closeAll = () => {
    setExpanded(false);
    setOpenMenu(null);
  };

  useEffect(() => {
    closeAll();
  }, [location.pathname]);

  // Close menus when clicking outside the navbar
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.navbar')) {
        closeAll();
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const isActive = (path) => location.pathname === path;
  const [bizCol1, bizCol2] = splitHalf(cfg.businessLinks);
  const [learnCol1, learnCol2] = splitHalf(cfg.learningLinks);
  const navTitleStyle = { fontWeight: 600, fontSize: '14.5px', color: 'var(--eduact-black)' };

  const toggleMenu = (menu) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const renderDropdown = (menu, title, wrapperClass, content) => {
    const isOpen = openMenu === menu;
    return (
      <div
        className={`nav-item dropdown ${wrapperClass} ${isOpen ? 'is-open' : ''}`}
        onMouseEnter={() => {
          if (typeof window !== 'undefined' && window.innerWidth >= 992) {
            setOpenMenu(menu);
          }
        }}
        onMouseLeave={() => {
          if (typeof window !== 'undefined' && window.innerWidth >= 992) {
            setOpenMenu(null);
          }
        }}
      >
        <span
          className={`nav-link dropdown-toggle ${isOpen ? 'show active' : ''}`}
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu(menu);
          }}
          style={{ ...navTitleStyle, cursor: 'pointer' }}
        >
          {title}
        </span>
        {isOpen && (
          <div className="dropdown-menu show" role="menu">
            {content}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
    <div className="navbar-topbar">
      <Container>
        <div className="d-flex justify-content-between align-items-center">
          <span className="navbar-topbar-tagline d-none d-sm-inline">Digital Solutions &amp; Career Building</span>
          <span className="navbar-topbar-phone">
            <Icon name="phone" size={14} strokeWidth={1.9} />
            {cfg.phone}
          </span>
        </div>
      </Container>
    </div>
    {expanded && (
      <div
        className="navbar-backdrop d-lg-none"
        onClick={closeAll}
        aria-hidden="true"
      />
    )}
    <Navbar
      expand="lg"
      expanded={expanded}
      onToggle={(next) => setExpanded(typeof next === 'boolean' ? next : !expanded)}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--eduact-white)',
        borderBottom: '1px solid var(--eduact-soft4)',
        padding: scrolled ? '8px 0' : '14px 0',
        transition: 'padding 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease',
        boxShadow: scrolled ? '0 8px 24px rgba(23, 42, 70,0.12)' : 'none',
      }}
      variant="light"
    >
      <Container>
        <Navbar.Brand as={Link} to="/" onClick={closeAll} style={{
          display: 'flex',
          alignItems: 'center',
        }}>
          {/* Transparent PNG: the .jpg carries an opaque off-white plate that
              reads as a grey block on the white bar. The .jpg is still the
              og:image, where an opaque background is what you want. */}
          <img
            src="/logos/qaroo-logo.png"
            alt="Qaroo India"
            width="472"
            height="132"
            style={{
              height: 'clamp(38px, 5vw, 46px)',
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </Navbar.Brand>

        <Navbar.Toggle
          aria-controls="main-navbar"
          aria-label="Toggle navigation"
          style={{ borderColor: 'rgba(23, 42, 70, 0.35)' }}
        />

        <Navbar.Collapse id="main-navbar">
          <Nav className="mx-auto" style={{ gap: '4px' }}>
            {/* Business Solutions Mega Dropdown */}
            {renderDropdown('business', cfg.businessTitle,
              location.pathname.startsWith('/business-solutions') || location.pathname.startsWith('/services') ? 'active' : '',
              (
                <>
                  <Link to="/services" className="mega-head" onClick={closeAll}>Explore All Solutions</Link>
                  <div className="mega-grid">
                    <div>
                      {bizCol1.map((link) => (
                        <Link
                          key={link.label}
                          className="dropdown-item"
                          to={link.path}
                          onClick={closeAll}
                          style={{
                            fontSize: '14px',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            color: 'var(--eduact-black)',
                          }}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                    <div>
                      {bizCol2.map((link) => (
                        <Link
                          key={link.label}
                          className="dropdown-item"
                          to={link.path}
                          onClick={closeAll}
                          style={{
                            fontSize: '14px',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            color: 'var(--eduact-black)',
                          }}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ))}

            {/* Learnings Mega Dropdown */}
            {renderDropdown('learning', cfg.learningTitle,
              location.pathname.startsWith('/learning-programs') || location.pathname.startsWith('/courses') ? 'active' : '',
              (
                <>
                  <Link to="/courses" className="mega-head" onClick={closeAll}>Explore All Programs</Link>
                  <div className="mega-grid">
                    <div>
                      {learnCol1.map((link) => (
                        <Link
                          key={link.label}
                          className="dropdown-item"
                          to={link.path}
                          onClick={closeAll}
                          style={{
                            fontSize: '14px',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            color: 'var(--eduact-black)',
                          }}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                    <div>
                      {learnCol2.map((link) => (
                        <Link
                          key={link.label}
                          className="dropdown-item"
                          to={link.path}
                          onClick={closeAll}
                          style={{
                            fontSize: '14px',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            color: 'var(--eduact-black)',
                          }}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ))}

            {/* CSR Projects Dropdown */}
            {renderDropdown('csr', cfg.csrTitle,
              isActive('/csr-projects') || isActive('/mou-directory') ? 'active' : '',
              (
                <>
                  {cfg.csrLinks.map((link, i) => (
                    <div key={link.label + i}>
                      {i > 0 && <div className="dropdown-divider" style={{ borderColor: 'rgba(179, 38, 45, 0.15)' }} />}
                      <Link
                        to={link.path}
                        className="dropdown-item"
                        onClick={closeAll}
                        style={{
                          fontSize: '14px',
                          padding: '10px 16px',
                          fontWeight: i === 0 ? 400 : 700,
                          color: i === 0 ? 'var(--eduact-black)' : 'var(--eduact-base)',
                        }}
                      >
                        {link.label}
                      </Link>
                    </div>
                  ))}
                </>
              ))}

            {cfg.navLinks.map((link) => (
              <Nav.Link
                key={link.path}
                as={Link}
                to={link.path}
                onClick={closeAll}
                style={{
                  fontWeight: 600,
                  fontSize: '14.5px',
                  color: isActive(link.path) ? 'var(--eduact-base)' : 'var(--eduact-black)',
                  borderBottom: isActive(link.path) ? '2px solid var(--eduact-secondary)' : '2px solid transparent',
                  margin: '0 4px',
                  paddingBottom: '6px',
                }}
              >
                {link.label}
              </Nav.Link>
            ))}
          </Nav>

          <div className="d-flex align-items-center gap-3">
            <Link to={cfg.ctaPath} onClick={closeAll} className="btn-eduact" style={{
              fontSize: '13px',
              padding: '10px 20px',
              background: 'var(--eduact-secondary)',
              color: 'var(--eduact-black)',
            }}>
              <Icon name="message" size={15} strokeWidth={1.9} />
              {cfg.ctaText}
            </Link>
          </div>
        </Navbar.Collapse>
      </Container>

      <style>{`
        .navbar-light .navbar-nav .nav-link {
          position: relative;
          border-radius: 8px;
          transition: background 0.25s ease, color 0.25s ease, transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
          will-change: transform;
        }
        .navbar-light .navbar-nav .nav-link:hover,
        .navbar-light .navbar-nav .nav-link:focus {
          color: var(--eduact-base) !important;
          background: rgba(179, 38, 45, 0.06);
          box-shadow: 0 2px 8px rgba(23, 42, 70, 0.08);
        }
        .dropdown-item {
          color: var(--eduact-black);
          border-radius: 8px;
          transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }
        .dropdown-item:hover, .dropdown-item:focus {
          background: rgba(179, 38, 45, 0.08);
          color: var(--eduact-base);
          transform: translateX(3px);
        }
        .navbar .dropdown-toggle::after {
          vertical-align: middle;
          margin-left: 6px;
          border-top-color: rgba(23, 42, 70, 0.6);
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-top-color 0.25s ease;
        }
        .navbar .dropdown-toggle[aria-expanded="true"]::after {
          transform: rotate(180deg);
        }
        .mega-head {
          display: block;
          width: max-content;
          margin: 2px auto 12px;
          font-family: var(--heading-font);
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #fff;
          background: linear-gradient(120deg, var(--eduact-base), #8a1820);
          padding: 8px 20px;
          border-radius: 999px;
          text-decoration: none;
          box-shadow: 0 8px 18px -8px rgba(179, 38, 45, 0.55);
          transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.26s ease, filter 0.26s ease;
        }
        .mega-head::after {
          content: '→';
          margin-left: 8px;
          transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mega-head:hover {
          filter: brightness(1.06);
          transform: translateY(-1px);
          box-shadow: 0 12px 22px -10px rgba(179, 38, 45, 0.65);
        }
        .mega-head:hover::after {
          transform: translateX(4px);
        }
        .navbar-toggler {
          border: 1px solid rgba(23, 42, 70, 0.25);
          padding: 6px 10px;
          border-radius: 8px;
          transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
        }
        .navbar-toggler:hover {
          border-color: var(--eduact-base);
          background: rgba(179, 38, 45, 0.05);
        }
        .navbar-toggler:focus {
          box-shadow: 0 0 0 3px rgba(179, 38, 45, 0.2);
        }

        /* Desktop Dropdown Styles (>= 992px) */
        @media (min-width: 992px) {
          .navbar-light .navbar-nav .nav-link:hover,
          .navbar-light .navbar-nav .nav-link:focus {
            transform: translateY(-1px);
          }
          .navbar .nav-item {
            position: relative;
            padding-bottom: 4px;
          }
          .navbar .dropdown-menu {
            position: absolute;
            left: 50%;
            top: 100%;
            transform: translate(-50%, 0);
            margin-top: 2px;
            background: #ffffff;
            border: 1px solid var(--eduact-soft4);
            border-radius: 14px;
            box-shadow: 0 20px 50px rgba(23, 42, 70, 0.15);
            padding: 12px;
            min-width: 220px;
            z-index: 1050;
            animation: desktopDropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes desktopDropdownIn {
            from {
              opacity: 0;
              transform: translate(-50%, 6px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translate(-50%, 0) scale(1);
            }
          }
          .mega-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
            min-width: min(440px, 92vw);
            padding: 8px;
          }
        }

        /* Mobile & Tablet Responsive (< 992px) */
        @media (max-width: 991.98px) {
          .navbar {
            padding: 8px 0 !important;
          }
          .navbar > .container {
            position: relative !important;
          }
          .navbar-collapse:not(.show),
          .navbar-collapse.collapsing {
            display: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          .dropdown-menu:not(.show) {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          .navbar-collapse.show {
            position: absolute !important;
            top: calc(100% + 8px) !important;
            left: 12px !important;
            right: 12px !important;
            display: block !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 16px 14px 20px !important;
            border-radius: 16px !important;
            border: 1px solid var(--eduact-soft4) !important;
            box-shadow: 0 20px 48px -6px rgba(23, 42, 70, 0.22) !important;
            max-height: calc(100vh - 100px) !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
            z-index: 1050 !important;
            animation: mobileCollapseIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes mobileCollapseIn {
            from {
              opacity: 0;
              transform: translateY(-8px) scale(0.99);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .navbar-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(23, 42, 70, 0.38);
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
            z-index: 99;
            animation: backdropFade 0.2s ease forwards;
          }
          @keyframes backdropFade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .navbar-nav {
            width: 100% !important;
            margin: 0 0 12px 0 !important;
            gap: 4px !important;
          }
          .nav-item.dropdown {
            width: 100%;
          }
          .navbar-light .navbar-nav .nav-link {
            padding: 10px 14px !important;
            font-size: 15px !important;
            margin: 0 !important;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-radius: 8px !important;
            border-bottom: none !important;
          }
          .navbar-light .navbar-nav .nav-link:hover,
          .navbar-light .navbar-nav .nav-link:focus,
          .navbar-light .navbar-nav .nav-link.show {
            background: rgba(179, 38, 45, 0.06);
            color: var(--eduact-base) !important;
          }
          .navbar .dropdown-toggle::after {
            margin-left: auto;
          }
          .navbar-collapse .dropdown-menu {
            position: static !important;
            float: none !important;
            display: block !important;
            width: 100% !important;
            margin: 4px 0 8px !important;
            padding: 8px 6px !important;
            background: #f8fafc !important;
            border: 1px solid rgba(23, 42, 70, 0.08) !important;
            border-radius: 10px !important;
            box-shadow: none !important;
            transform: none !important;
            animation: mobileDropdownSlide 0.2s ease-out forwards;
          }
          @keyframes mobileDropdownSlide {
            from {
              opacity: 0;
              transform: translateY(-4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .mega-grid {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
            padding: 0;
          }
          .mega-head {
            margin: 6px 0 8px 4px;
            display: inline-block;
            font-size: 10.5px;
            padding: 6px 14px;
          }
          .dropdown-item {
            padding: 9px 12px !important;
            font-size: 13.5px !important;
            white-space: normal !important;
            word-break: break-word;
          }
          .dropdown-item:hover, .dropdown-item:focus {
            transform: none !important;
          }
          .navbar-collapse .btn-eduact {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 12px 20px;
            font-size: 14px;
            margin-top: 6px;
          }
        }
      `}</style>
    </Navbar>
    </>
  );
}
