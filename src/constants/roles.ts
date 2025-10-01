export const ROLE_IDS = {
  CARER: "66fe5a3e9a0c8a0012a00001",
  HR: "66fe5a3e9a0c8a0012a00002",
  ADMIN: "66fe5a3e9a0c8a0012a00003",
  COORDINATOR: "66fe5a3e9a0c8a0012a00004",
  OFFICE_SUPPORT: "66fe5a3e9a0c8a0012a00005",
} as const;

export const ROLES = [
  { _id: ROLE_IDS.CARER, name: "Carer", description: "Carer" },
  { _id: ROLE_IDS.HR, name: "HR", description: "HR" },
  { _id: ROLE_IDS.ADMIN, name: "Admin", description: "Admin" },
  { _id: ROLE_IDS.COORDINATOR, name: "Coordinator", description: "Coordinator" },
  { _id: ROLE_IDS.OFFICE_SUPPORT, name: "Office Support", description: "Office Support" },
];

export default ROLES;