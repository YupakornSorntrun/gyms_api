const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1. GET /gyms - ดึงข้อมูลฟิสเนตทั้งหมด
router.get('/', async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM gyms');
        res.status(200).json({ message: "สำเร็จ", data: rows });
    } catch (err) {
        next(err);
    }
});

// 2. GET /gyms/:id - ดึงข้อมูลฟิสเนตตาม id
router.get('/:id', async (req, res, next) => {
    try{
        const [rows] = await pool.query('SELECT * FROM gyms WHERE id = ?', [req.params.id]);

        if(rows.length === 0){
            return res.status(404).json({ message: "ไม่พบข้อมูลฟิสเนต" });
        }
        res.status(200).json({ message: "สำเร็จ", data: rows[0] });
    } catch (err) {
        next(err);
    }
});

// 3. POST /gyms - เพิ่มข้อมูลฟิสเนตใหม่
router.post('/', async (req, res, next) => {
    try {
        const { name, address, monthly_fee } = req.body;

        // ตรวจสอบว่าใส่ข้อมูลครบถ้วนหรือไม่
        if(name === undefined || address === undefined || monthly_fee === undefined){
            return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
        }

        // ตรวจสอบว่า monthly_fee เป็นตัวเลขที่ถูกต้อง (ตรงตาม schema: DECIMAL(10,2) NOT NULL)
        if(isNaN(monthly_fee) || Number(monthly_fee) < 0){
            return res.status(400).json({ message: "monthly_fee ต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0" });
        }

        // ตรวจสอบว่ามี gym ที่มีชื่อเดียวกันอยู่แล้วหรือไม่
        const [existingGym] = await pool.query('SELECT * FROM gyms WHERE name = ?', [name]);

        if(existingGym.length > 0){
            return res.status(409).json({ message: "มีฟิสเนตที่มีชื่อเดียวกันอยู่แล้ว" });
        }

        const [result] = await pool.query('INSERT INTO gyms (name, address, monthly_fee) VALUES (?, ?, ?)', [name, address, monthly_fee]);

        res.status(201).json({ message: "เพิ่มข้อมูลฟิสเนตสำเร็จ", data: { id: result.insertId, name, address, monthly_fee } });

    } catch (err) {
        next(err);
    }
});

// 4. PUT /gyms/:id - แก้ไขข้อมูลฟิสเนตตาม id
router.put('/:id', async (req, res, next) => {
    try {
        const { name, address, monthly_fee } = req.body;

         if(name === undefined || address === undefined || monthly_fee === undefined){
            return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
        }

        // ตรวจสอบว่า monthly_fee เป็นตัวเลขที่ถูกต้อง (ตรงตาม schema: DECIMAL(10,2) NOT NULL)
        if(isNaN(monthly_fee) || Number(monthly_fee) < 0){
            return res.status(400).json({ message: "monthly_fee ต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0" });
        }

        // ตรวจสอบชื่อว่ามีชื่อ เดียวกันอยู่แล้วหรือไม่ (ยกเว้นตัวเอง)
        const [existingGym] = await pool.query('SELECT * FROM gyms WHERE name = ? AND id != ?', [name, req.params.id]);

        if(existingGym.length > 0){
            return res.status(409).json({ message: "มีฟิสเนตที่มีชื่อเดียวกันอยู่แล้ว" });
        }

        const [gym] = await pool.query('SELECT * FROM gyms WHERE id = ?', [req.params.id]);

        if(gym.length === 0){
            return res.status(404).json({ message: "ไม่พบข้อมูลฟิสเนต" });
        }

        const [result] = await pool.query('UPDATE gyms SET name = ?, address = ?, monthly_fee = ? WHERE id = ?', [name, address, monthly_fee, req.params.id]);

        // .affectedRows จะบอกว่ามีแถวที่ถูกแก้ไขกี่แถว ถ้าเป็น 0 แสดงว่าไม่มี gym ที่มี id นี้อยู่
        if(result.affectedRows === 0){
            return res.status(404).json({ message: "ไม่พบข้อมูลฟิสเนต" });
        }

        res.status(200).json({ message: "แก้ไขข้อมูลฟิสเนตสำเร็จ", data: { id: req.params.id, name, address, monthly_fee } });
    } catch (err) {
        next(err);
    }
});

// 5. DELETE /gyms/:id - ลบข้อมูลฟิสเนตตาม id
router.delete('/:id', async (req, res, next) => {
    try {
        const [result] = await pool.query('DELETE FROM gyms WHERE id = ?', [req.params.id]);

        // .affectedRows จะบอกว่ามีแถวที่ถูกลบกี่แถว ถ้าเป็น 0 แสดงว่าไม่มี gym ที่มี id นี้อยู่
        if(result.affectedRows === 0){
            return res.status(404).json({ message: "ไม่พบข้อมูลฟิสเนต" });
        }

        res.status(200).json({ message: "ลบข้อมูลฟิสเนตสำเร็จ" });
    } catch (err) {
        // ดักจับกรณีลบไม่ได้เพราะมี trainers หรือ memberships ผูกอยู่ (Foreign Key constraint)
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(409).json({ message: "ไม่สามารถลบข้อมูลฟิสเนตนี้ได้ เนื่องจากมี trainer หรือ membership ผูกอยู่กับฟิสเนตนี้" });
        }
        next(err);
    }
});


module.exports = router;