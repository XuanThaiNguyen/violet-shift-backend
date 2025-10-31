import type { Request, Response } from "express";
import { PRICE_BOOK_ERROR_CODE } from "../constants/errorCode";
import { IPriceBookRule, PriceBook } from "../models/priceBookModel";
import { sendResponse } from "../utils/sendResponse";
import {
  validateAddPriceBook,
  validateArchivePriceBook,
  validateUpdatePriceBook,
} from "../validations/priceBookValidation";

export const addPriceBook = async (req: Request, res: Response) => {
  try {
    const { error, value: priceBookData } = validateAddPriceBook(req.body);
    if (error)
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: PRICE_BOOK_ERROR_CODE.INVALID_REQUEST,
      });

    const existingPriceBook = await PriceBook.findOne({ name: priceBookData.name });
    if (existingPriceBook) {
      return sendResponse({
        res,
        statusCode: 400,
        message: "Price book already exists",
        code: PRICE_BOOK_ERROR_CODE.PRICE_BOOK_IS_EXISTING,
      });
    }

    const newPriceBook = await PriceBook.create(priceBookData);
    const { _id, ...rest } = newPriceBook.toObject();

    return sendResponse({
      res,
      statusCode: 201,
      message: "Price book created successfully",
      data: { id: _id, ...rest },
    });
  } catch (err) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: PRICE_BOOK_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const getPriceBooks = async (req: Request, res: Response) => {
  try {
    const priceBooks = await PriceBook.find({ isArchived: false }).lean();
    const formatPriceBooks = priceBooks.map((priceBook) => {
      return {
        id: priceBook._id.toString(),
        ...priceBook,
      };
    });

    return sendResponse({
      res,
      statusCode: 200,
      message: "Price books fetched successfully",
      data: formatPriceBooks,
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: PRICE_BOOK_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const updatePriceBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error, value: priceBookData } = validateUpdatePriceBook(req.body);

    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: PRICE_BOOK_ERROR_CODE.INVALID_REQUEST,
      });
    }

    const updatedPriceBook = await PriceBook.findByIdAndUpdate(
      id,
      { ...priceBookData },
      { new: true },
    );
    if (!updatedPriceBook) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Price book not found",
        code: PRICE_BOOK_ERROR_CODE.PRICE_BOOK_NOT_FOUND,
      });
    }

    if (priceBookData.rules && hasOverlappingRules(priceBookData.rules)) {
      return sendResponse({
        res,
        statusCode: 400,
        message: "Price book rules overlap",
        code: PRICE_BOOK_ERROR_CODE.PRICE_BOOK_RULES_OVERLAP,
      });
    }

    const { _id, ...rest } = updatedPriceBook.toObject();

    return sendResponse({
      res,
      statusCode: 200,
      message: "Price book updated successfully",
      data: {
        ...rest,
        id: _id,
      },
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: PRICE_BOOK_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const archivePricebook = async (req: Request, res: Response) => {
  try {
    const { error, value: priceBookData } = validateArchivePriceBook(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: PRICE_BOOK_ERROR_CODE.INVALID_REQUEST,
      });
    }

    const priceBook = await PriceBook.findById(priceBookData.id);
    if (!priceBook) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Price book not found",
        code: PRICE_BOOK_ERROR_CODE.PRICE_BOOK_NOT_FOUND,
      });
    }

    if (priceBookData.isArchived) {
      const activeCount = await PriceBook.countDocuments({ isArchived: false });
      if (activeCount <= 1) {
        return sendResponse({
          res,
          statusCode: 400,
          message: "At least one active price book must remain.",
          code: PRICE_BOOK_ERROR_CODE.CANNOT_ARCHIVE_LAST_ACTIVE,
        });
      }
    }

    const updatedPriceBook = await PriceBook.findByIdAndUpdate(
      priceBookData.id,
      { isArchived: priceBookData.isArchived },
      { new: true },
    );
    if (!updatedPriceBook) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Price book not found",
        code: PRICE_BOOK_ERROR_CODE.PRICE_BOOK_NOT_FOUND,
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      message: priceBookData.isArchived
        ? "Price book archived successfully"
        : "Price book unarchived successfully",
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: PRICE_BOOK_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const hasOverlappingRules = (rules: IPriceBookRule[]): boolean => {
  // Group rules by dayOfWeek
  const grouped = rules.reduce<Record<string, IPriceBookRule[]>>((acc, rule) => {
    if (!acc[rule.dayOfWeek]) acc[rule.dayOfWeek] = [];
    acc[rule.dayOfWeek].push(rule);
    return acc;
  }, {});

  // Check overlaps within each group
  for (const day in grouped) {
    const dayRules = grouped[day].sort((a, b) => a.timeFrom - b.timeFrom);

    for (let i = 0; i < dayRules.length - 1; i++) {
      const current = dayRules[i];
      const next = dayRules[i + 1];

      // Overlap condition
      if (current.timeTo > next.timeFrom) {
        return true;
      }
    }
  }

  return false;
};
