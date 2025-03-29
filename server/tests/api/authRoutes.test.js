/**
 * Auth Routes API Tests
 */
const { request, createTestApp, uuidv4 } = require('./setup');
const authRoutes = require('../../routes/authRoutes');
const authController = require('../../controllers/authController');
const jwt = require('jsonwebtoken');

// Mock the auth controller
jest.mock('../../controllers/authController');

// Mock JWT
jest.mock('jsonwebtoken');

describe('Auth Routes API', () => {
  let app;
  
  beforeEach(() => {
    app = createTestApp(authRoutes);
    jest.clearAllMocks();
  });
  
  describe('POST /auth/login', () => {
    it('should login a user successfully', async () => {
      // Mock data
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockUser = {
        id: uuidv4(),
        email: loginData.email,
        role: 'salesperson'
      };
      
      const mockToken = 'fake.jwt.token';
      
      // Setup mock implementations
      authController.loginUser.mockResolvedValue({ user: mockUser, token: mockToken });
      
      // Make the request
      const response = await request(app)
        .post('/auth/login')
        .send(loginData);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: mockUser, token: mockToken });
      expect(authController.loginUser).toHaveBeenCalledWith(loginData.email, loginData.password);
    });
    
    it('should handle invalid credentials', async () => {
      // Mock data
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      // Setup mock implementations
      authController.loginUser.mockRejectedValue(new Error('Invalid credentials'));
      
      // Make the request
      const response = await request(app)
        .post('/auth/login')
        .send(loginData);
      
      // Assertions
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle missing fields', async () => {
      // Mock data with missing password
      const loginData = {
        email: 'test@example.com'
      };
      
      // Make the request
      const response = await request(app)
        .post('/auth/login')
        .send(loginData);
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(authController.loginUser).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock data
      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User',
        phone: '(123) 456-7890'
      };
      
      const mockUser = {
        id: uuidv4(),
        email: registerData.email,
        first_name: registerData.first_name,
        last_name: registerData.last_name,
        phone: registerData.phone,
        role: 'salesperson',
        created_at: new Date().toISOString()
      };
      
      const mockToken = 'fake.jwt.token';
      
      // Setup mock implementations
      authController.registerUser.mockResolvedValue({ user: mockUser, token: mockToken });
      
      // Make the request
      const response = await request(app)
        .post('/auth/register')
        .send(registerData);
      
      // Assertions
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ user: mockUser, token: mockToken });
      expect(authController.registerUser).toHaveBeenCalledWith({
        email: registerData.email,
        password: registerData.password,
        first_name: registerData.first_name,
        last_name: registerData.last_name,
        phone: registerData.phone
      });
    });
    
    it('should handle email already in use', async () => {
      // Mock data
      const registerData = {
        email: 'existing@example.com',
        password: 'password123',
        first_name: 'Existing',
        last_name: 'User'
      };
      
      // Setup mock implementations
      authController.registerUser.mockRejectedValue(new Error('Email already in use'));
      
      // Make the request
      const response = await request(app)
        .post('/auth/register')
        .send(registerData);
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle missing required fields', async () => {
      // Mock data with missing fields
      const registerData = {
        email: 'invalid@example.com',
        // Missing password, first_name, and last_name
      };
      
      // Make the request
      const response = await request(app)
        .post('/auth/register')
        .send(registerData);
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(authController.registerUser).not.toHaveBeenCalled();
    });
  });
}); 