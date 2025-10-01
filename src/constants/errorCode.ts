export const LOGIN_ERROR_CODE = {
  INVALID_REQUEST: 1000, // user not found or invalid credentials
  INVALID_CURRENT_PASSWORD: 1001, // invalid current password
  EMAIL_CAN_BE_SENT: 1002, // email can be sent
  INTERNAL_SERVER_ERROR: 1003,
};

export const ME_ERROR_CODE = {
  USER_NOT_FOUND: 2000, // user not found
  INVALID_USER_UPDATE_PAYLOAD: 2001, // invalid user update payload

  INTERNAL_SERVER_ERROR: 2002,
};

export const STAFF_ERROR_CODE = {
  INVALID_REQUEST: 3000, // invalid request
  INVITATION_NOT_CREATED: 3001, // invitation not created
  INTERNAL_SERVER_ERROR: 3002,
};

export const AUTH_ERROR_CODE = {
  UNAUTHORIZED: 9999991, // unauthorized
  UNAUTHENTICATED: 9999992, // unauthenticated
};

