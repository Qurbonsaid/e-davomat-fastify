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
      const today = `${eventTime.getFullYear()}-${String(eventTime.getMonth()+1).padStart(2,'0')}-${String(eventTime.getDate()).padStart(2,'0')}`;
      const todayLogs = await empSvc.getAttendanceLogs({
        employee_id: employee._id,
        date: today,
      });
      
      // Check for duplicate event within last 30 seconds
      const thirtySecondsAgo = new Date(eventTime.getTime() - 30000);
      const recentDuplicate = todayLogs.find(
        (l) => new Date(l.eventTime).getTime() >= thirtySecondsAgo.getTime()
      );
      if (recentDuplicate) {
        return reply
          .status(200)
          .send({ status: "ok", message: "Takroriy hodisa (30 soniya ichida)" });
      }
      
      // Determine direction based on last log entry
      let direction = "in"; // default to "in" if no logs exist
      if (todayLogs.length > 0) {
        // todayLogs is already sorted by eventTime descending (from service)
        const lastLog = todayLogs[0];
        direction = lastLog.direction === "out" ? "in" : "out";
      }

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
