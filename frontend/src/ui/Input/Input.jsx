import { cx } from "../../utils/cx";
import styles from "./Input.module.css";

export const InputField = ({
  label,
  hint,
  error,
  className = "",
  inputClassName = "",
  id,
  ...props
}) => {
  const resolvedId = id || props.name;

  return (
    <div className={cx(styles.field, className)}>
      {label && (
        <label className={styles.label} htmlFor={resolvedId}>
          {label}
        </label>
      )}
      <input id={resolvedId} className={cx(styles.control, inputClassName)} {...props} />
      {error ? <div className={styles.error}>{error}</div> : hint ? <div className={styles.hint}>{hint}</div> : null}
    </div>
  );
};

export const SelectField = ({
  label,
  hint,
  error,
  className = "",
  selectClassName = "",
  id,
  children,
  ...props
}) => {
  const resolvedId = id || props.name;

  return (
    <div className={cx(styles.field, className)}>
      {label && (
        <label className={styles.label} htmlFor={resolvedId}>
          {label}
        </label>
      )}
      <select id={resolvedId} className={cx(styles.control, selectClassName)} {...props}>
        {children}
      </select>
      {error ? <div className={styles.error}>{error}</div> : hint ? <div className={styles.hint}>{hint}</div> : null}
    </div>
  );
};

export const TextareaField = ({
  label,
  hint,
  error,
  className = "",
  textareaClassName = "",
  id,
  ...props
}) => {
  const resolvedId = id || props.name;

  return (
    <div className={cx(styles.field, className)}>
      {label && (
        <label className={styles.label} htmlFor={resolvedId}>
          {label}
        </label>
      )}
      <textarea id={resolvedId} className={cx(styles.control, textareaClassName)} {...props} />
      {error ? <div className={styles.error}>{error}</div> : hint ? <div className={styles.hint}>{hint}</div> : null}
    </div>
  );
};

