import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

// Create context
const AuthContext = createContext();

/**
 * Custom hook to use the auth context
 * @returns {Object} Authentication context value
 */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * AuthProvider component to wrap the app and provide authentication state
 * Manages user authentication state and provides authentication methods
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Sign in result
   */
  const login = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Register a new user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Sign up result
   */
  const register = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Sign out the current user
   * @returns {Promise} Sign out result
   */
  const logout = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Send a password reset email
   * @param {string} email - User email
   * @returns {Promise} Password reset result
   */
  const resetPassword = async (email) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update the current user's email or password
   * @param {Object} credentials - New credentials
   * @param {string} credentials.email - New email (optional)
   * @param {string} credentials.password - New password (optional)
   * @returns {Promise} Update result
   */
  const updateCredentials = async (credentials) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.updateUser(credentials);
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    // Get the current session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting Supabase session:', error);
          setError(error.message);
        }
        
        // Set the user if there's an active session
        if (session?.user) {
          console.log('Active Supabase session found');
          setCurrentUser(session.user);
        } else {
          console.log('No active Supabase session found');
        }
      } catch (err) {
        console.error('Unexpected error during session retrieval:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth state change: ${event}`);
      if (session?.user) {
        setCurrentUser(session.user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Context value to be provided
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    updateCredentials,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 