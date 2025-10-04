import Joi from "joi";

interface IAddClient {
  displayName: string;
  email: string;
}

export const validateAddClient = (data: IAddClient) => {
  const schema = Joi.object<IAddClient>({
    displayName: Joi.string().required(),
    email: Joi.string().optional(),
  });
  return schema.validate(data, { stripUnknown: true });
};
