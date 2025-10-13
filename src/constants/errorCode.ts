export const LOGIN_ERROR_CODE = {
  INVALID_REQUEST: 1000, // user not found or invalid credentials
  USER_NOT_FOUND: 1001, // user not found
  INVALID_CURRENT_PASSWORD: 1002, // invalid current password
  EMAIL_CAN_BE_SENT: 1003, // email can be sent
  INTERNAL_SERVER_ERROR: 1004,
};

export const ME_ERROR_CODE = {
  USER_NOT_FOUND: 2000, // user not found
  INVALID_USER_UPDATE_PAYLOAD: 2001, // invalid user update payload

  INTERNAL_SERVER_ERROR: 2002,
};

export const STAFF_ERROR_CODE = {
  INVALID_REQUEST: 3000, // invalid request
  USER_NOT_FOUND: 3001, // user not found
  USER_JOINED_ALREADY: 3002, // user joined already
  INVITATION_NOT_CREATED: 3003, // invitation not created
  INVALID_INVITATION_TOKEN: 3004, // invalid invitation token
  INVITATION_EXPIRED: 3005, // invitation expired
  INTERNAL_SERVER_ERROR: 3006,
};

export const CLIENT_ERROR_CODE = {
  INVALID_REQUEST: 4000,
  CLIENT_NOT_FOUND: 4001,
  CLIENT_IS_EXISTING: 40002,
};

export const SHIFT_ERROR_CODE = {
  INVALID_REQUEST: 5000,
  SHIFT_NOT_FOUND: 5001,
  STAFF_SCHEDULE_NOT_FOUND: 5010,

  INTERNAL_SERVER_ERROR: 5020,
};

export const AUTH_ERROR_CODE = {
  UNAUTHORIZED: 9999991, // unauthorized
  UNAUTHENTICATED: 9999992, // unauthenticated
  INTERNAL_SERVER_ERROR: 9999993, // internal server error
};
