import {
  Employee,
  AttendanceLog,
  Branch,
  Department,
  Position,
  Shift,
} from "../models/index.js";

// ===== EMPLOYEES =====
export async function getEmployees(filters = {}) {
  const query = {};
  if (filters.status) {
    query.status = filters.status;
  } else {
    query.status = "active";
  }
  if (filters.branch_id) query.branch = filters.branch_id;
  if (filters.department_id) query.department = filters.department_id;
  if (filters.search) {
    query.$or = [
      { firstName: new RegExp(filters.search, "i") },
      { lastName: new RegExp(filters.search, "i") },
      { deviceId: new RegExp(filters.search, "i") },
    ];
  }

  return Employee.find(query)
    .populate("branch", "name")
    .populate("department", "name")
    .populate("position", "name")
    .populate("shift", "name startTime endTime gracePeriodMinutes")
    .sort({ lastName: 1, firstName: 1 })
    .lean();
}

export async function getEmployeeById(id) {
  return Employee.findById(id)
    .populate("branch", "name")
    .populate("department", "name")
    .populate("position", "name")
    .populate(
      "shift",
      "name startTime endTime gracePeriodMinutes breakStart breakEnd workDays"
    )
    .lean();
}

export async function getEmployeeByDeviceId(deviceId) {
  return Employee.findOne({ deviceId })
    .populate("branch", "name")
    .populate("department", "name")
    .populate("position", "name")
    .populate(
      "shift",
      "name startTime endTime gracePeriodMinutes breakStart breakEnd workDays"
    )
    .lean();
}

export async function createEmployee(data) {
  const employee = new Employee({
    deviceId: data.deviceId,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    email: data.email,
    photoUrl: data.photoUrl,
    branch: data.branch,
    department: data.department,
    position: data.position,
    shift: data.shift,
    hireDate: data.hireDate || new Date(),
    status: data.status || "active",
  });
  await employee.save();
  return getEmployeeById(employee._id);
}

export async function updateEmployee(id, data) {
  const allowed = [
    "deviceId",
    "firstName",
    "lastName",
    "phone",
    "email",
    "photoUrl",
    "branch",
    "department",
    "position",
    "shift",
    "hireDate",
    "status",
  ];
  const updateData = {};
  for (const key of allowed) {
    if (data[key] !== undefined) updateData[key] = data[key];
  }

  const result = await Employee.findByIdAndUpdate(id, updateData, {
    new: true,
  });
  if (!result) return null;
  return getEmployeeById(id);
}

export async function deleteEmployee(id) {
  const result = await Employee.findByIdAndDelete(id);
  return !!result;
}

// ===== ATTENDANCE =====
export async function getAttendanceLogs(filters = {}) {
  const query = {};
  if (filters.employee_id) query.employee = filters.employee_id;
  if (filters.date) {
    const start = new Date(filters.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.date);
    end.setHours(23, 59, 59, 999);
    query.eventTime = { $gte: start, $lte: end };
  }
  if (filters.start_date || filters.end_date) {
    query.eventTime = query.eventTime || {};
    if (filters.start_date) {
      const s = new Date(filters.start_date);
      s.setHours(0, 0, 0, 0);
      query.eventTime.$gte = s;
    }
    if (filters.end_date) {
      const e = new Date(filters.end_date);
      e.setHours(23, 59, 59, 999);
      query.eventTime.$lte = e;
    }
  }
  if (filters.status) query.status = filters.status;

  let q = AttendanceLog.find(query)
    .populate({
      path: "employee",
      select: "firstName lastName photoUrl deviceId",
      populate: [
        { path: "department", select: "name" },
        { path: "shift", select: "name" },
      ],
    })
    .sort({ eventTime: -1 });

  if (filters.limit) q = q.limit(filters.limit);
  return q.lean();
}

export async function createAttendanceLog(data) {
  const log = new AttendanceLog({
    employee: data.employee,
    deviceId: data.deviceId,
    deviceSerial: data.deviceSerial,
    eventTime: data.eventTime,
    direction: data.direction || "in",
    status: data.status || "on_time",
    lateMinutes: data.lateMinutes || 0,
  });
  await log.save();
  return log._id;
}

