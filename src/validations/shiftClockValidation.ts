import Joi from "joi";

interface ISignature {
  role: "staff" | "client";
  url: string;
  note?: string;
}

export const validateAddSignature = (data: ISignature) => {
  const schema = Joi.object<ISignature>({
    role: Joi.string().valid("staff", "client").required(),
    url: Joi.string().required().uri(),
    note: Joi.string().optional(),
  });
  return schema.validate(data, { stripUnknown: true });
};
