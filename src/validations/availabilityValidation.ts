import Joi from "joi";
import { AvailabilityType, availabilityTypes } from "../models/availability";

interface CreateAvailability {
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

export interface GetAvailabilities {
  staff: string;
  type?: AvailabilityType;
  from: number;
  to: number;
  isApproved?: boolean;
}

export const validateCreateAvailability = (data: CreateAvailability) => {
  const schema = Joi.object<CreateAvailability>({
    repeat: Joi.object({
      pattern: Joi.string().required().label("Pattern"),
      endsAt: Joi.number().required().label("Ends At"),
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


export const validateGetAvailabilities = (data: GetAvailabilities) => {
  const schema = Joi.object<GetAvailabilities>({
    staff: Joi.string().required().label("User ID"),
    type: Joi.string()
      .valid(...availabilityTypes, '')
      .label("Type"),
    from: Joi.number().required().label("From"),
    to: Joi.number().required().label("To").min(Joi.ref("from")),
    isApproved: Joi.boolean().optional().label("Is Approved"),
  });
  return schema.validate(data, { stripUnknown: true });
};