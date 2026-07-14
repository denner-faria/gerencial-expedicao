import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FaLock, FaUser } from 'react-icons/fa';
import './Login.css';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao realizar login. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card shadow-lg">
        <div className="login-header">
          <h2>Portal Expedição</h2>
          <p>Acesso Restrito Siderúrgica</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="alert alert-danger py-2">{error}</div>}
          
          <div className="input-group mb-3 custom-input">
            <span className="input-group-text bg-white border-end-0 text-muted"><FaUser /></span>
            <input 
              type="text" 
              className="form-control border-start-0 ps-0" 
              placeholder="Usuário (Login)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group mb-4 custom-input">
            <span className="input-group-text bg-white border-end-0 text-muted"><FaLock /></span>
            <input 
              type="password" 
              className="form-control border-start-0 ps-0" 
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-2 login-btn"
            disabled={loading}
          >
            {loading ? 'Autenticando...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
