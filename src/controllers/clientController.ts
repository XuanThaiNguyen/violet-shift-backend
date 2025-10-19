import type { Request, Response } from "express";
import mongoose, { PipelineStage, Types } from "mongoose";
import { API_STATUS } from "../constants/apiStatus";
import { logger as winstonLogger } from "../utils/logger";
import { CLIENT_ERROR_CODE, LOGIN_ERROR_CODE } from "../constants/errorCode";
import Client, { IClient } from "../models/clientModel";
import { sendResponse } from "../utils/sendResponse";
import {
  IQueryClient,
  validateAddClient,
  validateArchiveClient,
  validateChangeStatusClient,
  validateQueryClient,
} from "../validations/clientValidation";

const controllerLogger = winstonLogger.child({
  controller: "clientController",
});

export const getClients = async (req: Request, res: Response) => {
  try {
    const { error, value: queryData } = validateQueryClient(req.query as unknown as IQueryClient);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: CLIENT_ERROR_CODE.INVALID_REQUEST,
      });
    }

    const perPage = Math.min(queryData.perPage, 100);
    const skip = (+queryData.page - 1) * perPage;
    const searchPat = new RegExp(queryData.query || "", "i");

    const pipelines: PipelineStage[] = [
      {
        $match: {
          $and: [
            //getClients only get clients that are not archived
            { isArchived: { $ne: true } },
            {
              $or: [{ email: { $regex: searchPat } }],
            },
            queryData["statusTypes[]"]
              ? {
                  status: {
                    $in: queryData["statusTypes[]"]?.map((status) => status),
                  },
                }
              : {},
          ],
        },
      },
      {
        $sort: {
          [queryData.sort]: queryData.order === "asc" ? 1 : -1,
        },
      },
      {
        $facet: {
          pagination: [
            { $count: "total" },
            { $addFields: { page: queryData.page } },
            { $addFields: { perPage: perPage } },
          ],
          data: [{ $skip: skip }, { $limit: +perPage }, { $project: { __v: 0, password: 0 } }],
        },
      },
    ];

    const [facet] = await Client.aggregate(pipelines).exec();
    const rawClients = Array.isArray(facet?.data)
      ? (facet.data as mongoose.Document<unknown, {}, IClient>[])
      : [];
    const clients = rawClients.map((client) => {
      client.id = (client._id as Types.ObjectId).toString();
      delete client._id;
      return client;
    });
    const pagination =
      Array.isArray(facet?.pagination) && facet.pagination[0]
        ? facet.pagination[0]
        : { total: 0, page: queryData.page, perPage: perPage };

    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      data: {
        data: clients,
        pagination,
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

export const getArchivedClients = async (req: Request, res: Response) => {
  try {
    const { error, value: queryData } = validateQueryClient(req.query as unknown as IQueryClient);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: CLIENT_ERROR_CODE.INVALID_REQUEST,
      });
    }

    const perPage = Math.min(queryData.perPage, 100);
    const skip = (+queryData.page - 1) * perPage;
    const searchPat = new RegExp(queryData.query || "", "i");

    const pipelines: PipelineStage[] = [
      {
        $match: {
          $and: [
            //getClients only get clients that are not archived
            { isArchived: { $ne: false } },
            {
              $or: [{ email: { $regex: searchPat } }],
            },
          ],
        },
      },
      {
        $sort: {
          [queryData.sort]: queryData.order === "asc" ? 1 : -1,
        },
      },
      {
        $facet: {
          pagination: [
            { $count: "total" },
            { $addFields: { page: queryData.page } },
            { $addFields: { perPage: perPage } },
          ],
          data: [{ $skip: skip }, { $limit: +perPage }, { $project: { __v: 0, password: 0 } }],
        },
      },
    ];

    const [facet] = await Client.aggregate(pipelines).exec();
    const rawClients = Array.isArray(facet?.data)
      ? (facet.data as mongoose.Document<unknown, {}, IClient>[])
      : [];
    const clients = rawClients.map((client) => {
      client.id = (client._id as Types.ObjectId).toString();
      delete client._id;
      return client;
    });
    const pagination =
      Array.isArray(facet?.pagination) && facet.pagination[0]
        ? facet.pagination[0]
        : { total: 0, page: queryData.page, perPage: perPage };

    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      data: {
        data: clients,
        pagination,
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
    const client = await Client.findById(id, undefined, { lean: true });
    if (!client) {
      return sendResponse({
        res,
        statusCode: 404,
        code: CLIENT_ERROR_CODE.CLIENT_NOT_FOUND,
        message: "Client not found",
      });
    }

    const clientData = client;
    const { _id, ...rest } = clientData;

    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      data: { id: _id, ...rest },
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
        code: CLIENT_ERROR_CODE.INVALID_REQUEST,
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
    const { _id, ...rest } = newClient.toObject();

    return sendResponse({
      res,
      statusCode: 201,
      status: API_STATUS.OK,
      data: { id: _id, ...rest },
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
    if (!updatedClient) {
      return sendResponse({
        res,
        statusCode: 404,
        code: CLIENT_ERROR_CODE.CLIENT_NOT_FOUND,
        message: "Client not found",
      });
    }

    const { _id, ...rest } = updatedClient.toObject();
    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      data: { id: _id, ...rest },
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

export const archiveClient = async (req: Request, res: Response) => {
  try {
    const { error, value: clientData } = validateArchiveClient(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        code: CLIENT_ERROR_CODE.INVALID_REQUEST,
        message: error.details[0].message,
      });
    }

    const updatedClient = await Client.findByIdAndUpdate(
      clientData.id,
      { isArchived: clientData.isArchived },
      { new: true },
    );
    if (!updatedClient) {
      return sendResponse({
        res,
        statusCode: 404,
        code: CLIENT_ERROR_CODE.CLIENT_NOT_FOUND,
        message: "Client not found",
      });
    }

    const { _id, ...rest } = updatedClient.toObject();
    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      data: { id: _id, ...rest },
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

export const changeStatusClient = async (req: Request, res: Response) => {
  const logger = controllerLogger.child({
    function: "changeStatusClient",
  });
  try {
    const { error, value: clientData } = validateChangeStatusClient(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        code: CLIENT_ERROR_CODE.INVALID_REQUEST,
        message: error.details[0].message,
      });
    }

    const updatedClient = await Client.findByIdAndUpdate(
      clientData.id,
      { status: clientData.status },
      { new: true },
    );
    if (!updatedClient) {
      return sendResponse({
        res,
        statusCode: 404,
        code: CLIENT_ERROR_CODE.CLIENT_NOT_FOUND,
        message: "Client not found",
      });
    }

    const { _id, ...rest } = updatedClient.toObject();
    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      data: { id: _id, ...rest },
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, error.stack);
    } else {
      logger.error("Unknown error", error);
    }

    return sendResponse({
      res,
      statusCode: 500,
      code: LOGIN_ERROR_CODE.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
};