export async function getTodayStats(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const totalEmployees = await Employee.countDocuments({ status: "active" });
  const arrivedToday = await AttendanceLog.distinct("employee", {
    eventTime: { $gte: startOfDay, $lte: endOfDay },
    direction: "in",
  });
  const lateToday = await AttendanceLog.distinct("employee", {
    eventTime: { $gte: startOfDay, $lte: endOfDay },
    direction: "in",
    status: "late",
  });

  const arrivedCount = arrivedToday.length;
  const lateCount = lateToday.length;
  const onTimeCount = arrivedCount - lateCount;
  const absentCount = totalEmployees - arrivedCount;

  return {
    total: totalEmployees,
    arrived: arrivedCount,
    on_time: onTimeCount,
    late: lateCount,
    absent: absentCount,
    arrived_percent:
      totalEmployees > 0
        ? Math.round((arrivedCount / totalEmployees) * 100)
        : 0,
    late_percent:
      arrivedCount > 0 ? Math.round((lateCount / arrivedCount) * 100) : 0,
    absent_percent:
      totalEmployees > 0
        ? Math.round((absentCount / totalEmployees) * 100)
        : 0,
  };
}

export async function getEmployeeAttendanceForMonth(employeeId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const logs = await AttendanceLog.find({
    employee: employeeId,
    eventTime: { $gte: startDate, $lte: endDate },
  })
    .sort({ eventTime: 1 })
    .lean();

  const grouped = {};
  for (const log of logs) {
    const dateKey = log.eventTime.toISOString().split("T")[0];
    if (!grouped[dateKey]) {
      grouped[dateKey] = {
        clockIn: null,
        clockOut: null,
        status: "on_time",
        lateMinutes: 0,
      };
    }
    if (log.direction === "in" && !grouped[dateKey].clockIn) {
      grouped[dateKey].clockIn = log.eventTime.toTimeString().slice(0, 5);
      grouped[dateKey].status = log.status;
      grouped[dateKey].lateMinutes += log.lateMinutes;
    }
    if (log.direction === "out") {
      grouped[dateKey].clockOut = log.eventTime.toTimeString().slice(0, 5);
    }
  }

  return Object.entries(grouped).map(([date, data]) => ({
    date,
    clock_in: data.clockIn,
    clock_out: data.clockOut,
    status: data.status,
    total_late_minutes: data.lateMinutes,
  }));
}

// ===== SHIFTS =====
export async function getShifts() {
  return Shift.find().sort({ name: 1 }).lean();
}
export async function getShiftById(id) {
  return Shift.findById(id).lean();
}
export async function createShift(data) {
  const shift = new Shift({
    name: data.name,
    startTime: data.startTime,
    endTime: data.endTime,
    gracePeriodMinutes: data.gracePeriodMinutes ?? 15,
    breakStart: data.breakStart,
    breakEnd: data.breakEnd,
    workDays: data.workDays || [
      { dayOfWeek: 0, isWorkingDay: false },
      { dayOfWeek: 1, isWorkingDay: true },
      { dayOfWeek: 2, isWorkingDay: true },
      { dayOfWeek: 3, isWorkingDay: true },
      { dayOfWeek: 4, isWorkingDay: true },
      { dayOfWeek: 5, isWorkingDay: true },
      { dayOfWeek: 6, isWorkingDay: false },
    ],
  });
  await shift.save();
  return shift;
}
export async function updateShift(id, data) {
  return Shift.findByIdAndUpdate(id, data, { new: true }).lean();
}
export async function deleteShift(id) {
  return Shift.findByIdAndDelete(id);
}

// ===== BRANCHES =====
export async function getBranches() {
  return Branch.find().sort({ name: 1 }).lean();
}
export async function createBranch(data) {
  const branch = new Branch({ name: data.name, address: data.address });
  await branch.save();
  return branch;
}
export async function updateBranch(id, data) {
  return Branch.findByIdAndUpdate(
    id,
    { name: data.name, address: data.address },
    { new: true }
  ).lean();
}
export async function deleteBranch(id) {
  return Branch.findByIdAndDelete(id);
}

// ===== DEPARTMENTS =====
export async function getDepartments(branchId = null) {
  const query = branchId ? { branch: branchId } : {};
  return Department.find(query)
    .populate("branch", "name")
    .sort({ name: 1 })
    .lean();
}
export async function createDepartment(data) {
  const dep = new Department({ branch: data.branch, name: data.name });
  await dep.save();
  return dep;
}
export async function updateDepartment(id, data) {
  return Department.findByIdAndUpdate(
    id,
    { branch: data.branch, name: data.name },
    { new: true }
  ).lean();
}
export async function deleteDepartment(id) {
  return Department.findByIdAndDelete(id);
}

// ===== POSITIONS =====
export async function getPositions() {
  return Position.find().sort({ name: 1 }).lean();
}
export async function createPosition(data) {
  const pos = new Position({ name: data.name });
  await pos.save();
  return pos;
}
export async function updatePosition(id, data) {
  return Position.findByIdAndUpdate(
    id,
    { name: data.name },
    { new: true }
  ).lean();
}
export async function deletePosition(id) {
  return Position.findByIdAndDelete(id);
}
