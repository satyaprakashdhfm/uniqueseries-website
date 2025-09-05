import React from 'react';
import AdminTabs from '../../components/AdminTabs';
import OrdersTab from '../../components/OrdersTab';

const AdminDashboard = () => {
  return (
    <AdminTabs>
      <OrdersTab />
    </AdminTabs>
  );
};

export default AdminDashboard;
