import React, { useState, useEffect } from 'react';
import { Typography, Box, Button, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, CircularProgress, Tabs, Tab, TextField, InputAdornment, Alert } from '@mui/material';
import { Add as AddIcon, ArrowForward as ArrowForwardIcon, Search as SearchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LeadPipeline from '../components/leads/LeadPipeline';
import LeadForm from '../components/leads/LeadForm';
import LeadLoadingState from '../components/leads/LeadLoadingState';
import { LeadAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { debugLeadCreation, withApiKey } from '../utils/supabaseUtils';
import { supabase } from '../services/supabaseClient';

/**
 * Lead Management page component
 * Entry point for all lead management functionality
 */
function LeadManagement() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(0); // 0 = pipeline, 1 = table
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalLeads, setTotalLeads] = useState(0);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false); // New state to track form submission

  // Fetch leads on component mount
  useEffect(() => {
    // We should still fetch leads even if the form is open, just not during submit
    if (!isFormSubmitting) {
      fetchLeads();
    }
  }, [page, limit, isFormSubmitting]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Define filters based on current user role
      const filters = {};
      if (currentUser && currentUser.role !== 'admin') {
        filters.assigned_to = currentUser.id;
      }
      
      // Add search filter if search term exists
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
      console.log('Fetching leads with filters:', filters);
      
      // Fetch leads from API (with Supabase fallback)
      const result = await LeadAPI.getLeads(filters, page, limit);
      
      if (result.success) {
        // Handle data from either API endpoint or direct Supabase query
        // The structure might differ slightly depending on the source
        let leadData = [];
        let totalCount = 0;
        
        console.log('Lead API response:', result.data);
        
        if (result.data?.data && Array.isArray(result.data.data)) {
          // Standard API response format
          leadData = result.data.data;
          totalCount = result.data?.pagination?.total || leadData.length;
        } else if (Array.isArray(result.data)) {
          // Direct API response (no wrapper)
          leadData = result.data;
          totalCount = leadData.length;
        } else if (result.data?.pagination) {
          // Direct Supabase query response
          leadData = result.data.data || [];
          totalCount = result.data.pagination.total;
        }
        
        // Process leads to ensure consistent format
        const processedLeads = leadData.map(lead => {
          // Ensure lead_extensions is always an array
          if (!lead.lead_extensions || lead.lead_extensions.length === 0) {
            lead.lead_extensions = [{
              lead_status: 'New',
              created_at: lead.created_at
            }];
          }
          return lead;
        });
        
        console.log('Processed leads:', processedLeads);
        
        setLeads(processedLeads);
        setFilteredLeads(processedLeads);
        setTotalLeads(totalCount);
        
        // Log data for debugging
        console.log('Leads retrieved:', processedLeads.length);
        
        // If no leads found, check if we're in development and allow using mock data
        if (processedLeads.length === 0 && process.env.NODE_ENV === 'development') {
          console.warn('No leads found. You may want to add some test data.');
        }
      } else {
        throw new Error(result.error || 'Failed to fetch leads');
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setError('Failed to load leads. Please try again later.');
      
      // Fallback to mock data in development environment
      if (process.env.NODE_ENV === 'development') {
        const mockLeads = [
          {
            id: '1',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane.smith@example.com',
            phone: '(555) 123-4567',
            lead_extensions: [{
              lead_status: 'Contacted',
            }],
            interest_level: 'High',
            is_member: false,
            last_contacted: '2023-08-10T15:45:00'
          },
          {
            id: '2',
            first_name: 'Robert',
            last_name: 'Johnson',
            email: 'robert.j@example.com',
            phone: '(555) 987-6543',
            lead_extensions: [{
              lead_status: 'New',
            }],
            interest_level: 'Medium',
            is_member: false,
            last_contacted: null
          },
          {
            id: '3',
            first_name: 'Michael',
            last_name: 'Williams',
            email: 'michael.w@example.com',
            phone: '(555) 456-7890',
            lead_extensions: [{
              lead_status: 'Appointment Scheduled',
            }],
            interest_level: 'High',
            is_member: false,
            last_contacted: '2023-08-12T11:30:00'
          },
          {
            id: '4',
            first_name: 'Emily',
            last_name: 'Davis',
            email: 'emily.davis@example.com',
            phone: '(555) 234-5678',
            lead_extensions: [{
              lead_status: 'Proposal Made',
            }],
            interest_level: 'Low',
            is_member: false,
            last_contacted: '2023-08-05T09:15:00'
          },
          {
            id: '5',
            first_name: 'David',
            last_name: 'Brown',
            email: 'david.brown@example.com',
            phone: '(555) 876-5432',
            lead_extensions: [{
              lead_status: 'Negotiation',
            }],
            interest_level: 'Medium',
            is_member: false,
            last_contacted: '2023-08-11T16:20:00'
          },
          {
            id: '6',
            first_name: 'Sarah',
            last_name: 'Miller',
            email: 'sarah.m@example.com',
            phone: '(555) 345-6789',
            lead_extensions: [{
              lead_status: 'Won',
            }],
            interest_level: 'High',
            is_member: true,
            last_contacted: '2023-08-08T14:10:00'
          },
          {
            id: '7',
            first_name: 'James',
            last_name: 'Wilson',
            email: 'james.w@example.com',
            phone: '(555) 654-3210',
            lead_extensions: [{
              lead_status: 'Lost',
            }],
            interest_level: 'Low',
            is_member: false,
            last_contacted: '2023-07-29T10:45:00'
          }
        ];
        
        setLeads(mockLeads);
        setFilteredLeads(mockLeads);
        console.warn('Using mock data for development');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle search - this will make a new API call with search filter
  useEffect(() => {
    // Don't interrupt search during form submission
    if (isFormSubmitting) return;
    
    if (searchTerm) {
      // Debounce the search by setting a slight delay
      const debounceTimeout = setTimeout(() => {
        fetchLeads();
      }, 300);
      
      return () => clearTimeout(debounceTimeout);
    } else if (searchTerm === '') {
      // If search is cleared, fetch all leads
      fetchLeads();
    }
  }, [searchTerm, isFormSubmitting]);

  const handleViewLeadDetails = (leadId) => {
    navigate(`/leads/${leadId}`);
  };

  const handleViewModeChange = (event, newValue) => {
    setViewMode(newValue);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleNewLead = () => {
    setShowLeadForm(true);
  };

  const handleCloseLeadForm = () => {
    // Add confirmation if the form has unsaved changes
    setShowLeadForm(false);
    // Fetch leads immediately after closing the form
    fetchLeads();
  };

  const handleLeadSubmit = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setIsFormSubmitting(true); // Set form submission state to prevent conflicts
      
      console.log('Lead form submitted with values:', values);
      
      // Check if required fields are present
      if (!values.person?.first_name || !values.person?.last_name || !values.person?.email || !values.person?.phone) {
        setError('Missing required fields in the form data. Please check the form.');
        setLoading(false);
        setIsFormSubmitting(false);
        return;
      }
      
      // Prepare lead data for creation
      const leadData = {
        ...values.person,  // Basic person data
        is_lead: true,
        assigned_to: currentUser.id,
        lead_extensions: [{
          ...values.lead_extension,
          lead_status: values.lead_extension?.lead_status || 'New',
          readiness_score: values.person?.interest_level === 'High' ? 8 : 
                          values.person?.interest_level === 'Medium' ? 5 : 3,
          lead_temperature: values.person?.interest_level === 'High' ? 'hot' : 
                          values.person?.interest_level === 'Medium' ? 'warm' : 'cold',
        }]
      };
      
      console.log('Creating new lead with data:', leadData);
      
      let creationSuccessful = false;
      let newLead = null;
      
      try {
        // Create the lead through the API with Supabase fallback
        const result = await LeadAPI.createLead(leadData);
        
        if (result.success) {
          // Get the created lead data
          newLead = result.data?.data || result.data;
          
          console.log('Lead created successfully through API:', newLead);
          creationSuccessful = true;
        } else {
          throw new Error(result.error || 'Failed to create lead through API');
        }
      } catch (apiError) {
        console.error('API lead creation failed:', apiError);
        
        // Direct Supabase insert as last resort
        try {
          console.log('Attempting direct Supabase lead creation as last resort...');
          
          // Simplify the data structure for direct insert
          const personInsertData = {
            first_name: values.person.first_name,
            last_name: values.person.last_name,
            email: values.person.email,
            phone: values.person.phone,
            is_lead: true,
            assigned_to: currentUser.id,
            interest_level: values.person.interest_level || 'Medium',
            active_status: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // 1. Insert the person record
          const { data: insertedPerson, error: personError } = await withApiKey(() =>
            supabase
              .from('persons')
              .insert(personInsertData)
              .select()
          );
          
          if (personError) {
            console.error('Error creating person directly:', personError);
            throw personError;
          }
          
          if (!insertedPerson || insertedPerson.length === 0) {
            throw new Error('No person data returned after insert');
          }
          
          const personId = insertedPerson[0].id;
          console.log('Person created with ID:', personId);
          
          // 2. Insert lead_extension
          const leadExtData = {
            person_id: personId,
            lead_status: 'New',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { data: extData, error: extError } = await withApiKey(() =>
            supabase
              .from('lead_extensions')
              .insert(leadExtData)
              .select()
          );
          
          if (extError) {
            console.warn('Lead extension creation error:', extError);
            // Continue anyway since we at least created the person
          }
          
          // Construct our new lead object
          newLead = {
            ...insertedPerson[0],
            lead_extensions: extData || [{ lead_status: 'New' }]
          };
          
          console.log('Lead created directly in Supabase:', newLead);
          creationSuccessful = true;
        } catch (directError) {
          console.error('Direct Supabase lead creation failed:', directError);
          setError('Failed to create lead. Please try again later.');
        }
      }
      
      // Handle successful creation
      if (creationSuccessful && newLead) {
        // Close the form
        setShowLeadForm(false);
        
        // Show success message
        setSuccessMessage(`Lead "${newLead.first_name} ${newLead.last_name}" created successfully.`);
        
        // Fetch all leads to update the view
        fetchLeads();
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      setError('Failed to create lead. Please try again.');
    } finally {
      setLoading(false);
      setIsFormSubmitting(false);
    }
  };

  const handleLeadStatusChange = async (leadId, newStatus) => {
    try {
      // Convert column ID back to a proper status name if needed
      // Handling format like 'appointment_scheduled' -> 'Appointment Scheduled'
      let formattedStatus = newStatus;
      
      // If the status contains underscores, convert to spaces and capitalize words
      if (newStatus.includes('_')) {
        formattedStatus = newStatus
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      
      console.log(`Updating lead ${leadId} status to: ${formattedStatus}`);
      
      // Call API to update lead status
      const result = await LeadAPI.updateLeadStatus(leadId, formattedStatus);
      
      if (result.success) {
        // Update local state to reflect the change without a full reload
        setLeads(prevLeads => {
          return prevLeads.map(lead => {
            if (lead.id === leadId) {
              // Create a new lead object with updated lead_extensions
              return {
                ...lead,
                lead_extensions: lead.lead_extensions.map((ext, i) => {
                  if (i === 0) { // Update only the first extension (primary status)
                    return { ...ext, lead_status: formattedStatus };
                  }
                  return ext;
                })
              };
            }
            return lead;
          });
        });
        
        // Also update filtered leads
        setFilteredLeads(prevLeads => {
          return prevLeads.map(lead => {
            if (lead.id === leadId) {
              return {
                ...lead,
                lead_extensions: lead.lead_extensions.map((ext, i) => {
                  if (i === 0) {
                    return { ...ext, lead_status: formattedStatus };
                  }
                  return ext;
                })
              };
            }
            return lead;
          });
        });
      } else {
        throw new Error(result.error || 'Failed to update lead status');
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      // Consider adding a user-visible error notification here
    }
  };

  // After setting state with the leads, add this call to format them for the pipeline
  const formatLeadsForPipeline = (leads) => {
    if (!Array.isArray(leads) || leads.length === 0) {
      // Return empty pipeline if no leads
      return {
        'New': [],
        'Contacted': [],
        'Appointment Scheduled': [],
        'Appointment Completed': [],
        'Proposal Made': [],
        'Negotiation': [],
        'Won': [],
        'Lost': []
      };
    }
    
    // Define the pipeline stages
    const pipelineStages = {
      'New': [],
      'Contacted': [],
      'Appointment Scheduled': [],
      'Appointment Completed': [],
      'Proposal Made': [],
      'Negotiation': [],
      'Won': [],
      'Lost': []
    };
    
    // Distribute leads to appropriate stages
    leads.forEach(lead => {
      if (!lead) return;
      
      // Get the lead status from the first extension or default to 'New'
      let status = 'New';
      
      if (lead.lead_extensions && lead.lead_extensions.length > 0) {
        status = lead.lead_extensions[0].lead_status || 'New';
      }
      
      // Make sure the status is one of our defined stages
      if (!pipelineStages.hasOwnProperty(status)) {
        // Try to map common status variants
        const normalizedStatus = status.toLowerCase();
        
        if (normalizedStatus.includes('appointment') && normalizedStatus.includes('scheduled')) {
          status = 'Appointment Scheduled';
        } else if (normalizedStatus.includes('appointment') && normalizedStatus.includes('completed')) {
          status = 'Appointment Completed';
        } else if (normalizedStatus.includes('proposal')) {
          status = 'Proposal Made';
        } else if (normalizedStatus.includes('contact')) {
          status = 'Contacted';
        } else if (normalizedStatus.includes('won')) {
          status = 'Won';
        } else if (normalizedStatus.includes('lost')) {
          status = 'Lost';
        } else if (normalizedStatus.includes('negotiat')) {
          status = 'Negotiation';
        } else {
          // Default to New if no mapping found
          status = 'New';
        }
      }
      
      // Add the lead to its status array
      pipelineStages[status].push(lead);
    });
    
    return pipelineStages;
  };

  // Render component
  return (
    <Box sx={{ p: 3 }}>
      {/* Lead management header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Lead Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleNewLead}
        >
          New Lead
        </Button>
      </Box>
      
      {/* Success message */}
      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}
      
      {/* Error message */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      {/* View mode tabs and search */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Tabs value={viewMode} onChange={handleViewModeChange}>
          <Tab label="Pipeline View" />
          <Tab label="Table View" />
        </Tabs>
        
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search leads..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Loading, error, and empty states */}
      <LeadLoadingState 
        loading={loading} 
        error={error} 
        isEmpty={!loading && !error && filteredLeads.length === 0}
        onRetry={fetchLeads}
      />

      {/* Content when data is loaded */}
      {!loading && !error && filteredLeads.length > 0 && (
        <>
          {/* Pipeline view */}
          {viewMode === 0 && (
            <Box mt={2}>
              <LeadPipeline 
                pipelineData={formatLeadsForPipeline(filteredLeads)} 
                onLeadClick={handleViewLeadDetails}
                onStatusChange={handleLeadStatusChange}
              />
            </Box>
          )}

          {/* Table view */}
          {viewMode === 1 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Interest</TableCell>
                    <TableCell>Last Contact</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead?.id || Math.random()} hover>
                      <TableCell>
                        {lead?.first_name || ''} {lead?.last_name || ''}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{lead?.email || ''}</Typography>
                        <Typography variant="body2" color="textSecondary">{lead?.phone || ''}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={lead?.lead_extensions?.[0]?.lead_status || 'New'} 
                          color={
                            lead?.lead_extensions?.[0]?.lead_status === 'Won' ? 'success' :
                            lead?.lead_extensions?.[0]?.lead_status === 'Lost' ? 'error' :
                            'primary'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={lead?.interest_level || 'Low'} 
                          color={
                            lead?.interest_level === 'High' ? 'success' :
                            lead?.interest_level === 'Medium' ? 'primary' :
                            'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {lead?.last_contacted ? new Date(lead?.last_contacted).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleViewLeadDetails(lead?.id)}>
                          <ArrowForwardIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Lead form dialog */}
      {showLeadForm && (
        <LeadForm
          isOpen={showLeadForm}
          onClose={handleCloseLeadForm}
          onSubmit={handleLeadSubmit}
        />
      )}
    </Box>
  );
}

export default LeadManagement; 