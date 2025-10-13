import Joi from "joi";
import { Allowances, ShiftTypes, ShiftTypesEnum } from "../models/shifts/shiftModel";
import { AllowancesEnum } from "../models/shifts/shiftModel";
import { validateCronExpression } from "cron";
import { PaymentMethods, PaymentMethodsEnum } from "../models/shifts/staffScheduleModel";

export type ShiftTask = {
  name: string;
  description: string;
  isMandatory: boolean;
  isCompleted: boolean;
};

export type ClientSchedule = {
  client: string;
  timeFrom: number; // unix timestamp
  timeTo: number; // unix 
};

export type StaffSchedule = {
  staff: string;
  paymentMethod: PaymentMethodsEnum;
  timeFrom: number; // unix timestamp
  timeTo: number; // unix timestamp
};

type Repeat = {
  pattern: string;
  endDate: number; // unix timestamp
  tz: string; // timezone
};

export interface IAddShift {
  // client schedules
  clientSchedules: ClientSchedule[];

  // staff schedules
  staffSchedules: StaffSchedule[];

  // instruction
  instruction: string; // rich text

  // tasks
  tasks: ShiftTask[];

  // shift information
  shiftType: ShiftTypesEnum;
  additionalShiftTypes: ShiftTypesEnum[];
  allowances: AllowancesEnum[];
  mileageInvoicing: string[]; // client ids
  shiftMileage: number;
  additionalCost: number;
  ignoreStaffCount: boolean;
  confirmationRequired: boolean;
  acceptedDeclinable: boolean;

  // time and location
  timeFrom: number; // unix timestamp
  timeTo: number; // unix timestamp
  breakTime: number; // minutes
  address: string; // address
  unitNumber: string; // unit/department/door number
  bonus: number; // bonus
  dropOffAddress?: string; // drop off address
  dropOffUnitNumber?: string; // drop off unit/department/door number
  repeat: Repeat;

  // mileage information
  mileageCap: number; // miles
  mileage: number; // miles
  isCompanyVehicle: boolean;

  // clock-out information
  clientClockOutRequired: boolean;
  staffClockOutRequired: boolean;
  clientClockOutTime: number; // unix timestamp
  staffClockOutTime: number; // unix timestamp
  // Todo: add more status later
}

export interface IQueryShift {
  shiftId: string;
}

export const validateAddShift = (data: IAddShift) => {
  const repeatSchema = Joi.object<Repeat>({
    pattern: Joi.string()
      .required()
      .custom((value, helper) => {
        const { valid, error } = validateCronExpression(value);
        if (!valid) {
          console.error({ error });
          return helper.error("Invalid cron expression");
        }
        return value;
      }),
    endDate: Joi.number().required(),
    tz: Joi.string().required(),
  });

  const clientScheduleSchema = Joi.object<ClientSchedule>({
    client: Joi.string().required(),
    timeFrom: Joi.number().required(),
    timeTo: Joi.number().required(),
  });

  const staffScheduleSchema = Joi.object<StaffSchedule>({
    staff: Joi.string().required(),
    paymentMethod: Joi.string().valid(...PaymentMethods).required(),
    timeFrom: Joi.number().required(),
    timeTo: Joi.number().required(),
  });

  const shiftTaskSchema = Joi.object<ShiftTask>({
    name: Joi.string().required(),
    description: Joi.string().allow(""),
    isMandatory: Joi.boolean().default(false),
    isCompleted: Joi.boolean().default(false),
  });

  const schema = Joi.object<IAddShift>({
    // client schedules
    clientSchedules: Joi.array().items(clientScheduleSchema).required(),

    // staff schedules
    staffSchedules: Joi.array().items(staffScheduleSchema).required(),

    // instruction
    instruction: Joi.string().allow(""),

    // tasks
    tasks: Joi.array().items(shiftTaskSchema).default([]),

    // repeat
    repeat: repeatSchema.optional(),

    // shift information
    shiftType: Joi.string()
      .valid(...ShiftTypes)
      .required(),
    additionalShiftTypes: Joi.array()
      .items(Joi.string().valid(...ShiftTypes))
      .required(),
    allowances: Joi.array()
      .items(Joi.string().valid(...Allowances))
      .required(),
    mileageInvoicing: Joi.array().items(Joi.string()).optional(),
    shiftMileage: Joi.number().optional(),
    additionalCost: Joi.number().optional(),
    ignoreStaffCount: Joi.boolean().default(false),
    confirmationRequired: Joi.boolean().default(false),
    acceptedDeclinable: Joi.boolean().default(false),

    // time and location
    timeFrom: Joi.number().required(),
    timeTo: Joi.number().required(),
    breakTime: Joi.number().optional(),
    address: Joi.string().optional().allow(""),
    unitNumber: Joi.string().optional().allow(""),
    bonus: Joi.number().optional(),
    dropOffAddress: Joi.string().optional().allow(""),
    dropOffUnitNumber: Joi.string().optional().allow(""),

    // mileage information
    mileageCap: Joi.number().optional(),
    mileage: Joi.number().optional(),
    isCompanyVehicle: Joi.boolean().default(false),

    // clock-out information
    clientClockOutRequired: Joi.boolean().default(false),
    staffClockOutRequired: Joi.boolean().default(false),
    clientClockOutTime: Joi.number().optional(),
    staffClockOutTime: Joi.number().optional(),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateQueryShift = (data: IQueryShift) => {
  const schema = Joi.object<IQueryShift>({
    shiftId: Joi.string().required(),
  });
  return schema.validate(data, { stripUnknown: true });
};
