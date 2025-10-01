import { API_STATUS } from "../constants/apiStatus";

interface ISendResponse<T = any, M = any> {
  res: any;
  code?: number;
  statusCode?: number;
  status?: keyof typeof API_STATUS;
  message?: string;
  data?: T;
  meta?: M;
}

export const sendResponse = <T = any, M = any>({
  res,
  code = 200,
  statusCode = 200,
  status = API_STATUS.OK as keyof typeof API_STATUS,
  message = "",
  data = null,
  meta = null,
}: ISendResponse) => {
  const response: {
    message: string;
    status?: keyof typeof API_STATUS;
    data?: T;
    meta?: M;
    code?: number;
  } = {
    message,
    code,
  };

  if (status) {
    response.status = status;
  }

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};
