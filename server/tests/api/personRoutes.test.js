/**
 * Person Routes API Tests
 */
const { request, createTestApp, getTestHeaders, uuidv4 } = require('./setup');
const personRoutes = require('../../routes/personRoutes');
const personModel = require('../../models/personModel');
const { generatePerson } = require('../../utils/testDataGenerator');

// Mock the person model
jest.mock('../../models/personModel');

describe('Person Routes API', () => {
  let app;
  
  beforeEach(() => {
    app = createTestApp(personRoutes);
    jest.clearAllMocks();
  });
  
  describe('GET /persons', () => {
    it('should return a list of persons', async () => {
      // Mock data
      const mockPersons = [
        generatePerson(),
        generatePerson()
      ];
      
      // Setup mock implementation
      personModel.getAllPersons.mockResolvedValue(mockPersons);
      
      // Make the request
      const response = await request(app)
        .get('/persons')
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ persons: mockPersons });
      expect(personModel.getAllPersons).toHaveBeenCalled();
    });
    
    it('should handle filtering parameters', async () => {
      // Mock data
      const mockPersons = [
        generatePerson({ is_lead: true }),
        generatePerson({ is_lead: true })
      ];
      
      // Setup mock implementation
      personModel.getAllPersons.mockResolvedValue(mockPersons);
      
      // Make the request with filters
      const response = await request(app)
        .get('/persons')
        .query({ 
          isLead: 'true',
          search: 'Smith'
        })
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ persons: mockPersons });
      expect(personModel.getAllPersons).toHaveBeenCalledWith(
        expect.objectContaining({
          isLead: true,
          searchTerm: 'Smith'
        })
      );
    });
    
    it('should handle errors', async () => {
      // Setup mock implementation
      personModel.getAllPersons.mockRejectedValue(new Error('Database error'));
      
      // Make the request
      const response = await request(app)
        .get('/persons')
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('GET /persons/:id', () => {
    it('should return a single person by ID', async () => {
      // Mock data
      const personId = uuidv4();
      const mockPerson = generatePerson({ id: personId });
      
      // Setup mock implementation
      personModel.getPersonById.mockResolvedValue(mockPerson);
      
      // Make the request
      const response = await request(app)
        .get(`/persons/${personId}`)
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ person: mockPerson });
      expect(personModel.getPersonById).toHaveBeenCalledWith(personId);
    });
    
    it('should handle not found errors', async () => {
      // Setup mock implementation
      personModel.getPersonById.mockRejectedValue(new Error('Person not found'));
      
      // Make the request
      const response = await request(app)
        .get(`/persons/${uuidv4()}`)
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /persons', () => {
    it('should create a new person', async () => {
      // Mock data
      const personData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '(123) 456-7890',
        is_lead: true
      };
      
      const createdPerson = {
        id: uuidv4(),
        ...personData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Setup mock implementation
      personModel.createPerson.mockResolvedValue(createdPerson);
      
      // Make the request
      const response = await request(app)
        .post('/persons')
        .send(personData)
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ person: createdPerson });
      expect(personModel.createPerson).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: personData.first_name,
          last_name: personData.last_name,
          assigned_to: expect.any(String) // From the test headers
        })
      );
    });
    
    it('should handle validation errors', async () => {
      // Mock data with missing required fields
      const invalidPersonData = {
        email: 'john.doe@example.com'
        // Missing first_name and last_name
      };
      
      // Setup mock implementation
      personModel.createPerson.mockRejectedValue(new Error('first_name and last_name are required'));
      
      // Make the request
      const response = await request(app)
        .post('/persons')
        .send(invalidPersonData)
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('PUT /persons/:id', () => {
    it('should update a person', async () => {
      // Mock data
      const personId = uuidv4();
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
        email: 'updated.email@example.com'
      };
      
      const updatedPerson = {
        id: personId,
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      // Setup mock implementation
      personModel.updatePerson.mockResolvedValue(updatedPerson);
      
      // Make the request
      const response = await request(app)
        .put(`/persons/${personId}`)
        .send(updateData)
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ person: updatedPerson });
      expect(personModel.updatePerson).toHaveBeenCalledWith(personId, updateData);
    });
    
    it('should handle not found errors', async () => {
      // Setup mock implementation
      personModel.updatePerson.mockRejectedValue(new Error('Person not found'));
      
      // Make the request
      const response = await request(app)
        .put(`/persons/${uuidv4()}`)
        .send({ first_name: 'Test' })
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('DELETE /persons/:id', () => {
    it('should delete a person', async () => {
      // Mock data
      const personId = uuidv4();
      
      // Setup mock implementation
      personModel.deletePerson.mockResolvedValue(true);
      
      // Make the request
      const response = await request(app)
        .delete(`/persons/${personId}`)
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Person deleted successfully' });
      expect(personModel.deletePerson).toHaveBeenCalledWith(personId);
    });
    
    it('should handle not found errors', async () => {
      // Setup mock implementation
      personModel.deletePerson.mockRejectedValue(new Error('Person not found'));
      
      // Make the request
      const response = await request(app)
        .delete(`/persons/${uuidv4()}`)
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('GET /persons/search', () => {
    it('should search for persons', async () => {
      // Mock data
      const searchTerm = 'Smith';
      const mockPersons = [
        generatePerson({ last_name: 'Smith' }),
        generatePerson({ last_name: 'Smithson' })
      ];
      
      // Setup mock implementation
      personModel.searchPersons.mockResolvedValue(mockPersons);
      
      // Make the request
      const response = await request(app)
        .get('/persons/search')
        .query({ q: searchTerm })
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ persons: mockPersons });
      expect(personModel.searchPersons).toHaveBeenCalledWith(searchTerm);
    });
    
    it('should handle empty search term', async () => {
      // Make the request with empty search term
      const response = await request(app)
        .get('/persons/search')
        .query({ q: '' })
        .set(getTestHeaders());
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(personModel.searchPersons).not.toHaveBeenCalled();
    });
  });
}); 