// src/components/SpecificationsImporter.js
import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faFileExcel, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';

const SpecificationsImporter = ({ onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validar que sea un archivo Excel
      if (
        !selectedFile.name.endsWith('.xlsx') &&
        !selectedFile.name.endsWith('.xls') &&
        !selectedFile.name.endsWith('.csv')
      ) {
        setError('Por favor selecciona un archivo Excel válido (.xlsx, .xls o .csv)');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/specifications/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSuccess(response.data.message || 'Importación completada con éxito');
      setFile(null);
      
      // Reset the file input
      document.getElementById('specificationFile').value = '';
      
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Error importing specifications:', error);
      setError(
        error.response?.data?.error || 
        'Error al importar el archivo. Asegúrate de que el formato sea correcto.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header bg-primary text-white">
        <FontAwesomeIcon icon={faFileExcel} className="me-2" />
        Importar Especificaciones desde Excel
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger d-flex align-items-center">
            <div className="flex-grow-1">{error}</div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError(null)}
              aria-label="Close"
            ></button>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success d-flex align-items-center">
            <div className="flex-grow-1">{success}</div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setSuccess(null)}
              aria-label="Close"
            ></button>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="specificationFile" className="form-label">Archivo Excel</label>
            <input 
              type="file" 
              className="form-control" 
              id="specificationFile" 
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              disabled={loading}
            />
            <div className="form-text">
              El archivo debe contener columnas: Brand, Model, y los nombres de las especificaciones.
            </div>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                Importando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUpload} className="me-2" />
                Importar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SpecificationsImporter;