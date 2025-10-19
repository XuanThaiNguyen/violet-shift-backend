import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { addShift, getShift, isAssignedToShift } from '../../../controllers/shifts/shiftController';
import { validateAddShift } from '../../../validations/shiftValidation';
import { SHIFT_ERROR_CODE } from '../../../constants/errorCode';
import {
  createMockRequest,
  createMockResponse,
  createMockAuthRequest,
  createValidShiftRequest,
  createMockShift,
  createMockClientSchedule,
  createMockStaffSchedule,
  createMockShiftTask,
} from '../../utils/testHelpers';
import {
  mockShift,
  mockShiftRepeat,
  mockClientSchedule,
  mockStaffSchedule,
  mockShiftTask,
  mockClient,
} from '../../mocks/mongoose';

// Mock the validation function
jest.mock('../../../validations/shiftValidation', () => ({
  validateAddShift: jest.fn(),
}));

// Mock the sendResponse utility
jest.mock('../../../utils/sendResponse', () => ({
  sendResponse: jest.fn(),
}));

describe('Shift Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockAuthReq: Partial<Request>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockAuthReq = createMockAuthRequest();
  });

  describe('addShift', () => {
    it('should successfully create a shift with all related data', async () => {
      const validShiftData = createValidShiftRequest();
      const mockCreatedShift = createMockShift();
      const mockCreatedClientSchedule = createMockClientSchedule();
      const mockCreatedStaffSchedule = createMockStaffSchedule();
      const mockCreatedTask = createMockShiftTask();

      // Mock validation
      (validateAddShift as jest.Mock).mockReturnValue({
        error: null,
        value: validShiftData,
      });

      // Mock database operations
      mockShift.create.mockResolvedValue(mockCreatedShift);
      mockClientSchedule.insertMany.mockResolvedValue([mockCreatedClientSchedule]);
      mockStaffSchedule.insertMany.mockResolvedValue([mockCreatedStaffSchedule]);
      mockShiftTask.insertMany.mockResolvedValue([mockCreatedTask]);
      mockClient.findOne.mockResolvedValue({ _id: new Types.ObjectId() });

      mockReq.body = validShiftData;

      await addShift(mockReq as Request, mockRes as Response);

      expect(validateAddShift).toHaveBeenCalledWith(validShiftData);
      expect(mockShift.create).toHaveBeenCalled();
      expect(mockClientSchedule.insertMany).toHaveBeenCalled();
      expect(mockStaffSchedule.insertMany).toHaveBeenCalled();
      expect(mockShiftTask.insertMany).toHaveBeenCalled();
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = { shiftType: 'invalid' };
      const validationError = { details: [{ message: 'Invalid shift type' }] };

      (validateAddShift as jest.Mock).mockReturnValue({
        error: validationError,
        value: null,
      });

      mockReq.body = invalidData;

      await addShift(mockReq as Request, mockRes as Response);

      expect(validateAddShift).toHaveBeenCalledWith(invalidData);
      expect(mockShift.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during shift creation', async () => {
      const validShiftData = createValidShiftRequest();
      const dbError = new Error('Database connection failed');

      (validateAddShift as jest.Mock).mockReturnValue({
        error: null,
        value: validShiftData,
      });

      mockShift.create.mockRejectedValue(dbError);
      mockReq.body = validShiftData;

      await addShift(mockReq as Request, mockRes as Response);

      expect(mockShift.create).toHaveBeenCalled();
    });

    it('should create shift with repeat schedule when repeat is provided', async () => {
      const validShiftData = createValidShiftRequest({
        repeat: '0 9 * * 1-5', // Weekdays at 9 AM
      });
      const mockCreatedShift = createMockShift();
      const mockCreatedRepeat = { _id: new Types.ObjectId() };

      (validateAddShift as jest.Mock).mockReturnValue({
        error: null,
        value: validShiftData,
      });

      mockShift.create.mockResolvedValue(mockCreatedShift);
      mockShiftRepeat.create.mockResolvedValue(mockCreatedRepeat);
      mockClientSchedule.insertMany.mockResolvedValue([]);
      mockStaffSchedule.insertMany.mockResolvedValue([]);
      mockShiftTask.insertMany.mockResolvedValue([]);
      mockClient.findOne.mockResolvedValue({ _id: new Types.ObjectId() });

      mockReq.body = validShiftData;

      await addShift(mockReq as Request, mockRes as Response);

      expect(mockShiftRepeat.create).toHaveBeenCalled();
    });
  });

  describe('getShift', () => {
    it('should successfully retrieve a shift by ID', async () => {
      const shiftId = new Types.ObjectId().toString();
      const mockShiftData = createMockShift({ _id: shiftId });

      mockShift.findOne.mockResolvedValue(mockShiftData);
      mockReq.params = { shiftId };

      await getShift(mockReq as Request, mockRes as Response);

      expect(mockShift.findOne).toHaveBeenCalledWith({ _id: shiftId, isActive: true });
    });

    it('should return error when shift is not found', async () => {
      const shiftId = new Types.ObjectId().toString();

      mockShift.findOne.mockResolvedValue(null);
      mockReq.params = { shiftId };

      await getShift(mockReq as Request, mockRes as Response);

      expect(mockShift.findOne).toHaveBeenCalledWith({ _id: shiftId, isActive: true });
    });

    it('should handle database errors', async () => {
      const shiftId = new Types.ObjectId().toString();
      const dbError = new Error('Database error');

      mockShift.findOne.mockRejectedValue(dbError);
      mockReq.params = { shiftId };

      await getShift(mockReq as Request, mockRes as Response);

      expect(mockShift.findOne).toHaveBeenCalledWith({ _id: shiftId, isActive: true });
    });
  });

  describe('isAssignedToShift', () => {
    it('should return true when user is assigned to shift', async () => {
      const shiftId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      const mockSchedule = createMockStaffSchedule();

      mockStaffSchedule.findOne.mockResolvedValue(mockSchedule);
      mockReq.params = { shiftId };
      (mockReq as any).userId = userId;

      const result = await isAssignedToShift(mockReq as Request);

      expect(result).toBe(true);
      expect(mockStaffSchedule.findOne).toHaveBeenCalledWith({
        shift: shiftId,
        user: userId,
        isDeleted: false,
      });
    });

    it('should return false when user is not assigned to shift', async () => {
      const shiftId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();

      mockStaffSchedule.findOne.mockResolvedValue(null);
      mockReq.params = { shiftId };
      (mockReq as any).userId = userId;

      const result = await isAssignedToShift(mockReq as Request);

      expect(result).toBe(false);
    });

    it('should return false when database error occurs', async () => {
      const shiftId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();

      mockStaffSchedule.findOne.mockRejectedValue(new Error('Database error'));
      mockReq.params = { shiftId };
      (mockReq as any).userId = userId;

      const result = await isAssignedToShift(mockReq as Request);

      expect(result).toBe(false);
    });
  });
});
