import React, { useEffect, useState, useRef, useCallback } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faSearch,
  faCalendarAlt,
  faMotorcycle,
  faUserClock,
  faCheck,
  faExclamationTriangle,
  faExclamation,
  faArrowUp,
  faArrowDown,
  faCalendarCheck,
  faPlus,
  faSpinner,
  faListAlt,
  faTools,
  faFilter,
  faChevronRight,
  faUser,
  faClock,
  faInfo,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { 
  ActionButton, 
  ActionButtonsContainer 
} from '../components/common/ActionButtons';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

const API_BASE_URL = "http://localhost:3000";

// Predefined priorities
const PRIORITY_LEVELS = {
  URGENT: {
    id: 'URGENT',
    label: 'Urgent',
    color: '#FF3D00',
    icon: faExclamationTriangle,
    description: 'Vehicle needs immediate attention',
    value: 5
  },
  HIGH: {
    id: 'HIGH',
    label: 'High',
    color: '#FF9800',
    icon: faExclamation,
    description: 'Important repair that must be completed same day',
    value: 4
  },
  MEDIUM: {
    id: 'MEDIUM',
    label: 'Normal',
    color: '#FFEB3B',
    icon: faArrowUp,
    description: 'Regular maintenance or planned repair',
    value: 3
  },
  LOW: {
    id: 'LOW',
    label: 'Low',
    color: '#8BC34A',
    icon: faArrowDown,
    description: 'Non-critical or aesthetic services',
    value: 2
  },
  SCHEDULED: {
    id: 'SCHEDULED',
    label: 'Scheduled',
    color: '#2196F3',
    icon: faCalendarCheck,
    description: 'Service scheduled for specific date',
    value: 1
  }
};

// Factors affecting priority
const PRIORITY_FACTORS = [
  {
    id: 'CUSTOMER_VIP',
    label: 'VIP Customer',
    adjustment: +1,
    description: 'Frequent customers or those with special agreements'
  },
  {
    id: 'MOTORCYCLE_COMMERCIAL',
    label: 'Commercial Use',
    adjustment: +1,
    description: 'Motorcycles used for work or deliveries'
  },
  {
    id: 'SAFETY_ISSUE',
    label: 'Safety Issue',
    adjustment: +2,
    description: 'Problems affecting driver safety'
  },
  {
    id: 'WAITING_CUSTOMER',
    label: 'Customer Waiting',
    adjustment: +1,
    description: 'Customer waiting at the shop'
  },
  {
    id: 'PARTS_AVAILABILITY',
    label: 'Parts Not Available',
    adjustment: -1,
    description: 'Parts need to be ordered'
  }
];

