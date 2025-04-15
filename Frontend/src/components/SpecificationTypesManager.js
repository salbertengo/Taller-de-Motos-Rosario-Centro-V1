import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSave, faTimes, faSpinner, faCheck, faSearch } from '@fortawesome/free-solid-svg-icons';

const API_BASE_URL = 'http://localhost:3000';

const SpecificationTypesManager = () => {
  const [specTypes, setSpecTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    unit: '',
    category: '',
    is_essential: false
  });
  const [newCategory, setNewCategory] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchSpecTypes();
  }, []);

  const fetchSpecTypes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/specifications/types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSpecTypes(response.data);
      setErrorMessage('');
      
      const uniqueCategories = [...new Set(response.data.map(spec => spec.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching specification types:', error);
      setErrorMessage('Failed to load specification types. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setCategories(prev => [...prev, newCategory.trim()]);
      setFormData(prev => ({
        ...prev,
        category: newCategory.trim()
      }));
      setNewCategory('');
      setShowCategoryInput(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!formData.name || !formData.display_name || !formData.category) {
      alert('Please complete all required fields');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      if (editingType) {
        await axios.put(`${API_BASE_URL}/specifications/types/${editingType.id}`, {
          display_name: formData.display_name,
          unit: formData.unit,
          category: formData.category,
          is_essential: formData.is_essential
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE_URL}/specifications/types`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setFormData({
        name: '',
        display_name: '',
        unit: '',
        category: '',
        is_essential: false
      });
      setEditingType(null);
      setShowModal(false);
      
      fetchSpecTypes();
    } catch (error) {
      console.error('Error saving specification type:', error);
      setErrorMessage(error.response?.data?.error || 'Error saving specification type. Please verify your connection and try again.');
    }
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      display_name: type.display_name,
      unit: type.unit || '',
      category: type.category,
      is_essential: type.is_essential
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this specification type?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/specifications/types/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchSpecTypes();
    } catch (error) {
      console.error('Error deleting specification type:', error);
      setErrorMessage(error.response?.data?.error || 'Error deleting specification type');
    }
  };

  const filteredTypes = specTypes.filter(type => 
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          Specification Types
        </h2>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "10px 36px 10px 15px",
                width: "220px",
                borderRadius: "12px",
                border: "1px solid #E0E0E0",
                backgroundColor: "#FFFFFF",
                fontSize: "14px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
              }}
            />
            <FontAwesomeIcon
              icon={faSearch}
              style={{
                position: "absolute",
                right: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#5932EA",
                cursor: "pointer",
              }}
            />
          </div>
          
          <button 
            onClick={() => {
              setEditingType(null);
              setFormData({
                name: '',
                display_name: '',
                unit: '',
                category: '',
                is_essential: false
              });
              setShowModal(true);
            }}
            onMouseEnter={() => setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
            style={{
              padding: "10px 20px",
              backgroundColor: isButtonHovered ? "#4321C9" : "#5932EA",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 3px 10px rgba(89, 50, 234, 0.2)"
            }}
          >
            <FontAwesomeIcon icon={faPlus} />
            New Type
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 0",
        }}>
          <FontAwesomeIcon 
            icon={faSpinner} 
            spin 
            style={{ 
              fontSize: "32px", 
              color: "#5932EA",
              marginBottom: "16px" 
            }} 
          />
          <p style={{
            margin: 0,
            color: "#5A5A5A",
            fontSize: "16px"
          }}>
            Loading specification types...
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}>
          {errorMessage && (
            <div style={{
              padding: "20px",
              backgroundColor: "#FFF0F0",
              color: "#D32F2F",
              borderRadius: "12px",
              marginBottom: "20px",
              textAlign: "center"
            }}>
              {errorMessage}
            </div>
          )}
          {filteredTypes.length === 0 ? (
            <div style={{
              padding: "40px 0",
              textAlign: "center",
              color: "#5A5A5A"
            }}>
              No specification types found
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px"
              }}>
                <thead>
                  <tr style={{
                    borderBottom: "1px solid #E0E0E0",
                    backgroundColor: "#F8F9FE"
                  }}>
                    <th style={{ 
                      padding: "16px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#222222"
                    }}>Name</th>
                    <th style={{ 
                      padding: "16px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#222222"
                    }}>Display Name</th>
                    <th style={{ 
                      padding: "16px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#222222"
                    }}>Unit</th>
                    <th style={{ 
                      padding: "16px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#222222"
                    }}>Category</th>
                    <th style={{ 
                      padding: "16px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#222222"
                    }}>Essential</th>
                    <th style={{ 
                      padding: "16px",
                      textAlign: "right",
                      fontWeight: "600",
                      color: "#222222"
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTypes.map((type, index) => (
                    <tr key={type.id} style={{
                      borderBottom: "1px solid #E0E0E0",
                      backgroundColor: index % 2 === 0 ? "white" : "#F8F9FE"
                    }}>
                      <td style={{ padding: "14px 16px" }}>{type.name}</td>
                      <td style={{ padding: "14px 16px" }}>{type.display_name}</td>
                      <td style={{ padding: "14px 16px" }}>{type.unit || '-'}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          padding: "4px 10px",
                          backgroundColor: "#F0F0F0",
                          borderRadius: "12px",
                          fontSize: "12px",
                          color: "#333333"
                        }}>
                          {type.category}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {type.is_essential ? (
                          <span style={{
                            padding: "4px 10px",
                            backgroundColor: "#E6F7EA",
                            borderRadius: "12px",
                            fontSize: "12px",
                            color: "#2E7D32"
                          }}>
                            Yes
                          </span>
                        ) : (
                          <span style={{
                            padding: "4px 10px",
                            backgroundColor: "#F0F0F0",
                            borderRadius: "12px",
                            fontSize: "12px",
                            color: "#757575"
                          }}>
                            No
                          </span>
                        )}
                      </td>
                      <td style={{ 
                        padding: "14px 16px",
                        textAlign: "right"
                      }}>
                        <button 
                          onClick={() => handleEdit(type)}
                          style={{
                            marginRight: "8px",
                            padding: "8px",
                            backgroundColor: "#F5F0FF",
                            color: "#5932EA",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "background-color 0.2s ease"
                          }}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button 
                          onClick={() => handleDelete(type.id)}
                          style={{
                            padding: "8px",
                            backgroundColor: "#FFF0F0",
                            color: "#D32F2F",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "background-color 0.2s ease"
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            width: "500px",
            maxWidth: "90%",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #E0E0E0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3 style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: "600",
                color: "#222222"
              }}>
                {editingType ? 'Edit' : 'New'} Specification Type
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#5A5A5A"
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ padding: "24px" }}>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#333333"
                  }}>
                    Display Name*
                  </label>
                  <input
                    type="text"
                    id="display_name"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid #E0E0E0",
                      fontSize: "14px",
                      backgroundColor: "#FFFFFF"
                    }}
                    placeholder="e.g. Valve Clearance"
                  />
                  <div style={{
                    fontSize: "12px",
                    color: "#777777",
                    marginTop: "6px"
                  }}>
                    The name users will see (e.g. "Valve Clearance")
                  </div>
                </div>
                
                <div style={{ marginBottom: "20px" }}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#333333"
                  }}>
                    System Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={editingType !== null}
                    required
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid #E0E0E0",
                      fontSize: "14px",
                      backgroundColor: editingType ? "#F8F9FE" : "#FFFFFF"
                    }}
                    placeholder="e.g. valve_clearance"
                  />
                  <div style={{
                    fontSize: "12px",
                    color: "#777777",
                    marginTop: "6px"
                  }}>
                    Technical name without spaces (e.g. "valve_clearance")
                  </div>
                </div>
                
                <div style={{ marginBottom: "20px" }}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#333333"
                  }}>
                    Unit
                  </label>
                  <input
                    type="text"
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid #E0E0E0",
                      fontSize: "14px",
                      backgroundColor: "#FFFFFF"
                    }}
                    placeholder="e.g. mm, L"
                  />
                  <div style={{
                    fontSize: "12px",
                    color: "#777777",
                    marginTop: "6px"
                  }}>
                    Optional: unit of measurement (e.g. "mm", "L")
                  </div>
                </div>
                
                <div style={{ marginBottom: "20px" }}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#333333"
                  }}>
                    Category*
                  </label>
                  
                  {!showCategoryInput ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        style={{
                          flex: 1,
                          padding: "12px",
                          borderRadius: "12px",
                          border: "1px solid #E0E0E0",
                          fontSize: "14px",
                          backgroundColor: "#FFFFFF"
                        }}
                      >
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowCategoryInput(true)}
                        style={{
                          padding: "12px",
                          backgroundColor: "#F5F0FF",
                          color: "#5932EA",
                          border: "none",
                          borderRadius: "12px",
                          cursor: "pointer"
                        }}
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="New category"
                        style={{
                          flex: 1,
                          padding: "12px",
                          borderRadius: "12px",
                          border: "1px solid #E0E0E0",
                          fontSize: "14px",
                          backgroundColor: "#FFFFFF"
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        style={{
                          padding: "12px",
                          backgroundColor: "#E6F7EA",
                          color: "#2E7D32",
                          border: "none",
                          borderRadius: "12px",
                          cursor: "pointer"
                        }}
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCategoryInput(false)}
                        style={{
                          padding: "12px",
                          backgroundColor: "#F0F0F0",
                          color: "#5A5A5A",
                          border: "none",
                          borderRadius: "12px",
                          cursor: "pointer"
                        }}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  )}
                  <div style={{
                    fontSize: "12px",
                    color: "#777777",
                    marginTop: "6px"
                  }}>
                    Group related specifications (e.g. "Engine", "Brakes")
                  </div>
                </div>
                
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  marginBottom: "20px",
                  backgroundColor: "#F8F9FE",
                  padding: "12px",
                  borderRadius: "12px" 
                }}>
                  <input
                    type="checkbox"
                    id="is_essential"
                    name="is_essential"
                    checked={formData.is_essential}
                    onChange={handleInputChange}
                    style={{
                      width: "16px",
                      height: "16px",
                      marginRight: "12px"
                    }}
                  />
                  <div>
                    <label 
                      htmlFor="is_essential"
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#333333"
                      }}
                    >
                      Show in essential view
                    </label>
                    <div style={{
                      fontSize: "12px",
                      color: "#777777"
                    }}>
                      Display in compact views like jobsheets
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{
                padding: "16px 24px",
                borderTop: "1px solid #E0E0E0",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px"
              }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#F0F0F0",
                    color: "#333333",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500"
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#5932EA",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <FontAwesomeIcon icon={faSave} />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecificationTypesManager;