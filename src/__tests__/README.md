# Testing Setup for Violet Shift Backend

This directory contains comprehensive unit tests for the shift module and other components of the Violet Shift Backend.

## Test Structure

```
src/__tests__/
├── setup.ts                    # Jest setup and teardown
├── utils/
│   └── testHelpers.ts          # Test utilities and mock factories
├── mocks/
│   └── mongoose.ts             # Mongoose model mocks
└── controllers/
    └── shifts/
        ├── shiftController.test.ts
        ├── shiftTasksController.test.ts
        ├── staffScheduleController.test.ts
        └── clientScheduleController.test.ts
```

## Test Configuration

- **Jest**: Testing framework with TypeScript support
- **MongoDB Memory Server**: In-memory MongoDB for isolated testing
- **Supertest**: HTTP assertion library for API testing
- **Coverage**: Code coverage reporting with HTML and LCOV formats

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only shift module tests
npm run test:shift

# Run specific test file
npm test -- shiftController.test.ts
```

## Test Features

### Shift Controller Tests
- ✅ `addShift` - Create new shifts with validation
- ✅ `getShift` - Retrieve shift by ID
- ✅ `isAssignedToShift` - Check staff assignment

### Shift Tasks Controller Tests
- ✅ `addShiftTask` - Create shift tasks
- ✅ `updateShiftTask` - Update existing tasks
- ✅ `deleteShiftTask` - Remove tasks

### Staff Schedule Controller Tests
- ✅ `assignStaffToShift` - Assign staff to shifts
- ✅ `removeStaffFromShift` - Remove staff assignments
- ✅ `getStaffSchedule` - Retrieve staff schedules with pagination

### Client Schedule Controller Tests
- ✅ `assignClientToShift` - Assign clients to shifts
- ✅ `removeClientFromShift` - Remove client assignments
- ✅ `getClientSchedule` - Retrieve client schedules with pagination

## Test Utilities

### Mock Factories
- `createMockShift()` - Generate test shift data
- `createMockClientSchedule()` - Generate client schedule data
- `createMockStaffSchedule()` - Generate staff schedule data
- `createMockShiftTask()` - Generate shift task data
- `createValidShiftRequest()` - Generate valid API request data

### Mock Objects
- `createMockRequest()` - Express request mock
- `createMockResponse()` - Express response mock
- `createMockAuthRequest()` - Authenticated request mock

## Database Testing

Tests use MongoDB Memory Server for:
- Isolated test environments
- No external database dependencies
- Automatic cleanup between tests
- Fast test execution

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI/CD

## Best Practices

1. **Isolation**: Each test is independent and doesn't affect others
2. **Mocking**: External dependencies are mocked for reliable testing
3. **Coverage**: Aim for >80% code coverage
4. **Naming**: Test names clearly describe what is being tested
5. **Setup/Teardown**: Proper cleanup after each test

## Adding New Tests

1. Create test file in appropriate directory
2. Import necessary mocks and utilities
3. Write descriptive test cases
4. Ensure proper cleanup
5. Update this README if adding new test categories

## Troubleshooting

### Common Issues

1. **MongoDB Memory Server fails to start**
   - Ensure sufficient system memory
   - Check for port conflicts

2. **Tests timeout**
   - Increase `testTimeout` in `jest.config.js`
   - Check for unhandled promises

3. **Mock not working**
   - Ensure mocks are imported before the module being tested
   - Check mock function names match exactly

### Debug Mode

Run tests with debug output:
```bash
DEBUG=* npm test
```
