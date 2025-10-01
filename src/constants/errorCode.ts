const LOGIN_ERROR_CODE = {
  INVALID_REQUEST: 1000, // user not found or invalid credentials
  EMAIL_CAN_BE_SENT: 1001, // email can be sent
  INTERNAL_SERVER_ERROR: 1002,
};

const ME_ERROR_CODE = {
  USER_NOT_FOUND: 1000, // user not found
  INVALID_USER_UPDATE_PAYLOAD: 1001, // invalid user update payload

  INTERNAL_SERVER_ERROR: 1002,
};

export { LOGIN_ERROR_CODE, ME_ERROR_CODE };