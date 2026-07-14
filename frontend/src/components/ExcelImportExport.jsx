import React, { useRef, useState, useContext } from 'react';
import { Download, Upload, Loader } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const ExcelImportExport = ({ entidade, onImportSuccess }) => {
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // Somente admins e apenas desktop
  if (user?.perfil?.toLowerCase() !== 'admin') return null;

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/import/${entidade}/template`, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `template_${entidade}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Erro ao baixar template.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await api.post(`/import/${entidade}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { successCount, failCount } = response.data;
      alert(`Importação concluída!\n\nLinhas com sucesso: ${successCount}\nLinhas com falha: ${failCount}`);
      
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      alert('Erro na importação: ' + msg);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="d-none d-md-flex align-items-center gap-2">
      <input 
        type="file" 
        accept=".xlsx, .xls" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
      />
      <button 
        className="btn btn-outline-secondary d-flex align-items-center gap-2" 
        onClick={handleDownloadTemplate}
        disabled={loading}
      >
        <Download size={18} />
        Baixar Modelo
      </button>
      <button 
        className="btn btn-success d-flex align-items-center gap-2"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
      >
        {loading ? <Loader size={18} className="spin" /> : <Upload size={18} />}
        Importar XLSX
      </button>
    </div>
  );
};

export default ExcelImportExport;
