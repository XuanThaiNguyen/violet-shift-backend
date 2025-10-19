// Mock Mongoose models for testing
export const mockShift = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  deleteOne: jest.fn(),
  aggregate: jest.fn(),
};

export const mockShiftRepeat = {
  create: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteOne: jest.fn(),
};

export const mockClientSchedule = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteMany: jest.fn(),
  insertMany: jest.fn(),
};

export const mockStaffSchedule = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteMany: jest.fn(),
  insertMany: jest.fn(),
};

export const mockShiftTask = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteMany: jest.fn(),
  insertMany: jest.fn(),
};

export const mockClient = {
  findOne: jest.fn(),
  find: jest.fn(),
};

// Mock the models
jest.mock('../../models/shifts/shiftModel', () => ({
  __esModule: true,
  default: mockShift,
}));

jest.mock('../../models/shifts/shiftRepeatModel', () => ({
  __esModule: true,
  default: mockShiftRepeat,
}));

jest.mock('../../models/shifts/clientScheduleModel', () => ({
  __esModule: true,
  default: mockClientSchedule,
}));

jest.mock('../../models/shifts/staffScheduleModel', () => ({
  __esModule: true,
  default: mockStaffSchedule,
}));

jest.mock('../../models/shifts/shiftTaskModel', () => ({
  __esModule: true,
  default: mockShiftTask,
}));

jest.mock('../../models/clientModel', () => ({
  __esModule: true,
  default: mockClient,
}));
