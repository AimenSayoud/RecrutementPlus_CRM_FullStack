// src/app/team/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuth } from '@/app/context/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { useTeamStore } from '@/store/useTeamStore';

const TeamPage = () => {
  const { colors } = useTheme();
  const { user: currentUser, canAccess } = useAuth();
  const { 
    teamMembers, 
    fetchTeamMembers, 
    isLoading, 
    error 
  } = useTeamStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch team members on mount and when filters change
  useEffect(() => {
    const filters = {
      type: filterType !== 'all' ? filterType : undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined,
    };
    
    fetchTeamMembers(
      currentUser?.role === 'super_admin' ? undefined : currentUser?.officeId,
      filters
    );
  }, [currentUser?.role, currentUser?.officeId, filterType, filterStatus, fetchTeamMembers]);

  // Check if user has admin access
  const hasAdminAccess = canAccess('admin');

  // Debug logging
  console.log('Team members:', teamMembers);
  
  // Filter team members based on search term
  const filteredMembers = teamMembers.filter(
    member =>
      searchTerm === '' ||
      (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.role && member.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.department && member.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Define columns for the table
  const columns = [
    {
      key: 'name',
      title: 'Name',
      render: (value: any, record: any) => (
        <div>
          <div className="font-medium">{record.name || 'Unknown'}</div>
          <div className="text-sm text-gray-500">{record.email || 'No email'}</div>
        </div>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      render: (value: any, record: any) => (
        <div>
          <div className="font-medium">{record.role || 'Unknown'}</div>
          <div className="text-sm text-gray-500">{record.department || 'No department'}</div>
        </div>
      ),
    },
    {
      key: 'type',
      title: 'Type',
      render: (value: any, record: any) => {
        const typeColors: Record<string, string> = {
          consultant: 'blue',
          admin: 'purple',
          superadmin: 'red',
          recruiter: 'green',
          sales: 'yellow',
          marketing: 'indigo',
          hr: 'pink',
        };
        return (
          <Badge variant={typeColors[record.type] || 'gray'}>
            {record.type || 'Unknown'}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: any, record: any) => (
        <Badge 
          variant={record.status === 'active' ? 'green' : 'gray'}
        >
          {record.status || 'Unknown'}
        </Badge>
      ),
    },
    {
      key: 'availability',
      title: 'Availability',
      render: (value: any, record: any) => (
        <Badge 
          variant={
            record.availability === 'available' ? 'green' : 
            record.availability === 'busy' ? 'yellow' : 
            'red'
          }
        >
          {record.availability || 'Unknown'}
        </Badge>
      ),
    },
    {
      key: 'yearsExperience',
      title: 'Experience',
      render: (value: any, record: any) => `${record.yearsExperience || 0} years`,
    },
    {
      key: 'performanceMetrics',
      title: 'Performance',
      render: (value: any, record: any) => {
        const metrics = record.performanceMetrics || {};
        if (record.type === 'consultant' || record.type === 'recruiter') {
          return (
            <div className="text-sm">
              <div>Placements: {metrics.placements_ytd || metrics.placementsYtd || 0}</div>
              <div>Satisfaction: {metrics.client_satisfaction || metrics.clientSatisfaction || 0}</div>
            </div>
          );
        } else if (record.type === 'sales') {
          return (
            <div className="text-sm">
              <div>New Clients: {metrics.new_clients_ytd || metrics.newClientsYtd || 0}</div>
              <div>Revenue: ${(metrics.revenue_generated || metrics.revenueGenerated || 0).toLocaleString()}</div>
            </div>
          );
        } else {
          return <div className="text-sm text-gray-500">N/A</div>;
        }
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error loading team members: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        style={{
          background: colors.cardBg,
          borderColor: colors.cardBorder,
        }}
        className="border rounded-lg p-6"
      >
        <h1
          style={{ color: colors.text }}
          className="text-2xl font-bold mb-2"
        >
          Team
        </h1>
        <p style={{ color: colors.mutedText }} className="text-sm">
          Manage your team members and their roles
        </p>
      </div>

      <div
        style={{
          background: colors.cardBg,
          borderColor: colors.cardBorder,
        }}
        className="border rounded-lg p-6"
      >
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon="search"
            />
          </div>
          <div className="flex gap-4">
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'consultant', label: 'Consultants' },
                { value: 'admin', label: 'Admins' },
                { value: 'recruiter', label: 'Recruiters' },
                { value: 'sales', label: 'Sales' },
                { value: 'marketing', label: 'Marketing' },
                { value: 'hr', label: 'HR' },
              ]}
            />
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredMembers.length > 0 ? (
            <Table
              columns={columns}
              data={filteredMembers}
              rowKey={(member) => member.id}
              onRowClick={(member) => {
                // Handle row click - could open a detail modal
                console.log('Clicked member:', member);
              }}
              emptyText="No team members found"
            />
          ) : (
            <div className="text-center py-8">
              <p style={{ color: colors.mutedText }}>
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'No team members match your filters'
                  : 'No team members found'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamPage;