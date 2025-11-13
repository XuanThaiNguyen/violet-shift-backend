import Joi from "joi";
import { AvailabilityType, availabilityTypes } from "../models/availability";

interface createAvailability {
  repeat?: {
    pattern: string;
    endsAt: number;
  };
  timeSegments: {
    from: number; // 0 -> 1440
    to: number; // 0 -> 1440
  }[];
  date: number; // unix timestamp
  tz: string;
  note?: string;
  type: AvailabilityType;
}

export const validateCreateAvailability = (data: createAvailability) => {
  const schema = Joi.object<createAvailability>({
    repeat: Joi.object({
      pattern: Joi.string().required().label("Pattern"),
      endsAt: Joi.number().required().label("Ends At").min(Joi.ref("date")),
    }).optional(),
    tz: Joi.string().required().label("TZ"),
    timeSegments: Joi.array()
      .items(
        Joi.object({
          from: Joi.number().required().label("From").min(0).max(1440),
          to: Joi.number().required().label("To").min(0).max(1440),
        }),
      )
      .required()
      .label("Time Segments"),
    date: Joi.number().required().label("Date"),
    note: Joi.string().optional().label("Note"),
    type: Joi.string()
      .valid(...availabilityTypes)
      .required()
      .label("Type"),
  });
  return schema.validate(data, { stripUnknown: true });
};
