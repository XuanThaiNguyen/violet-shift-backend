import Joi from "joi";

interface IClockOut {
  signature?: string;
  clientSignature?: string;
  signatureNote?: string;
  clientSignatureNote?: string;
}

interface ISignature {
  role: "staff" | "client";
  signatureUrl: string;
  note?: string;
}

interface clockOutOptions {
  staffSignatureRequired: boolean;
  clientSignatureRequired: boolean;
}
export const validateClockOut = (data: IClockOut, clockOutOptions?: clockOutOptions) => {
  const staffSignatureRequired = clockOutOptions?.staffSignatureRequired ?? false;
  const clientSignatureRequired = clockOutOptions?.clientSignatureRequired ?? false;
  const schema = Joi.object<IClockOut>({
    signature: staffSignatureRequired
      ? Joi.string().required().uri()
      : Joi.string().optional().allow("").uri(),
    clientSignature: clientSignatureRequired
      ? Joi.string().required().uri()
      : Joi.string().optional().allow("").uri(),
    signatureNote: staffSignatureRequired
      ? Joi.string().required()
      : Joi.string().optional().allow(""),
    clientSignatureNote: clientSignatureRequired
      ? Joi.string().required()
      : Joi.string().optional().allow(""),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateAddSignature = (data: ISignature) => {
  const schema = Joi.object<ISignature>({
    role: Joi.string().valid("staff", "client").required(),
    signatureUrl: Joi.string().required().uri(),
    note: Joi.string().optional(),
  });
  return schema.validate(data, { stripUnknown: true });
};
