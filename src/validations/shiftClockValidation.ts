import Joi from "joi";

interface IClockOut {
  signature?: string;
  clientSignatures?: string[];
}

interface clockOutOptions {
  staffSignatureRequired: boolean;
  clientSignatureRequired: boolean;
}
export const validateClockOut = (
  data: IClockOut,
  clockOutOptions?: clockOutOptions,
) => {
  const staffSignatureRequired = clockOutOptions?.staffSignatureRequired ?? false;
  const clientSignatureRequired = clockOutOptions?.clientSignatureRequired ?? false;
  const schema = Joi.object<IClockOut>({
    signature: staffSignatureRequired
      ? Joi.string().required().uri()
      : Joi.string().optional().allow("").uri(),
    clientSignatures: clientSignatureRequired
      ? Joi.array().items(Joi.string().required().uri()).min(1)
      : Joi.array().items(Joi.string().optional().allow("").uri()),
  });
  return schema.validate(data, { stripUnknown: true });
};
