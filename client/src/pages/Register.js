import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Avatar, 
  Button, 
  TextField, 
  Link, 
  Grid, 
  Box, 
  Typography, 
  Container, 
  Alert,
  IconButton,
  InputAdornment,
  Paper,
  Stepper,
  Step,
  StepLabel,
  CircularProgress
} from '@mui/material';
import {
  PersonAddAlt as PersonAddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

// Import AuthContext
import { useAuth } from '../contexts/AuthContext';

/**
 * Register page component
 * Handles new user registration with a multi-step form using Supabase
 */
function Register() {
  // Steps for the registration process
  const steps = ['Account Details', 'Personal Information', 'Company Information'];
  
  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Account details
    email: '',
    password: '',
    confirmPassword: '',
    
    // Personal information
    firstName: '',
    lastName: '',
    phone: '',
    
    // Company information
    companyName: '',
    companyType: '',
    role: 'salesperson' // Default role
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  // Get auth functions from context
  const { register, currentUser } = useAuth();
  
  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);
  
  /**
   * Handle form field changes
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  /**
   * Move to next step if current step is valid
   */
  const handleNext = () => {
    // Validate current step
    if (!validateStep(activeStep)) {
      return;
    }
    
    setActiveStep(prev => prev + 1);
  };
  
  /**
   * Move to previous step
   */
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };
  
  /**
   * Validate the current step's form fields
   * @param {number} step - Current step index
   * @returns {boolean} Whether the step is valid
   */
  const validateStep = (step) => {
    setError('');
    
    switch (step) {
      case 0: // Account Details
        if (!formData.email) {
          setError('Email is required');
          return false;
        }
        
        if (!formData.password) {
          setError('Password is required');
          return false;
        }
        
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters');
          return false;
        }
        
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        break;
        
      case 1: // Personal Information
        if (!formData.firstName || !formData.lastName) {
          setError('First and last name are required');
          return false;
        }
        
        if (!formData.phone) {
          setError('Phone number is required');
          return false;
        }
        break;
        
      case 2: // Company Information
        if (!formData.companyName) {
          setError('Company name is required');
          return false;
        }
        break;
    }
    
    return true;
  };
  
  /**
   * Handle final form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation
    if (!validateStep(activeStep)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Register with Supabase
      const userData = await register(formData.email, formData.password);
      
      // In a real application, you would use the Supabase API to store additional user metadata
      // For example:
      // await supabase.from('profiles').insert({
      //   user_id: userData.user.id,
      //   first_name: formData.firstName,
      //   last_name: formData.lastName,
      //   phone: formData.phone,
      //   company_name: formData.companyName,
      //   company_type: formData.companyType,
      //   role: formData.role
      // });
      
      // Redirect to login with success message
      navigate('/login', { 
        state: { 
          registrationSuccess: true,
          email: formData.email,
          message: "Registration successful! Please check your email to confirm your account."
        } 
      });
    } catch (err) {
      setError('Failed to create account: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };
  
  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  /**
   * Render step content based on active step
   * @returns {JSX.Element} Step content
   */
  const getStepContent = (step) => {
    switch (step) {
      case 0: // Account Details
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </>
        );
      
      case 1: // Personal Information
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              id="firstName"
              label="First Name"
              name="firstName"
              autoComplete="given-name"
              value={formData.firstName}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              autoComplete="family-name"
              value={formData.lastName}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="phone"
              label="Phone Number"
              name="phone"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
            />
          </>
        );
      
      case 2: // Company Information
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              id="companyName"
              label="Company Name"
              name="companyName"
              autoComplete="organization"
              value={formData.companyName}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              id="companyType"
              label="Company Type (Gym, Studio, etc.)"
              name="companyType"
              value={formData.companyType}
              onChange={handleChange}
            />
          </>
        );
      
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          mt: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'background.paper'
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <PersonAddIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Create Account
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ width: '100%', mt: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        
        <Box
          component="form"
          noValidate
          sx={{ mt: 2, width: '100%' }}
          onSubmit={activeStep === steps.length - 1 ? handleSubmit : handleNext}
        >
          {getStepContent(activeStep)}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : activeStep === steps.length - 1 ? (
                'Create Account'
              ) : (
                'Next'
              )}
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <Grid container justifyContent="center">
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

export default Register; 