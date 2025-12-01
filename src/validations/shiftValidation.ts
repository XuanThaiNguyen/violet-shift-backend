import { validateCronExpression } from "cron";
import Joi from "joi";
import {
  Allowances,
  AllowancesEnum,
  ShiftTypes,
  ShiftTypesEnum,
} from "../models/shifts/shiftModel";
import { ShiftProgressTypes, ShiftProgressTypesEnum } from "../models/shifts/shiftProgressModel";
import { PaymentMethods, PaymentMethodsEnum } from "../models/shifts/staffScheduleModel";
import { isValidTimeZone } from "../utils/tz";
import { validateRRule } from "../utils/scheduler";

export type ShiftProgress = {
  description: string;
  url?: string[];
  client: string;
  shiftProgressType: ShiftProgressTypesEnum;
  metadata: Record<string, string>;
};

export type ShiftTask = {
  repetitiveId?: string; // for shift repeat bulk update / deletion
  name: string;
  description: string;
  isMandatory: boolean;
  isCompleted: boolean;
};

export type ClientSchedule = {
  repetitiveId?: string; // for shift repeat bulk update / deletion
  client: string;
  priceBook: string;
  fund: string;
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
  timezone?: string; // timezone
  repeat?: Repeat;

  // mileage information
  mileageCap: number; // miles
  mileage: number; // miles
  isCompanyVehicle: boolean;

  // clock-out information
  clientClockOutRequired: boolean;
  staffClockOutRequired: boolean;

  // Todo: add more status later
}

export interface IBulkDeleteShift {
  from: number; // unix timestamp
  to: number; // unix timestamp
}

export interface IUpdateShift {
  // client schedules
  clientSchedules: {
    add: ClientSchedule[];
    delete: string[]; // repetitiveIds
    update: ClientSchedule[];
  };

  // staff schedules
  staffSchedules: {
    add: StaffSchedule[];
    delete: string[]; // staff ids
    update: StaffSchedule[];
  };

  // tasks
  tasks: {
    add: ShiftTask[];
    delete: string[]; // repetitiveIds
    update: ShiftTask[];
  };

  // instruction
  instruction: string; // rich text

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
  timezone: string; // timezone

  // mileage information
  mileageCap: number; // miles
  mileage: number; // miles
  isCompanyVehicle: boolean;

  // clock-out information
  clientClockOutRequired: boolean;
  staffClockOutRequired: boolean;
  // Todo: add more status later
}

export interface IBulkUpdateShift {
  payload: IUpdateShift;
  from: number;
  to: number;
}

export interface IQueryShift {
  shiftId: string;
}

const clientScheduleSchema = Joi.object<ClientSchedule>({
  client: Joi.string().required(),
  priceBook: Joi.string().required(),
  fund: Joi.string().required(),
  timeFrom: Joi.number().required(),
  timeTo: Joi.number().required().min(Joi.ref("timeFrom")),
});

const staffScheduleSchema = Joi.object<StaffSchedule>({
  staff: Joi.string().required(),
  paymentMethod: Joi.string()
    .valid(...PaymentMethods)
    .required(),
  timeFrom: Joi.number().required(),
  timeTo: Joi.number().required().min(Joi.ref("timeFrom")),
});

const shiftTaskSchema = Joi.object<ShiftTask>({
  name: Joi.string().required(),
  description: Joi.string().allow(""),
  isMandatory: Joi.boolean().default(false),
  isCompleted: Joi.boolean().default(false),
});

const repeatSchema = Joi.object<Repeat>({
  pattern: Joi.string()
    .required()
    .custom((value, helper) => {
      const { valid, error } = validateRRule(value);
      if (!valid) {
        return helper.error(error!);
      }
      return value;
    }),
  endDate: Joi.number().required(),
  tz: Joi.string().required(),
});

export const validateShiftProgress = (data: ShiftProgress) => {
  const expenseSchema = Joi.object({
    expense: Joi.string().required(),
  });
  const mileageSchema = Joi.object({
    mileage: Joi.string().required(),
  });

  const schema = Joi.object<ShiftProgress>({
    description: Joi.string().required(),
    url: Joi.array().items(Joi.string()).optional(),
    client: Joi.string().required(),
    shiftProgressType: Joi.string()
      .valid(...ShiftProgressTypes)
      .required(),
    metadata: Joi.when("shiftProgressType", {
      switch: [
        { is: "expense", then: expenseSchema.required() },
        { is: "mileage", then: mileageSchema.required() },
      ],
      otherwise: Joi.forbidden(),
    }),
  });

  return schema.validate(data, { stripUnknown: true });
};

