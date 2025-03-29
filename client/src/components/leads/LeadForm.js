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
  Chip,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { Close as CloseIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { SchemaConstraints } from '../../types/schema';

/**
 * LeadForm component
 * Form for creating or editing a lead using the unified Person model with lead_extensions
 * Handles both new lead creation and editing existing leads
 * 
 * Database mapping:
 * - Basic information fields map to the persons table
 * - Lead status and qualification data map to the lead_extensions table
 */
const LeadForm = ({ isOpen, onClose, onSubmit, initialData = {}, isEditing = false }) => {
  // Phone validation regex - accepts formats like (123) 456-7890, 123-456-7890, etc.
  const phoneRegExp = /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
  
  // Fix the email regex to be more flexible
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  
  // Extract lead extension data or use defaults
  const leadExtension = initialData.lead_extensions && initialData.lead_extensions.length > 0
    ? initialData.lead_extensions[0]
    : {};
  
  // Set up form state directly with React useState
  const [formState, setFormState] = useState({
    // Person table fields
    first_name: initialData.first_name || '',
    last_name: initialData.last_name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    secondary_phone: initialData.secondary_phone || '',
    address: initialData.address || {},
    dob: initialData.dob || '',
    gender: initialData.gender || '',
    interest_level: initialData.interest_level || 'Medium',
    preferred_contact_method: initialData.preferred_contact_method || 'Email',
    preferred_membership: initialData.preferred_membership || '',
    goals: initialData.goals || '',
    budget_range: initialData.budget_range || '',
    acquisition_source: initialData.acquisition_source || '',
    tags: initialData.tags || [],
    notes: initialData.notes || '',
    
    // Lead extension table fields
    lead_status: leadExtension.lead_status || 'new',
    decision_authority: leadExtension.decision_authority || '',
    decision_timeline: leadExtension.decision_timeline || '',
    previous_experience: leadExtension.previous_experience || '',
    pain_points: leadExtension.pain_points || [],
    motivations: leadExtension.motivations || [],
    readiness_score: leadExtension.readiness_score || 5,
    lead_temperature: leadExtension.lead_temperature || 'warm',
    conversion_probability: leadExtension.conversion_probability || 50,
    estimated_value: leadExtension.estimated_value || '',
    conversion_blockers: leadExtension.conversion_blockers || [],
    visit_completed: leadExtension.visit_completed || false,
    trial_status: leadExtension.trial_status || '',
  });
  
  // Form errors state
  const [errors, setErrors] = useState({});
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent unnecessary state updates - stop immediately if value hasn't changed
    if (formState[name] === value) return;
    
    // Only log if not in production
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Field ${name} changed to: ${value}`);
    }
    
    // Validate readiness_score and conversion_probability against schema constraints
    if (name === 'readiness_score') {
      const numValue = Number(value);
      if (numValue < SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MIN || 
          numValue > SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MAX) {
        setErrors(prevErrors => ({
          ...prevErrors,
          readiness_score: `Value must be between ${SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MIN} and ${SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MAX}`
        }));
      } else {
        setErrors(prevErrors => ({
          ...prevErrors,
          readiness_score: undefined
        }));
      }
    }
    
    if (name === 'conversion_probability') {
      const numValue = Number(value);
      if (numValue < SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MIN || 
          numValue > SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MAX) {
        setErrors(prevErrors => ({
          ...prevErrors,
          conversion_probability: `Value must be between ${SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MIN} and ${SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MAX}`
        }));
      } else {
        setErrors(prevErrors => ({
          ...prevErrors,
          conversion_probability: undefined
        }));
      }
    }
    
    // Use a callback form of setState to ensure we're working with the most recent state
    setFormState(prevState => {
      const newState = {
        ...prevState,
        [name]: value
      };
      
      // If this is a field that affects other values, update those too
      if (name === 'interest_level') {
        // Update readiness_score and lead_temperature based on interest_level
        if (value === 'High') {
          newState.readiness_score = 8;
          newState.lead_temperature = 'hot';
        } else if (value === 'Medium') {
          newState.readiness_score = 5;
          newState.lead_temperature = 'warm';
        } else {
          newState.readiness_score = 3;
          newState.lead_temperature = 'cold';
        }
      }
      
      return newState;
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: undefined
      }));
    }
    
    // Validate after a short delay to avoid excess validation calls
    if (['first_name', 'last_name', 'email', 'phone'].includes(name)) {
      setTimeout(() => validateField(name, value), 100);
    }
  };
  
  // Add field-specific validation
  const validateField = (name, value) => {
    let error = null;
    
    switch (name) {
      case 'first_name':
        error = !value.trim() ? 'First name is required' : null;
        break;
      case 'last_name':
        error = !value.trim() ? 'Last name is required' : null;
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!emailRegex.test(value.trim())) {
          error = 'Invalid email address';
        }
        break;
      case 'phone':
        if (!value.trim()) {
          error = 'Phone number is required';
        } else if (!phoneRegExp.test(value.trim())) {
          error = 'Invalid phone number format';
        }
        break;
      case 'readiness_score':
        const readinessScore = Number(value);
        if (isNaN(readinessScore)) {
          error = 'Readiness score must be a number';
        } else if (readinessScore < SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MIN || 
                  readinessScore > SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MAX) {
          error = `Readiness score must be between ${SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MIN} and ${SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MAX}`;
        }
        break;
      case 'conversion_probability':
        const convProb = Number(value);
        if (isNaN(convProb)) {
          error = 'Conversion probability must be a number';
        } else if (convProb < SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MIN || 
                  convProb > SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MAX) {
          error = `Conversion probability must be between ${SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MIN} and ${SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MAX}`;
        }
        break;
      default:
        break;
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Validate the form - only validates required fields
  const validateForm = () => {
    const newErrors = {};
    
    // Required field validation
    if (!formState.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formState.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formState.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formState.email.trim())) {
      newErrors.email = 'Invalid email address';
    }
    
    if (!formState.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegExp.test(formState.phone.trim())) {
      newErrors.phone = 'Invalid phone number format';
    }
    
    // Validate lead extension fields against schema constraints
    const readinessScore = Number(formState.readiness_score);
    if (isNaN(readinessScore) || 
        readinessScore < SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MIN || 
        readinessScore > SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MAX) {
      newErrors.readiness_score = `Readiness score must be between ${SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MIN} and ${SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MAX}`;
    }
    
    const convProb = Number(formState.conversion_probability);
    if (isNaN(convProb) || 
        convProb < SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MIN || 
        convProb > SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MAX) {
      newErrors.conversion_probability = `Conversion probability must be between ${SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MIN} and ${SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MAX}`;
    }
    
    // Set errors state
    setErrors(newErrors);
    return newErrors;
  };
  
  // Check if form has critical errors (missing required fields)
  const hasRequiredFieldErrors = () => {
    // Check for empty required fields
    if (!formState.first_name.trim() || !formState.last_name.trim() || 
        !formState.email.trim() || !formState.phone.trim()) {
      return true;
    }
    
    // Check email format only if there's an email
    if (formState.email.trim() && 
        !emailRegex.test(formState.email.trim())) {
      return true;
    }
    
    // Check phone format only if there's a phone
    if (formState.phone.trim() && !phoneRegExp.test(formState.phone.trim())) {
      return true;
    }
    
    // Check readiness_score and conversion_probability
    const readinessScore = Number(formState.readiness_score);
    if (isNaN(readinessScore) || 
        readinessScore < SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MIN || 
        readinessScore > SchemaConstraints.LEAD_EXTENSION.READINESS_SCORE_MAX) {
      return true;
    }
    
    const convProb = Number(formState.conversion_probability);
    if (isNaN(convProb) || 
        convProb < SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MIN || 
        convProb > SchemaConstraints.LEAD_EXTENSION.CONVERSION_PROBABILITY_MAX) {
      return true;
    }
    
    // All validations passed
    return false;
  };
  
  // Validate on mount and when form is displayed
  useEffect(() => {
    if (isOpen) {
      // Only run validation if there are actual values to validate
      if (formState.first_name || formState.last_name || formState.email || formState.phone) {
        validateForm();
      }
    }
  }, [isOpen]);

  // Add a helper function to check if form is valid
  const isFormValid = () => {
    // Quick check for required fields before running full validation
    if (hasRequiredFieldErrors()) {
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted with values:', formState);
    
    // Make sure form is valid before submitting
    if (!hasRequiredFieldErrors()) {
      // Transform form state into expected API format
      const personData = {
        first_name: formState.first_name,
        last_name: formState.last_name,
        email: formState.email,
        phone: formState.phone,
        secondary_phone: formState.secondary_phone,
        gender: formState.gender,
        interest_level: formState.interest_level,
        preferred_contact_method: formState.preferred_contact_method,
        preferred_membership: formState.preferred_membership,
        goals: formState.goals,
        budget_range: formState.budget_range,
        acquisition_source: formState.acquisition_source,
        tags: formState.tags,
        notes: formState.notes,
        is_lead: true
      };
      
      // Address is a special case - needs to be properly formatted as JSON
      if (formState.address && typeof formState.address === 'object') {
        personData.address = formState.address;
      }
      
      // Extract lead extension data
      const leadExtensionData = {
        lead_status: formState.lead_status,
        decision_authority: formState.decision_authority,
        decision_timeline: formState.decision_timeline,
        previous_experience: formState.previous_experience,
        pain_points: formState.pain_points,
        motivations: formState.motivations,
        readiness_score: parseInt(formState.readiness_score, 10),
        lead_temperature: formState.lead_temperature,
        conversion_probability: parseInt(formState.conversion_probability, 10),
        estimated_value: formState.estimated_value ? parseFloat(formState.estimated_value) : null,
        conversion_blockers: formState.conversion_blockers,
        visit_completed: formState.visit_completed,
        trial_status: formState.trial_status
      };
      
      // Only include defined values to avoid sending empty strings
      Object.keys(personData).forEach(key => {
        if (personData[key] === '' || personData[key] === null) {
          delete personData[key];
        }
      });
      
      Object.keys(leadExtensionData).forEach(key => {
        if (leadExtensionData[key] === '' || leadExtensionData[key] === null) {
          delete leadExtensionData[key];
        }
      });
      
      // Call the parent's onSubmit with the formatted data
      onSubmit({
        ...personData,
        lead_extensions: [leadExtensionData]
      });
      
      // Close the form
      onClose();
    } else {
      // Form has errors
      validateForm();
    }
  };
  
  // Reset form when initialData changes
  useEffect(() => {
    // Only reset the form when it initially opens or when editing a different lead
    // This prevents resetting during typing
    if (isOpen && !document.activeElement?.closest('#lead-form')) {
      // Extract lead extension data or use defaults
      const leadExt = initialData.lead_extensions && initialData.lead_extensions.length > 0
        ? initialData.lead_extensions[0]
        : {};
        
      setFormState({
        // Person table fields
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        secondary_phone: initialData.secondary_phone || '',
        address: initialData.address || {},
        dob: initialData.dob || '',
        gender: initialData.gender || '',
        interest_level: initialData.interest_level || 'Medium',
        preferred_contact_method: initialData.preferred_contact_method || 'Email',
        preferred_membership: initialData.preferred_membership || '',
        goals: initialData.goals || '',
        budget_range: initialData.budget_range || '',
        acquisition_source: initialData.acquisition_source || '',
        tags: initialData.tags || [],
        notes: initialData.notes || '',
        
        // Lead extension table fields
        lead_status: leadExt.lead_status || 'new',
        decision_authority: leadExt.decision_authority || '',
        decision_timeline: leadExt.decision_timeline || '',
        previous_experience: leadExt.previous_experience || '',
        pain_points: leadExt.pain_points || [],
        motivations: leadExt.motivations || [],
        readiness_score: leadExt.readiness_score || 5,
        lead_temperature: leadExt.lead_temperature || 'warm',
        conversion_probability: leadExt.conversion_probability || 50,
        estimated_value: leadExt.estimated_value || '',
        conversion_blockers: leadExt.conversion_blockers || [],
        visit_completed: leadExt.visit_completed || false,
        trial_status: leadExt.trial_status || '',
      });
    }
  }, [initialData, isOpen]);
  
  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown={false}
      disableBackdropClick={false}
      PaperProps={{
        sx: {
          borderRadius: 1,
          backgroundColor: 'background.paper'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{isEditing ? 'Edit Lead' : 'Add New Lead'}</Typography>
          <IconButton onClick={onClose} size="small" aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box 
          component="form" 
          id="lead-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}
          action="#"
          autoComplete="off"
          noValidate
          sx={{ 
            '& .MuiTextField-root': { my: 1 },
            '& .error': { color: 'error.main' }
          }}
        >
          {/* Form debug state - only visible in development */}
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mb: 2, p: 1, border: '1px dashed rgba(0,0,0,0.2)', fontSize: '0.8rem', display: 'none' }}>
              <pre>Form state: {JSON.stringify(formState, null, 2)}</pre>
            </Box>
          )}
          
          {/* Basic Information Section (persons table) */}
          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
            Basic Information
          </Typography>
          
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="first_name"
                name="first_name"
                label="First Name"
                value={formState.first_name}
                onChange={handleInputChange}
                error={errors.first_name}
                helperText={errors.first_name}
                inputProps={{ autoComplete: 'off' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="last_name"
                name="last_name"
                label="Last Name"
                value={formState.last_name}
                onChange={handleInputChange}
                error={errors.last_name}
                helperText={errors.last_name}
                inputProps={{ autoComplete: 'off' }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                type="email"
                value={formState.email}
                onChange={handleInputChange}
                error={errors.email}
                helperText={errors.email}
                inputProps={{ autoComplete: 'off' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="phone"
                name="phone"
                label="Phone"
                value={formState.phone}
                onChange={handleInputChange}
                error={errors.phone}
                helperText={errors.phone}
                inputProps={{ autoComplete: 'off' }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="secondary_phone"
                name="secondary_phone"
                label="Secondary Phone (optional)"
                value={formState.secondary_phone}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="dob"
                name="dob"
                label="Date of Birth"
                type="date"
                value={formState.dob}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  labelId="gender-label"
                  id="gender"
                  name="gender"
                  value={formState.gender}
                  onChange={handleInputChange}
                  label="Gender"
                >
                  <MenuItem value="">Not specified</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="preferred-contact-label">Preferred Contact Method</InputLabel>
                <Select
                  labelId="preferred-contact-label"
                  id="preferred_contact_method"
                  name="preferred_contact_method"
                  value={formState.preferred_contact_method}
                  onChange={handleInputChange}
                  label="Preferred Contact Method"
                >
                  <MenuItem value="Email">Email</MenuItem>
                  <MenuItem value="Phone">Phone</MenuItem>
                  <MenuItem value="SMS">SMS</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {/* Lead Status Section (lead_extensions table) */}
          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
            Lead Status and Qualification
          </Typography>
          
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="lead-status-label">Lead Status</InputLabel>
                <Select
                  labelId="lead-status-label"
                  id="lead_status"
                  name="lead_status"
                  value={formState.lead_status}
                  onChange={handleInputChange}
                  error={errors.lead_status}
                  label="Lead Status"
                >
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="contacted">Contacted</MenuItem>
                  <MenuItem value="appointment_scheduled">Appointment Scheduled</MenuItem>
                  <MenuItem value="appointment_completed">Appointment Completed</MenuItem>
                  <MenuItem value="proposal_made">Proposal Made</MenuItem>
                  <MenuItem value="negotiation">Negotiation</MenuItem>
                  <MenuItem value="won">Won</MenuItem>
                  <MenuItem value="lost">Lost</MenuItem>
                </Select>
                {errors.lead_status && (
                  <FormHelperText error>{errors.lead_status}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="interest-level-label">Interest Level</InputLabel>
                <Select
                  labelId="interest-level-label"
                  id="interest_level"
                  name="interest_level"
                  value={formState.interest_level}
                  onChange={handleInputChange}
                  error={errors.interest_level}
                  label="Interest Level"
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Very High">Very High</MenuItem>
                </Select>
                {errors.interest_level && (
                  <FormHelperText error>{errors.interest_level}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="lead-temperature-label">Lead Temperature</InputLabel>
                <Select
                  labelId="lead-temperature-label"
                  id="lead_temperature"
                  name="lead_temperature"
                  value={formState.lead_temperature}
                  onChange={handleInputChange}
                  label="Lead Temperature"
                >
                  <MenuItem value="cold">Cold</MenuItem>
                  <MenuItem value="warm">Warm</MenuItem>
                  <MenuItem value="hot">Hot</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="decision_timeline"
                name="decision_timeline"
                label="Decision Timeline"
                value={formState.decision_timeline}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="readiness_score"
                name="readiness_score"
                label="Readiness Score (1-10)"
                type="number"
                InputProps={{ inputProps: { min: 1, max: 10 } }}
                value={formState.readiness_score}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="conversion_probability"
                name="conversion_probability"
                label="Conversion Probability (%)"
                type="number"
                InputProps={{ inputProps: { min: 0, max: 100 } }}
                value={formState.conversion_probability}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
          
          {/* Additional Information (collapsible sections) */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight="medium">
                Membership & Financial Information
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="preferred-membership-label">Preferred Membership</InputLabel>
                    <Select
                      labelId="preferred-membership-label"
                      id="preferred_membership"
                      name="preferred_membership"
                      value={formState.preferred_membership}
                      onChange={handleInputChange}
                      label="Preferred Membership"
                    >
                      <MenuItem value="">Not specified</MenuItem>
                      <MenuItem value="Basic">Basic</MenuItem>
                      <MenuItem value="Standard">Standard</MenuItem>
                      <MenuItem value="Premium">Premium</MenuItem>
                      <MenuItem value="Family">Family</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="budget-range-label">Budget Range</InputLabel>
                    <Select
                      labelId="budget-range-label"
                      id="budget_range"
                      name="budget_range"
                      value={formState.budget_range}
                      onChange={handleInputChange}
                      label="Budget Range"
                    >
                      <MenuItem value="">Not specified</MenuItem>
                      <MenuItem value="Under $25/month">Under $25/month</MenuItem>
                      <MenuItem value="$25-$50/month">$25-$50/month</MenuItem>
                      <MenuItem value="$50-$100/month">$50-$100/month</MenuItem>
                      <MenuItem value="$100+/month">$100+/month</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="estimated_value"
                    name="estimated_value"
                    label="Estimated Value ($)"
                    type="number"
                    value={formState.estimated_value}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight="medium">
                Trial & Visit Information
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="trial-status-label">Trial Status</InputLabel>
                    <Select
                      labelId="trial-status-label"
                      id="trial_status"
                      name="trial_status"
                      value={formState.trial_status}
                      onChange={handleInputChange}
                      label="Trial Status"
                    >
                      <MenuItem value="">None</MenuItem>
                      <MenuItem value="not_started">Not Started</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="expired">Expired</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="visit-completed-label">Visit Completed</InputLabel>
                    <Select
                      labelId="visit-completed-label"
                      id="visit_completed"
                      name="visit_completed"
                      value={formState.visit_completed}
                      onChange={handleInputChange}
                      label="Visit Completed"
                    >
                      <MenuItem value={true}>Yes</MenuItem>
                      <MenuItem value={false}>No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight="medium">
                Source & Notes
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="acquisition-source-label">Lead Source</InputLabel>
                    <Select
                      labelId="acquisition-source-label"
                      id="acquisition_source"
                      name="acquisition_source"
                      value={formState.acquisition_source}
                      onChange={handleInputChange}
                      label="Lead Source"
                    >
                      <MenuItem value="">Not specified</MenuItem>
                      <MenuItem value="Website">Website</MenuItem>
                      <MenuItem value="Social Media">Social Media</MenuItem>
                      <MenuItem value="Direct Referral">Direct Referral</MenuItem>
                      <MenuItem value="Email Campaign">Email Campaign</MenuItem>
                      <MenuItem value="Walk-in">Walk-in</MenuItem>
                      <MenuItem value="Phone Inquiry">Phone Inquiry</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="goals"
                    name="goals"
                    label="Goals"
                    multiline
                    rows={2}
                    value={formState.goals}
                    onChange={handleInputChange}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="notes"
                    name="notes"
                    label="Notes"
                    multiline
                    rows={3}
                    value={formState.notes}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          type="submit"
          form="lead-form"
          // The button should be enabled as long as required fields are filled
          disabled={
            !formState.first_name.trim() || 
            !formState.last_name.trim() || 
            !formState.email.trim() || 
            !formState.phone.trim() ||
            (formState.email.trim() && !emailRegex.test(formState.email.trim())) ||
            (formState.phone.trim() && !phoneRegExp.test(formState.phone.trim()))
          }
        >
          {isEditing ? 'Update Lead' : 'Create Lead'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeadForm; 