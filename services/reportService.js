import { Employee, AttendanceLog } from "../models/index.js";

export async function getSummaryReport(startDate, endDate, filters = {}) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const empQuery = { status: "active" };
  if (filters.department_id) empQuery.department = filters.department_id;
  if (filters.branch_id) empQuery.branch = filters.branch_id;

  const employees = await Employee.find(empQuery)
    .populate("department", "name")
    .populate("position", "name")
    .populate("shift", "name startTime endTime")
    .lean();

  const report = [];
  for (const emp of employees) {
    const logs = await AttendanceLog.find({
      employee: emp._id,
      eventTime: { $gte: start, $lte: end },
      direction: "in",
    }).lean();

    const uniqueDays = new Set(
      logs.map((l) => l.eventTime.toISOString().split("T")[0])
    );
    const lateLogs = logs.filter((l) => l.status === "late");
    const totalLateMinutes = logs.reduce(
      (sum, l) => sum + (l.lateMinutes || 0),
      0
    );

    report.push({
      employee_id: emp._id,
      device_id: emp.deviceId,
      first_name: emp.firstName,
      last_name: emp.lastName,
      department_name: emp.department?.name,
      position_name: emp.position?.name,
      shift_name: emp.shift?.name,
      shift_start: emp.shift?.startTime,
      shift_end: emp.shift?.endTime,
      days_present: uniqueDays.size,
      late_count: lateLogs.length,
      total_late_minutes: totalLateMinutes,
    });
  }
  return report;
}

export async function getDetailedReport(startDate, endDate, employeeId = null) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const query = { eventTime: { $gte: start, $lte: end } };
  if (employeeId) query.employee = employeeId;

  const logs = await AttendanceLog.find(query)
    .populate("employee", "firstName lastName")
    .sort({ eventTime: 1 })
    .lean();

  const grouped = {};
  for (const log of logs) {
    const empId = log.employee._id.toString();
    const dateKey = log.eventTime.toISOString().split("T")[0];
    const key = `${empId}-${dateKey}`;

    if (!grouped[key]) {
      grouped[key] = {
        employee_id: log.employee._id,
        first_name: log.employee.firstName,
        last_name: log.employee.lastName,
        date: dateKey,
        clock_in: null,
        clock_out: null,
        status: "on_time",
        late_minutes: 0,
      };
    }
    if (log.direction === "in" && !grouped[key].clock_in) {
      grouped[key].clock_in = log.eventTime.toTimeString().slice(0, 5);
      grouped[key].status = log.status;
      grouped[key].late_minutes += log.lateMinutes || 0;
    }
    if (log.direction === "out") {
      grouped[key].clock_out = log.eventTime.toTimeString().slice(0, 5);
    }
  }

  return Object.values(grouped).sort((a, b) => {
    const nameCompare = `${a.last_name} ${a.first_name}`.localeCompare(
      `${b.last_name} ${b.first_name}`
    );
    if (nameCompare !== 0) return nameCompare;
    return a.date.localeCompare(b.date);
  });
}