export const validateAddShift = (data: IAddShift) => {
  const schema = Joi.object<IAddShift>({
    // client schedules
    clientSchedules: Joi.array().items(clientScheduleSchema).optional().default([]),

    // staff schedules
    staffSchedules: Joi.array().items(staffScheduleSchema).optional().default([]),

    // tasks
    tasks: Joi.array().items(shiftTaskSchema).default([]),

    // repeat
    repeat: repeatSchema.optional(),

    // instruction
    instruction: Joi.string().allow(""),

    // shift information
    shiftType: Joi.string()
      .valid(...ShiftTypes)
      .optional(),
    additionalShiftTypes: Joi.array()
      .items(Joi.string().valid(...ShiftTypes))
      .optional(),
    allowances: Joi.array()
      .items(Joi.string().valid(...Allowances))
      .optional(),
    mileageInvoicing: Joi.array().items(Joi.string()).optional(),
    shiftMileage: Joi.number().optional(),
    additionalCost: Joi.number().optional(),
    ignoreStaffCount: Joi.boolean().optional(),
    confirmationRequired: Joi.boolean().optional(),
    acceptedDeclinable: Joi.boolean().optional(),

    // time and location
    timeFrom: Joi.number().required(),
    timeTo: Joi.number().required().min(Joi.ref("timeFrom")),
    breakTime: Joi.number().optional(),
    address: Joi.string().optional().allow(""),
    unitNumber: Joi.string().optional().allow(""),
    bonus: Joi.number().optional(),
    dropOffAddress: Joi.string().optional().allow(""),
    dropOffUnitNumber: Joi.string().optional().allow(""),
    timezone: Joi.string()
      .default(process.env.TZ || "Australia/Sydney")
      .custom((value, helper) => {
        if (!isValidTimeZone(value)) {
          return helper.error("Invalid timezone");
        }
        return value;
      }),

    // mileage information
    mileageCap: Joi.number().optional(),
    mileage: Joi.number().optional(),
    isCompanyVehicle: Joi.boolean().optional(),

    // clock-out information
    clientClockOutRequired: Joi.boolean().optional(),
    staffClockOutRequired: Joi.boolean().optional(),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateQueryShift = (data: IQueryShift) => {
  const schema = Joi.object<IQueryShift>({
    shiftId: Joi.string().required(),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateBulkDeleteShift = (data: IBulkDeleteShift) => {
  const yesterday = Date.now() - 86400000;
  const schema = Joi.object<IBulkDeleteShift>({
    from: Joi.number().required().min(yesterday),
    to: Joi.number().required().min(Joi.ref("from")),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateUpdateShift = (data: IUpdateShift) => {
  const updateClientScheduleSchema = clientScheduleSchema.keys({
    repetitiveId: Joi.string().required(),
  });

  const updateShiftTaskSchema = shiftTaskSchema.keys({
    repetitiveId: Joi.string().required(),
  });

  const clientSchema = Joi.object<{
    add: ClientSchedule[];
    delete: string[]; // repetitiveIds
    update: ClientSchedule[];
  }>({
    add: Joi.array().items(clientScheduleSchema).optional().default([]),
    delete: Joi.array().items(Joi.string()).optional().default([]),
    update: Joi.array().items(updateClientScheduleSchema).optional().default([]),
  });

  const staffSchema = Joi.object<{
    add: StaffSchedule[];
    delete: string[]; // staff ids
    update: StaffSchedule[];
  }>({
    add: Joi.array().items(staffScheduleSchema).optional().default([]),
    delete: Joi.array().items(Joi.string()).optional().default([]),
    update: Joi.array().items(staffScheduleSchema).optional().default([]),
  });

  const taskSchema = Joi.object<{
    add: ShiftTask[];
    delete: string[]; // repetitiveIds
    update: ShiftTask[];
  }>({
    add: Joi.array().items(shiftTaskSchema).optional().default([]),
    delete: Joi.array().items(Joi.string()).optional().default([]),
    update: Joi.array().items(updateShiftTaskSchema).optional().default([]),
  });

  const schema = Joi.object<IUpdateShift>({
    clientSchedules: clientSchema,
    staffSchedules: staffSchema,
    tasks: taskSchema,

    // instruction
    instruction: Joi.string().optional().allow(""),

    // shift information
    shiftType: Joi.string()
      .valid(...ShiftTypes)
      .optional(),
    additionalShiftTypes: Joi.array()
      .items(Joi.string().valid(...ShiftTypes))
      .optional(),
    allowances: Joi.array()
      .items(Joi.string().valid(...Allowances))
      .optional(),
    mileageInvoicing: Joi.array().items(Joi.string()).optional(),
    shiftMileage: Joi.number().optional(),
    additionalCost: Joi.number().optional(),
    ignoreStaffCount: Joi.boolean().optional(),
    confirmationRequired: Joi.boolean().optional(),
    acceptedDeclinable: Joi.boolean().optional(),

    // time and location
    timeFrom: Joi.number().required(),
    timeTo: Joi.number().required().min(Joi.ref("timeFrom")),
    breakTime: Joi.number().optional(),
    address: Joi.string().optional().allow(""),
    unitNumber: Joi.string().optional().allow(""),
    bonus: Joi.number().optional(),
    dropOffAddress: Joi.string().optional().allow(""),
    dropOffUnitNumber: Joi.string().optional().allow(""),
    timezone: Joi.string()
      .optional()
      .custom((value, helper) => {
        if (value && !isValidTimeZone(value)) {
          return helper.error("Invalid timezone");
        }
        return value;
      }),

    // mileage information
    mileageCap: Joi.number().optional(),
    mileage: Joi.number().optional(),
    isCompanyVehicle: Joi.boolean().optional(),

    // clock-out information
    clientClockOutRequired: Joi.boolean().optional(),
    staffClockOutRequired: Joi.boolean().optional(),
  });

  return schema.validate(data, { stripUnknown: true });
};

export const validateBulkUpdateShift = (data: IBulkUpdateShift) => {
  const updateClientScheduleSchema = clientScheduleSchema.keys({
    repetitiveId: Joi.string().required(),
  });

  const updateShiftTaskSchema = shiftTaskSchema.keys({
    repetitiveId: Joi.string().required(),
  });

  const clientSchema = Joi.object<{
    add: ClientSchedule[];
    delete: string[]; // repetitiveIds
    update: ClientSchedule[];
  }>({
    add: Joi.array().items(clientScheduleSchema).optional().default([]),
    delete: Joi.array().items(Joi.string()).optional().default([]),
    update: Joi.array().items(updateClientScheduleSchema).optional().default([]),
  });

  const staffSchema = Joi.object<{
    add: StaffSchedule[];
    delete: string[]; // staff ids
    update: StaffSchedule[];
  }>({
    add: Joi.array().items(staffScheduleSchema).optional().default([]),
    delete: Joi.array().items(Joi.string()).optional().default([]),
    update: Joi.array().items(staffScheduleSchema).optional().default([]),
  });

  const taskSchema = Joi.object<{
    add: ShiftTask[];
    delete: string[]; // repetitiveIds
    update: ShiftTask[];
  }>({
    add: Joi.array().items(shiftTaskSchema).optional().default([]),
    delete: Joi.array().items(Joi.string()).optional().default([]),
    update: Joi.array().items(updateShiftTaskSchema).optional().default([]),
  });

  const updateSchema = Joi.object<IUpdateShift>({
    clientSchedules: clientSchema,
    staffSchedules: staffSchema,
    tasks: taskSchema,

    // instruction
    instruction: Joi.string().optional().allow(""),

    // shift information
    shiftType: Joi.string()
      .valid(...ShiftTypes)
      .optional(),
    additionalShiftTypes: Joi.array()
      .items(Joi.string().valid(...ShiftTypes))
      .optional(),
    allowances: Joi.array()
      .items(Joi.string().valid(...Allowances))
      .optional(),
    mileageInvoicing: Joi.array().items(Joi.string()).optional(),
    shiftMileage: Joi.number().optional(),
    additionalCost: Joi.number().optional(),
    ignoreStaffCount: Joi.boolean().optional(),
    confirmationRequired: Joi.boolean().optional(),
    acceptedDeclinable: Joi.boolean().optional(),

    // time and location
    timeFrom: Joi.number().required(),
    timeTo: Joi.number().required().min(Joi.ref("timeFrom")),
    breakTime: Joi.number().optional(),
    address: Joi.string().optional().allow(""),
    unitNumber: Joi.string().optional().allow(""),
    bonus: Joi.number().optional(),
    dropOffAddress: Joi.string().optional().allow(""),
    dropOffUnitNumber: Joi.string().optional().allow(""),
    timezone: Joi.string()
      .required()
      .custom((value, helper) => {
        if (value && !isValidTimeZone(value)) {
          return helper.error("Invalid timezone");
        }
        return value;
      }),

    // mileage information
    mileageCap: Joi.number().optional(),
    mileage: Joi.number().optional(),
    isCompanyVehicle: Joi.boolean().optional(),

    // clock-out information
    clientClockOutRequired: Joi.boolean().optional(),
    staffClockOutRequired: Joi.boolean().optional(),
  });

  const schema = Joi.object<IBulkUpdateShift>({
    payload: updateSchema,
    from: Joi.number().required(),
    to: Joi.number().required().min(Joi.ref("from")),
  });

  return schema.validate(data, { stripUnknown: true });
};