const AppointmentsView = () => {
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date());
  const [viewMode, setViewMode] = useState("day"); // day, week, all
  const gridRef = useRef(null);
  const searchTimeout = useRef(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const customerSearchTimeout = useRef(null);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [priorityFactors, setPriorityFactors] = useState([]);
  const [selectedPriorityLevel, setSelectedPriorityLevel] = useState("MEDIUM");
  const [showConvertModal, setShowConvertModal] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: "",
    vehicle_id: "",
    scheduled_date: new Date(),
    scheduled_time: "10:00",
    duration: 60,
    service_type: "maintenance",
    description: "",
    status: "scheduled",
    assigned_to: "",
    priority_id: null,
    priority_base_level: "MEDIUM",
    priority_factors: []
  });

  // Service types
  const serviceTypes = [
    { id: "maintenance", label: "Scheduled Maintenance", icon: faCalendarCheck },
    { id: "repair", label: "Repair", icon: faTools },
    { id: "diagnostic", label: "Diagnostic", icon: faSearch },
    { id: "inspection", label: "Inspection", icon: faListAlt },
    { id: "emergency", label: "Emergency", icon: faExclamationTriangle },
    { id: "other", label: "Other Service", icon: faInfo }
  ];

  // Appointment statuses
  const appointmentStatuses = [
    { value: "scheduled", label: "Scheduled", color: "#2196F3" },
    { value: "confirmed", label: "Confirmed", color: "#4CAF50" },
    { value: "in_progress", label: "In Progress", color: "#FF9800" },
    { value: "completed", label: "Completed", color: "#8BC34A" },
    { value: "cancelled", label: "Cancelled", color: "#F44336" },
    { value: "no_show", label: "No Show", color: "#9E9E9E" }
  ];

  // Column definitions for AG-Grid
  const columnDefs = [
    {
      headerName: "Time",
      field: "scheduled_time",
      width: 95,
      suppressMenu: true,
      headerClass: "custom-header",
      cellRenderer: params => {
        if (!params.data) return '';
        return <div style={{ fontWeight: "500" }}>{params.value}</div>;
      }
    },
    {
      headerName: "Customer",
      field: "customer_name",
      suppressMenu: true,
      headerClass: "custom-header",
      cellRenderer: params => {
        if (!params.data) return '';
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ 
              width: "28px", 
              height: "28px", 
              borderRadius: "50%", 
              backgroundColor: "#F0F0FF", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              color: "#5932EA" 
            }}>
              <FontAwesomeIcon icon={faUser} size="sm" />
            </div>
            <span>{params.value}</span>
          </div>
        );
      }
    },
    {
      headerName: "Vehicle",
      field: "vehicle_model",
      suppressMenu: true,
      headerClass: "custom-header",
      cellRenderer: params => {
        if (!params.data) return '';
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div>
              <div> {params.value}</div>
            </div>
          </div>
        );
      }
    },
   
    // Mechanic column - Compact version
    {
      headerName: "Mechanic",
      field: "mechanic_name",
      suppressMenu: true,
      headerClass: "custom-header",
      cellRenderer: params => {
        if (!params.data || !params.value) return '—';
        
        // Fixed color for mechanics
        const mechColor = "#3B82F6";
        
        return (
          <div style={{
            backgroundColor: `${mechColor}20`,
            color: mechColor,
            border: `1px solid ${mechColor}40`,
            borderRadius: "12px",         
            padding: "4px 10px",
            fontSize: "14px",             
            fontWeight: 500,
            textTransform: "capitalize",
            textAlign: "center",
            width: "fit-content",
            whiteSpace: "nowrap",         
            height: "auto",                 
            display: "inline-flex",
            alignItems: "center",
            lineHeight: "1.2"
          }}>
            {params.value}
          </div>
        );
      }
    },
    {
      headerName: "Status",
      field: "status",
      suppressMenu: true,
      headerClass: "custom-header",
      cellRenderer: params => {
        if (!params.data) return '';
        
        const status = appointmentStatuses.find(s => s.value === params.value) || appointmentStatuses[0];
        
        return (
          <button
            className="status-btn"
            data-id={params.data.id}
            data-status={params.value}
            style={{
              backgroundColor: `${status.color}20`,
              color: status.color,
              border: `1px solid ${status.color}40`,
              borderRadius: "12px",
              padding: "4px 10px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              textTransform: "capitalize",
              minWidth: "90px",
              textAlign: "center"
            }}
            onClick={() => handleStatusChange(params.data.id, params.value)}
          >
            {status.label}
          </button>
        );
      }
    },
    {
      headerName: "Priority",
      field: "priority_level",
      suppressMenu: true,
      headerClass: "custom-header",
      cellRenderer: params => {
        if (!params.data) return '';
        
        const priorityKey = params.data.priority_base_level || "MEDIUM";
        const priority = PRIORITY_LEVELS[priorityKey] || PRIORITY_LEVELS.MEDIUM;
        
        return (
          <div 
            style={{
              backgroundColor: `${priority.color}20`,
              color: priority.color,
              border: `1px solid ${priority.color}40`,
              borderRadius: "12px",         
              padding: "4px 10px",
              fontSize: "14px",             
              fontWeight: 500,
              textTransform: "capitalize",
              textAlign: "center",
              width: "fit-content",
              whiteSpace: "nowrap",         
              height: "auto",                
              display: "inline-flex",      
              alignItems: "center",
              lineHeight: "1.2"
            }}
            onClick={() => handlePriorityClick(params.data)}
          >
            <FontAwesomeIcon icon={priority.icon} style={{ fontSize: "12px", marginRight: "6px" }} />
            {priority.label}
          </div>
        );
      }
    },
    {
      headerName: "Actions",
      field: "actions",
      width: 160,
      headerClass: "custom-header",
      cellRenderer: (params) => {
        if (!params.data) return '';
        return (
          <ActionButtonsContainer>
            <ActionButton
              icon={faEdit}
              onClick={() => handleEdit(params.data)}
              tooltip="Edit Appointment"
              type="default"
            />
             <ActionButton
             icon={faTools}
             onClick={() => handleConvertToJobsheet(params.data)}
              tooltip="Convert to Job Sheet"
              type="primary"
            />
            <ActionButton
              icon={faTrash}
              onClick={() => handleDelete(params.data)}
              tooltip="Delete Appointment"
              type="danger"
            />
          </ActionButtonsContainer>
        );
      },
    },
  ];

  const onGridReady = params => {
    gridRef.current = params.api;
  };

  const handlePriorityClick = (appointment) => {
    setCurrentAppointment(appointment);
    setSelectedPriorityLevel(appointment.priority_base_level || "MEDIUM");
    setPriorityFactors(appointment.priority_factors || []);
    setShowPriorityModal(true);
  };

  const fetchAppointments = useCallback(async (searchTerm = "", date = dateFilter) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      setLoading(false);
      return;
    }

    try {
      let url = `${API_BASE_URL}/appointments`;
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (date && viewMode !== 'all') {
        const formattedDate = date.toISOString().split('T')[0];
        params.append('date', formattedDate);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        console.log("Appointments received:", response.data);
        setAppointments(response.data);
      } else {
        console.error("Server error:", response.status);
        setAppointments([]);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, viewMode]);

  const fetchCustomers = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/customers`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setCustomers(response.data);
      } else {
        console.error("Error fetching customers:", response.status);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchVehicles = async (customerId = null) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      let url = `${API_BASE_URL}/vehicles`;
      if (customerId) {
        url += `?customer_id=${customerId}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setVehicles(response.data);
      } else {
        console.error("Error fetching vehicles:", response.status);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const fetchMechanics = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      // Assuming you have an endpoint to get mechanics or users with 'mechanic' role
      const response = await axios.get(`${API_BASE_URL}/users?role=mechanic`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setMechanics(response.data);
      } else {
        console.error("Error fetching mechanics:", response.status);
      }
    } catch (error) {
      console.error("Error fetching mechanics:", error);
    }
  };

  useEffect(() => {
    fetchAppointments(searchTerm, dateFilter);
    fetchCustomers();
    fetchMechanics();
  }, [fetchAppointments, searchTerm, dateFilter]);

  useEffect(() => {
    // Every time the view or date changes, update the data
    fetchAppointments(searchTerm, dateFilter);
  }, [viewMode, dateFilter, fetchAppointments, searchTerm]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      fetchAppointments(value, dateFilter);
    }, 500);
  };

  const handleDateChange = (date) => {
    setDateFilter(date);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const handleEdit = (appointment) => {
    setCurrentAppointment(appointment);
    
    // Convert date from string to Date object
    let scheduledDate = new Date();
    if (appointment.scheduled_date) {
      scheduledDate = new Date(appointment.scheduled_date);
    }
    
    // Extract time from scheduled_time field
    let scheduledTime = "10:00";
    if (appointment.scheduled_time) {
      scheduledTime = appointment.scheduled_time.substring(0, 5); // HH:MM format
    }
    
    setFormData({
      customer_id: appointment.customer_id,
      vehicle_id: appointment.vehicle_id,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      duration: appointment.duration || 60,
      service_type: appointment.service_type || "maintenance",
      description: appointment.description || "",
      status: appointment.status || "scheduled",
      assigned_to: appointment.assigned_to || "",
      priority_id: appointment.priority_id,
      priority_base_level: appointment.priority_base_level || "MEDIUM",
      priority_factors: appointment.priority_factors || []
    });
    
    // Find customer's vehicles
    fetchVehicles(appointment.customer_id);
    
    setShowModal(true);
  };

  const handleOpenNewModal = () => {
    setCurrentAppointment(null);
    setFormData({
      customer_id: "",
      vehicle_id: "",
      scheduled_date: new Date(),
      scheduled_time: "10:00",
      duration: 60,
      service_type: "maintenance",
      description: "",
      status: "scheduled",
      assigned_to: "",
      priority_id: null,
      priority_base_level: "MEDIUM",
      priority_factors: []
    });
    setShowModal(true);
  };

  const handleStatusChange = async (id, currentStatus) => {
    // Status cycle: scheduled -> confirmed -> in_progress -> completed -> cancelled
    const statusCycle = ["scheduled", "confirmed", "in_progress", "completed", "cancelled"];
    
    const currentIndex = statusCycle.indexOf(currentStatus);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }
      
      const response = await axios.put(`${API_BASE_URL}/appointments/${id}`, 
        { status: nextStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 200) {
        // Update appointments list
        fetchAppointments(searchTerm, dateFilter);
        
        // Show notification
        setNotification({
          show: true,
          message: `Status updated to ${nextStatus}`,
          type: "success"
        });
        setTimeout(() => setNotification({ show: false }), 3000);
      } else {
        console.error("Error updating status:", response.status);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      
      setNotification({
        show: true,
        message: "Error updating status",
        type: "error"
      });
      setTimeout(() => setNotification({ show: false }), 3000);
    }
  };

  const handleCustomerSearch = (e) => {
    const value = e.target.value;
    setCustomerSearchTerm(value);
    setShowCustomerResults(true);

    if (customerSearchTimeout.current) {
      clearTimeout(customerSearchTimeout.current);
    }

    customerSearchTimeout.current = setTimeout(async () => {
      if (value.trim() === "") {
        setFilteredCustomers([]);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/customers?search=${encodeURIComponent(value)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.status === 200) {
          setFilteredCustomers(response.data);
        } else {
          console.error("Error searching customers:", response.status);
          setFilteredCustomers([]);
        }
      } catch (error) {
        console.error("Error searching customers:", error);
        setFilteredCustomers([]);
      }
    }, 300);
  };

  const handleSelectCustomer = (customer) => {
    setFormData({
      ...formData,
      customer_id: customer.id,
      vehicle_id: "" // Reset vehicle when customer changes
    });
    
    setCustomerSearchTerm(`${customer.name || ''}`);
    setShowCustomerResults(false);
    
    // Get customer's vehicles
    fetchVehicles(customer.id);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleTimeChange = (e) => {
    setFormData({
      ...formData,
      scheduled_time: e.target.value
    });
  };

  const handleDatePickerChange = (date) => {
    setFormData({
      ...formData,
      scheduled_date: date
    });
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare data to send
      const appointmentData = {
        ...formData,
        scheduled_date: formData.scheduled_date.toISOString().split('T')[0]
      };
      
      let response;
      
      if (currentAppointment) {
        // Update existing appointment
        response = await axios.put(
          `${API_BASE_URL}/appointments/${currentAppointment.id}`,
          appointmentData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      } else {
        // Create new appointment
        response = await axios.post(
          `${API_BASE_URL}/appointments`,
          appointmentData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      }
      
      if (response.status === 200 || response.status === 201) {
        setShowModal(false);
        fetchAppointments(searchTerm, dateFilter);
        
        // Show notification
        setNotification({
          show: true,
          message: currentAppointment ? "Appointment updated" : "Appointment created",
          type: "success"
        });
        setTimeout(() => setNotification({ show: false }), 3000);
      } else {
        console.error("Error saving appointment:", response.status);
        
        setNotification({
          show: true,
          message: "Error saving appointment",
          type: "error"
        });
        setTimeout(() => setNotification({ show: false }), 3000);
      }
    } catch (error) {
      console.error("Error saving appointment:", error);
      
      // Show more specific error if available
      const errorMessage = error.response?.data?.error || "Error saving appointment";
      
      setNotification({
        show: true,
        message: errorMessage,
        type: "error"
      });
      setTimeout(() => setNotification({ show: false }), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (appointment) => {
    setCurrentAppointment(appointment);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    const token = localStorage.getItem("token");
    if (!token || !currentAppointment) {
      console.error("No token found or no appointment selected");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/appointments/${currentAppointment.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 200) {
        setShowDeleteModal(false);
        fetchAppointments(searchTerm, dateFilter);
        
        // Show notification
        setNotification({
          show: true,
          message: "Appointment deleted",
          type: "success"
        });
        setTimeout(() => setNotification({ show: false }), 3000);
      } else {
        console.error("Error deleting appointment:", response.status);
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
      
      setNotification({
        show: true,
        message: "Error deleting appointment",
        type: "error"
      });
      setTimeout(() => setNotification({ show: false }), 3000);
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleSavePriority = async () => {
    const token = localStorage.getItem("token");
    if (!token || !currentAppointment) {
      console.error("No token found or no appointment selected");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.put(
        `${API_BASE_URL}/appointments/${currentAppointment.id}`,
        {
          priority_base_level: selectedPriorityLevel,
          priority_factors: priorityFactors
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 200) {
        setShowPriorityModal(false);
        fetchAppointments(searchTerm, dateFilter);
        
        // Show notification
        setNotification({
          show: true,
          message: "Priority updated",
          type: "success"
        });
        setTimeout(() => setNotification({ show: false }), 3000);
      } else {
        console.error("Error saving priority:", response.status);
      }
    } catch (error) {
      console.error("Error saving priority:", error);
      
      setNotification({
        show: true,
        message: "Error saving priority",
        type: "error"
      });
      setTimeout(() => setNotification({ show: false }), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToJobsheet = (appointment) => {
    setCurrentAppointment(appointment);
    setShowConvertModal(true);
  };

  const handleConfirmConvert = async () => {
    const token = localStorage.getItem("token");
    if (!token || !currentAppointment) {
      console.error("No token found or no appointment selected");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/appointments/${currentAppointment.id}/convert`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 200) {
        setShowConvertModal(false);
        fetchAppointments(searchTerm, dateFilter);
        
        // Show notification
        setNotification({
          show: true,
          message: "Appointment converted to job sheet",
          type: "success"
        });
        setTimeout(() => setNotification({ show: false }), 3000);
      } else {
        console.error("Error converting appointment:", response.status);
      }
    } catch (error) {
      console.error("Error converting appointment:", error);
      
      // Show more specific error if available
      const errorMessage = error.response?.data?.error || "Error converting appointment";
      
      setNotification({
        show: true,
        message: errorMessage,
        type: "error"
      });
      setTimeout(() => setNotification({ show: false }), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePriorityFactor = (factorId) => {
    if (priorityFactors.includes(factorId)) {
      // Remove factor
      setPriorityFactors(priorityFactors.filter(id => id !== factorId));
    } else {
      // Add factor
      setPriorityFactors([...priorityFactors, factorId]);
    }
  };

  // Component interface
  return (
    <>
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: "30px",
          overflow: "hidden",
          backgroundColor: "#ffffff",
          boxSizing: "border-box",
          padding: "20px",
        }}
      >
        {/* Header, filters and add button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>
            Appointments Management
          </h2>
          
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={handleSearch}
                style={{
                  padding: "8px 30px 8px 12px",
                  width: "200px",
                  borderRadius: "10px",
                  border: "1px solid #e0e0e0",
                  backgroundColor: "#F9FBFF",
                  height: "36px",
                  fontSize: "14px"
                }}
              />
              <FontAwesomeIcon
                icon={faSearch}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: loading ? "#4321C9" : "gray",
                  cursor: "pointer",
                }}
              />
            </div>
            
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              backgroundColor: "#f8f9fa",
              borderRadius: "10px",
              padding: "4px",
              border: "1px solid #e0e0e0"
            }}>
              <button
                onClick={() => handleViewModeChange("day")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: viewMode === "day" ? "#5932EA" : "transparent",
                  color: viewMode === "day" ? "white" : "#666",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                Day
              </button>
              
              <button
                onClick={() => handleViewModeChange("week")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: viewMode === "week" ? "#5932EA" : "transparent",
                  color: viewMode === "week" ? "white" : "#666",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                Week
              </button>
              
              <button
                onClick={() => handleViewModeChange("all")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: viewMode === "all" ? "#5932EA" : "transparent",
                  color: viewMode === "all" ? "white" : "#666",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                All
              </button>
            </div>
            
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              backgroundColor: "#fff",
              borderRadius: "10px",
              border: "1px solid #e0e0e0",
              padding: "0 12px",
              height: "36px"
            }}>
              <FontAwesomeIcon icon={faCalendarAlt} style={{ color: "#5932EA" }} />
              <DatePicker
                selected={dateFilter}
                onChange={handleDateChange}
                dateFormat="MM/dd/yyyy"
                className="date-picker"
                disabled={viewMode === "all"}
                style={{
                  border: "none",
                  width: "100px",
                  fontSize: "14px"
                }}
              />
            </div>

            <button
              onClick={handleOpenNewModal}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                padding: "8px 16px",
                backgroundColor: isHovered ? "#4321C9" : "#5932EA",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "background-color 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              <FontAwesomeIcon icon={faPlus} />
              New Appointment
            </button>
          </div>
        </div>

        {/* Day summary */}
        {viewMode === "day" && (
          <div style={{
            backgroundColor: "#f8f9fa",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
            border: "1px solid #e0e0e0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600" }}>
                  {dateFilter.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
                <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                  {appointments.length} scheduled appointments
                </p>
              </div>
              
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ 
                  backgroundColor: "#fff", 
                  borderRadius: "10px", 
                  padding: "10px 16px",
                  border: "1px solid #e0e0e0",
                  textAlign: "center",
                  minWidth: "100px"
                }}>
                  <div style={{ color: "#666", fontSize: "14px", marginBottom: "4px" }}>
                    Confirmed
                  </div>
                  <div style={{ fontWeight: "600", fontSize: "18px", color: "#4CAF50" }}>
                    {appointments.filter(a => a.status === "confirmed").length}
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: "#fff", 
                  borderRadius: "10px", 
                  padding: "10px 16px",
                  border: "1px solid #e0e0e0",
                  textAlign: "center",
                  minWidth: "100px"
                }}>
                  <div style={{ color: "#666", fontSize: "14px", marginBottom: "4px" }}>
                    To Confirm
                  </div>
                  <div style={{ fontWeight: "600", fontSize: "18px", color: "#FF9800" }}>
                    {appointments.filter(a => a.status === "scheduled").length}
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: "#fff", 
                  borderRadius: "10px", 
                  padding: "10px 16px",
                  border: "1px solid #e0e0e0",
                  textAlign: "center",
                  minWidth: "100px"
                }}>
                  <div style={{ color: "#666", fontSize: "14px", marginBottom: "4px" }}>
                    High Priority
                  </div>
                  <div style={{ fontWeight: "600", fontSize: "18px", color: "#F44336" }}>
                    {appointments.filter(a => 
                      a.priority_base_level === "URGENT" || 
                      a.priority_base_level === "HIGH"
                    ).length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grid with the same style as other components */}
        <div style={{ flex: 1, position: "relative" }}>
          <div
            className="ag-theme-alpine"
            style={{
              width: "100%",
              height: "100%",
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.3s ease",
            }}
          >
            <AgGridReact
              ref={gridRef}
              rowData={appointments}
              columnDefs={columnDefs}
              defaultColDef={{
                resizable: false,
                sortable: true,
                flex: 1,
                suppressMenu: true,
              }}
              modules={[ClientSideRowModelModule]}
              pagination={true}
              paginationPageSize={12}
              headerHeight={38}
              rowHeight={50}
              suppressSizeToFit={true}
              suppressHorizontalScroll={true}
              onGridReady={onGridReady}
            />
          </div>
          
          {loading && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  border: "4px solid rgba(0, 0, 0, 0.1)",
                  borderLeft: "4px solid #4321C9",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              ></div>
            </div>
          )}
        </div>

        {/* Notifications */}
        {notification.show && (
          <div
            style={{
              position: "fixed",
              bottom: "20px",
              right: "20px",
              padding: "12px 16px",
              backgroundColor: notification.type === "success" ? "#E6F7F0" : "#FFF2F0",
              color: notification.type === "success" ? "#00A36A" : "#FF4D4F",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "300px",
              animation: "slideInUp 0.3s ease",
              border: `1px solid ${notification.type === "success" ? "#B7EB8F" : "#FFCCC7"}`,
            }}
          >
            <FontAwesomeIcon
              icon={notification.type === "success" ? faCheck : faExclamation}
              style={{
                backgroundColor: notification.type === "success" ? "#F6FFED" : "#FFF2F0",
                color: notification.type === "success" ? "#52C41A" : "#FF4D4F",
                padding: "6px",
                borderRadius: "50%",
                width: "12px",
                height: "12px"
              }}
            />
            <div>
              <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600" }}>
                {notification.type === "success" ? "Success" : "Error"}
              </h4>
              <p style={{ margin: 0, fontSize: "14px" }}>{notification.message}</p>
            </div>
          </div>
        )}

        {/* Create/Edit Modal - Improved UI/UX */}
        {showModal && (
  <div className="modal-backdrop">
    <div className="modal-dialog">
      {/* Header */}
      <div className="modal-header">
        <h3 className="modal-title">
          <span className="modal-title-accent">
            {currentAppointment ? "Edit" : "New"}
          </span> Appointment
        </h3>
        <button className="modal-close" onClick={() => setShowModal(false)}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* Body */}
      <div className="modal-body">
        <div className="form-cards">
          {/* Customer & Vehicle Card */}
          <div className="form-card">
            <div className="form-card-header">
              <div className="form-card-icon">
                <FontAwesomeIcon icon={faUser} />
              </div>
              <h4 className="form-card-title">Customer & Vehicle</h4>
            </div>
            
            <div className="form-card-body">
              <div className="form-control form-control-full">
                <label className="form-label">
                  <FontAwesomeIcon icon={faUser} className="form-label-icon" />
                  Customer
                </label>
                <div className="input-wrapper">
                  <FontAwesomeIcon icon={faUser} className="form-input-icon" />
                  <input
                    type="text"
                    placeholder="Search customer by name..."
                    value={customerSearchTerm}
                    onChange={handleCustomerSearch}
                    className="form-input with-icon"
                  />
                  
                  {showCustomerResults && filteredCustomers.length > 0 && (
                    <div className="search-results">
                      {filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => handleSelectCustomer(customer)}
                          className="search-result-item"
                        >
                          <div className="search-result-avatar">
                            {customer.name.charAt(0)}
                          </div>
                          <div className="search-result-content">
                            <div className="search-result-name">{customer.name}</div>
                            {customer.email && (
                              <div className="search-result-meta">{customer.email}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-control form-control-full">
                <label className="form-label">
                  <FontAwesomeIcon icon={faMotorcycle} className="form-label-icon" />
                  Vehicle
                </label>
                <div className="input-wrapper">
                  <FontAwesomeIcon icon={faMotorcycle} className="form-input-icon" />
                  <select
                    name="vehicle_id"
                    value={formData.vehicle_id}
                    onChange={handleInputChange}
                    disabled={!formData.customer_id}
                    className="form-input form-select with-icon"
                  >
                    <option value="">Select a vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} - {vehicle.plate}
                      </option>
                    ))}
                  </select>
                </div>
                {!formData.customer_id && (
                  <div className="form-hint">Please select a customer first</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Service Information Card */}
          <div className="form-card">
            <div className="form-card-header">
              <div className="form-card-icon">
                <FontAwesomeIcon icon={faTools} />
              </div>
              <h4 className="form-card-title">Service Information</h4>
            </div>
            
            <div className="form-card-body">
              <div className="form-control">
                <label className="form-label">
                  <FontAwesomeIcon icon={faListAlt} className="form-label-icon" />
                  Service Type
                </label>
                <div className="input-wrapper">
                  <FontAwesomeIcon icon={faListAlt} className="form-input-icon" />
                  <select
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleInputChange}
                    className="form-input form-select with-icon"
                  >
                    {serviceTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-control">
                <label className="form-label">
                  <FontAwesomeIcon icon={faExclamation} className="form-label-icon" />
                  Priority
                </label>
                <div className="chip-group">
                  {Object.values(PRIORITY_LEVELS).map(level => (
                    <div
                      key={level.id}
                      onClick={() => setFormData({
                        ...formData,
                        priority_base_level: level.id
                      })}
                      className={`chip ${level.id.toLowerCase()} ${formData.priority_base_level === level.id ? 'active' : ''}`}
                    >
                      <FontAwesomeIcon icon={level.icon} />
                      {level.label}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="form-control form-control-full">
                <label className="form-label">
                  <FontAwesomeIcon icon={faListAlt} className="form-label-icon" />
                  Service Description
                </label>
                <div className="input-wrapper">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the service or issue to address..."
                    className="form-input"
                    style={{minHeight: "100px", resize: "vertical"}}
                  ></textarea>
                  <div style={{
                    position: "absolute",
                    bottom: "8px",
                    right: "8px",
                    fontSize: "12px",
                    color: "#9ca3af",
                    pointerEvents: "none",
                    padding: "2px 6px",
                    background: "rgba(255,255,255,0.8)",
                    borderRadius: "4px"
                  }}>
                    {formData.description.length}/500
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Schedule & Assignment Card */}
          <div className="form-card">
            <div className="form-card-header">
              <div className="form-card-icon">
                <FontAwesomeIcon icon={faCalendarAlt} />
              </div>
              <h4 className="form-card-title">Schedule & Assignment</h4>
            </div>
            
            <div className="form-card-body three-columns">
              <div className="form-control">
                <label className="form-label">
                  <FontAwesomeIcon icon={faCalendarAlt} className="form-label-icon" />
                  Date
                </label>
                <div className="input-wrapper">
                  <FontAwesomeIcon icon={faCalendarAlt} className="form-input-icon" />
                  <DatePicker
                    selected={formData.scheduled_date}
                    onChange={handleDatePickerChange}
                    dateFormat="MM/dd/yyyy"
                    className="form-input with-icon"
                    minDate={new Date()}
                  />
                </div>
              </div>
              
              <div className="form-control">
                <label className="form-label">
                  <FontAwesomeIcon icon={faClock} className="form-label-icon" />
                  Time
                </label>
                <div className="input-wrapper">
                  <FontAwesomeIcon icon={faClock} className="form-input-icon" />
                  <input
                    type="time"
                    value={formData.scheduled_time}
                    onChange={handleTimeChange}
                    className="form-input with-icon"
                  />
                </div>
              </div>
              
              <div className="form-control">
                <label className="form-label">
                  <FontAwesomeIcon icon={faClock} className="form-label-icon" />
                  Duration (min)
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="15"
                    step="15"
                    className="form-input with-spinner-buttons"
                  />
                  <div className="duration-control">
                    <button 
                      type="button" 
                      className="duration-btn"
                      onClick={() => setFormData({...formData, duration: Math.max(15, formData.duration - 15)})}
                    >-</button>
                    <button 
                      type="button" 
                      className="duration-btn"
                      onClick={() => setFormData({...formData, duration: formData.duration + 15})}
                    >+</button>
                  </div>
                </div>
              </div>
              
              <div className="form-control">
                <label className="form-label">
                  <FontAwesomeIcon icon={faListAlt} className="form-label-icon" />
                  Status
                </label>
                <div className="chip-group">
                  {appointmentStatuses.slice(0, 3).map((status) => (
                    <div
                      key={status.value}
                      onClick={() => setFormData({...formData, status: status.value})}
                      className={`chip ${formData.status === status.value ? 'active' : ''}`}
                      style={{
                        backgroundColor: formData.status === status.value ? `${status.color}10` : undefined,
                        color: formData.status === status.value ? status.color : undefined,
                        borderColor: formData.status === status.value ? `${status.color}30` : undefined
                      }}
                    >
                      {status.label}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="form-control">
                <label className="form-label">
                  <FontAwesomeIcon icon={faUserClock} className="form-label-icon" />
                  Assigned Mechanic
                </label>
                <div className="input-wrapper">
                  <FontAwesomeIcon icon={faUserClock} className="form-input-icon" />
                  <select
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleInputChange}
                    className="form-input form-select with-icon"
                  >
                    <option value="">Not assigned</option>
                    {mechanics.map((mechanic) => (
                      <option key={mechanic.id} value={mechanic.id}>
                        {mechanic.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="modal-footer">
        <div style={{
          flex: "1",
          fontSize: "14px",
          color: "#6b7280",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          {currentAppointment ? (
            <>
              <FontAwesomeIcon icon={faEdit} />
              Editing appointment for <strong>{currentAppointment.customer_name}</strong>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faPlus} />
              Creating new appointment
            </>
          )}
        </div>
        <button
          onClick={() => setShowModal(false)}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading || !formData.customer_id || !formData.vehicle_id}
          className="btn btn-primary"
        >
          {isLoading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
              Saving...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faCheck} />
              Save Appointment
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}

        {/* Delete Modal - Improved UI/UX */}
       {showDeleteModal && (
  <div className="modal-backdrop">
    <div className="modal-dialog modal-dialog-small">
      <div className="modal-header" style={{
        background: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)"
      }}>
        <h3 className="modal-title">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          Confirm Deletion
        </h3>
        <button 
          className="modal-close"
          onClick={() => setShowDeleteModal(false)}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="modal-body">
        <div className="alert alert-danger">
          <FontAwesomeIcon icon={faExclamationTriangle} className="alert-icon" />
          <div className="alert-content">
            <div className="alert-title">This action cannot be undone</div>
            <p className="alert-text">
              The appointment will be permanently removed from the system.
            </p>
          </div>
        </div>
        
        <div className="detail-card">
          <div className="detail-row">
            <div className="detail-label">
              <FontAwesomeIcon icon={faUser} /> Customer
            </div>
            <div className="detail-value">{currentAppointment?.customer_name}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">
              <FontAwesomeIcon icon={faCalendarAlt} /> Date
            </div>
            <div className="detail-value">{currentAppointment?.scheduled_date}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">
              <FontAwesomeIcon icon={faClock} /> Time
            </div>
            <div className="detail-value">{currentAppointment?.scheduled_time}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">
              <FontAwesomeIcon icon={faMotorcycle} /> Vehicle
            </div>
            <div className="detail-value">
              {currentAppointment?.vehicle_make} {currentAppointment?.vehicle_model}
            </div>
          </div>
        </div>
        
        <p style={{fontSize: "15px", textAlign: "center", color: "#4b5563", marginTop: "20px"}}>
          Are you sure you want to delete this appointment?
        </p>
      </div>

      <div className="modal-footer">
        <button
          onClick={() => setShowDeleteModal(false)}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirmDelete}
          disabled={isLoading}
          className="btn btn-danger delete-confirm"
        >
          {isLoading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
              Deleting...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faTrash} />
              Yes, Delete Appointment
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}

        {/* Priority Modal - Improved UI/UX */}
        {showPriorityModal && (
          <div className="modal-overlay">
            <div className="modal-container-medium">
              <div className="modal-header accent">
                <h3>
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                  Configure Priority
                </h3>
                <button 
                  className="close-button light"
                  onClick={() => setShowPriorityModal(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <div className="modal-content">
                <p>Set priority for appointment with <strong>{currentAppointment?.customer_name}</strong></p>
                
                <div className="priority-section">
                  <h4>Base Priority Level</h4>
                  
                  <div className="priority-level-options">
                    {Object.values(PRIORITY_LEVELS).map(level => (
                      <div 
                        key={level.id}
                        onClick={() => setSelectedPriorityLevel(level.id)}
                        className={`priority-level-option ${selectedPriorityLevel === level.id ? 'selected' : ''}`}
                        style={{
                          borderColor: selectedPriorityLevel === level.id ? level.color : "#e0e0e0",
                          backgroundColor: selectedPriorityLevel === level.id ? `${level.color}10` : "#f9f9f9"
                        }}
                      >
                        <div className="priority-icon" style={{ backgroundColor: `${level.color}20`, color: level.color }}>
                          <FontAwesomeIcon icon={level.icon} />
                        </div>
                        
                        <div className="priority-details">
                          <div className="priority-name" style={{
                            color: selectedPriorityLevel === level.id ? level.color : "#333"
                          }}>
                            {level.label}
                          </div>
                          <div className="priority-description">
                            {level.description}
                          </div>
                        </div>
                        
                        {selectedPriorityLevel === level.id && (
                          <div className="priority-selected">
                            <FontAwesomeIcon icon={faCheck} style={{ color: level.color }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="priority-section">
                  <h4>Additional Priority Factors</h4>
                  
                  <div className="priority-factors">
                    {PRIORITY_FACTORS.map(factor => (
                      <div 
                        key={factor.id}
                        onClick={() => togglePriorityFactor(factor.id)}
                        className={`priority-factor ${priorityFactors.includes(factor.id) ? 'selected' : ''}`}
                      >
                        <div className="factor-checkbox">
                          {priorityFactors.includes(factor.id) && (
                            <FontAwesomeIcon icon={faCheck} />
                          )}
                        </div>
                        
                        <div className="factor-details">
                          <div className="factor-name">
                            {factor.label}
                            <span className={`adjustment-badge ${factor.adjustment > 0 ? 'positive' : 'negative'}`}>
                              {factor.adjustment > 0 ? `+${factor.adjustment}` : factor.adjustment}
                            </span>
                          </div>
                          <div className="factor-description">
                            {factor.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => setShowPriorityModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePriority}
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} />
                      Save Priority
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Convert to Job Sheet Modal - Improved UI/UX */}
        {showConvertModal && (
          <div className="modal-overlay">
            <div className="modal-container-medium">
              <div className="modal-header accent">
                <h3>
                  <FontAwesomeIcon icon={faTools} className="mr-2" />
                  Convert to Job Sheet
                </h3>
                <button 
                  className="close-button light"
                  onClick={() => setShowConvertModal(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <div className="modal-content">
                <div className="appointment-details">
                  <div className="detail-row">
                    <div className="detail-label">Customer:</div>
                    <div className="detail-value">{currentAppointment?.customer_name}</div>
                  </div>
                  
                  <div className="detail-row">
                    <div className="detail-label">Vehicle:</div>
                    <div className="detail-value">
                      {currentAppointment?.vehicle_make} {currentAppointment?.vehicle_model}
                    </div>
                  </div>
                  
                  <div className="detail-row">
                    <div className="detail-label">Service:</div>
                    <div className="detail-value">
                      {serviceTypes.find(s => s.id === currentAppointment?.service_type)?.label || "Service"}
                    </div>
                  </div>
                  
                  <div className="detail-row">
                    <div className="detail-label">Description:</div>
                    <div className="detail-value">{currentAppointment?.description || "No description"}</div>
                  </div>
                </div>
                
                <p>By converting this appointment to a job sheet:</p>
                
                <ul className="convert-effects">
                  <li>A new job sheet will be created with the appointment data</li>
                  <li>The appointment will be marked as completed</li>
                  <li>You will be able to manage parts, services, and payments in the new job sheet</li>
                </ul>
                
                <div className="warning-message">
                  <FontAwesomeIcon icon={faInfo} />
                  <span>This action cannot be undone. Are you sure you want to continue?</span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => setShowConvertModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmConvert}
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faTools} />
                      Convert to Job Sheet
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global styles */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes slideInUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          .date-picker {
            border: none;
            outline: none;
            font-size: 14px;
            cursor: pointer;
            background: transparent;
          }
          
          /* Modal styles - Improved UI/UX */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(23, 25, 35, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: modalBackdropIn 0.3s ease;
}

@keyframes modalBackdropIn {
  from { background: rgba(23, 25, 35, 0); backdrop-filter: blur(0); }
  to { background: rgba(23, 25, 35, 0.7); backdrop-filter: blur(6px); }
}

.modal-dialog {
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  transform-origin: center;
  animation: modalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  background-color: #f9fafb;
  position: relative;
}

.modal-dialog-small {
  max-width: 500px;
}

.modal-dialog-medium {
  max-width: 650px;
}

@keyframes modalIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-header {
  background: white;
  padding: 24px 32px;
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eaeaea;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title-accent {
  color: #5932EA;
  font-weight: 700;
}

.modal-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #e5e7eb;
  color: #374151;
  transform: rotate(90deg);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  background: white;
}

/* Scrollbar personalizado para el modal body */
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}

.modal-footer {
  padding: 20px 32px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  border-top: 1px solid #eaeaea;
  background: white;
}

/* SISTEMA DE TARJETAS PARA FORMULARIOS */
.form-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #eaeaea;
  overflow: hidden;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.form-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.form-card-header {
  padding: 16px;
  background: #f9fafb;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-card-icon {
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5932EA;
  border: 1px solid rgba(89, 50, 234, 0.2);
}

.form-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.form-card-body {
  padding: 20px;
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr 1fr;
}

.form-card-body.three-columns {
  grid-template-columns: 1fr 1fr 1fr;
}

.form-control-full {
  grid-column: 1 / -1;
}

/* NUEVOS CONTROLES DE FORMULARIO */
.form-control {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-label-icon {
  color: #5932EA;
  font-size: 12px;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  transition: all 0.2s ease;
}

.form-input:focus {
  border-color: #5932EA;
  box-shadow: 0 0 0 3px rgba(89, 50, 234, 0.12);
  background: white;
  outline: none;
}

.form-input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}

.form-input.with-icon {
  padding-left: 40px;
}

.form-input.with-spinner-buttons {
  padding-right: 32px;
}

.form-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

/* SELECT MEJORADO */
.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='16' height='16'%3E%3Cpath fill='none' stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 9l6 6 6-6'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;
}

/* NUEVO SISTEMA DE CHIPS SELECCIONABLES */
.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 8px 16px;
  border-radius: 40px;
  border: 2px solid transparent;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.chip:hover {
  background: #e5e7eb;
  transform: translateY(-2px);
}

.chip.active {
  background: rgba(89, 50, 234, 0.1);
  color: #5932EA;
  border-color: rgba(89, 50, 234, 0.3);
  font-weight: 600;
}

/* Para prioridades con colores específicos */
.chip.urgent {
  background-color: rgba(255, 61, 0, 0.1);
  color: #FF3D00;
}

.chip.urgent.active {
  background-color: rgba(255, 61, 0, 0.15);
  border-color: rgba(255, 61, 0, 0.3);
}

.chip.high {
  background-color: rgba(255, 152, 0, 0.1);
  color: #FF9800;
}

.chip.high.active {
  background-color: rgba(255, 152, 0, 0.15);
  border-color: rgba(255, 152, 0, 0.3);
}

.chip.medium {
  background-color: rgba(255, 235, 59, 0.15);
  color: #FFC107;
}

.chip.medium.active {
  background-color: rgba(255, 235, 59, 0.2);
  border-color: rgba(255, 235, 59, 0.4);
}

.chip.low {
  background-color: rgba(139, 195, 74, 0.1);
  color: #8BC34A;
}

.chip.low.active {
  background-color: rgba(139, 195, 74, 0.15);
  border-color: rgba(139, 195, 74, 0.3);
}

.chip.scheduled {
  background-color: rgba(33, 150, 243, 0.1);
  color: #2196F3;
}

.chip.scheduled.active {
  background-color: rgba(33, 150, 243, 0.15);
  border-color: rgba(33, 150, 243, 0.3);
}

/* NUEVOS CONTROLES DE TIEMPO Y NÚMERO */
.duration-control {
  position: absolute;
  right: 0;
  top: 1px;
  bottom: 1px;
  width: 32px;
  border-left: 1px solid #e5e7eb;
  overflow: hidden;
  border-radius: 0 8px 8px 0;
}

.duration-btn {
  height: 50%;
  width: 100%;
  border: none;
  background: #f9fafb;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.duration-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.duration-btn:first-child {
  border-bottom: 1px solid #e5e7eb;
}

/* BOTONES PRINCIPALES REDISEÑADOS */
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.4;
}

.btn-primary {
  background: #5932EA;
  color: white;
  box-shadow: 0 2px 4px rgba(89, 50, 234, 0.2);
}

.btn-primary:hover {
  background: #4321C9;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(89, 50, 234, 0.25);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: #f3f4f6;
  color: #4b5563;
}

.btn-secondary:hover {
  background: #e5e7eb;
  color: #374151;
  transform: translateY(-1px);
}

.btn-danger {
  background: #EF4444;
  color: white;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
}

.btn-danger:hover {
  background: #DC2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.25);
}

.btn-text {
  background: transparent;
  color: #5932EA;
  padding: 10px;
}

.btn-text:hover {
  background: rgba(89, 50, 234, 0.05);
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* COMPONENTES INFORMATIVOS */
.alert {
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}

.alert-warning {
  background: #FFFBEB;
  border: 1px solid #FEF3C7;
  color: #92400E;
}

.alert-danger {
  background: #FEF2F2;
  border: 1px solid #FEE2E2;
  color: #B91C1C;
}

.alert-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 600;
  font-size: 14px;
  margin: 0 0 4px;
}

.alert-text {
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

/* COMPONENTE PARA DETALLES */
.detail-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.detail-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.5;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  flex: 0 0 120px;
  font-weight: 500;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-value {
  flex: 1;
  color: #111827;
}

/* ANIMACIÓN PARA EL BOTÓN DE ELIMINAR */
.delete-confirm {
  position: relative;
  overflow: hidden;
}

.delete-confirm::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 30%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  transform: skewX(-20deg);
  animation: deleteShine 1.5s infinite;
}

@keyframes deleteShine {
  0% { left: -30%; }
  100% { left: 130%; }
}

/* ITEM DE RESULTADO DE BÚSQUEDA MEJORADO */
.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}

.search-result-item {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.1s ease;
  border-bottom: 1px solid #f3f4f6;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: #f9fafb;
}

.search-result-avatar {
  width: 32px;
  height: 32px;
  background: #EFF6FF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3B82F6;
  font-weight: 500;
}

.search-result-content {
  flex: 1;
}

.search-result-name {
  font-weight: 500;
  color: #111827;
}

.search-result-meta {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}
`}</style>
      </div>
    </>
  );
};

export default AppointmentsView;