import { cx } from "../../utils/cx";
import styles from "./NavItem.module.css";

const NavItem = ({ active = false, icon: Icon, label, className = "", ...props }) => {
  return (
    <a className={cx(styles.item, active && styles.active, className)} {...props}>
      {Icon ? <Icon className={styles.icon} /> : null}
      <span className={styles.label}>{label}</span>
    </a>
  );
};

export default NavItem;

