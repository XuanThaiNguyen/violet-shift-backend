import { Request, Response } from "express";
import User, { IUser } from "../models/userModel";
import { sendResponse } from "../utils/sendResponse";
import { ME_ERROR_CODE, STAFF_ERROR_CODE } from "../constants/errorCode";
import {
  validateInviteStaff,
  validateQueryStaff,
  IQueryStaff,
  validateAcceptInvitation,
  IAcceptInvitation,
} from "../validations/staffValidation";
import mongoose, { FilterQuery, PipelineStage, Types } from "mongoose";
import MemberInvitation from "../models/memberInvitation";
import { nanoid } from "nanoid";
import RedisService from "../services/redis";
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
            queryData.role
              ? {
                  role: {
                    $eq: Types.ObjectId.createFromHexString(queryData.role),
                  },
                }
              : {},
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

    try {
      const invitation = await MemberInvitation.findOneAndUpdate(
        {
          email: invitationData.email,
          isAccepted: false,
        },
        {
          $set: {
            token: token,
            role: invitationData.role,
            isAccepted: false,
            expiresAt: new Date(Date.now() + 3 * 60 * 60 * 24 * 1000),
            acceptedAt: null,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );
      if (!invitation) {
        return sendResponse({
          res,
          statusCode: 500,
          message: "Internal server error",
          code: STAFF_ERROR_CODE.INVITATION_NOT_CREATED,
        });
      }
    } catch (error: any) {
      // Check for MongoDB duplicate key error
      if (
        error.code === 11000 ||
        error.message?.includes("duplicate key error")
      ) {
        return sendResponse({
          res,
          statusCode: 400,
          message:
            "User has already been invited or has joined the organization",
          code: STAFF_ERROR_CODE.USER_JOINED_ALREADY,
        });
      }

      return sendResponse({
        res,
        statusCode: 500,
        message: "Failed to create invitation",
        code: STAFF_ERROR_CODE.INTERNAL_SERVER_ERROR,
      });
    }

    const setUpUrl = `${process.env.APP_URL}/auth/new-password?token=${token}`;
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

export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { error, value: invitationData } = validateAcceptInvitation(
      req.query as unknown as IAcceptInvitation
    );
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: STAFF_ERROR_CODE.INVALID_REQUEST,
      });
    }

    const session = await mongoose.startSession();
    let invitationDoc: any = null;
    let userDoc: any = null;

    try {
      await session.withTransaction(async () => {
        invitationDoc = await MemberInvitation.findOneAndUpdate(
          {
            token: invitationData.token,
            isAccepted: false,
            expiresAt: { $gte: new Date() },
          },
          {
            $set: {
              isAccepted: true,
              acceptedAt: new Date(),
            },
          },
          {
            new: true,
            session,
          }
        );
  
        if (!invitationDoc) {
          throw new Error("INVALID_INVITATION");
        }
  
        userDoc = await User.findOneAndUpdate(
          { email: invitationDoc.email },
          {
            $set: {
              role: invitationDoc.role,
              email: invitationDoc.email,
            },
          },
          { upsert: true, new: true, session }
        );
  
        if (!userDoc) {
          throw new Error("USER_CREATE_FAILED");
        }
      });

    } catch (error) {
      try {
        await session.abortTransaction();
      } catch {}
      

      if (error instanceof Error && error.message === "INVALID_INVITATION") {
        return sendResponse({
          res,
          statusCode: 400,
          message: "Invalid invitation",
          code: STAFF_ERROR_CODE.INVALID_INVITATION_TOKEN,
        });
      }
      if (error instanceof Error && error.message === "USER_CREATE_FAILED") {
        return sendResponse({
          res,
          statusCode: 400,
          message: "Failed to accept invitation",
          code: STAFF_ERROR_CODE.INTERNAL_SERVER_ERROR,
        });
      }
    } finally {
      session.endSession();
    }

    const tempToken = nanoid(10);

    const redis = RedisService.getInstance();
    // for password setup, the token will be deleted after 0.5 hours
    redis.setex(
      `token:auth_temp:${tempToken}`,
      60 * 60 * 0.5,
      userDoc.email
    );

    return sendResponse({
      res,
      statusCode: 200,
      message: "Invitation accepted successfully",
      data: {
        token: tempToken,
        userId: userDoc._id,
        email: userDoc.email,
        role: userDoc.role,
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
