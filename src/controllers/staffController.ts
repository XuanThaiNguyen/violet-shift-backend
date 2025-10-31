import { Request, Response } from "express";
import mongoose, { FilterQuery, PipelineStage, Types } from "mongoose";
import { nanoid } from "nanoid";
import { API_STATUS } from "../constants/apiStatus";
import { ME_ERROR_CODE, STAFF_ERROR_CODE } from "../constants/errorCode";
import MemberInvitation, { IMemberInvitation } from "../models/memberInvitation";
import User, { IUser } from "../models/userModel";
import RedisService from "../services/redis";
import { logger as winstonLogger } from "../utils/logger";
import { sendResponse } from "../utils/sendResponse";
import {
  IAcceptInvitation,
  IQueryStaff,
  IQueryStaffs,
  validateAcceptInvitation,
  validateArchiveStaff,
  validateInviteStaff,
  validateQueryStaff,
  validateQueryStaffs,
  validateUpdateStaff,
} from "../validations/staffValidation";
// nanoid is ESM-only; use dynamic import in CommonJS environment

const controllerLogger = winstonLogger.child({
  controller: "staffController",
});

export const getStaffs = async (req: Request, res: Response) => {
  const logger = controllerLogger.child({
    function: "getStaffs",
  });
  try {
    const { error, value: queryData } = validateQueryStaffs(req.query as unknown as IQueryStaffs);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: STAFF_ERROR_CODE.INVALID_REQUEST,
      });
    }

    // Prepare pipeline
    const perPage = Math.min(queryData.perPage, 100);
    const skip = (+queryData.page - 1) * perPage;
    const searchPat = new RegExp(queryData.query || "", "i");
    const filterQuery: FilterQuery<IUser>[] = [
      {
        $or: [
          { email: { $regex: searchPat } },
          { fullName: { $regex: searchPat } },
          { preferredName: { $regex: searchPat } },
        ],
      },
    ];

    if (typeof queryData.archived === "boolean") {
      if (queryData.archived) {
        filterQuery.unshift({ isArchived: true });
      } else {
        filterQuery.unshift({ isArchived: { $ne: true } });
      }
    }

    if (typeof queryData.joined === "boolean") {
      if (queryData.joined) {
        filterQuery.unshift({ joinedAt: { $gt: new Date(0) } });
      } else {
        filterQuery.unshift({ joinedAt: { $not: { $gt: new Date(0) } } });
      }
    }

    if (queryData["roles[]"]) {
      filterQuery.push({
        role: {
          $in: queryData["roles[]"]?.map((role) => Types.ObjectId.createFromHexString(role)),
        },
      });
    }

    if (queryData["employmentTypes[]"]) {
      filterQuery.push({
        employmentType: {
          $in: queryData["employmentTypes[]"]?.map((employmentType) => employmentType),
        },
      });
    }

    const pipelines: PipelineStage[] = [
      {
        $match: {
          $and: filterQuery,
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

    const [facet] = await User.aggregate(pipelines).exec();
    const rawUsers = Array.isArray(facet?.data)
      ? (facet.data as mongoose.Document<unknown, {}, IUser>[])
      : [];
    const users = rawUsers.map((user) => {
      user.id = (user._id as Types.ObjectId).toString();
      delete user._id;
      return user;
    });
    const pagination =
      Array.isArray(facet?.pagination) && facet.pagination[0]
        ? facet.pagination[0]
        : { total: 0, page: queryData.page, perPage: perPage };
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
    if (error instanceof Error) {
      logger.error(error.message, error.stack);
    } else {
      logger.error("Unknown error", error);
    }
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: STAFF_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const getArchivedStaffs = async (req: Request, res: Response) => {
  try {
    const { error, value: queryData } = validateQueryStaffs(req.query as unknown as IQueryStaffs);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: STAFF_ERROR_CODE.INVALID_REQUEST,
      });
    }

    // Prepare pipeline
    const perPage = Math.min(queryData.perPage, 100);
    const skip = (+queryData.page - 1) * perPage;
    const searchPat = new RegExp(queryData.query || "", "i");

    const pipelines: PipelineStage[] = [
      {
        $match: {
          $and: [
            { isArchived: { $ne: false } },
            {
              $or: [
                { email: { $regex: searchPat } },
                { fullName: { $regex: searchPat } },
                { preferredName: { $regex: searchPat } },
              ],
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

    const [facet] = await User.aggregate(pipelines).exec();
    const rawUsers = Array.isArray(facet?.data)
      ? (facet.data as mongoose.Document<unknown, {}, IUser>[])
      : [];
    const users = rawUsers.map((user) => {
      user.id = (user._id as Types.ObjectId).toString();
      delete user._id;
      return user;
    });
    const pagination =
      Array.isArray(facet?.pagination) && facet.pagination[0]
        ? facet.pagination[0]
        : { total: 0, page: queryData.page, perPage: perPage };
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
    console.log("errorrrrr", error);

    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: STAFF_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const getStaff = async (req: Request, res: Response) => {
  try {
    const { error, value: queryData } = validateQueryStaff(req.params as unknown as IQueryStaff);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: STAFF_ERROR_CODE.INVALID_REQUEST,
      });
    }

    const user = await User.findById(queryData.staffId, undefined, { lean: true });
    if (!user) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "User not found",
        code: STAFF_ERROR_CODE.USER_NOT_FOUND,
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      message: "User fetched successfully",
      data: {
        id: user._id,
        ...user,
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

export const updateStaff = async (req: Request, res: Response) => {
  try {
    const staffId = req.params.staffId as string;
    const { error, value: staffData } = validateUpdateStaff(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: STAFF_ERROR_CODE.INVALID_REQUEST,
      });
    }

    const user = await User.findOneAndUpdate(
      { _id: staffId },
      { $set: staffData },
      { new: true, lean: true },
    );
    if (!user) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "User not found",
        code: STAFF_ERROR_CODE.USER_NOT_FOUND,
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      message: "User updated successfully",
      data: {
        id: user._id,
        ...user,
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
  const logger = controllerLogger.child({
    function: "inviteStaff",
  });
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

    const session = await mongoose.startSession();
    let userDoc: mongoose.Document<unknown, {}, IUser> | null = null;
    let invitationDoc: mongoose.Document<unknown, {}, IMemberInvitation> | null = null;
    try {
      await session.withTransaction(async () => {
        invitationDoc = await MemberInvitation.findOneAndUpdate(
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
            session,
          },
        );
        if (!invitationDoc) {
          throw new Error("INVITATION_NOT_CREATED");
        }

        userDoc = await User.findOneAndUpdate(
          { email: invitationData.email, joinedAt: null },
          {
            $set: {
              role: invitationData.role,
              email: invitationData.email,
              salutation: invitationData.salutation,
              mobileNumber: invitationData.mobileNumber,
              phoneNumber: invitationData.phoneNumber,
              address: invitationData.address,
              gender: invitationData.gender,
              birthdate: invitationData.birthdate,
              employmentType: invitationData.employmentType,
              preferredName: invitationData.preferredName,
              firstName: invitationData.firstName,
              lastName: invitationData.lastName,
              middleName: invitationData.middleName,
              fullName: invitationData.middleName
                ? `${invitationData.firstName} ${invitationData.middleName} ${invitationData.lastName}`
                : `${invitationData.firstName} ${invitationData.lastName}`,
            },
          },
          { upsert: true, new: true, session },
        );

        if (!userDoc) {
          throw new Error("USER_CREATE_FAILED");
        }
      });
    } catch (error: any) {
      try {
        await session.abortTransaction();
      } catch {}

      // Check for MongoDB duplicate key error
      if (error.code === 11000 || error.message?.includes("duplicate key error")) {
        return sendResponse({
          res,
          statusCode: 400,
          message: "User has already been invited or has joined the organization",
          code: STAFF_ERROR_CODE.USER_JOINED_ALREADY,
        });
      }

      if (error instanceof Error && error.message === "INVITATION_NOT_CREATED") {
        return sendResponse({
          res,
          statusCode: 400,
          message: "Failed to create invitation",
          code: STAFF_ERROR_CODE.INTERNAL_SERVER_ERROR,
        });
      }

      if (error instanceof Error && error.message === "USER_CREATE_FAILED") {
        return sendResponse({
          res,
          statusCode: 400,
          message: "Failed to create user",
          code: STAFF_ERROR_CODE.INTERNAL_SERVER_ERROR,
        });
      }

      return sendResponse({
        res,
        statusCode: 500,
        message: "Failed to create invitation",
        code: STAFF_ERROR_CODE.INTERNAL_SERVER_ERROR,
      });
    } finally {
      session.endSession();
    }

    const setUpUrl = `${process.env.APP_URL}/auth/accept-invitation?token=${token}`;
    logger.info(`Set up URL: ${setUpUrl}`);

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
  const logger = controllerLogger.child({
    function: "acceptInvitation",
  });
  try {
    const { error, value: invitationData } = validateAcceptInvitation(
      req.query as unknown as IAcceptInvitation,
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
          },
        );

        if (!invitationDoc) {
          throw new Error("INVALID_INVITATION");
        }

        userDoc = await User.findOneAndUpdate(
          { email: invitationDoc.email },
          { $set: { joinedAt: new Date(), role: invitationDoc.role } },
          { session },
        );

        if (!userDoc) {
          throw new Error("USER_NOT_FOUND");
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
    redis.setex(`token:auth_temp:${tempToken}`, 60 * 60 * 0.5, userDoc._id.toString());

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
    if (error instanceof Error) {
      logger.error(error.message, error.stack);
    } else {
      logger.error("Unknown error", error);
    }
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: STAFF_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const archiveStaff = async (req: Request, res: Response) => {
  try {
    const { error, value: staffData } = validateArchiveStaff(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        code: STAFF_ERROR_CODE.INVALID_REQUEST,
        message: error.details[0].message,
      });
    }

    const updatedClient = await User.findByIdAndUpdate(
      staffData.id,
      { isArchived: staffData.isArchived },
      { new: true },
    );
    if (!updatedClient) {
      return sendResponse({
        res,
        statusCode: 404,
        code: STAFF_ERROR_CODE.USER_NOT_FOUND,
        message: "Staff not found",
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
      code: STAFF_ERROR_CODE.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
};
