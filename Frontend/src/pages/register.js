import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FirstAdminSetup = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.name || !formData.username || !formData.password) {
      setError('Todos los campos son obligatorios');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Usando la ruta estándar de registro
      const response = await axios.post('http://localhost:3000/auth/register', {

        name: formData.name,
        username: formData.username,
        password: formData.password,
        role: 'admin' // Asegurando que sea admin
      });
      
      setSuccess('Usuario administrador creado con éxito. Redirigiendo al login...');
      
      // Redirección al login después de 2 segundos
      setTimeout(() => {
        navigate('/login'); 
      }, 2000);
      
    } catch (err) {
      console.error('Error creating first user:', err);
      if (err.response && err.response.data) {
        setError(err.response.data.error || 'Error al crear el usuario');
      } else {
        setError('Error al conectar con el servidor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      padding: '20px'
    }}>
      <div style={{
        width: '400px',
        padding: '30px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Configuración Inicial</h1>
        <p style={{ textAlign: 'center', marginBottom: '30px', color: '#666' }}>
          Crea el primer usuario administrador para comenzar a usar el sistema.
        </p>
        
        {error && (
          <div style={{
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: '#e8f5e9',
            color: '#2e7d32',
            marginBottom: '20px'
          }}>
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Nombre Completo
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Nombre de Usuario
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Confirmar Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isLoading ? '#cccccc' : '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {isLoading ? 'Creando usuario...' : 'Crear Usuario Administrador'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FirstAdminSetup;