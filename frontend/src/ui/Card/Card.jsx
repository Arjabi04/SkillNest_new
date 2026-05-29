import { cx } from "../../utils/cx";
import styles from "./Card.module.css";

const Card = ({ className = "", padded = true, subtle = false, as: As = "div", ...props }) => {
  return (
    <As
      className={cx(styles.card, padded && styles.padded, subtle && styles.subtle, className)}
      {...props}
    />
  );
};

export default Card;

