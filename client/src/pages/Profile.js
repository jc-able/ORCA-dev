import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Switch,
  FormControlLabel,
  FormGroup,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Save as SaveIcon,
  Upload as UploadIcon
} from '@mui/icons-material';

/**
 * Profile page component
 * Handles user profile settings and preferences
 */
function Profile() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Sample user data - would come from Auth context in a real implementation
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    jobTitle: 'Sales Representative',
    company: 'Fitness Club XYZ',
    bio: 'Experienced sales professional specializing in gym memberships and fitness services.',
    
    // Notification settings
    emailNotifications: {
      newLeads: true,
      newReferrals: true,
      appointments: true,
      messages: false
    },
    
    smsNotifications: {
      newLeads: false,
      newReferrals: true,
      appointments: true,
      messages: false
    }
  });
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle notification toggle
  const handleNotificationToggle = (type, setting) => {
    setProfileData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [setting]: !prev[type][setting]
      }
    }));
  };
  
  // Save profile changes
  const handleSaveProfile = async () => {
    setLoading(true);
    setSuccess(false);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, py: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="medium">
        Profile Settings
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<PersonIcon />} label="Personal Info" />
          <Tab icon={<SecurityIcon />} label="Security" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
        </Tabs>
      </Paper>
      
      {/* Personal Info Tab */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Avatar
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                src=""
                alt={`${profileData.firstName} ${profileData.lastName}`}
              >
                {profileData.firstName.charAt(0)}
              </Avatar>
              <Typography variant="h6" gutterBottom>
                {profileData.firstName} {profileData.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {profileData.jobTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profileData.company}
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                sx={{ mt: 2 }}
              >
                Upload Photo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                />
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Job Title"
                    name="jobTitle"
                    value={profileData.jobTitle}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company"
                    name="company"
                    value={profileData.company}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    multiline
                    rows={4}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      onClick={handleSaveProfile}
                      disabled={loading}
                      color={success ? 'success' : 'primary'}
                    >
                      {loading ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {/* Security Tab */}
      {tab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Security Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                name="currentPassword"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              {/* Spacer */}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                name="newPassword"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                name="confirmPassword"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => console.log('Change password')}
                >
                  Update Password
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Two-Factor Authentication
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  SMS Authentication
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Receive a verification code via SMS when logging in from a new device.
                </Typography>
                <FormControlLabel
                  control={<Switch color="primary" />}
                  label="Enable SMS Authentication"
                />
              </CardContent>
            </Card>
            
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  App Authentication
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Use an authenticator app like Google Authenticator to generate verification codes.
                </Typography>
                <FormControlLabel
                  control={<Switch color="primary" />}
                  label="Enable App Authentication"
                />
              </CardContent>
            </Card>
          </Box>
        </Paper>
      )}
      
      {/* Notifications Tab */}
      {tab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Notification Preferences
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Email Notifications
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={<Switch 
                    checked={profileData.emailNotifications.newLeads}
                    onChange={() => handleNotificationToggle('emailNotifications', 'newLeads')}
                    color="primary"
                  />}
                  label="New Leads"
                />
                <FormControlLabel
                  control={<Switch 
                    checked={profileData.emailNotifications.newReferrals}
                    onChange={() => handleNotificationToggle('emailNotifications', 'newReferrals')}
                    color="primary"
                  />}
                  label="New Referrals"
                />
                <FormControlLabel
                  control={<Switch 
                    checked={profileData.emailNotifications.appointments}
                    onChange={() => handleNotificationToggle('emailNotifications', 'appointments')}
                    color="primary"
                  />}
                  label="Appointment Reminders"
                />
                <FormControlLabel
                  control={<Switch 
                    checked={profileData.emailNotifications.messages}
                    onChange={() => handleNotificationToggle('emailNotifications', 'messages')}
                    color="primary"
                  />}
                  label="New Messages"
                />
              </FormGroup>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                SMS Notifications
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={<Switch 
                    checked={profileData.smsNotifications.newLeads}
                    onChange={() => handleNotificationToggle('smsNotifications', 'newLeads')}
                    color="primary"
                  />}
                  label="New Leads"
                />
                <FormControlLabel
                  control={<Switch 
                    checked={profileData.smsNotifications.newReferrals}
                    onChange={() => handleNotificationToggle('smsNotifications', 'newReferrals')}
                    color="primary"
                  />}
                  label="New Referrals"
                />
                <FormControlLabel
                  control={<Switch 
                    checked={profileData.smsNotifications.appointments}
                    onChange={() => handleNotificationToggle('smsNotifications', 'appointments')}
                    color="primary"
                  />}
                  label="Appointment Reminders"
                />
                <FormControlLabel
                  control={<Switch 
                    checked={profileData.smsNotifications.messages}
                    onChange={() => handleNotificationToggle('smsNotifications', 'messages')}
                    color="primary"
                  />}
                  label="New Messages"
                />
              </FormGroup>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                >
                  Save Preferences
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}

export default Profile; 