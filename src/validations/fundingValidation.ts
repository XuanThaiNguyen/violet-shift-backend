import Joi from "joi";
import { Types } from "mongoose";

export interface IAddFunding {
  client: string;
  name: string;
  startDate?: Date;
  expireDate?: Date;
  amount?: number;
  isDefault?: boolean;
}

export interface IUpdateFunding {
  client: string;
  name?: string;
  startDate?: Date;
  expireDate?: Date;
  amount?: number;
  isDefault?: boolean;
}

const objectId = () =>
  Joi.string()
    .custom((value, helpers) => {
      if (!Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .message("Invalid ObjectId format");

export const validateAddFunding = (data: IAddFunding) => {
  const schema = Joi.object<IAddFunding>({
    client: objectId().required(),
    name: Joi.string().trim().min(2).max(20).required(),
    startDate: Joi.date().optional(),
    expireDate: Joi.date().optional(),
    amount: Joi.number().min(0).optional(),
    isDefault: Joi.boolean().optional(),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateUpdateFunding = (data: IUpdateFunding) => {
  const schema = Joi.object<IUpdateFunding>({
    client: objectId().required(),
    name: Joi.string().trim().min(2).max(20).optional(),
    startDate: Joi.date().optional(),
    expireDate: Joi.date().optional(),
    amount: Joi.number().min(0).optional(),
    isDefault: Joi.boolean().optional(),
  });
  return schema.validate(data, { stripUnknown: true });
};
