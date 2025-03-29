/**
 * Member Model Tests
 */
const memberModel = require('../../models/memberModel');
const { generatePerson } = require('../../utils/testDataGenerator');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../../config/supabase');

// Mock Supabase
jest.mock('../../config/supabase', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  match: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis()
}));

// Helper function to generate a member extension
const generateMemberExtension = (personId) => {
  return {
    id: uuidv4(),
    person_id: personId,
    membership_type: ['Basic', 'Premium', 'Family', 'Corporate'][Math.floor(Math.random() * 4)],
    membership_status: ['active', 'inactive', 'suspended', 'cancelled'][Math.floor(Math.random() * 4)],
    join_date: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString(),
    membership_end_date: Math.random() > 0.5 ? new Date(Date.now() + Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString() : null,
    billing_day: Math.floor(Math.random() * 28) + 1,
    check_in_count: Math.floor(Math.random() * 100),
    last_check_in: Math.random() > 0.7 ? new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString() : null,
    attendance_streak: Math.floor(Math.random() * 20),
    classes_attended: Array.from({ length: Math.floor(Math.random() * 5) }, () => ({
      class_name: ['Yoga', 'Spin', 'HIIT', 'Pilates'][Math.floor(Math.random() * 4)],
      date: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      instructor: ['John', 'Jane', 'Mike', 'Sarah'][Math.floor(Math.random() * 4)]
    })),
    lifetime_value: Math.floor(Math.random() * 5000) + 500,
    current_monthly_spend: Math.floor(Math.random() * 200) + 50,
    payment_status: ['current', 'past_due', 'failed'][Math.floor(Math.random() * 3)],
    satisfaction_score: Math.floor(Math.random() * 10) + 1,
    churn_risk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    retention_actions: Math.random() > 0.5 ? Array.from({ length: Math.floor(Math.random() * 2) + 1 }, () => ({
      action: ['Call', 'Email', 'Special Offer'][Math.floor(Math.random() * 3)],
      date: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      result: ['Successful', 'Unsuccessful', 'Pending'][Math.floor(Math.random() * 3)]
    })) : [],
    referral_count: Math.floor(Math.random() * 10),
    successful_referrals: Math.floor(Math.random() * 5),
    referral_rewards_earned: Math.floor(Math.random() * 500),
    created_at: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString(),
    updated_at: new Date().toISOString()
  };
};

describe('Member Model', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    jest.clearAllMocks();
  });
  
  describe('getAllMembers', () => {
    it('should retrieve all members without filters', async () => {
      // Mock data
      const mockMemberPerson = generatePerson({ is_member: true });
      const mockMemberExtension = generateMemberExtension(mockMemberPerson.id);
      const mockMembers = [{
        ...mockMemberPerson,
        member_extensions: mockMemberExtension
      }];
      
      // Setup the mock return value
      supabase.range.mockImplementation(() => ({
        data: mockMembers,
        error: null
      }));
      
      // Call the function
      const result = await memberModel.getAllMembers();
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalledWith('*, member_extensions(*)');
      expect(supabase.match).toHaveBeenCalledWith({ is_member: true });
      expect(supabase.range).toHaveBeenCalledWith(0, 9);
      expect(result).toEqual(mockMembers);
    });
    
    it('should apply filters correctly', async () => {
      // Mock data
      const assignedTo = uuidv4();
      const mockMemberPerson = generatePerson({ is_member: true, assigned_to: assignedTo });
      const mockMemberExtension = generateMemberExtension(mockMemberPerson.id);
      mockMemberExtension.membership_type = 'Premium';
      mockMemberExtension.membership_status = 'active';
      
      const mockMembers = [{
        ...mockMemberPerson,
        member_extensions: mockMemberExtension
      }];
      
      // Setup the mock
      supabase.range.mockImplementation(() => ({
        data: mockMembers,
        error: null
      }));
      
      // Call with filters
      const filters = {
        assignedTo,
        membershipType: 'Premium',
        membershipStatus: 'active',
        searchTerm: 'Smith'
      };
      
      await memberModel.getAllMembers(filters);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalledWith('*, member_extensions(*)');
      expect(supabase.match).toHaveBeenCalledWith({ is_member: true });
      expect(supabase.eq).toHaveBeenCalledWith('assigned_to', assignedTo);
      // Additional assertions for other filters would go here
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.range.mockImplementation(() => ({
        data: null,
        error: new Error('Database error')
      }));
      
      // Call and expect rejection
      await expect(memberModel.getAllMembers()).rejects.toThrow('Database error');
    });
  });
  
  describe('getMemberById', () => {
    it('should retrieve a member by ID', async () => {
      // Mock data
      const mockMemberPerson = generatePerson({ is_member: true });
      const mockMemberExtension = generateMemberExtension(mockMemberPerson.id);
      const mockMember = {
        ...mockMemberPerson,
        member_extensions: mockMemberExtension
      };
      
      // Setup the mock
      supabase.single.mockImplementation(() => ({
        data: mockMember,
        error: null
      }));
      
      // Call the function
      const result = await memberModel.getMemberById(mockMemberPerson.id);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalledWith('*, member_extensions(*)');
      expect(supabase.eq).toHaveBeenCalledWith('id', mockMemberPerson.id);
      expect(supabase.eq).toHaveBeenCalledWith('is_member', true);
      expect(supabase.single).toHaveBeenCalled();
      expect(result).toEqual(mockMember);
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.single.mockImplementation(() => ({
        data: null,
        error: new Error('Member not found')
      }));
      
      // Call and expect rejection
      await expect(memberModel.getMemberById('invalid-id')).rejects.toThrow('Member not found');
    });
  });
  
  describe('createMember', () => {
    it('should create a new member', async () => {
      // Mock data
      const memberData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '(123) 456-7890',
        membership_type: 'Premium',
        join_date: new Date().toISOString(),
        billing_day: 15,
        assigned_to: uuidv4()
      };
      
      const createdPerson = {
        id: uuidv4(),
        first_name: memberData.first_name,
        last_name: memberData.last_name,
        email: memberData.email,
        phone: memberData.phone,
        is_member: true,
        assigned_to: memberData.assigned_to,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const createdMemberExtension = {
        id: uuidv4(),
        person_id: createdPerson.id,
        membership_type: memberData.membership_type,
        membership_status: 'active',
        join_date: memberData.join_date,
        billing_day: memberData.billing_day,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const createdMember = {
        ...createdPerson,
        member_extensions: createdMemberExtension
      };
      
      // Setup the mocks for the transaction steps
      supabase.single.mockImplementationOnce(() => ({
        data: createdPerson,
        error: null
      })).mockImplementationOnce(() => ({
        data: createdMemberExtension,
        error: null
      })).mockImplementationOnce(() => ({
        data: createdMember,
        error: null
      }));
      
      // Call the function
      const result = await memberModel.createMember(memberData);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.insert).toHaveBeenCalled();
      expect(result).toEqual(createdMember);
    });
    
    it('should reject if required fields are missing', async () => {
      // Call with missing required fields
      const memberData = {
        email: 'john.doe@example.com',
        // Missing first_name, last_name, and membership_type
      };
      
      // Call and expect rejection
      await expect(memberModel.createMember(memberData))
        .rejects.toThrow('first_name, last_name, and membership_type are required');
    });
  });
  
  describe('updateMember', () => {
    it('should update an existing member', async () => {
      // Mock data
      const memberId = uuidv4();
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
        member_extensions: {
          membership_type: 'Family',
          current_monthly_spend: 150
        }
      };
      
      const updatedPerson = {
        id: memberId,
        first_name: updateData.first_name,
        last_name: updateData.last_name,
        is_member: true,
        updated_at: new Date().toISOString()
      };
      
      const updatedMemberExtension = {
        id: uuidv4(),
        person_id: memberId,
        membership_type: updateData.member_extensions.membership_type,
        current_monthly_spend: updateData.member_extensions.current_monthly_spend,
        updated_at: new Date().toISOString()
      };
      
      const updatedMember = {
        ...updatedPerson,
        member_extensions: updatedMemberExtension
      };
      
      // Setup the mocks
      supabase.single.mockImplementationOnce(() => ({
        data: updatedPerson,
        error: null
      })).mockImplementationOnce(() => ({
        data: updatedMemberExtension,
        error: null
      })).mockImplementationOnce(() => ({
        data: updatedMember,
        error: null
      }));
      
      // Call the function
      const result = await memberModel.updateMember(memberId, updateData);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.update).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', memberId);
      expect(result).toEqual(updatedMember);
    });
  });
  
  describe('deleteMember', () => {
    it('should delete a member', async () => {
      // Mock data
      const memberId = uuidv4();
      
      // Setup the mock
      supabase.delete.mockImplementation(() => ({
        error: null
      }));
      
      // Call the function
      const result = await memberModel.deleteMember(memberId);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', memberId);
      expect(result).toBe(true);
    });
    
    it('should handle errors', async () => {
      // Setup error mock
      supabase.delete.mockImplementation(() => ({
        error: new Error('Delete failed')
      }));
      
      // Call and expect rejection
      await expect(memberModel.deleteMember('invalid-id')).rejects.toThrow('Delete failed');
    });
  });
  
  describe('getMembersByStatus', () => {
    it('should retrieve members by status', async () => {
      // Mock data
      const status = 'active';
      const mockMemberPerson = generatePerson({ is_member: true });
      const mockMemberExtension = generateMemberExtension(mockMemberPerson.id);
      mockMemberExtension.membership_status = status;
      
      const mockMembers = [{
        ...mockMemberPerson,
        member_extensions: mockMemberExtension
      }];
      
      // Setup the mock
      supabase.range.mockImplementation(() => ({
        data: mockMembers,
        error: null
      }));
      
      // Call the function
      const result = await memberModel.getMembersByStatus(status);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalledWith('*, member_extensions(*)');
      expect(supabase.match).toHaveBeenCalledWith({ is_member: true });
      expect(result).toEqual(mockMembers);
    });
  });
  
  describe('getMemberCountByType', () => {
    it('should get member counts by membership type', async () => {
      // Mock data
      const mockCounts = {
        Basic: 10,
        Premium: 5,
        Family: 3,
        Corporate: 2
      };
      
      // Setup mock implementations for each type query
      Object.keys(mockCounts).forEach(type => {
        supabase.range.mockImplementationOnce(() => ({
          data: Array(mockCounts[type]).fill({}),
          error: null,
          count: mockCounts[type]
        }));
      });
      
      // Call the function
      const result = await memberModel.getMemberCountByType();
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.match).toHaveBeenCalledWith({ is_member: true });
      expect(result).toEqual(mockCounts);
    });
  });
  
  describe('recordMemberCheckIn', () => {
    it('should record a member check-in', async () => {
      // Mock data
      const memberId = uuidv4();
      const checkInDate = new Date().toISOString();
      
      const memberBefore = {
        id: memberId,
        is_member: true,
        member_extensions: {
          id: uuidv4(),
          person_id: memberId,
          check_in_count: 5,
          last_check_in: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          attendance_streak: 1
        }
      };
      
      const memberAfter = {
        ...memberBefore,
        member_extensions: {
          ...memberBefore.member_extensions,
          check_in_count: 6,
          last_check_in: checkInDate,
          attendance_streak: 2
        }
      };
      
      // Setup the mocks
      supabase.single.mockImplementationOnce(() => ({
        data: memberBefore,
        error: null
      })).mockImplementationOnce(() => ({
        data: memberAfter.member_extensions,
        error: null
      }));
      
      // Call the function
      const result = await memberModel.recordMemberCheckIn(memberId, checkInDate);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('persons');
      expect(supabase.select).toHaveBeenCalledWith('*, member_extensions(*)');
      expect(supabase.eq).toHaveBeenCalledWith('id', memberId);
      expect(supabase.from).toHaveBeenCalledWith('member_extensions');
      expect(supabase.update).toHaveBeenCalledWith(expect.objectContaining({
        check_in_count: 6,
        last_check_in: checkInDate,
        attendance_streak: 2
      }));
      expect(result).toEqual(memberAfter.member_extensions);
    });
  });
  
  describe('getMemberReferrals', () => {
    it('should get referrals made by a member', async () => {
      // Mock data
      const memberId = uuidv4();
      const mockReferrals = [
        { id: uuidv4(), first_name: 'John', last_name: 'Doe', is_referral: true },
        { id: uuidv4(), first_name: 'Jane', last_name: 'Smith', is_referral: true }
      ];
      
      // Setup the mock
      supabase.range.mockImplementation(() => ({
        data: mockReferrals,
        error: null
      }));
      
      // Call the function
      const result = await memberModel.getMemberReferrals(memberId);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('relationships');
      expect(supabase.select).toHaveBeenCalledWith('*, persons:person_b_id(*)');
      expect(supabase.eq).toHaveBeenCalledWith('person_a_id', memberId);
      expect(supabase.eq).toHaveBeenCalledWith('relationship_type', 'referral');
      expect(result).toEqual(mockReferrals);
    });
  });
}); 