import React, { useState, useEffect } from 'react';
import { Typography, Box, Button, Paper, Grid, Card, CardContent, Divider, TextField, InputAdornment, IconButton, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Share as ShareIcon, ContentCopy as ContentCopyIcon, Add as AddIcon, CalendarMonth as CalendarMonthIcon } from '@mui/icons-material';
import ReferralForm from '../components/referrals/ReferralForm';
import ReferralNetwork from '../components/referrals/ReferralNetwork';
import { useNavigate } from 'react-router-dom';
import { ReferralAPI, RelationshipAPI, LeadAPI, MemberAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { ErrorPage, InlineError } from '../components/common/ErrorDisplay';

/**
 * Referral System page component
 * Entry point for all referral management functionality
 */
function ReferralSystem() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [referralLink, setReferralLink] = useState("");
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [networkData, setNetworkData] = useState({ nodes: [], links: [] });
  const [copiedLink, setCopiedLink] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'success' });
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [error, setError] = useState(null);
  
  // Fetch referral data on component mount
  useEffect(() => {
    fetchReferralData();
    generateReferralLink();
  }, []);

  // Function to fetch referral data from API
  const fetchReferralData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch referrals for the current user
      const filters = {};
      if (currentUser && currentUser.role !== 'admin') {
        filters.referrerId = currentUser.id;
      }
      
      // Get referral relationships
      const referralResult = await RelationshipAPI.getReferralRelationships(filters);
      
      if (referralResult.success) {
        setReferrals(referralResult.data.referrals || []);
      } else {
        setError(referralResult);
        return;
      }
      
      // Get network visualization data
      const networkResult = await RelationshipAPI.getReferralNetwork(currentUser.id, 3);
      
      if (networkResult.success) {
        setNetworkData(networkResult.data.data || { nodes: [], links: [] });
      } else {
        setError(networkResult);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      setError({
        error: 'Failed to load referral data. Please try again later.',
        errorType: 'unknown'
      });
      
      // Fallback to mock data in development environment
      if (process.env.NODE_ENV === 'development') {
        // Mock network data - with improved structure for visualization
        const mockData = {
          nodes: [
            { 
              id: 'member-1', 
              name: 'You (Member)', 
              type: 'member', 
              email: 'you@example.com', 
              phone: '(555) 123-7890', 
              referrals_count: 4,
              membership_type: 'Premium',
              join_date: '2023-01-15'
            },
            { 
              id: 'ref-1', 
              name: 'John Smith', 
              type: 'referral', 
              email: 'john@example.com', 
              phone: '(555) 123-4567',
              status: 'contacted',
              date: '2023-07-10'
            },
            { 
              id: 'ref-2', 
              name: 'Emma Johnson', 
              type: 'referral',
              email: 'emma@example.com', 
              phone: '(555) 987-6543',
              status: 'appointment_scheduled',
              date: '2023-07-15'
            },
            { 
              id: 'ref-3', 
              name: 'Michael Williams', 
              type: 'member', 
              email: 'michael@example.com', 
              phone: '(555) 456-7890',
              status: 'converted',
              date: '2023-06-20'
            },
            { 
              id: 'ref-4', 
              name: 'Sarah Davis', 
              type: 'referral', 
              email: 'sarah@example.com', 
              phone: '(555) 234-5678',
              status: 'submitted',
              date: '2023-07-25'
            },
            // Second-level referrals (referred by Michael)
            { 
              id: 'ref-5', 
              name: 'David Brown', 
              type: 'referral', 
              email: 'david@example.com', 
              phone: '(555) 345-6789',
              status: 'contacted',
              date: '2023-07-05'
            },
            { 
              id: 'ref-6', 
              name: 'Jennifer Wilson', 
              type: 'referral', 
              email: 'jennifer@example.com', 
              phone: '(555) 876-5432',
              status: 'submitted',
              date: '2023-07-18'
            }
          ],
          links: [
            { source: 'member-1', target: 'ref-1', id: 'link-1', isPrimary: true },
            { source: 'member-1', target: 'ref-2', id: 'link-2', isPrimary: true },
            { source: 'member-1', target: 'ref-3', id: 'link-3', isPrimary: true },
            { source: 'member-1', target: 'ref-4', id: 'link-4', isPrimary: true },
            { source: 'ref-3', target: 'ref-5', id: 'link-5', isPrimary: true },
            { source: 'ref-3', target: 'ref-6', id: 'link-6', isPrimary: true },
          ]
        };
        
        setNetworkData(mockData);
        
        const mockReferrals = [
          {
            id: 'ref-1',
            referred: {
              id: 'ref-1',
              first_name: 'John',
              last_name: 'Smith',
              email: 'john@example.com',
              phone: '(555) 123-4567',
              is_member: false
            },
            referral_date: '2023-07-10',
            status: 'active',
            referral_channel: 'app'
          },
          {
            id: 'ref-2',
            referred: {
              id: 'ref-2',
              first_name: 'Emma',
              last_name: 'Johnson',
              email: 'emma@example.com',
              phone: '(555) 987-6543',
              is_member: false
            },
            referral_date: '2023-07-15',
            status: 'active',
            referral_channel: 'email'
          },
          {
            id: 'ref-3',
            referred: {
              id: 'ref-3',
              first_name: 'Michael',
              last_name: 'Williams',
              email: 'michael@example.com',
              phone: '(555) 456-7890',
              is_member: true
            },
            referral_date: '2023-06-20',
            status: 'active',
            referral_channel: 'app'
          },
          {
            id: 'ref-4',
            referred: {
              id: 'ref-4',
              first_name: 'Sarah',
              last_name: 'Davis',
              email: 'sarah@example.com',
              phone: '(555) 234-5678',
              is_member: false
            },
            referral_date: '2023-07-25',
            status: 'active',
            referral_channel: 'app'
          }
        ];
        
        setReferrals(mockReferrals);
        console.warn('Using mock data for development');
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate a referral link for the current user
  const generateReferralLink = async () => {
    try {
      if (!currentUser) return;
      
      const result = await ReferralAPI.generateReferralLink(
        currentUser.id,
        `${currentUser.first_name} ${currentUser.last_name}`
      );
      
      if (result.success) {
        setReferralLink(result.data.shortLink);
      } else {
        // Use fallback link if API fails
        console.warn('Failed to generate referral link:', result.error);
        setReferralLink(`https://orca.app/r/${currentUser.id}`);
      }
    } catch (error) {
      console.error('Error generating referral link:', error);
      // Use fallback link if API fails
      setReferralLink(`https://orca.app/r/${currentUser.id}`);
    }
  };

  // Copy referral link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        setCopiedLink(true);
        showNotification('Referral link copied to clipboard!');
        setTimeout(() => setCopiedLink(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        showNotification('Failed to copy link', 'error');
      });
  };

  // Open form to create a new manual referral
  const handleNewReferral = () => {
    setShowReferralForm(true);
  };

  // Close referral form
  const handleCloseReferralForm = () => {
    setShowReferralForm(false);
  };

  // Handle submitting a new manual referral
  const handleReferralSubmit = async (values) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create the referral relationship
      const result = await RelationshipAPI.createReferralRelationship({
        referrer_id: currentUser.id,
        referred_id: values.id, // If it's a new person, this would be created first
        referral_channel: 'manual',
        notes: values.notes,
        relationship_strength: values.relationship_strength || 'medium'
      });
      
      if (result.success) {
        showNotification('Referral created successfully!');
        setShowReferralForm(false);
        
        // Refresh data
        fetchReferralData();
      } else {
        showNotification(result.error || 'Failed to create referral', 'error');
      }
    } catch (error) {
      console.error('Error creating referral:', error);
      showNotification('Failed to create referral', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle selecting a referral from the network visualization
  const handleSelectPerson = (person) => {
    const selectedReferral = referrals.find(r => r.referred.id === person.id);
    setSelectedReferral(selectedReferral);
  };

  // Create a lead from a referral
  const handleCreateLead = async (referral) => {
    try {
      setLoading(true);
      setError(null);
      
      // Convert referral to lead
      const result = await LeadAPI.createLead({
        ...referral.referred,
        is_lead: true,
        lead_extensions: {
          lead_status: 'New',
          readiness_score: 5,
          lead_temperature: 'warm'
        }
      });
      
      if (result.success) {
        showNotification('Referral converted to lead successfully!');
        navigate(`/leads/${result.data.id}`);
      } else {
        showNotification(result.error || 'Failed to create lead from referral', 'error');
      }
    } catch (error) {
      console.error('Error creating lead from referral:', error);
      showNotification('Failed to convert referral to lead', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Convert a referral to a member
  const handleConvertToMember = async (referral) => {
    try {
      setLoading(true);
      setError(null);
      
      // Convert to member
      const result = await MemberAPI.convertToMember(referral.referred.id, {
        membership_type: 'Basic',
        join_date: new Date().toISOString(),
        membership_end_date: null, // Open-ended membership
        billing_day: new Date().getDate(),
        payment_status: 'active'
      });
      
      if (result.success) {
        showNotification('Referral converted to member successfully!');
        // Refresh data
        fetchReferralData();
      } else {
        showNotification(result.error || 'Failed to convert to member', 'error');
      }
    } catch (error) {
      console.error('Error converting to member:', error);
      showNotification('Failed to convert to member', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Share the referral link
  const handleShareLink = () => {
    // Check if Web Share API is supported
    if (navigator.share) {
      navigator.share({
        title: 'Join us!',
        text: `${currentUser.first_name} is inviting you to join ORCA!`,
        url: referralLink,
      })
        .then(() => showNotification('Referral link shared successfully!'))
        .catch((error) => {
          console.error('Error sharing:', error);
          // Fallback to copying to clipboard if sharing fails
          handleCopyLink();
        });
    } else {
      // Fallback for browsers that don't support the Web Share API
      handleCopyLink();
    }
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({
      open: true,
      message,
      type
    });
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Handle retry when errors occur
  const handleRetry = () => {
    setError(null);
    fetchReferralData();
    generateReferralLink();
  };

  if (loading && networkData.nodes.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If there's an error and we have no data, show the error page
  if (error && networkData.nodes.length === 0 && referrals.length === 0) {
    return (
      <ErrorPage
        error={error}
        title="Couldn't Load Referral Data"
        onRetry={handleRetry}
      />
    );
  }

  return (
    <ErrorBoundary componentName="ReferralSystem">
      <Box sx={{ p: 3 }}>
        {/* Referral system header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Referral System
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleNewReferral}
          >
            New Referral
          </Button>
        </Box>

        {/* Error display - will show if there's an error but we still have some data */}
        {error && <InlineError error={error} onRetry={handleRetry} />}

        {/* Referral link card */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Your Referral Link
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              value={referralLink}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleCopyLink} color={copiedLink ? "success" : "primary"}>
                      <ContentCopyIcon />
                    </IconButton>
                    <IconButton onClick={handleShareLink} color="primary">
                      <ShareIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Share this link with potential referrals. They'll be connected to you automatically.
          </Typography>
        </Paper>

        {/* Referral network visualization */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Your Referral Network
          </Typography>
          <Box sx={{ height: '400px', width: '100%' }}>
            <ErrorBoundary 
              componentName="ReferralNetwork"
              message="Unable to display referral network visualization."
              fallback={(error, reset) => (
                <Box sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center' 
                }}>
                  <Typography variant="body1" color="error" align="center" gutterBottom>
                    Unable to display referral network visualization.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={reset}
                    size="small"
                  >
                    Try Again
                  </Button>
                </Box>
              )}
            >
              <ReferralNetwork 
                data={networkData} 
                onSelectPerson={handleSelectPerson} 
              />
            </ErrorBoundary>
          </Box>
        </Paper>

        {/* Recent referrals and selected referral details */}
        <Grid container spacing={3}>
          {/* Recent referrals */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Recent Referrals
              </Typography>
              {referrals.length === 0 ? (
                <Typography variant="body1" color="textSecondary">
                  No referrals yet. Start by sharing your referral link or adding a referral manually.
                </Typography>
              ) : (
                referrals.slice(0, 5).map((referral) => (
                  <Card 
                    key={referral.id} 
                    variant="outlined" 
                    sx={{ 
                      mb: 2, 
                      cursor: 'pointer',
                      bgcolor: selectedReferral?.id === referral.id ? 'action.selected' : 'background.paper'
                    }}
                    onClick={() => setSelectedReferral(referral)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle1">
                            {referral.referred.first_name} {referral.referred.last_name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {referral.referred.email} • {referral.referred.phone}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(referral.referral_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )}
            </Paper>
          </Grid>

          {/* Selected referral details */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Referral Details
              </Typography>
              {selectedReferral ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6">
                      {selectedReferral.referred.first_name} {selectedReferral.referred.last_name}
                    </Typography>
                    <Typography variant="body1">
                      {selectedReferral.referred.email}
                    </Typography>
                    <Typography variant="body1">
                      {selectedReferral.referred.phone}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="textSecondary">
                      <strong>Referral Date:</strong> {new Date(selectedReferral.referral_date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Channel:</strong> {selectedReferral.referral_channel}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Status:</strong> {selectedReferral.status}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Member:</strong> {selectedReferral.referred.is_member ? 'Yes' : 'No'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {!selectedReferral.referred.is_member && (
                      <>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => handleCreateLead(selectedReferral)}
                        >
                          Create Lead
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleConvertToMember(selectedReferral)}
                        >
                          Convert to Member
                        </Button>
                      </>
                    )}
                    {selectedReferral.referred.is_member && (
                      <Button
                        variant="contained"
                        startIcon={<CalendarMonthIcon />}
                        onClick={() => navigate(`/members/${selectedReferral.referred.id}`)}
                      >
                        View Member
                      </Button>
                    )}
                  </Box>
                </>
              ) : (
                <Typography variant="body1" color="textSecondary">
                  Select a referral to view details.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Referral form dialog */}
        {showReferralForm && (
          <ReferralForm
            open={showReferralForm}
            onClose={handleCloseReferralForm}
            onSubmit={handleReferralSubmit}
          />
        )}

        {/* Notification snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseNotification} severity={notification.type} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </ErrorBoundary>
  );
}

export default ReferralSystem; 