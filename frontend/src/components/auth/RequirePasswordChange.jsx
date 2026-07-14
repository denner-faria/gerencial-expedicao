import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react';

const RequirePasswordChange = () => {
  const { user, updateUser, logout } = useContext(AuthContext);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', { newPassword });
      setSuccess(true);
      
      // Espera um segundinho para mostrar a mensagem de sucesso e libera o acesso
      setTimeout(() => {
        updateUser({ primeiroAcesso: false, PrimeiroAcesso: false });
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao alterar a senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="card shadow border-0 p-5 text-center" style={{ maxWidth: '400px' }}>
          <CheckCircle2 size={64} className="text-success mx-auto mb-3" />
          <h4 className="fw-bold text-success mb-2">Senha Alterada!</h4>
          <p className="text-muted mb-0">Sua senha foi atualizada com sucesso. Entrando no sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vh-100 d-flex align-items-center justify-content-center bg-light" style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 9999 }}>
      <div className="card shadow-lg border-0" style={{ maxWidth: '450px', width: '100%' }}>
        <div className="card-header bg-primary text-white text-center p-4 border-0">
          <ShieldAlert size={48} className="mb-2" />
          <h4 className="fw-bold mb-0">Primeiro Acesso</h4>
        </div>
        
        <div className="card-body p-4 p-sm-5">
          <p className="text-muted text-center mb-4">
            Olá, <strong>{user?.Nome || user?.nome}</strong>!<br/>
            Como este é seu primeiro acesso (ou sua senha foi redefinida), você precisa cadastrar uma nova senha para continuar.
          </p>

          {error && <div className="alert alert-danger py-2">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-bold text-dark">Nova Senha</label>
              <div className="input-group">
                <span className="input-group-text bg-light"><KeyRound size={18}/></span>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Mínimo de 6 caracteres"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="form-label fw-bold text-dark">Confirmar Nova Senha</label>
              <div className="input-group">
                <span className="input-group-text bg-light"><KeyRound size={18}/></span>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 fw-bold py-2" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar e Entrar'}
            </button>
          </form>
          
          <div className="mt-4 text-center">
             <button onClick={logout} className="btn btn-link text-muted text-decoration-none btn-sm">
                Voltar para o Login
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirePasswordChange;
