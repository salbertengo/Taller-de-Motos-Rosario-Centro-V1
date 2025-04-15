import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faChevronRight,
  faMotorcycle,
  faGaugeSimpleHigh,
  faGasPump,
  faRulerCombined,
  faGears,
  faScrewdriverWrench,
  faDumbbell,
  faBolt,
  faWrench,
  faInfoCircle,
  faTags
} from "@fortawesome/free-solid-svg-icons";

const API_BASE_URL = "http://localhost:3000";

const BikeSpecificationsViewer = ({ model, minimal }) => {
  const [loading, setLoading] = useState(true);
  const [specifications, setSpecifications] = useState({});
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [apiData, setApiData] = useState(null);

  // Iconos mejorados y específicos para mecánicos
  const categoryIcons = {

    "Dimensions": faRulerCombined,
    "Chasis": faMotorcycle,
    "Chassis": faMotorcycle,
    "Frenos": faWrench,
    "Brakes": faWrench,
    "Transmission": faGears,
    "Ruedas": faScrewdriverWrench,
    "Wheels": faScrewdriverWrench,
    "Electrical": faBolt,
    "Combustible": faGasPump,
    "Fuel": faGasPump,
    "Rendimiento": faGaugeSimpleHigh,
    "Performance": faGaugeSimpleHigh,
    "Peso": faDumbbell,
    "Weight": faDumbbell,
    "General": faInfoCircle,
    "Features": faTags
  };

  // Colores por categoría para fácil identificación visual
  const categoryColors = {
    "Motor": "#ff9800",
    "Engine": "#ff9800",
    "Dimensiones": "#2196f3",
    "Dimensions": "#2196f3",
    "Chasis": "#9c27b0", 
    "Chassis": "#9c27b0",
    "Frenos": "#e91e63",
    "Brakes": "#e91e63",
    "Transmisión": "#3f51b5",
    "Transmission": "#3f51b5",
    "Ruedas": "#607d8b",
    "Wheels": "#607d8b",
    "Sistema Eléctrico": "#ffc107",
    "Electrical": "#ffc107",
    "Combustible": "#4caf50",
    "Fuel": "#4caf50",
    "Rendimiento": "#f44336",
    "Performance": "#f44336",
    "Peso": "#795548",
    "Weight": "#795548",
    "General": "#673ab7",
    "Features": "#009688"
  };

  useEffect(() => {
    if (model) {
      console.log("Fetching specs for model:", model);
      fetchSpecifications();
    }
  }, [model]);

  const fetchSpecifications = async () => {
    if (!model) return;
  
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
  
      console.log("Requesting specifications...");
      const response = await axios.get(`${API_BASE_URL}/specifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { model }
      });
  
      console.log("API response:", response.data);
      setApiData(response.data);
  
      let grouped = {};
  
      if (response.data && response.data.categories) {
        console.log("Using pre-grouped categories from API");
        grouped = response.data.categories;
      } else if (response.data && Array.isArray(response.data)) {
        console.log("Grouping specifications from array");
        const filteredSpecs = response.data.filter(
          (spec) =>
            spec.model?.toLowerCase() === model.toLowerCase() ||
            spec.bike_model?.toLowerCase() === model.toLowerCase()
        );
  
        console.log(`Filtered ${filteredSpecs.length} specs for model ${model}`);
  
        if (filteredSpecs.length > 0) {
          grouped = filteredSpecs.reduce((acc, spec) => {
            const category = spec.category || "General";
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(spec);
            return acc;
          }, {});
        }
      }
      
   
  
      console.log("Final grouped specifications:", grouped);
      setSpecifications(grouped);
  
      if (Object.keys(grouped).length > 0) {
        setSelectedCategory(Object.keys(grouped)[0]);
      }
    } catch (error) {
      console.error("Error fetching specifications:", error);
      setError("No se pudieron cargar las especificaciones: " + error.message);
      
      const testData = {
        'Engine': [
          {name: 'Displacement', value: '450', unit: 'cc'},
          {name: 'Power', value: '55', unit: 'HP'}
        ],
        'Dimensions': [
          {name: 'Length', value: '218', unit: 'cm'},
          {name: 'Height', value: '125', unit: 'cm'}
        ]
      };
      setSpecifications(testData);
      setSelectedCategory('Engine');
    } finally {
      setLoading(false);
    }
  };

  // Versión minimal para tarjetas pero con mejor visibilidad
  if (minimal) {
    return (
      <div className="minimal-specs" style={{ 
        padding: "10px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        border: "1px solid #e0e0e0"
      }}>
        {loading ? (
          <p>Cargando...</p>
        ) : error ? (
          <p className="error" style={{ color: "#D32F2F" }}>{error}</p>
        ) : Object.keys(specifications).length === 0 ? (
          <p>There is no avaiable specifications</p>
        ) : (
          <>
            <div style={{ marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>
              Main Spects
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {Object.entries(specifications)
                .slice(0, 2)
                .flatMap(([category, specs]) =>
                  specs.slice(0, 3).map((spec, idx) => (
                    <li
                      key={`${category}-${idx}`}
                      style={{
                        padding: "8px 10px",
                        backgroundColor: "#fff",
                        borderLeft: `4px solid ${categoryColors[category] || "#5932EA"}`,
                        borderRadius: "4px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        fontSize: "13px",
                        display: "flex",
                        justifyContent: "space-between"
                      }}
                    >
                      <span style={{ fontWeight: "500" }}>
                        {spec.display_name || spec.spec_name || spec.name}:
                      </span>
                      <span style={{ 
                        fontWeight: "600", 
                        color: "#333",
                        marginLeft: "12px"
                      }}>
                        {spec.value} {spec.unit || ""}
                      </span>
                    </li>
                  ))
                )}
            </ul>
          </>
        )}
      </div>
    );
  }

  // Versión completa con mejor organización visual para mecánicos
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        position: "relative",
        backgroundColor: "#f8f9fa"
      }}
    >
      {/* Encabezado con información de la moto */}
      <div style={{
        backgroundColor: "#fff",
        padding: "12px 20px",
        borderBottom: "1px solid #e0e0e0",
        display: "flex",
        alignItems: "center",
        gap: "15px"
      }}>
        <FontAwesomeIcon icon={faMotorcycle} style={{ fontSize: "24px", color: "#5932EA" }} />
        <div>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>{model}</h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#666" }}>Technical specifications</p>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "20px",
          }}
        >
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            size="3x"
            style={{ marginBottom: "15px", color: "#5932EA" }}
          />
          <p>Loading specification</p>
        </div>
      ) : error ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "20px",
            color: "#D32F2F",
          }}
        >
          <p>{error}</p>
          <p style={{ fontSize: "14px", marginTop: "10px" }}>
            Mostrando datos de ejemplo para prueba de interfaz.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            height: "100%",
            width: "100%",
            overflow: "hidden",
          }}
        >
          {/* Panel de categorías mejorado para mecánicos */}
          <div
            style={{
              minWidth: "220px",
              width: "30%",
              backgroundColor: "#fff",
              overflowY: "auto",
              padding: "0",
              boxShadow: "1px 0 3px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                padding: "15px 20px",
                borderBottom: "1px solid #e0e0e0",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  margin: "0",
                  color: "#333",
                }}
              >
                Secciones
              </h3>
            </div>

            <div style={{ marginTop: "8px" }}>
              {Object.keys(specifications).length > 0 ? (
                Object.keys(specifications).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      padding: "14px 20px",
                      margin: "0",
                      background: selectedCategory === category ? "#f5f5ff" : "#fff",
                      border: "none",
                      borderLeft: selectedCategory === category 
                        ? `4px solid ${categoryColors[category] || "#5932EA"}`
                        : "4px solid transparent",
                      borderBottom: "1px solid #eee",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: "15px",
                      color: selectedCategory === category ? "#333" : "#555",
                      fontWeight: selectedCategory === category ? "600" : "500",
                      transition: "all 0.2s ease",
                      gap: "12px"
                    }}
                  >
                    <FontAwesomeIcon
                      icon={categoryIcons[category] || faInfoCircle}
                      style={{
                        color: categoryColors[category] || "#5932EA",
                        fontSize: "18px",
                      }}
                    />
                    <span>{category}</span>
                    {selectedCategory === category && (
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        style={{
                          marginLeft: "auto",
                          fontSize: "12px",
                          color: "#999"
                        }}
                      />
                    )}
                  </button>
                ))
              ) : (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#666",
                  }}
                >
                  Categories not found.
                </div>
              )}
            </div>
          </div>

          {/* Panel de detalles mejorado para mecánicos */}
          <div
            style={{
              flex: "1",
              padding: "0",
              overflowY: "auto",
              backgroundColor: "#f8f9fa",
            }}
          >
            {selectedCategory && specifications[selectedCategory] ? (
              <div style={{ padding: "20px 30px" }}>
                <h4
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "18px",
                    fontWeight: "600",
                    margin: "0 0 20px 0",
                    padding: "12px 15px",
                    borderRadius: "8px",
                    color: "#fff",
                    backgroundColor: categoryColors[selectedCategory] || "#5932EA",
                  }}
                >
                  <FontAwesomeIcon
                    icon={categoryIcons[selectedCategory] || faInfoCircle}
                  />
                  {selectedCategory}
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "15px",
                  }}
                >
                  {specifications[selectedCategory].length > 0 ? (
                    specifications[selectedCategory].map((spec, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "16px",
                          borderRadius: "8px",
                          backgroundColor: "#fff",
                          border: "1px solid #eee",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#666",
                            marginBottom: "8px",
                            fontWeight: "500"
                          }}
                        >
                          {spec.display_name || spec.spec_name || spec.name}
                        </div>
                        <div
                          style={{
                            fontSize: "22px",
                            fontWeight: "700",
                            color: "#333",
                            display: "flex",
                            alignItems: "baseline"
                          }}
                        >
                          {spec.value} 
                          {spec.unit && (
                            <span style={{ 
                              fontSize: "14px", 
                              color: "#666", 
                              marginLeft: "5px",
                              fontWeight: "400"
                            }}>
                              {spec.unit}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        color: "#666",
                        padding: "30px",
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        gridColumn: "1 / -1"
                      }}
                    >
                      This category has no specifications available.
                    </div>
                  )}
                </div>
              </div>
            ) : selectedCategory ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#666",
                }}
              >
                <p>
                 No specifications for {selectedCategory}
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  padding: "40px",
                  textAlign: "center"
                }}
              >
                <FontAwesomeIcon 
                  icon={faWrench} 
                  style={{ 
                    fontSize: "32px", 
                    color: "#5932EA",
                    marginBottom: "15px" 
                  }} 
                />
                <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>
                  Technical Specifications
                </h3>
                <p style={{ color: "#666", maxWidth: "400px" }}>
                 Select a category from the left to view detailed specifications.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BikeSpecificationsViewer;
