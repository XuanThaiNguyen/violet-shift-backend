import { IStaffSchedule } from "../../models/shifts/staffScheduleModel";
import { AuthRequest } from "../../middleware/type";

export type AuthRequestWithSchedule = AuthRequest & {
  schedule: IStaffSchedule;
};
