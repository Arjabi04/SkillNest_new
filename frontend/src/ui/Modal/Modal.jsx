import { useEffect } from "react";
import styles from "./Modal.module.css";

const Modal = ({ open, title, subtitle, onClose, children, panelClassName = "" }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <button type="button" className={styles.backdrop} onClick={onClose} aria-label="Close dialog" />
      <div className={`${styles.panel} ${panelClassName}`}>
        {(title || subtitle || onClose) && (
          <div className={styles.header}>
            <div>
              {title && <h2 className={styles.title}>{title}</h2>}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            {onClose && (
              <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
                ✕
              </button>
            )}
          </div>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;

