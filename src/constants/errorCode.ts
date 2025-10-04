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
  USER_JOINED_ALREADY: 3001, // user joined already
  INVITATION_NOT_CREATED: 3002, // invitation not created
  INVALID_INVITATION_TOKEN: 3003, // invalid invitation token
  INVITATION_EXPIRED: 3004, // invitation expired
  INTERNAL_SERVER_ERROR: 3005,
};

export const AUTH_ERROR_CODE = {
  UNAUTHORIZED: 9999991, // unauthorized
  UNAUTHENTICATED: 9999992, // unauthenticated
};
