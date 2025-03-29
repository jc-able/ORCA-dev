import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  Grid, 
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert
} from '@mui/material';

// Supabase client
import { supabase, insertRecord } from '../services/supabaseClient';

/**
 * ReferralHandler component
 * Handles referral links and captures referral information
 * This page is shown when someone visits a referral link
 */
function ReferralHandler() {
  const { referralId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [referralSource, setReferralSource] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [referralData, setReferralData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    goals: '',
    referral_source: referralId
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch referral source info on component mount
  useEffect(() => {
    const fetchReferralSource = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, this would fetch the member who created this referral link
        // For now, using simulated data
        setTimeout(() => {
          const mockReferralSource = {
            id: referralId,
            first_name: 'David',
            last_name: 'Brown',
            business_name: 'Fitness Plus'
          };
          
          setReferralSource(mockReferralSource);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Error fetching referral source:', err);
        setError('We couldn\'t find the referral information. Please try again or contact us directly.');
        setLoading(false);
      }
    };

    if (referralId) {
      fetchReferralSource();
    } else {
      setError('Invalid referral link');
      setLoading(false);
    }
  }, [referralId]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setReferralData({
      ...referralData,
      [name]: value
    });
    
    // Clear error when field is changed
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Validate the form
  const validateForm = () => {
    const errors = {};
    
    if (!referralData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }
    
    if (!referralData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }
    
    if (!referralData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(referralData.email)) {
      errors.email = 'Email is not valid';
    }
    
    if (!referralData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // In a real implementation, this would create a lead in Supabase
      // with the referral information and source
      // For now, just simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubmitted(true);
      setActiveStep(1);
    } catch (err) {
      console.error('Error submitting referral:', err);
      setError('There was a problem submitting your information. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Box sx={{ py: 5, maxWidth: 600, mx: 'auto', px: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => window.location.href = '/'}
        >
          Go to Homepage
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 5, maxWidth: 800, mx: 'auto', px: 2 }}>
      <Paper sx={{ p: 4 }}>
        {/* Header section */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            {referralSource.business_name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            You've been referred by {referralSource.first_name} {referralSource.last_name}
          </Typography>
        </Box>
        
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Your Information</StepLabel>
          </Step>
          <Step>
            <StepLabel>Schedule Appointment</StepLabel>
          </Step>
        </Stepper>
        
        {/* Step 1: Referral Form */}
        {activeStep === 0 && (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={referralData.first_name}
                  onChange={handleChange}
                  error={!!formErrors.first_name}
                  helperText={formErrors.first_name}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="last_name"
                  value={referralData.last_name}
                  onChange={handleChange}
                  error={!!formErrors.last_name}
                  helperText={formErrors.last_name}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={referralData.email}
                  onChange={handleChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={referralData.phone}
                  onChange={handleChange}
                  error={!!formErrors.phone}
                  helperText={formErrors.phone}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="What are your fitness goals?"
                  name="goals"
                  multiline
                  rows={4}
                  value={referralData.goals}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                        Submitting...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        )}
        
        {/* Step 2: Calendar Placeholder */}
        {activeStep === 1 && (
          <Box>
            <Alert severity="success" sx={{ mb: 4 }}>
              Your information has been submitted successfully!
            </Alert>
            
            <Typography variant="h6" gutterBottom>
              Schedule Your Appointment
            </Typography>
            
            <Typography variant="body1" paragraph>
              Please select a date and time that works for you to meet with {referralSource.first_name}.
            </Typography>
            
            <Box 
              sx={{ 
                height: '300px', 
                backgroundColor: 'rgba(0,191,255,0.1)', 
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mt: 2,
                mb: 4,
                border: '1px dashed',
                borderColor: 'primary.main'
              }}
            >
              <Typography variant="subtitle1" color="primary.main">
                Calendar Integration - Coming Soon
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={() => window.location.href = '/'}
              >
                Finish
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default ReferralHandler; 