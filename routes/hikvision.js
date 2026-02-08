import * as empSvc from "../services/employeeService.js";
import { broadcast } from "../services/wsService.js";

export default async function hikvisionRoutes(fastify) {
  // No auth — Hikvision devices hit this endpoint directly
  fastify.post("/api/hikvision/event", async (request, reply) => {
    try {
      const payload = request.body;
      fastify.log.info({ payload }, "Hikvision event received");

      let employeeId = null;
      let eventTime = new Date();
      let deviceSerial = null;

      if (payload.AccessControllerEvent) {
        const event = payload.AccessControllerEvent;
        employeeId = event.employeeNoString || event.employeeNo;
        eventTime = event.dateTime ? new Date(event.dateTime) : new Date();
        deviceSerial = event.deviceName || payload.ipAddress;
      } else if (payload.employeeNoString || payload.employeeNo) {
        employeeId = payload.employeeNoString || payload.employeeNo;
        eventTime = payload.dateTime ? new Date(payload.dateTime) : new Date();
        deviceSerial = payload.serialNumber || payload.deviceName;
      }

      if (!employeeId) {
        return reply
          .status(200)
          .send({ status: "ok", message: "Xodim ID kiritilmagan" });
      }

      const employee = await empSvc.getEmployeeByDeviceId(employeeId);
      if (!employee) {
        return reply
          .status(200)
          .send({ status: "ok", message: "Xodim topilmadi" });
      }

      // Determine direction
      const today = eventTime.toISOString().split("T")[0];
      const todayLogs = await empSvc.getAttendanceLogs({
        employee_id: employee._id,
        date: today,
      });
      const hasInLog = todayLogs.some((l) => l.direction === "in");
      const direction = hasInLog ? "out" : "in";

      // Calculate late status
      let status = "on_time";
      let lateMinutes = 0;
      if (direction === "in" && employee.shift) {
        const shift = employee.shift;
        const [shiftHour, shiftMin] = shift.startTime.split(":").map(Number);
        const grace = shift.gracePeriodMinutes || 15;
        const eventMin = eventTime.getHours() * 60 + eventTime.getMinutes();
        const allowed = shiftHour * 60 + shiftMin + grace;
        if (eventMin > allowed) {
          status = "late";
          lateMinutes = eventMin - (shiftHour * 60 + shiftMin);
        }
      }

      const logId = await empSvc.createAttendanceLog({
        employee: employee._id,
        deviceId: employeeId,
        deviceSerial,
        eventTime,
        direction,
        status,
        lateMinutes,
      });

      broadcast({
        type: "attendance",
        data: {
          id: logId,
          employee: {
            _id: employee._id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            photoUrl: employee.photoUrl,
            department: employee.department,
            position: employee.position,
          },
          eventTime: eventTime.toISOString(),
          direction,
          status,
          lateMinutes,
          shift: employee.shift?.name,
        },
      });

      fastify.log.info(
        `✅ ${employee.firstName} ${employee.lastName} — ${direction} — ${status}`
      );
      return reply.status(200).send({ status: "ok" });
    } catch (error) {
      fastify.log.error(error, "Hikvision hodisasini qayta ishlashda xatolik");
      return reply.status(200).send({ status: "ok" });
    }
  });
}
