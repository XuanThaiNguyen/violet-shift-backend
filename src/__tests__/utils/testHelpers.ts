import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../../middleware/type';

// Mock Express Request and Response objects
export const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  ...overrides,
});

export const createMockResponse = (): Partial<Response> => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

export const createMockAuthRequest = (overrides: Partial<AuthRequest> = {}): Partial<AuthRequest> => ({
  userId: new Types.ObjectId().toString(),
  ...overrides,
});

// Test data factories
export const createMockShift = (overrides: any = {}) => ({
  _id: new Types.ObjectId(),
  shiftType: 'personal_care',
  startTime: new Date('2024-01-01T09:00:00Z'),
  endTime: new Date('2024-01-01T17:00:00Z'),
  location: '123 Main St',
  client: new Types.ObjectId(),
  createdBy: new Types.ObjectId(),
  isActive: true,
  ...overrides,
});

export const createMockClientSchedule = (overrides: any = {}) => ({
  _id: new Types.ObjectId(),
  shift: new Types.ObjectId(),
  client: new Types.ObjectId(),
  startTime: new Date('2024-01-01T09:00:00Z'),
  endTime: new Date('2024-01-01T17:00:00Z'),
  isDeleted: false,
  ...overrides,
});

export const createMockStaffSchedule = (overrides: any = {}) => ({
  _id: new Types.ObjectId(),
  shift: new Types.ObjectId(),
  user: new Types.ObjectId(),
  startTime: new Date('2024-01-01T09:00:00Z'),
  endTime: new Date('2024-01-01T17:00:00Z'),
  isDeleted: false,
  ...overrides,
});

export const createMockShiftTask = (overrides: any = {}) => ({
  _id: new Types.ObjectId(),
  shift: new Types.ObjectId(),
  title: 'Test Task',
  description: 'Test Description',
  isCompleted: false,
  ...overrides,
});

// Mock functions for testing
export const mockSendResponse = jest.fn();

// Helper to create a valid shift request body
export const createValidShiftRequest = (overrides: any = {}) => ({
  shiftType: 'personal_care',
  startTime: '2024-01-01T09:00:00Z',
  endTime: '2024-01-01T17:00:00Z',
  location: '123 Main St',
  client: new Types.ObjectId().toString(),
  instruction: 'Test instruction',
  clientSchedules: [{
    client: new Types.ObjectId().toString(),
    startTime: '2024-01-01T09:00:00Z',
    endTime: '2024-01-01T17:00:00Z',
  }],
  staffSchedules: [{
    user: new Types.ObjectId().toString(),
    startTime: '2024-01-01T09:00:00Z',
    endTime: '2024-01-01T17:00:00Z',
  }],
  tasks: [{
    title: 'Test Task',
    description: 'Test Description',
  }],
  ...overrides,
});
