import { useNavigate } from 'react-router-dom';

export default function Menu() {
  const navigate = useNavigate();

  return (
    <div>
      <button onClick={() => navigate('/game')}>ion rembor shi</button>
    </div>
  );
}