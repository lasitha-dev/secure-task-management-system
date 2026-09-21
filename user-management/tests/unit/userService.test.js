// Set test env vars before any imports
require('../setup');

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../src/models/User');
const generateToken = require('../../src/utils/generateToken');
const userService = require('../../src/services/userService');

// Mock the User model
jest.mock('../../src/models/User');
jest.mock('../../src/utils/generateToken');

beforeEach(() => {
  jest.clearAllMocks();
  generateToken.mockReturnValue('mock-jwt-token');
});

describe('userService', () => {
  describe('registerUser', () => {
    it('should create a new user and return user data with token', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'user-id-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'User',
      });

      const result = await userService.registerUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(User.create).toHaveBeenCalled();
      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
    });

    it('should throw 409 if user already exists', async () => {
      User.findOne.mockResolvedValue({ email: 'john@example.com' });

      await expect(
        userService.registerUser({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        })
      ).rejects.toMatchObject({
        message: 'User already exists',
        statusCode: 409,
      });
    });

    it('should default role to User', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'user-id-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'User',
      });

      const result = await userService.registerUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(result.role).toBe('User');
    });
  });

  describe('loginUser', () => {
    it('should return user and token for valid credentials', async () => {
      const mockUser = {
        _id: 'user-id-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'User',
        matchPassword: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await userService.loginUser('john@example.com', 'password123');

      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result.email).toBe('john@example.com');
      expect(mockUser.matchPassword).toHaveBeenCalledWith('password123');
    });

    it('should throw 401 for non-existent email', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        userService.loginUser('nonexistent@example.com', 'password123')
      ).rejects.toMatchObject({
        message: 'Invalid email or password',
        statusCode: 401,
      });
    });

    it('should throw 401 for incorrect password', async () => {
      const mockUser = {
        _id: 'user-id-123',
        email: 'john@example.com',
        matchPassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await expect(
        userService.loginUser('john@example.com', 'wrongpassword')
      ).rejects.toMatchObject({
        message: 'Invalid email or password',
        statusCode: 401,
      });
    });
  });

  describe('getUserProfile', () => {
    it('should return user data for valid ID', async () => {
      User.findById.mockResolvedValue({
        _id: 'user-id-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'User',
        googleId: null,
        createdAt: new Date(),
      });

      const result = await userService.getUserProfile('user-id-123');

      expect(result).toHaveProperty('name', 'John Doe');
      expect(result).toHaveProperty('email', 'john@example.com');
    });

    it('should throw 404 for non-existent ID', async () => {
      User.findById.mockResolvedValue(null);

      await expect(
        userService.getUserProfile('nonexistent-id')
      ).rejects.toMatchObject({
        message: 'User not found',
        statusCode: 404,
      });
    });
  });

  describe('updateUser', () => {
    it('should update user fields', async () => {
      const mockUser = {
        _id: 'user-id-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'User',
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      User.findById.mockResolvedValue(mockUser);

      const requestingUser = { _id: { toString: () => 'user-id-123' }, role: 'User' };
      const result = await userService.updateUser(
        'user-id-123',
        { name: 'Jane Doe' },
        requestingUser
      );

      expect(mockUser.save).toHaveBeenCalled();
      expect(result.name).toBe('Jane Doe');
    });

    it('should throw 403 if non-admin tries to update another user', async () => {
      const mockUser = {
        _id: 'user-id-123',
        name: 'John Doe',
      };

      User.findById.mockResolvedValue(mockUser);

      const requestingUser = { _id: { toString: () => 'other-user-id' }, role: 'User' };

      await expect(
        userService.updateUser('user-id-123', { name: 'Hacked' }, requestingUser)
      ).rejects.toMatchObject({
        message: 'Not authorized to update this user',
        statusCode: 403,
      });
    });

    it('should throw 404 for non-existent user', async () => {
      User.findById.mockResolvedValue(null);

      const requestingUser = { _id: { toString: () => 'admin-id' }, role: 'Admin' };

      await expect(
        userService.updateUser('nonexistent-id', { name: 'Test' }, requestingUser)
      ).rejects.toMatchObject({
        message: 'User not found',
        statusCode: 404,
      });
    });

    it('should allow admin to change roles', async () => {
      const mockUser = {
        _id: 'user-id-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'User',
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      User.findById.mockResolvedValue(mockUser);

      const requestingUser = { _id: { toString: () => 'admin-id' }, role: 'Admin' };
      const result = await userService.updateUser(
        'user-id-123',
        { role: 'Admin' },
        requestingUser
      );

      expect(mockUser.role).toBe('Admin');
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete user for valid request', async () => {
      const mockUser = {
        _id: 'user-id-123',
        deleteOne: jest.fn().mockResolvedValue(true),
      };

      User.findById.mockResolvedValue(mockUser);

      const requestingUser = { _id: { toString: () => 'user-id-123' }, role: 'User' };
      const result = await userService.deleteUser('user-id-123', requestingUser);

      expect(mockUser.deleteOne).toHaveBeenCalled();
      expect(result.message).toBe('User removed');
    });

    it('should throw 403 if non-admin tries to delete another user', async () => {
      const mockUser = { _id: 'user-id-123' };
      User.findById.mockResolvedValue(mockUser);

      const requestingUser = { _id: { toString: () => 'other-user-id' }, role: 'User' };

      await expect(
        userService.deleteUser('user-id-123', requestingUser)
      ).rejects.toMatchObject({
        message: 'Not authorized to delete this user',
        statusCode: 403,
      });
    });

    it('should throw 404 for non-existent user', async () => {
      User.findById.mockResolvedValue(null);

      const requestingUser = { _id: { toString: () => 'admin-id' }, role: 'Admin' };

      await expect(
        userService.deleteUser('nonexistent-id', requestingUser)
      ).rejects.toMatchObject({
        message: 'User not found',
        statusCode: 404,
      });
    });
  });

  describe('getAllUsers', () => {
    it('should return array of all users', async () => {
      const mockUsers = [
        { _id: '1', name: 'User 1', email: 'user1@example.com', role: 'User' },
        { _id: '2', name: 'User 2', email: 'user2@example.com', role: 'Admin' },
      ];

      User.find.mockResolvedValue(mockUsers);

      const result = await userService.getAllUsers();

      expect(User.find).toHaveBeenCalledWith({});
      expect(result).toHaveLength(2);
    });
  });

  describe('googleAuth', () => {
    it('should return existing user if found by googleId', async () => {
      const mockUser = {
        _id: 'user-id-123',
        name: 'Google User',
        email: 'google@example.com',
        role: 'User',
        googleId: 'google-123',
      };

      // Mock the google-auth-library verifyIdToken
      const { OAuth2Client } = require('google-auth-library');
      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({
          sub: 'google-123',
          email: 'google@example.com',
          name: 'Google User',
        }),
      });

      User.findOne
        .mockResolvedValueOnce(mockUser); // findOne({ googleId })

      const result = await userService.googleAuth('valid-id-token');

      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result.name).toBe('Google User');
      expect(result.email).toBe('google@example.com');
    });

    it('should link Google account if user exists by email but not googleId', async () => {
      const mockUser = {
        _id: 'user-id-456',
        name: 'Existing User',
        email: 'existing@example.com',
        role: 'User',
        googleId: undefined,
        save: jest.fn().mockResolvedValue(true),
      };

      const { OAuth2Client } = require('google-auth-library');
      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({
          sub: 'google-456',
          email: 'existing@example.com',
          name: 'Existing User',
        }),
      });

      User.findOne
        .mockResolvedValueOnce(null)      // findOne({ googleId }) - not found
        .mockResolvedValueOnce(mockUser);  // findOne({ email }) - found

      const result = await userService.googleAuth('valid-id-token');

      expect(mockUser.googleId).toBe('google-456');
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toHaveProperty('token', 'mock-jwt-token');
    });

    it('should create new user if no existing user found', async () => {
      const { OAuth2Client } = require('google-auth-library');
      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({
          sub: 'google-789',
          email: 'newgoogle@example.com',
          name: 'New Google User',
        }),
      });

      User.findOne
        .mockResolvedValueOnce(null)   // findOne({ googleId })
        .mockResolvedValueOnce(null);  // findOne({ email })

      User.create.mockResolvedValue({
        _id: 'new-user-id',
        name: 'New Google User',
        email: 'newgoogle@example.com',
        role: 'User',
      });

      const result = await userService.googleAuth('valid-id-token');

      expect(User.create).toHaveBeenCalledWith({
        name: 'New Google User',
        email: 'newgoogle@example.com',
        googleId: 'google-789',
      });
      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result.name).toBe('New Google User');
    });
  });
});
