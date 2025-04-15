import React from 'react';
import AppointmentsView from './appointmentsView';
import SideBar from './Sidebar';

const AppointmentsPage = () => {

    return (
      <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#D9D9D9',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: '220px',
            backgroundColor: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <SideBar />
        </div>
  
        {/* Contenedor principal */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
          }}
        >
          {/* Main Content */}
          <div className="dashboard-content"
            style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto'
            }}
          >
            <AppointmentsView />
          </div>
        </div>
      </div>
    );
  };
export default AppointmentsPage;