import { Modal } from 'react-bootstrap';

export default function DetailModal({ show, onHide, title, subtitle, size = 'lg', footer, children }) {
  return (
    <Modal show={show} onHide={onHide} size={size} centered scrollable>
      <Modal.Header closeButton>
        <div className="admin-modal-head">
          <Modal.Title as="h2" className="admin-modal-title">{title}</Modal.Title>
          {subtitle ? <div className="admin-modal-subtitle">{subtitle}</div> : null}
        </div>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      {footer ? <Modal.Footer>{footer}</Modal.Footer> : null}
    </Modal>
  );
}