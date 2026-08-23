require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

// Import routes
const GymRoutes = require("./routes/gyms");
const MemberRoutes = require("./routes/members");
const TrainerRoutes = require("./routes/trainers");
const MembershipRoutes = require("./routes/memberships");

const app = express();
const PORT = process.env.PORT || 3000;

// ลำดับ middleware มีความสำคัญ: security header → CORS → logger → body parser
app.use(helmet());

/* cors เอาไว้ใช้เพื่อให้ frontend สามารถเรียก API ของ backend ได้ */
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(morgan("dev"));

function requireJson(req, res, next) {
  const methodsWithBody = ["POST", "PUT"];
  if (
    methodsWithBody.includes(req.method) &&
    req.headers["content-type"] !== "application/json"
  ) {
    return res.status(415).json({
      error: {
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "กรุณาส่งข้อมูลในรูปแบบ application/json",
      },
    });
  }
  next();
}

app.use(requireJson);

app.use(express.json({ limit: "10kb" })); // จำกัดขนาด request body เป็น 10Kb เพื่อป้องกันการโจมตีแบบ Denial of Service (DoS) ที่ส่งข้อมูลขนาดใหญ่เกินไป

// เรียกใช้ routes
app.use("/api/v1/gyms", GymRoutes);
app.use("/api/v1/members", MemberRoutes);
app.use("/api/v1/trainers", TrainerRoutes);
app.use("/api/v1/memberships", MembershipRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Gym API พร้อมใช้งาน" });
});

// 404: ไม่พบ route ที่ร้องขอ (ต้องอยู่หลัง route ทั้งหมด)
app.use((req, res) => {
  res.status(404).json({
    error: { code: "ROUTE_NOT_FOUND", message: "ไม่พบเส้นทางที่ร้องขอ" },
  });
});

// Error-handling middleware (ต้องมีพารามิเตอร์ 4 ตัวเสมอ)
app.use((err, req, res, next) => {
  console.error(err.stack);
  // ใช้ err.status/err.statusCode หากมี (เช่น PayloadTooLargeError จาก express.json ที่ส่งมาเป็น 413)
  // เพื่อไม่ให้ error ที่มีรหัสสถานะของตัวเองถูกกลบด้วย 500 เสมอไป
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      code: statusCode === 500 ? "INTERNAL_SERVER_ERROR" : err.type || "ERROR",
      message: statusCode === 500 ? "เกิดข้อผิดพลาดที่ไม่คาดคิดภายในระบบ" : err.message,
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server กำลังทำงานที่พอร์ต ${PORT} (${process.env.NODE_ENV})`);
});