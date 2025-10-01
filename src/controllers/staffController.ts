import { Request, Response } from "express";
import User, { IUser } from "../models/userModel";
import { sendResponse } from "../utils/sendResponse";
import { ME_ERROR_CODE, STAFF_ERROR_CODE } from "../constants/errorCode";
import {
  validateInviteStaff,
  validateQueryStaff,
  IQueryStaff,
} from "../validations/staffValidation";
import { FilterQuery, PipelineStage, Types } from "mongoose";
import MemberInvitation from "../models/memberInvitation";
import { nanoid } from "nanoid";
// nanoid is ESM-only; use dynamic import in CommonJS environment

export const getStaffs = async (req: Request, res: Response) => {
  try {
    const { error, value: queryData } = validateQueryStaff(
      req.query as unknown as IQueryStaff
    );
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: STAFF_ERROR_CODE.INVALID_REQUEST,
      });
    }

    // Prepare pipeline
    const skip = (+queryData.page - 1) * queryData.perPage;
    const searchPat = new RegExp(queryData.query || "", "i");

    const pipelines: PipelineStage[] = [
      {
        $match: {
          $and: [
            {
              $or: [
                { email: { $regex: searchPat } },
                // maybe name here
              ],
            },
            queryData.role ? {
              role: {
                $eq: Types.ObjectId.createFromHexString(queryData.role),
              },
            } : {},
          ],
        },
      },
      {
        $facet: {
          pagination: [
            { $count: "total" },
            { $addFields: { page: queryData.page } },
            { $addFields: { perPage: queryData.perPage } },
          ],
          data: [
            { $skip: skip },
            { $limit: +queryData.perPage },
            { $project: { __v: 0, password: 0 } },
          ],
        },
      },
    ];

    const [facet] = await User.aggregate(pipelines).exec();
    const users = Array.isArray(facet?.data) ? facet.data : [];
    const pagination =
      Array.isArray(facet?.pagination) && facet.pagination[0]
        ? facet.pagination[0]
        : { total: 0, page: queryData.page, perPage: queryData.perPage };
    return sendResponse({
      res,
      statusCode: 200,
      message: "User fetched successfully",
      data: {
        data: users,
        pagination: pagination,
      },
    });
  } catch (error) {
    console.log("🚀 ~ error:", error)
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: STAFF_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const inviteStaff = async (req: Request, res: Response) => {
  try {
    const { error, value: invitationData } = validateInviteStaff(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: STAFF_ERROR_CODE.INVALID_REQUEST,
      });
    }
    const token = nanoid(10);

    const invitation = await MemberInvitation.updateOne(
      {
        email: invitationData.email,
        role: invitationData.role,
        token: token,
        isAccepted: false,
        invitedAt: new Date(),
        acceptedAt: null,
      },
      {
        upsert: true,
        where: {
          email: invitationData.email,
          isAccepted: false,
        },
        $set: {
          token: token,
          role: invitationData.role,
          isAccepted: false,
          invitedAt: new Date(),
          acceptedAt: null,
        },
      }
    );
    if (!invitation) {
      return sendResponse({
        res,
        statusCode: 400,
        message: "Invitation not created",
        code: STAFF_ERROR_CODE.INVITATION_NOT_CREATED,
      });
    }

    const setUpUrl = `${process.env.FRONTEND_URL}/auth/new-password?token=${token}`;
    console.log("🚀 ~ setUpUrl:", setUpUrl);

    return sendResponse({
      res,
      statusCode: 200,
      message: "Invitation created successfully",
      data: token,
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: ME_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};
