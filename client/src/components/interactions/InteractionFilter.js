import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

/**
 * InteractionFilter Component
 * Filter panel for interactions
 * 
 * @param {Object} props - Component props
 * @param {Object} props.initialFilters - Initial filter values
 * @param {Function} props.onApplyFilters - Function called when filters are applied
 * @param {Function} props.onCancel - Function called when cancel is clicked
 * @returns {JSX.Element} Interaction filter component
 */
const InteractionFilter = ({ 
  initialFilters = {}, 
  onApplyFilters, 
  onCancel 
}) => {
  const [filters, setFilters] = useState({
    type: initialFilters.type || '',
    status: initialFilters.status || '',
    startDate: initialFilters.startDate || null,
    endDate: initialFilters.endDate || null
  });
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle date picker changes
  const handleDateChange = (date, fieldName) => {
    setFilters(prev => ({
      ...prev,
      [fieldName]: date
    }));
  };
  
  // Handle form reset
  const handleReset = () => {
    setFilters({
      type: '',
      status: '',
      startDate: null,
      endDate: null
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Remove empty values
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '' && value !== null)
    );
    
    if (onApplyFilters) {
      onApplyFilters(cleanedFilters);
    }
  };
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={0} sx={{ p: 0 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            {/* Interaction Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="type-label">Interaction Type</InputLabel>
                <Select
                  labelId="type-label"
                  id="type"
                  name="type"
                  value={filters.type}
                  onChange={handleChange}
                  label="Interaction Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="call">Call</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="sms">SMS</MenuItem>
                  <MenuItem value="meeting">Meeting</MenuItem>
                  <MenuItem value="note">Note</MenuItem>
                  <MenuItem value="visit">Visit</MenuItem>
                  <MenuItem value="form">Form</MenuItem>
                  <MenuItem value="payment">Payment</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Status */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Date Range */}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="From Date"
                value={filters.startDate}
                onChange={(date) => handleDateChange(date, 'startDate')}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="To Date"
                value={filters.endDate}
                onChange={(date) => handleDateChange(date, 'endDate')}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
                minDate={filters.startDate}
              />
            </Grid>
            
            {/* Buttons */}
            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="button"
                onClick={onCancel}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleReset}
                sx={{ mr: 1 }}
              >
                Reset
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
              >
                Apply Filters
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default InteractionFilter; 