require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
const PORT = process.env.PORT || 3000;
const GymRoutes = require("./routes/gyms");

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Student API พร้อมใช้งาน" });
});

app.use(helmet());

/* cors เอาไว้ใช้เพื่อให้ frontend สามารถเรียก API ของ backend ได้ */
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN , 
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(morgan("dev"));
app.use(express.json({limit: "10Kb"})); // เพิ่ม limit ของ request body เป็น 10Kb เพื่อป้องกันการโจมตีแบบ Denial of Service (DoS) ที่ส่งข้อมูลขนาดใหญ่เกินไป

app.use("/api/v1/gyms", GymRoutes);


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

