import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTags, faFileUpload, faSearch, faMotorcycle } from '@fortawesome/free-solid-svg-icons';
import SpecificationTypesManager from '../components/SpecificationTypesManager';
import SpecificationsImporter from '../components/SpecificationsImporter';
import Sidebar from './Sidebar';
import ModelSpecificationAssignment from '../components/ModelSpecificationAssignment';

const SpecificationManagementPage = () => {
    const [activeTab, setActiveTab] = useState('types');
    const [isHovered, setIsButtonHovered] = useState(false);
  
    return (
      <div style={{ 
        display: "flex", 
        width: "100%",
        height: "100vh",
        backgroundColor: "#D9D9D9",
        overflow: "hidden"
      }}>
        <div style={{
          width: "220px",
          backgroundColor: "white"
        }}>
          <Sidebar />
        </div>
        
        <div style={{ 
          flex: 1, 
          padding: "30px",
          backgroundColor: "#F8F9FE",
          overflow: "auto"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px"
          }}>
            <div>
              <h2 style={{ 
                fontSize: "24px", 
                fontWeight: "600", 
                color: "#222222",
                margin: 0 
              }}>
                Technical Specifications Management
              </h2>
              <p style={{ 
                color: "#5A5A5A",
                fontSize: "14px",
                marginTop: "6px",
                marginBottom: 0
              }}>
                Manage the technical specifications of motorcycles
              </p>
            </div>
            
            <div style={{ 
              display: "flex", 
              gap: "12px", 
              alignItems: "center" 
            }}>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search specifications..."
                  style={{
                    padding: "10px 36px 10px 15px",
                    width: "250px",
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
                onClick={() => setActiveTab('import')}
                onMouseEnter={() => setIsButtonHovered(true)}
                onMouseLeave={() => setIsButtonHovered(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: isHovered ? "#4321C9" : "#5932EA",
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
                <FontAwesomeIcon icon={faFileUpload} />
                Import Specifications
              </button>
            </div>
          </div>
  
          <div style={{ 
            display: "flex", 
            gap: "20px", 
            marginBottom: "25px" 
          }}>
            <div 
              onClick={() => setActiveTab('types')} 
              style={{
                flex: "1 1 0",
                backgroundColor: activeTab === 'types' ? "#5932EA" : "#FFFFFF",
                color: activeTab === 'types' ? "white" : "#333333",
                borderRadius: "14px",
                padding: "20px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                border: activeTab === 'types' ? "none" : "1px solid #F0F0F0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {activeTab === 'types' && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "120px",
                  height: "120px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "50%",
                  transform: "translate(30%, -30%)"
                }}></div>
              )}
              <div style={{ 
                backgroundColor: activeTab === 'types' ? "rgba(255,255,255,0.2)" : "#F5F0FF",
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "15px"
              }}>
                <FontAwesomeIcon 
                  icon={faTags} 
                  style={{ 
                    fontSize: "24px",
                    color: activeTab === 'types' ? "white" : "#5932EA" 
                  }} 
                />
              </div>
              <h3 style={{ 
                margin: "0 0 5px 0",
                fontSize: "18px",
                fontWeight: "600"
              }}>
                Specification Types
              </h3>
              <p style={{ 
                margin: 0,
                fontSize: "14px",
                opacity: activeTab === 'types' ? "0.8" : "0.6"
              }}>
                Define categories and default values
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('import')} 
              style={{
                flex: "1 1 0",
                backgroundColor: activeTab === 'import' ? "#5932EA" : "#FFFFFF",
                color: activeTab === 'import' ? "white" : "#333333",
                borderRadius: "14px",
                padding: "20px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                border: activeTab === 'import' ? "none" : "1px solid #F0F0F0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {activeTab === 'import' && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "120px",
                  height: "120px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "50%",
                  transform: "translate(30%, -30%)"
                }}></div>
              )}
              <div style={{ 
                backgroundColor: activeTab === 'import' ? "rgba(255,255,255,0.2)" : "#F5F0FF",
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "15px"
              }}>
                <FontAwesomeIcon 
                  icon={faFileUpload} 
                  style={{ 
                    fontSize: "24px",
                    color: activeTab === 'import' ? "white" : "#5932EA" 
                  }} 
                />
              </div>
              <h3 style={{ 
                margin: "0 0 5px 0",
                fontSize: "18px",
                fontWeight: "600"
              }}>
                Import Data
              </h3>
              <p style={{ 
                margin: 0,
                fontSize: "14px",
                opacity: activeTab === 'import' ? "0.8" : "0.6"
              }}>
                Import data from Excel or CSV
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('assign')} 
              style={{
                flex: "1 1 0",
                backgroundColor: activeTab === 'assign' ? "#5932EA" : "#FFFFFF",
                color: activeTab === 'assign' ? "white" : "#333333",
                borderRadius: "14px",
                padding: "20px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                border: activeTab === 'assign' ? "none" : "1px solid #F0F0F0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {activeTab === 'assign' && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "120px",
                  height: "120px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "50%",
                  transform: "translate(30%, -30%)"
                }}></div>
              )}
              <div style={{ 
                backgroundColor: activeTab === 'assign' ? "rgba(255,255,255,0.2)" : "#F5F0FF",
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "15px"
              }}>
                <FontAwesomeIcon 
                  icon={faMotorcycle} 
                  style={{ 
                    fontSize: "24px",
                    color: activeTab === 'assign' ? "white" : "#5932EA" 
                  }} 
                />
              </div>
              <h3 style={{ 
                margin: "0 0 5px 0",
                fontSize: "18px",
                fontWeight: "600"
              }}>
                Assign Specifications
              </h3>
              <p style={{ 
                margin: 0,
                fontSize: "14px",
                opacity: activeTab === 'assign' ? "0.8" : "0.6"
              }}>
                Add values to motorcycle models
              </p>
            </div>

            <div style={{
              flex: "1 1 0",
              backgroundColor: "#FFFFFF",
              color: "#333333",
              borderRadius: "14px",
              padding: "20px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              border: "1px solid #F0F0F0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center"
            }}>
              <div style={{ 
                backgroundColor: "#F5F0FF",
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "15px"
              }}>
                <FontAwesomeIcon 
                  icon={faMotorcycle} 
                  style={{ 
                    fontSize: "24px",
                    color: "#5932EA" 
                  }} 
                />
              </div>
              <h3 style={{ 
                margin: "0 0 5px 0",
                fontSize: "18px",
                fontWeight: "600"
              }}>
                Models
              </h3>
              <p style={{ 
                margin: 0,
                fontSize: "14px",
                opacity: "0.6"
              }}>
                Explore all available models
              </p>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: "white", 
            borderRadius: "16px",
            boxShadow: "0 2px 15px rgba(0,0,0,0.05)",
            overflow: "hidden",
            minHeight: "600px"
          }}>
            <div style={{ padding: "25px" }}>
              {activeTab === 'types' && <SpecificationTypesManager />}
              {activeTab === 'import' && <SpecificationsImporter />}
              {activeTab === 'assign' && <ModelSpecificationAssignment />}
            </div>
          </div>
        </div>
      </div>
    );
};

export default SpecificationManagementPage;