const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1. GET /members - ดึงข้อมูลสมาชิกทั้งหมด
router.get('/', async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM members');
        res.status(200).json({ message: "สำเร็จ", data: rows });
    } catch (err) {
        next(err);
    }
});

// 2. GET /members/:id - ดึงข้อมูลสมาชิกตาม id
router.get('/:id', async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM members WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลสมาชิก" });
        }
        res.status(200).json({ message: "สำเร็จ", data: rows[0] });
    } catch (err) {
        next(err);
    }
});

// 3. POST /members - เพิ่มข้อมูลสมาชิกใหม่
router.post('/', async (req, res, next) => {
    try {
        const { name, email, phone } = req.body;

        // ตรวจสอบว่าใส่ข้อมูลครบถ้วนหรือไม่
        if (name === undefined || email === undefined || phone === undefined) {
            return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
        }

        // ตรวจสอบว่ามี email หรือ phone ซ้ำหรือไม่ (ตรงตาม schema: UNIQUE)
        const [existingMember] = await pool.query('SELECT * FROM members WHERE email = ? OR phone = ?', [email, phone]);

        if (existingMember.length > 0) {
            return res.status(409).json({ message: "มีสมาชิกที่ใช้อีเมลหรือเบอร์โทรนี้อยู่แล้ว" });
        }

        const [result] = await pool.query('INSERT INTO members (name, email, phone) VALUES (?, ?, ?)', [name, email, phone]);

        res.status(201).json({ message: "เพิ่มข้อมูลสมาชิกสำเร็จ", data: { id: result.insertId, name, email, phone } });

    } catch (err) {
        next(err);
    }
});

// 4. PUT /members/:id - แก้ไขข้อมูลสมาชิกตาม id
router.put('/:id', async (req, res, next) => {
    try {
        const { name, email, phone } = req.body;

        if (name === undefined || email === undefined || phone === undefined) {
            return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
        }

        // ตรวจสอบว่ามี email หรือ phone ซ้ำกับสมาชิกคนอื่นหรือไม่ (ยกเว้นตัวเอง)
        const [existingMember] = await pool.query('SELECT * FROM members WHERE (email = ? OR phone = ?) AND id != ?', [email, phone, req.params.id]);

        if (existingMember.length > 0) {
            return res.status(409).json({ message: "มีสมาชิกที่ใช้อีเมลหรือเบอร์โทรนี้อยู่แล้ว" });
        }

        const [member] = await pool.query('SELECT * FROM members WHERE id = ?', [req.params.id]);

        if (member.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลสมาชิก" });
        }

        const [result] = await pool.query('UPDATE members SET name = ?, email = ?, phone = ? WHERE id = ?', [name, email, phone, req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลสมาชิก" });
        }

        res.status(200).json({ message: "แก้ไขข้อมูลสมาชิกสำเร็จ", data: { id: req.params.id, name, email, phone } });
    } catch (err) {
        next(err);
    }
});

// 5. DELETE /members/:id - ลบข้อมูลสมาชิกตาม id
router.delete('/:id', async (req, res, next) => {
    try {
        const [result] = await pool.query('DELETE FROM members WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลสมาชิก" });
        }

        res.status(200).json({ message: "ลบข้อมูลสมาชิกสำเร็จ" });
    } catch (err) {
        // ดักจับกรณีลบไม่ได้เพราะมี memberships ผูกอยู่ (Foreign Key constraint)
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(409).json({ message: "ไม่สามารถลบข้อมูลสมาชิกนี้ได้ เนื่องจากมีการสมัครสมาชิกฟิสเนต (membership) ผูกอยู่กับสมาชิกนี้" });
        }
        next(err);
    }
});


module.exports = router;