import Joi from "joi";

interface IUpdateTaskStatus {
  isCompleted: boolean;
}

export const validateTaskStatus = (data: IUpdateTaskStatus) => {
  const schema = Joi.object<IUpdateTaskStatus>({
    isCompleted: Joi.boolean().required().label("Is Completed"),
  });
  return schema.validate(data, { stripUnknown: true });
};

