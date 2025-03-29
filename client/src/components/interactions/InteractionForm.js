import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  FormHelperText,
  Grid,
  Paper,
  Snackbar,
  Alert
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { SchemaConstraints } from '../../types/interfaces.js';
import { DefaultValues, validateInteraction } from '../../utils/validationUtils';

/**
 * InteractionForm Component
 * Form for creating or editing interactions
 * 
 * @param {Object} props - Component props
 * @param {String} props.personId - Person ID (required)
 * @param {Object} props.initialData - Initial form data for editing
 * @param {Function} props.onSubmit - Function to call on successful submission
 * @param {Function} props.onCancel - Function to call when cancel is clicked
 * @returns {JSX.Element} Interaction form component
 */
const InteractionForm = ({ 
  personId, 
  initialData = {}, 
  onSubmit, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    person_id: personId,
    interaction_type: initialData.interaction_type || 'note',
    subject: initialData.subject || '',
    content: initialData.content || '',
    status: initialData.status || SchemaConstraints.DEFAULT_VALUES.INTERACTION_STATUS, // Use default from SQL schema
    scheduled_at: initialData.scheduled_at ? new Date(initialData.scheduled_at) : null,
    duration_minutes: initialData.duration_minutes || '',
    response_received: initialData.response_received || SchemaConstraints.DEFAULT_VALUES.RESPONSE_RECEIVED, // Use default from SQL schema
    response_content: initialData.response_content || '',
    ...initialData
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'error' });
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Handle date/time picker changes
  const handleDateChange = (date, fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: date
    }));
    
    // Clear validation error when field is edited
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Validate form data
  const validateForm = () => {
    // Use our validation utility from validationUtils.js
    const validationResult = validateInteraction(formData);
    let newErrors = { ...validationResult.errors };
    
    // Additional field-specific validations
    
    // If meeting or call is scheduled in future, require scheduled_at
    if (
      (formData.interaction_type === 'meeting' || formData.interaction_type === 'call') && 
      formData.status === 'scheduled' && 
      !formData.scheduled_at
    ) {
      newErrors.scheduled_at = 'Schedule date/time is required';
    }
    
    // If response received is true, require response content
    if (formData.response_received && !formData.response_content) {
      newErrors.response_content = 'Response content is required when response received is true';
    }
    
    // Duration must be a positive number if provided
    if (
      formData.duration_minutes && 
      (isNaN(Number(formData.duration_minutes)) || Number(formData.duration_minutes) <= 0)
    ) {
      newErrors.duration_minutes = 'Duration must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare data for API
      const apiData = {
        ...formData,
        // Convert duration to number if provided
        duration_minutes: formData.duration_minutes ? Number(formData.duration_minutes) : undefined,
        // Handle date fields
        scheduled_at: formData.scheduled_at ? formData.scheduled_at.toISOString() : undefined,
      };
      
      // Call onSubmit with the prepared data
      await onSubmit(apiData);
      
      setAlert({
        show: true,
        message: 'Interaction saved successfully',
        severity: 'success'
      });
      
      // Clear form after successful submission
      setTimeout(() => {
        setAlert({ show: false, message: '', severity: 'success' });
        onCancel();
      }, 1500);
    } catch (error) {
      console.error('Error saving interaction:', error);
      setAlert({
        show: true,
        message: `Error: ${error.message || 'Failed to save interaction'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper elevation={2} sx={{ p: 3, maxWidth: '100%' }}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6">
              {initialData.id ? 'Edit Interaction' : 'New Interaction'}
            </Typography>
          </Grid>
          
          {/* Interaction type */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.interaction_type}>
              <InputLabel>Interaction Type *</InputLabel>
              <Select
                name="interaction_type"
                value={formData.interaction_type}
                onChange={handleChange}
                required
              >
                <MenuItem value="note">Note</MenuItem>
                <MenuItem value="call">Call</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="meeting">Meeting</MenuItem>
                <MenuItem value="text">Text Message</MenuItem>
                <MenuItem value="task">Task</MenuItem>
              </Select>
              {errors.interaction_type && (
                <FormHelperText>{errors.interaction_type}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          
          {/* Interaction status */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Subject line */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              error={!!errors.subject}
              helperText={errors.subject}
            />
          </Grid>
          
          {/* Content */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Content *"
              name="content"
              value={formData.content}
              onChange={handleChange}
              multiline
              rows={4}
              required
              error={!!errors.content}
              helperText={errors.content}
            />
          </Grid>
          
          {/* Scheduled date/time */}
          {(formData.status === 'scheduled' || formData.status === 'pending') && (
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Scheduled Date/Time"
                  value={formData.scheduled_at}
                  onChange={(date) => handleDateChange(date, 'scheduled_at')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.scheduled_at}
                      helperText={errors.scheduled_at}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
          )}
          
          {/* Duration */}
          {['call', 'meeting'].includes(formData.interaction_type) && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                name="duration_minutes"
                type="number"
                value={formData.duration_minutes}
                onChange={handleChange}
                error={!!errors.duration_minutes}
                helperText={errors.duration_minutes}
                InputProps={{
                  inputProps: { min: 1 }
                }}
              />
            </Grid>
          )}
          
          {/* Response section - only show for completed interactions */}
          {formData.status === 'completed' && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                  Response Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Response Received</InputLabel>
                  <Select
                    name="response_received"
                    value={formData.response_received}
                    onChange={handleChange}
                  >
                    <MenuItem value={true}>Yes</MenuItem>
                    <MenuItem value={false}>No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {formData.response_received && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Response Content"
                    name="response_content"
                    value={formData.response_content}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    error={!!errors.response_content}
                    helperText={errors.response_content}
                  />
                </Grid>
              )}
            </>
          )}
          
          {/* Action buttons */}
          <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              sx={{ mr: 2 }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : initialData.id ? 'Update' : 'Save'}
            </Button>
          </Grid>
        </Grid>
      </form>
      
      {/* Alert for success/error messages */}
      <Snackbar
        open={alert.show}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, show: false })}
      >
        <Alert
          onClose={() => setAlert({ ...alert, show: false })}
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default InteractionForm; 