import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  TextField, 
  Button, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Divider, 
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  IconButton
} from '@mui/material';
import { Close as CloseIcon, PersonAdd } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ValidationPatterns, validateEmail, validatePhone, ReferralValidation } from '../../utils/validationUtils';
import { SchemaConstraints } from '../../types/schema';

/**
 * ReferralForm component
 * Form for creating a new referral using the unified Person model with referral_extensions
 * Uses a multi-step approach to collect information
 * 
 * Database mapping:
 * - Basic information fields map to the persons table with is_referral=true
 * - Referral-specific fields map to the referral_extensions table
 * - Relationship data maps to the relationships table
 */
const ReferralForm = ({ isOpen, onClose, onSubmit }) => {
  // Track the form step
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Basic Information', 'Referral Details', 'Scheduling Preferences'];
  
  // Form validation schema with schema constraints
  const validationSchema = Yup.object({
    // Person table fields validation
    first_name: Yup.string().required('First name is required'),
    last_name: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email format').required('Email is required'),
    phone: Yup.string().matches(ValidationPatterns.PHONE, 'Phone number is not valid').required('Phone number is required'),
    
    // Referral extension and relationship fields validation
    relationship_to_referrer: Yup.string().required('Relationship is required'),
    
    // Add constraint validation for conversion_probability
    conversion_probability: Yup.number()
      .transform((value) => (isNaN(value) ? undefined : value))
      .min(
        SchemaConstraints.REFERRAL_EXTENSION.CONVERSION_PROBABILITY_MIN,
        `Must be at least ${SchemaConstraints.REFERRAL_EXTENSION.CONVERSION_PROBABILITY_MIN}`
      )
      .max(
        SchemaConstraints.REFERRAL_EXTENSION.CONVERSION_PROBABILITY_MAX,
        `Must be at most ${SchemaConstraints.REFERRAL_EXTENSION.CONVERSION_PROBABILITY_MAX}`
      ),
  });
  
  // Initialize formik with fields from both person and referral_extension tables
  const formik = useFormik({
    initialValues: {
      // Person table fields
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      goals: '',
      preferred_contact_method: 'Email',
      preferred_contact_times: '', // JSON in database
      special_requirements: '',
      
      // Referral extension table fields
      relationship_to_referrer: '',
      relationship_strength: 'medium',
      permission_level: 'explicit',
      referral_status: 'submitted',
      conversion_probability: 50, // Default value within constraints
      
      // Relationship table fields and metadata
      referral_channel: 'app',
      is_primary_referrer: true,
      attribution_percentage: 100, // Default value within constraints
      relationship_level: 1, // Default value meeting minimum constraint
      notes: ''
    },
    validationSchema,
    onSubmit: (values) => {
      // Validate conversion_probability with our utility
      const conversionProbError = ReferralValidation.conversionProbability(values.conversion_probability);
      if (conversionProbError) {
        formik.setFieldError('conversion_probability', conversionProbError);
        return;
      }
      
      // Format values to match the expected API structure with unified Person model
      const formattedValues = {
        // Person data (is_referral flag set to true)
        person: {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          phone: values.phone,
          preferred_contact_method: values.preferred_contact_method,
          preferred_contact_times: values.preferred_contact_times 
            ? { times: values.preferred_contact_times } 
            : null,
          goals: values.goals,
          special_requirements: values.special_requirements,
          is_referral: true, // Flag for unified person model
          acquisition_source: 'Referral', // Standard source tracking
          notes: values.notes
        },
        
        // Referral extension data
        referral_extension: {
          relationship_to_referrer: values.relationship_to_referrer,
          relationship_strength: values.relationship_strength,
          permission_level: values.permission_level,
          referral_status: values.referral_status,
          conversion_probability: Number(values.conversion_probability),
        },
        
        // Relationship data for linking referrer and referral
        relationship: {
          referral_channel: values.referral_channel,
          is_primary_referrer: values.is_primary_referrer,
          attribution_percentage: Number(values.attribution_percentage),
          relationship_level: Number(values.relationship_level),
        }
      };
      
      onSubmit(formattedValues);
      handleClose();
    },
  });
  
  // Reset form and step when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveStep(0);
    } else {
      // Timeout to allow dialog exit animation
      setTimeout(() => {
        formik.resetForm();
      }, 300);
    }
  }, [isOpen]);
  
  // Custom validation functions using our validation utilities
  const validateField = (fieldName, value) => {
    let error = null;
    
    switch (fieldName) {
      case 'email':
        error = validateEmail(value);
        break;
      case 'phone':
        error = validatePhone(value);
        break;
      case 'conversion_probability':
        error = ReferralValidation.conversionProbability(value);
        break;
      default:
        // Fall back to Formik's validation
        return undefined;
    }
    
    return error;
  };
  
  // Validate current step before proceeding
  const validateStep = () => {
    let valid = true;
    
    if (activeStep === 0) {
      // Basic information validation - from person table
      const fields = ['first_name', 'last_name', 'email', 'phone'];
      fields.forEach(field => {
        if (!formik.values[field]) {
          formik.setFieldTouched(field, true, true);
          valid = false;
        }
      });
      
      // Use our custom validation utilities
      const emailError = validateField('email', formik.values.email);
      if (emailError) {
        formik.setFieldError('email', emailError);
        valid = false;
      }
      
      const phoneError = validateField('phone', formik.values.phone);
      if (phoneError) {
        formik.setFieldError('phone', phoneError);
        valid = false;
      }
    } else if (activeStep === 1) {
      // Referral relationship validation - from referral_extensions table
      if (!formik.values.relationship_to_referrer) {
        formik.setFieldTouched('relationship_to_referrer', true, true);
        valid = false;
      }
      
      // Validate conversion_probability with our utility
      const conversionProbError = validateField('conversion_probability', formik.values.conversion_probability);
      if (conversionProbError) {
        formik.setFieldError('conversion_probability', conversionProbError);
        valid = false;
      }
    }
    
    return valid;
  };
  
  // Handle step navigation
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Handle dialog close
  const handleClose = () => {
    onClose();
  };
  
  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1,
          backgroundColor: 'background.paper'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <PersonAdd sx={{ mr: 1 }} />
            <Typography variant="h6">Create New Referral</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent>
        <Box sx={{ my: 2 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        
        <Box component="form" noValidate>
          {/* Step 1: Basic Information (persons table) */}
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="first_name"
                  name="first_name"
                  label="First Name"
                  value={formik.values.first_name}
                  onChange={formik.handleChange}
                  error={formik.touched.first_name && Boolean(formik.errors.first_name)}
                  helperText={formik.touched.first_name && formik.errors.first_name}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="last_name"
                  name="last_name"
                  label="Last Name"
                  value={formik.values.last_name}
                  onChange={formik.handleChange}
                  error={formik.touched.last_name && Boolean(formik.errors.last_name)}
                  helperText={formik.touched.last_name && formik.errors.last_name}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="phone"
                  name="phone"
                  label="Phone"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                  helperText={formik.touched.phone && formik.errors.phone}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="preferred-contact-label">Preferred Contact Method</InputLabel>
                  <Select
                    labelId="preferred-contact-label"
                    id="preferred_contact_method"
                    name="preferred_contact_method"
                    value={formik.values.preferred_contact_method}
                    onChange={formik.handleChange}
                    label="Preferred Contact Method"
                  >
                    <MenuItem value="Email">Email</MenuItem>
                    <MenuItem value="Phone">Phone</MenuItem>
                    <MenuItem value="SMS">SMS</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
          
          {/* Step 2: Referral Details (referral_extensions table and relationships table) */}
          {activeStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl 
                  fullWidth 
                  error={formik.touched.relationship_to_referrer && Boolean(formik.errors.relationship_to_referrer)}
                  required
                >
                  <InputLabel id="relationship-to-referrer-label">Relationship to Referrer</InputLabel>
                  <Select
                    labelId="relationship-to-referrer-label"
                    id="relationship_to_referrer"
                    name="relationship_to_referrer"
                    value={formik.values.relationship_to_referrer}
                    onChange={formik.handleChange}
                    label="Relationship to Referrer"
                  >
                    <MenuItem value="friend">Friend</MenuItem>
                    <MenuItem value="family">Family</MenuItem>
                    <MenuItem value="colleague">Colleague</MenuItem>
                    <MenuItem value="neighbor">Neighbor</MenuItem>
                    <MenuItem value="acquaintance">Acquaintance</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                  {formik.touched.relationship_to_referrer && formik.errors.relationship_to_referrer && (
                    <FormHelperText>{formik.errors.relationship_to_referrer}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="relationship-strength-label">Relationship Strength</InputLabel>
                  <Select
                    labelId="relationship-strength-label"
                    id="relationship_strength"
                    name="relationship_strength"
                    value={formik.values.relationship_strength}
                    onChange={formik.handleChange}
                    label="Relationship Strength"
                  >
                    <MenuItem value="strong">Strong</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="weak">Weak</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="permission-level-label">Permission Level</InputLabel>
                  <Select
                    labelId="permission-level-label"
                    id="permission_level"
                    name="permission_level"
                    value={formik.values.permission_level}
                    onChange={formik.handleChange}
                    label="Permission Level"
                  >
                    <MenuItem value="explicit">Explicit (Direct Permission)</MenuItem>
                    <MenuItem value="implied">Implied (Might Be Interested)</MenuItem>
                    <MenuItem value="cold">Cold (No Prior Discussion)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="referral-channel-label">Referral Channel</InputLabel>
                  <Select
                    labelId="referral-channel-label"
                    id="referral_channel"
                    name="referral_channel"
                    value={formik.values.referral_channel}
                    onChange={formik.handleChange}
                    label="Referral Channel"
                  >
                    <MenuItem value="app">App Referral</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="in-person">In Person</MenuItem>
                    <MenuItem value="phone">Phone</MenuItem>
                    <MenuItem value="social">Social Media</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="goals"
                  name="goals"
                  label="Goals and Interests"
                  multiline
                  rows={3}
                  value={formik.values.goals}
                  onChange={formik.handleChange}
                />
              </Grid>
            </Grid>
          )}
          
          {/* Step 3: Scheduling Preferences (persons table custom fields) */}
          {activeStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="preferred_contact_times"
                  name="preferred_contact_times"
                  label="Preferred Contact Times"
                  placeholder="e.g., Weekday evenings, Weekend mornings"
                  value={formik.values.preferred_contact_times}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="special_requirements"
                  name="special_requirements"
                  label="Special Requirements or Accommodations"
                  multiline
                  rows={2}
                  value={formik.values.special_requirements}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="notes"
                  name="notes"
                  label="Additional Notes"
                  multiline
                  rows={3}
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                />
              </Grid>
            </Grid>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button
          onClick={activeStep === 0 ? handleClose : handleBack}
          variant="outlined"
        >
          {activeStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          onClick={activeStep === steps.length - 1 ? formik.handleSubmit : handleNext}
        >
          {activeStep === steps.length - 1 ? 'Submit Referral' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReferralForm; 