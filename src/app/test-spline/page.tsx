'use client';

import DashboardClient from '../dashboard/DashboardClient';

const mockSession = {
  user: {
    name: 'Test User',
    id: 'test-id-1234567890',
  }
};

export default function TestSplinePage() {
  return (
    <DashboardClient 
      session={mockSession as any} 
      status="ACCEPTED" 
      team={null} 
    />
  );
}
