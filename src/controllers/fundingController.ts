import type { Request, Response } from "express";
import { validateAddFunding, validateUpdateFunding } from "../validations/fundingValidation";
import { sendResponse } from "../utils/sendResponse";
import { FUNDING_ERROR_CODE } from "../constants/errorCode";
import { Funding } from "../models/fundingModel";

export const addFunding = async (req: Request, res: Response) => {
  try {
    const { error, value: fundingData } = validateAddFunding(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: FUNDING_ERROR_CODE.INVALID_REQUEST,
      });
    }

    const existing = await Funding.findOne({
      userId: fundingData.userId,
      name: { $regex: new RegExp(`^${fundingData.name}$`, "i") },
    });

    if (existing) {
      return sendResponse({
        res,
        statusCode: 400,
        code: FUNDING_ERROR_CODE.FUNDING_IS_EXISTING,
        message: "Funding name already exists for this user.",
      });
    }

    if (fundingData.isDefault) {
      await Funding.updateMany({ userId: fundingData.userId }, { $set: { isDefault: false } });
    }

    const newFunding = await Funding.create(fundingData);
    const { _id, ...rest } = newFunding.toObject();

    return sendResponse({
      res,
      statusCode: 201,
      message: "Funding created successfully",
      data: { id: _id, ...rest },
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: FUNDING_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const getFundings = async (req: Request, res: Response) => {
  try {
    const fundings = await Funding.find().lean();
    const formatFundings = fundings.map((funding) => {
      return {
        id: funding._id.toString(),
        ...funding,
      };
    });

    return sendResponse({
      res,
      statusCode: 200,
      message: "Fundings fetched successfully",
      data: formatFundings,
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: FUNDING_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const getFundingsByUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fundings = await Funding.find({ userId: id }).lean();
    const formatFundings = fundings.map((funding) => {
      return {
        id: funding._id.toString(),
        ...funding,
      };
    });

    return sendResponse({
      res,
      statusCode: 200,
      message: "Fundings fetched successfully",
      data: formatFundings,
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: FUNDING_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};
export const updateFunding = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error, value: fundingData } = validateUpdateFunding(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: FUNDING_ERROR_CODE.INVALID_REQUEST,
      });
    }

    const funding = await Funding.findOne({
      _id: id,
    });

    if (!funding) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Funding not found",
        code: FUNDING_ERROR_CODE.FUNDING_NOT_FOUND,
      });
    }

    if (fundingData.name) {
      const isDuplicate = await Funding.findOne({
        name: { $regex: new RegExp(`^${fundingData.name}$`, "i") },
        _id: { $ne: id },
      });

      if (isDuplicate) {
        return sendResponse({
          res,
          statusCode: 400,
          message: "Funding name already exists for this user.",
          code: FUNDING_ERROR_CODE.FUNDING_IS_EXISTING,
        });
      }
    }

    if (fundingData.isDefault) {
      await Funding.updateMany({ userId: fundingData.userId }, { $set: { isDefault: false } });
    }

    const updatedFunding = await Funding.findByIdAndUpdate(
      id,
      {
        $set: {
          name: fundingData.name,
          startDate: fundingData.startDate,
          expireDate: fundingData.expireDate,
          amount: fundingData.amount,
          isDefault: fundingData.isDefault,
        },
      },
      { new: true },
    );
    if (!updatedFunding) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Funding not found",
        code: FUNDING_ERROR_CODE.FUNDING_NOT_FOUND,
      });
    }

    const { _id, ...rest } = updatedFunding.toObject();

    return sendResponse({
      res,
      statusCode: 200,
      message: "Funding updated successfully",
      data: { id: _id, ...rest },
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: FUNDING_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const deleteFunding = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const funding = await Funding.findById(id);
    if (!funding) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Funding not found",
        code: FUNDING_ERROR_CODE.FUNDING_NOT_FOUND,
      });
    }
    await Funding.deleteOne({ _id: id });
    return sendResponse({
      res,
      statusCode: 200,
      message: "Funding deleted successfully",
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: FUNDING_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};
