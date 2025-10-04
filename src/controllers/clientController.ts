import type { Request, Response } from "express";
import Client from "../models/clientModel";
import { sendResponse } from "../utils/sendResponse";
import { API_STATUS } from "../constants/apiStatus";
import { CLIENT_ERROR_CODE, LOGIN_ERROR_CODE } from "../constants/errorCode";
import { validateAddClient } from "../validations/clientValidation";

export const getClients = async (req: Request, res: Response) => {
  try {
    const clients = await Client.find({});
    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      data: {
        clients,
      },
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      code: LOGIN_ERROR_CODE.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
};

export const getClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);
    if (!client) {
      return sendResponse({
        res,
        statusCode: 404,
        code: CLIENT_ERROR_CODE.CLIENT_NOT_FOUND,
        message: "Client not found",
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      data: { client },
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      code: LOGIN_ERROR_CODE.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
};

export const addClient = async (req: Request, res: Response) => {
  try {
    const { error, value: clientData } = validateAddClient(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
      });
    }
    const existingClient = await Client.findOne({ email: clientData.email });
    if (existingClient) {
      return sendResponse({
        res,
        statusCode: 400,
        code: CLIENT_ERROR_CODE.CLIENT_IS_EXISTING,
        message: "Client already exists",
      });
    }

    const newClient = await Client.create(clientData);
    return sendResponse({
      res,
      statusCode: 201,
      status: API_STATUS.OK,
      data: { client: newClient },
    });
  } catch (err) {
    return sendResponse({
      res,
      statusCode: 500,
      code: LOGIN_ERROR_CODE.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, ...updateData } = req.body;

    const existingClient = await Client.findById(id);
    if (!existingClient) {
      return sendResponse({
        res,
        statusCode: 404,
        code: CLIENT_ERROR_CODE.CLIENT_NOT_FOUND,
        message: "Client not found",
      });
    }

    if (email && email !== existingClient.email) {
      const emailExists = await Client.findOne({ email });
      if (emailExists) {
        return sendResponse({
          res,
          statusCode: 400,
          code: CLIENT_ERROR_CODE.CLIENT_IS_EXISTING,
          message: "Email is existed",
        });
      }
      updateData.email = email;
    }

    const updatedClient = await Client.findByIdAndUpdate(id, updateData, { new: true });
    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      data: { client: updatedClient },
      message: "Client updated successfully",
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      code: LOGIN_ERROR_CODE.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingClient = await Client.findById(id);
    if (!existingClient) {
      return sendResponse({
        res,
        statusCode: 404,
        code: CLIENT_ERROR_CODE.CLIENT_NOT_FOUND,
        message: "Client not found",
      });
    }

    await Client.findByIdAndDelete(id);

    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      message: "Client deleted successfully",
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      code: LOGIN_ERROR_CODE.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
};
