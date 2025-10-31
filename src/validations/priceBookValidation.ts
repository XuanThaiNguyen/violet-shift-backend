import Joi from "joi";
import { IPriceBookRule } from "../models/priceBookModel";

interface IAddPriceBook {
  name: string;
  rules: IPriceBookRule[];
}

interface IArchivePriceBook {
  id: string;
  isArchived: boolean;
}

interface IUpdatePriceBook {
  name?: string;
  rules?: IPriceBookRule[];
}

export const validateAddPriceBook = (data: IAddPriceBook) => {
  const schema = Joi.object<IAddPriceBook>({
    name: Joi.string().required(),
    rules: Joi.array().items(
      Joi.object<IPriceBookRule>({
        dayOfWeek: Joi.string().valid("holidays", "weekdays", "saturday", "sunday").required(),
        timeFrom: Joi.number().required(),
        timeTo: Joi.number().required(),
        perHour: Joi.number().default(0),
        referenceNumberHour: Joi.number().default(0),
        perKm: Joi.number().default(0),
        referenceNumberKm: Joi.number().default(0),
        effectiveDate: Joi.date().required(),
      }),
    ),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateArchivePriceBook = (data: IArchivePriceBook) => {
  const schema = Joi.object<IArchivePriceBook>({
    id: Joi.string().required(),
    isArchived: Joi.boolean().required(),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateUpdatePriceBook = (data: IUpdatePriceBook) => {
  const schema = Joi.object<IUpdatePriceBook>({
    name: Joi.string().optional(),
    rules: Joi.array().items(
      Joi.object<IPriceBookRule>({
        dayOfWeek: Joi.string().valid("holidays", "weekdays", "saturday", "sunday").required(),
        timeFrom: Joi.number().required(),
        timeTo: Joi.number().required(),
        perHour: Joi.number().default(0),
        referenceNumberHour: Joi.number().default(0),
        perKm: Joi.number().default(0),
        referenceNumberKm: Joi.number().default(0),
        effectiveDate: Joi.date().required(),
      }),
    ),
  });
  return schema.validate(data, { stripUnknown: true });
};
