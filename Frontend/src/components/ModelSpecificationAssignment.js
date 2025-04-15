import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faSpinner, faCheck} from '@fortawesome/free-solid-svg-icons';

const API_BASE_URL = 'http://localhost:3000';

const ModelSpecificationAssignment = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [models, setModels] = useState([]);
  const [specTypes, setSpecTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  
  useEffect(() => {
    fetchModels();
    fetchSpecificationTypes();
  }, []);
  
  const fetchModels = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Usar la ruta /vehicles en lugar de /motorcycles/models
      const response = await fetch(`${API_BASE_URL}/vehicles`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extraer modelos únicos de la lista de vehículos
      if (Array.isArray(data)) {
        const uniqueModels = [...new Set(data.map(vehicle => vehicle.model))];
        setModels(uniqueModels);
      } else {
        console.error('Expected vehicles to be an array but got:', data);
        setErrorMessage('API returned unexpected data format');
        setModels([]);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setErrorMessage(`Failed to load motorcycle models: ${error.message}`);
      setModels([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSpecificationTypes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/specifications/types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSpecTypes(response.data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.map(spec => spec.category))];
      setCategories(uniqueCategories);
      
      if (uniqueCategories.length > 0) {
        setSelectedCategory(uniqueCategories[0]);
      }
    } catch (error) {
      console.error('Error fetching specification types:', error);
      setErrorMessage('Failed to load specification types');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!selectedModel || !selectedSpec || !specValue.trim()) {
      setErrorMessage('Please complete all required fields');
      return;
    }
    
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/specifications`,
        {
          model: selectedModel,
          spec_name: selectedSpec, // Changed from specification_name to spec_name
          value: specValue
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSpecValue('');
      setSuccessMessage('Specification added successfully');
    } catch (error) {
      console.error('Error saving specification:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage('Error adding specification. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };
  
  // Filter specs by selected category
  const filteredSpecs = specTypes.filter(spec => spec.category === selectedCategory);
  
  return (
    <div style={{ padding: "0px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px"
      }}>
        <h2 style={{ 
          fontSize: "20px", 
          fontWeight: "600", 
          color: "#222222",
          margin: 0 
        }}>
          Assign Specifications to Model
        </h2>
      </div>
      
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        padding: "24px"
      }}>
        {errorMessage && (
          <div style={{
            padding: "16px",
            backgroundColor: "#FFF0F0",
            color: "#D32F2F",
            borderRadius: "12px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <FontAwesomeIcon icon={faTimes} />
            {errorMessage}
          </div>
        )}
        
        {successMessage && (
          <div style={{
            padding: "16px",
            backgroundColor: "#E6F7EA",
            color: "#2E7D32",
            borderRadius: "12px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <FontAwesomeIcon icon={faCheck} />
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleSave}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "20px",
            marginBottom: "20px" 
          }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#333333"
              }}>
                Motorcycle Model*
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid #E0E0E0",
                  fontSize: "14px",
                  backgroundColor: "#FFFFFF"
                }}
              >
                <option value="">Select model</option>
                {Array.isArray(models) ? (
                  models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))
                ) : (
                  <option value="" disabled>No models available</option>
                )}
              </select>
            </div>
            
            <div>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#333333"
              }}>
                Category*
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSpec('');
                }}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid #E0E0E0",
                  fontSize: "14px",
                  backgroundColor: "#FFFFFF"
                }}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#333333"
              }}>
                Specification*
              </label>
              <select
                value={selectedSpec}
                onChange={(e) => setSelectedSpec(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid #E0E0E0",
                  fontSize: "14px",
                  backgroundColor: "#FFFFFF"
                }}
              >
                <option value="">Select specification</option>
                {filteredSpecs.map(spec => (
                  <option key={spec.name} value={spec.name}>
                    {spec.display_name} {spec.unit ? `(${spec.unit})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#333333"
              }}>
                Value*
              </label>
              <input
                type="text"
                value={specValue}
                onChange={(e) => setSpecValue(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid #E0E0E0",
                  fontSize: "14px",
                  backgroundColor: "#FFFFFF"
                }}
                placeholder="Enter specification value"
              />
            </div>
          </div>
          
          <div style={{
            display: "flex",
            justifyContent: "flex-end"
          }}>
            <button
              type="submit"
              disabled={saving}
              onMouseEnter={() => setIsButtonHovered(true)}
              onMouseLeave={() => setIsButtonHovered(false)}
              style={{
                padding: "12px 24px",
                backgroundColor: isButtonHovered ? "#4321C9" : "#5932EA",
                color: "white",
                border: "none",
                borderRadius: "12px",
                cursor: saving ? "not-allowed" : "pointer",
                transition: "background-color 0.3s ease",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: saving ? 0.7 : 1,
                boxShadow: "0 3px 10px rgba(89, 50, 234, 0.2)"
              }}
            >
              {saving ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Saving...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} />
                  Save Specification
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModelSpecificationAssignment;