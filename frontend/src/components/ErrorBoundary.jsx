import { Component } from 'react';
import { reportError } from '../utils/crashReporter.js';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    reportError(error, { componentStack: info?.componentStack || '' });
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="page-wrapper">
          <div style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div className="state-wrap">
              <span className="state-icon error" aria-hidden="true">!</span>
              <p className="state-title">Something went wrong</p>
              <p className="state-text">
                An unexpected error occurred while rendering this page. Please reload - if it keeps happening,
                reach out to us through the contact page.
              </p>
              <button type="button" className="state-btn" onClick={this.handleReload}>Reload page</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}