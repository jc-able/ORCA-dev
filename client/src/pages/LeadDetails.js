import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Grid, 
  Divider, 
  Chip, 
  Card, 
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  LinearProgress,
  Link
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  PermContactCalendar as PermContactCalendarIcon,
  Message as MessageIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  PeopleAlt as PeopleAltIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Link as LinkIcon,
  PersonAdd as PersonAddIcon,
  AccountTree as AccountTreeIcon
} from '@mui/icons-material';

// Supabase client
import { supabase, fetchData, updateRecord } from '../services/supabaseClient';
// Import the data transformation utilities
import { formatTimestamp, processJsonField, processArrayField, processNumericField } from '../utils/dataTransformUtils';

/**
 * Lead Details page component
 * Displays comprehensive information about a single lead
 * Allows editing lead details, communication options, and conversion to member
 */
function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [interactions, setInteractions] = useState([]);
  const [referralLinkDialog, setReferralLinkDialog] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showGeneratingLoader, setShowGeneratingLoader] = useState(false);
  const [referralNetworkDialog, setReferralNetworkDialog] = useState(false);
  const [referralNetwork, setReferralNetwork] = useState({ referrer: null, referrals: [] });

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Fetch lead data
  useEffect(() => {
    const fetchLeadData = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, this would fetch from Supabase
        // For now, using simulated data
        setTimeout(() => {
          const mockLead = {
            id: id,
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane.smith@example.com',
            phone: '(555) 123-4567',
            acquisition_source: 'Referral', // Modified to show referral
            acquisition_date: '2023-08-01T10:30:00',
            interest_level: 'High',
            lead_status: 'Contacted',
            is_member: false,
            assigned_to: 'John Doe',
            notes: 'Interested in premium membership. Prefers evening contact.',
            goals: 'Weight loss and increasing strength',
            preferred_membership: 'Premium',
            interested_services: processArrayField(['Personal Training', 'Nutrition Coaching'], 'text'),
            profile_completeness: processNumericField(80, 0, 100),
            tags: processArrayField(['Hot Lead', 'Follow-up Required'], 'text'),
            budget_range: '$50-100/month',
            last_contacted: formatTimestamp('2023-08-10T15:45:00', 'iso'),
            next_scheduled_contact: formatTimestamp('2023-08-17T16:00:00', 'iso'),
            // Adding referral tracking data
            referral_source: {
              id: '5', // This matches the ID of David Brown in our mock data
              first_name: 'David',
              last_name: 'Brown',
              is_member: true
            }
          };
          
          setLead(mockLead);
          
          // Mock interactions
          const mockInteractions = [
            {
              id: 1,
              type: 'email',
              date: formatTimestamp('2023-08-10T15:45:00', 'iso'),
              summary: 'Sent initial welcome email',
              details: 'Introduced services and requested a call back'
            },
            {
              id: 2,
              type: 'call',
              date: formatTimestamp('2023-08-05T11:20:00', 'iso'),
              summary: 'Introductory call',
              details: 'Discussed membership options and facility tour'
            },
            {
              id: 3,
              type: 'note',
              date: formatTimestamp('2023-08-03T09:15:00', 'iso'),
              summary: 'Internal note',
              details: 'Lead seems very interested but concerned about price'
            }
          ];
          
          setInteractions(mockInteractions);
          setLoading(false);
        }, 1000);
        
      } catch (err) {
        console.error('Error fetching lead data:', err);
        setError('Failed to load lead data. Please try again.');
        setLoading(false);
      }
    };

    fetchLeadData();
  }, [id]);

  /**
   * Generate a unique referral link for converted leads (members)
   * In production, this would create a unique link in the database
   */
  const generateReferralLink = async () => {
    setShowGeneratingLoader(true);
    
    try {
      // In a real implementation, this would:
      // 1. Call an API to generate a unique link
      // 2. Store the link in the database
      // 3. Associate it with this member
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a unique link based on member ID
      const baseUrl = window.location.origin;
      const uniqueLink = `${baseUrl}/r/${id}`;
      
      setReferralLink(uniqueLink);
      setReferralLinkDialog(true);
      
    } catch (err) {
      console.error('Error generating referral link:', err);
      setError('Failed to generate referral link. Please try again.');
    } finally {
      setShowGeneratingLoader(false);
    }
  };

  /**
   * Copy referral link to clipboard
   */
  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopySuccess(true);
    
    // Reset copy success message after 2 seconds
    setTimeout(() => {
      setCopySuccess(false);
    }, 2000);
  };

  /**
   * Convert lead to member
   * In production, this would update the database record
   */
  const convertToMember = async () => {
    try {
      // In a real implementation, update the database
      // For now, just update local state
      setLead({ ...lead, is_member: true });
      
      // Generate referral link automatically after conversion
      generateReferralLink();
      
    } catch (err) {
      console.error('Error converting lead to member:', err);
      setError('Failed to convert lead to member. Please try again.');
    }
  };

  /**
   * Show the referral network for this lead/member
   * In production, this would fetch the referral tree from the database
   */
  const showReferralNetwork = () => {
    // In a real implementation, this would fetch the referral network from the database
    // For now, just generate some mock data
    
    const mockReferralNetwork = {
      // If this lead was referred by someone
      referrer: lead.referral_source,
      
      // People this lead/member has referred
      referrals: [
        {
          id: '6',
          first_name: 'Sarah',
          last_name: 'Johnson',
          date_referred: formatTimestamp('2023-08-20T10:15:00', 'iso'),
          is_member: true,
          status: 'Active Member'
        },
        {
          id: '7',
          first_name: 'Mark',
          last_name: 'Williams',
          date_referred: formatTimestamp('2023-08-15T14:30:00', 'iso'),
          is_member: false,
          status: 'Contacted'
        }
      ]
    };
    
    setReferralNetwork(mockReferralNetwork);
    setReferralNetworkDialog(true);
  };

  /**
   * Navigate to another lead/member's details
   */
  const navigateToContact = (contactId) => {
    // Close the dialog
    setReferralNetworkDialog(false);
    
    // Navigate to the contact's details page
    navigate(`/leads/${contactId}`);
  };

  // Handle loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Box sx={{ py: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/leads')}
          sx={{ mt: 2 }}
        >
          Back to Leads
        </Button>
      </Box>
    );
  }

  // Render lead details if data is loaded
  if (!lead) {
    return (
      <Box sx={{ py: 3 }}>
        <Alert severity="warning">Lead not found</Alert>
        <Button
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/leads')}
          sx={{ mt: 2 }}
        >
          Back to Leads
        </Button>
      </Box>
    );
  }

  // Helper function to format display dates
  const formatDisplayDate = (dateString) => {
    return formatTimestamp(dateString, 'display');
  };

  return (
    <Box sx={{ flexGrow: 1, py: 3 }}>
      {/* Back button and header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/leads')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          {lead.first_name} {lead.last_name}
        </Typography>
        {lead.is_member && (
          <Chip 
            label="Member" 
            color="success" 
            sx={{ ml: 2 }}
            icon={<CheckIcon />}
          />
        )}
        {!lead.is_member && (
          <Chip 
            label={lead.lead_status} 
            color="primary" 
            variant="outlined"
            sx={{ ml: 2 }}
          />
        )}
        {/* Referral Network Button */}
        <Button
          variant="outlined"
          startIcon={<AccountTreeIcon />}
          onClick={showReferralNetwork}
          sx={{ ml: 'auto' }}
        >
          Referral Network
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Lead summary card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Contact Information</Typography>
                <IconButton size="small">
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <EmailIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="body2">{lead.email}</Typography>
              </Box>
              
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <PhoneIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="body2">{lead.phone}</Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Source:</strong> {lead.acquisition_source}
              </Typography>
              
              {/* Referral Source Information */}
              {lead.referral_source && (
                <Box sx={{ 
                  my: 2, 
                  p: 1.5,
                  backgroundColor: 'rgba(0, 230, 118, 0.08)', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'success.light'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonAddIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="subtitle2" color="success.main">
                      Referred by:
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    <Link 
                      component="button" 
                      variant="body2" 
                      onClick={() => navigateToContact(lead.referral_source.id)}
                      underline="hover"
                      sx={{ fontWeight: 'medium' }}
                    >
                      {lead.referral_source.first_name} {lead.referral_source.last_name}
                    </Link>
                    {lead.referral_source.is_member && (
                      <Chip 
                        label="Member" 
                        color="success" 
                        size="small" 
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                </Box>
              )}
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Acquisition Date:</strong> {new Date(lead.acquisition_date).toLocaleDateString()}
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Interest Level:</strong> {lead.interest_level}
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Assigned To:</strong> {lead.assigned_to}
              </Typography>
            </CardContent>
          </Card>
          
          {/* Quick Actions Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<EmailIcon />} 
                    sx={{ mb: 1 }}
                  >
                    Email
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<PhoneIcon />} 
                    sx={{ mb: 1 }}
                  >
                    Call
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<MessageIcon />} 
                    sx={{ mb: 1 }}
                  >
                    SMS
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<PermContactCalendarIcon />} 
                    sx={{ mb: 1 }}
                  >
                    Schedule
                  </Button>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              {!lead.is_member ? (
                <Button 
                  fullWidth 
                  variant="contained" 
                  color="success"
                  startIcon={<PeopleAltIcon />}
                  onClick={convertToMember}
                >
                  Convert to Member
                </Button>
              ) : (
                <Button 
                  fullWidth 
                  variant="contained" 
                  color="primary"
                  startIcon={<LinkIcon />}
                  onClick={generateReferralLink}
                  disabled={showGeneratingLoader}
                >
                  {showGeneratingLoader ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      Generating Link...
                    </>
                  ) : (
                    "Generate Referral Link"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Tabs panel */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 2 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="lead detail tabs"
              variant="fullWidth"
            >
              <Tab label="Details" id="lead-tab-0" />
              <Tab label="Interactions" id="lead-tab-1" />
              <Tab label="Notes" id="lead-tab-2" />
            </Tabs>
            
            <Box role="tabpanel" hidden={activeTab !== 0} id="lead-tabpanel-0" sx={{ p: 3 }}>
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Preferred Membership:</strong>
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {lead.preferred_membership}
                    </Typography>
                    
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Budget Range:</strong>
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {lead.budget_range}
                    </Typography>
                    
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Goals:</strong>
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {lead.goals}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Interested Services:</strong>
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      {lead.interested_services.map((service, index) => (
                        <Chip 
                          key={index} 
                          label={service} 
                          color="primary" 
                          variant="outlined" 
                          sx={{ mr: 1, mb: 1 }} 
                        />
                      ))}
                    </Box>
                    
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Tags:</strong>
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      {lead.tags.map((tag, index) => (
                        <Chip 
                          key={index} 
                          label={tag} 
                          color="secondary" 
                          variant="outlined" 
                          sx={{ mr: 1, mb: 1 }} 
                        />
                      ))}
                    </Box>
                    
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Profile Completeness:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress variant="determinate" value={lead.profile_completeness} />
                      </Box>
                      <Box sx={{ minWidth: 35 }}>
                        <Typography variant="body2" color="text.secondary">{`${Math.round(
                          lead.profile_completeness,
                        )}%`}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </Box>
            
            <Box role="tabpanel" hidden={activeTab !== 1} id="lead-tabpanel-1" sx={{ p: 3 }}>
              {activeTab === 1 && (
                <List>
                  {interactions.map((interaction) => (
                    <React.Fragment key={interaction.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemIcon>
                          {interaction.type === 'email' && <EmailIcon color="primary" />}
                          {interaction.type === 'call' && <PhoneIcon color="secondary" />}
                          {interaction.type === 'note' && <EditIcon color="action" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={interaction.summary}
                          secondary={
                            <React.Fragment>
                              <Typography component="span" variant="body2" color="text.primary">
                                {new Date(interaction.date).toLocaleString()}
                              </Typography>
                              {` — ${interaction.details}`}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
            
            <Box role="tabpanel" hidden={activeTab !== 2} id="lead-tabpanel-2" sx={{ p: 3 }}>
              {activeTab === 2 && (
                <>
                  <Typography variant="body1" paragraph>
                    {lead.notes}
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Add a note"
                    multiline
                    rows={4}
                    variant="outlined"
                    placeholder="Enter notes about this lead..."
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="contained">Save Note</Button>
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Referral Link Dialog */}
      <Dialog 
        open={referralLinkDialog}
        onClose={() => setReferralLinkDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Member's Referral Link
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Share this unique link with the member. Anyone who signs up through this link will be tracked as their referral.
          </Typography>
          
          <TextField
            fullWidth
            variant="outlined"
            value={referralLink}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    edge="end" 
                    color="primary" 
                    onClick={copyReferralLink}
                    aria-label="copy referral link"
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          
          {copySuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Link copied to clipboard!
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReferralLinkDialog(false)}>Close</Button>
          <Button 
            variant="contained" 
            startIcon={<ShareIcon />}
            onClick={() => {
              // In a real implementation, this would open share options
              console.log('Share link');
            }}
          >
            Share
          </Button>
        </DialogActions>
      </Dialog>

      {/* Referral Network Dialog */}
      <Dialog 
        open={referralNetworkDialog}
        onClose={() => setReferralNetworkDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Referral Network
          </Typography>
        </DialogTitle>
        <DialogContent>
          {/* Referrer Section */}
          {referralNetwork.referrer && (
            <>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', mt: 1 }}>
                Referred By:
              </Typography>
              <Paper sx={{ p: 2, mb: 3, borderLeft: 4, borderColor: 'success.main' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" component="div">
                      {referralNetwork.referrer.first_name} {referralNetwork.referrer.last_name}
                      {referralNetwork.referrer.is_member && (
                        <Chip 
                          label="Member" 
                          color="success" 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                  </Box>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => navigateToContact(referralNetwork.referrer.id)}
                  >
                    View Profile
                  </Button>
                </Box>
              </Paper>
            </>
          )}

          {/* Referrals Section */}
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', mt: 2 }}>
            People Referred by {lead.first_name}:
          </Typography>
          
          {referralNetwork.referrals.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              No referrals yet
            </Alert>
          ) : (
            <List>
              {referralNetwork.referrals.map((referral) => (
                <ListItem 
                  key={referral.id}
                  sx={{ 
                    mb: 1, 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: referral.is_member ? 'success.light' : 'primary.light',
                    bgcolor: referral.is_member ? 'rgba(0, 230, 118, 0.08)' : 'rgba(0, 127, 255, 0.08)'
                  }}
                >
                  <ListItemIcon>
                    {referral.is_member ? (
                      <CheckIcon color="success" />
                    ) : (
                      <PersonAddIcon color="primary" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography component="span">
                          {referral.first_name} {referral.last_name}
                        </Typography>
                        {referral.is_member ? (
                          <Chip 
                            label="Member" 
                            color="success" 
                            size="small" 
                            sx={{ ml: 1 }}
                          />
                        ) : (
                          <Chip 
                            label="Lead" 
                            color="primary" 
                            variant="outlined"
                            size="small" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.secondary">
                          Status: {referral.status}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2" color="text.secondary">
                          Referred on: {new Date(referral.date_referred).toLocaleDateString()}
                        </Typography>
                      </>
                    }
                  />
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => navigateToContact(referral.id)}
                    sx={{ ml: 2 }}
                  >
                    View
                  </Button>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReferralNetworkDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LeadDetails; 