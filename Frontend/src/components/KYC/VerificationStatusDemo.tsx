import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
  Divider,
  Alert,
} from '@mui/material';
import { VerificationStatus } from './VerificationStatus';

// Demo component to showcase different verification statuses
export const VerificationStatusDemo: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('in_review');
  const [userId] = useState('demo_user_123');

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_review', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'incomplete', label: 'Incomplete' },
  ];

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            KYC Verification Status Demo
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            This demo showcases different verification statuses with real-time progress indicators
            and comprehensive status tracking for KYC applications.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Demo Features:</strong> Status color coding, progress tracking, 
              document verification status, estimated completion times, and refresh functionality.
            </Typography>
          </Alert>

          <Typography variant="h6" gutterBottom>
            Select Status to Preview:
          </Typography>
          <ButtonGroup variant="outlined" sx={{ mb: 2, flexWrap: 'wrap' }}>
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={selectedStatus === option.value ? 'contained' : 'outlined'}
                onClick={() => setSelectedStatus(option.value)}
                size="small"
              >
                {option.label}
              </Button>
            ))}
          </ButtonGroup>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Demo Verification Status Component */}
      <VerificationStatus
        userId={userId}
        onStatusUpdate={(status) => {
          console.log('Status updated:', status);
        }}
      />

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sample API Integration
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            The component integrates with the KYC API service to fetch real-time status updates.
            Here's how you would use it in your application:
          </Typography>
          
          <Box component="pre" sx={{ 
            bgcolor: 'grey.100', 
            p: 2, 
            borderRadius: 1, 
            overflow: 'auto',
            fontSize: '0.875rem',
            fontFamily: 'monospace'
          }}>
{`// Import the component
import { VerificationStatus } from './components/KYC/VerificationStatus';

// Use in your component
<VerificationStatus
  userId={currentUser.id}
  onStatusUpdate={(status) => {
    // Handle status updates
    console.log('KYC Status:', status);
    // Update parent component state
    setUserKYCStatus(status);
  }}
/>`}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};