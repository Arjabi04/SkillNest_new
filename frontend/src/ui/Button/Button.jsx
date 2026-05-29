import { cx } from "../../utils/cx";
import styles from "./Button.module.css";

const Button = ({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}) => {
  return (
    <button
      type={type}
      className={cx(styles.button, styles[size], styles[variant], className)}
      {...props}
    />
  );
};

export default Button;

