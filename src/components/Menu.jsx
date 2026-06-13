import { useNavigate } from 'react-router-dom';

import styles from '../styles/Menu.module.css';

export default function Menu() {
  const navigate = useNavigate();

  return (
    <div className={styles.menu_body}>
      <button className={styles.menu_btn} onClick={() => navigate('/game')}>ion rembor shi</button>
    </div>
  );
}