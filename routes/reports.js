import ExcelJS from "exceljs";
import * as reportSvc from "../services/reportService.js";

export default async function reportRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/api/reports/summary", async (request, reply) => {
    const { start_date, end_date, department_id, branch_id } = request.query;
    if (!start_date || !end_date) {
      return reply
        .status(400)
        .send({ error: "start_date va end_date kiritilishi shart" });
    }
    const report = await reportSvc.getSummaryReport(start_date, end_date, {
      department_id,
      branch_id,
    });
    return reply.send(report);
  });

  fastify.get("/api/reports/detailed", async (request, reply) => {
    const { start_date, end_date, employee_id } = request.query;
    if (!start_date || !end_date) {
      return reply
        .status(400)
        .send({ error: "start_date va end_date kiritilishi shart" });
    }
    const report = await reportSvc.getDetailedReport(
      start_date,
      end_date,
      employee_id
    );
    return reply.send(report);
  });

  fastify.get("/api/reports/export", async (request, reply) => {
    const { start_date, end_date, department_id, branch_id, type } =
      request.query;
    if (!start_date || !end_date) {
      return reply
        .status(400)
        .send({ error: "start_date va end_date kiritilishi shart" });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "E-Davomat tizimi";
    workbook.created = new Date();

    if (type === "detailed") {
      const report = await reportSvc.getDetailedReport(start_date, end_date);
      const sheet = workbook.addWorksheet("Batafsil davomat");
      sheet.columns = [
        { header: "Xodim", key: "employee", width: 25 },
        { header: "Sana", key: "date", width: 12 },
        { header: "Kelish", key: "clock_in", width: 10 },
        { header: "Ketish", key: "clock_out", width: 10 },
        { header: "Holat", key: "status", width: 12 },
        { header: "Kechikish (daq)", key: "late_minutes", width: 12 },
      ];
      for (const row of report) {
        sheet.addRow({
          employee: `${row.first_name} ${row.last_name}`,
          date: row.date,
          clock_in: row.clock_in || "-",
          clock_out: row.clock_out || "-",
          status: row.status === "late" ? "Kechikkan" : "O'z vaqtida",
          late_minutes: row.late_minutes,
        });
      }
    } else {
      const report = await reportSvc.getSummaryReport(start_date, end_date, {
        department_id,
        branch_id,
      });
      const sheet = workbook.addWorksheet("Davomat xulosasi");
      sheet.columns = [
        { header: "Xodim", key: "employee", width: 25 },
        { header: "Bo'lim", key: "department", width: 20 },
        { header: "Lavozim", key: "position", width: 20 },
        { header: "Smena", key: "shift", width: 15 },
        { header: "Kelgan kunlar", key: "days_present", width: 12 },
        { header: "Kechikishlar", key: "late_count", width: 12 },
        { header: "Jami kechikish (daq)", key: "total_late", width: 15 },
      ];
      for (const row of report) {
        sheet.addRow({
          employee: `${row.first_name} ${row.last_name}`,
          department: row.department_name || "-",
          position: row.position_name || "-",
          shift: row.shift_name || "-",
          days_present: row.days_present,
          late_count: row.late_count,
          total_late: row.total_late_minutes,
        });
      }
    }

    // Style header row
    const sheet = workbook.worksheets[0];
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    reply.header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    reply.header(
      "Content-Disposition",
      `attachment; filename="attendance_report_${start_date}_${end_date}.xlsx"`
    );
    return reply.send(buffer);
  });
}
