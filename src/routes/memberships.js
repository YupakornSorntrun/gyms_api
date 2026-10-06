const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1. GET /memberships - ดึงข้อมูลการสมัครสมาชิกทั้งหมด
router.get('/', async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM memberships');
        res.status(200).json({ message: "สำเร็จ", data: rows });
    } catch (err) {
        next(err);
    }
});

// 2. GET /memberships/:id - ดึงข้อมูลการสมัครสมาชิกตาม id
router.get('/:id', async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM memberships WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการสมัครสมาชิก" });
        }
        res.status(200).json({ message: "สำเร็จ", data: rows[0] });
    } catch (err) {
        next(err);
    }
});

// 3. POST /memberships - เพิ่มข้อมูลการสมัครสมาชิกใหม่
router.post('/', async (req, res, next) => {
    try {
        const { member_id, gym_id, startDate, endDate, trainer_id } = req.body;

        // ตรวจสอบว่าใส่ข้อมูลครบถ้วนหรือไม่ 
        if (member_id === undefined || gym_id === undefined || startDate === undefined) {
            return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
        }

        // ตรวจสอบว่า endDate ต้องไม่มาก่อน startDate (ถ้ามีการระบุ endDate) เช่น ถ้า startDate = 2024-01-01 และ endDate = 2023-12-31 จะถือว่าไม่ถูกต้อง
        if (endDate !== undefined && endDate !== null && new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({ message: "endDate ต้องไม่มาก่อน startDate" });
        }

        // ตรวจสอบว่ามี member ตาม member_id นี้อยู่จริงหรือไม่
        const [member] = await pool.query('SELECT * FROM members WHERE id = ?', [member_id]);
        if (member.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลสมาชิกตาม member_id ที่ระบุ" });
        }

        // ตรวจสอบว่ามี gym ตาม gym_id นี้อยู่จริงหรือไม่
        const [gym] = await pool.query('SELECT * FROM gyms WHERE id = ?', [gym_id]);
        if (gym.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลฟิสเนตตาม gym_id ที่ระบุ" });
        }

        // ตรวจสอบว่ามี trainer ตาม trainer_id นี้อยู่จริงหรือไม่ (เฉพาะกรณีระบุมา เพราะ trainer_id เป็น optional)
        if (trainer_id !== undefined && trainer_id !== null) {
            const [trainer] = await pool.query('SELECT * FROM trainers WHERE id = ?', [trainer_id]);
            if (trainer.length === 0) {
                return res.status(404).json({ message: "ไม่พบข้อมูลเทรนเนอร์ตาม trainer_id ที่ระบุ" });
            }
        }

        const [result] = await pool.query(
            'INSERT INTO memberships (member_id, gym_id, startDate, endDate, trainer_id) VALUES (?, ?, ?, ?, ?)',
            [member_id, gym_id, startDate, endDate ?? null, trainer_id ?? null]
        );

        res.status(201).json({
            message: "เพิ่มข้อมูลการสมัครสมาชิกสำเร็จ",
            data: { id: result.insertId, member_id, gym_id, startDate, endDate: endDate ?? null, trainer_id: trainer_id ?? null }
        });

    } catch (err) {
        next(err);
    }
});

// 4. PUT /memberships/:id - แก้ไขข้อมูลการสมัครสมาชิกตาม id
router.put('/:id', async (req, res, next) => {
    try {
        const { member_id, gym_id, startDate, endDate, trainer_id } = req.body;

        if (member_id === undefined || gym_id === undefined || startDate === undefined) {
            return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
        }

        if (endDate !== undefined && endDate !== null && new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({ message: "endDate ต้องไม่มาก่อน startDate" });
        }

        const [membership] = await pool.query('SELECT * FROM memberships WHERE id = ?', [req.params.id]);
        if (membership.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการสมัครสมาชิก" });
        }

        const [member] = await pool.query('SELECT * FROM members WHERE id = ?', [member_id]);
        if (member.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลสมาชิกตาม member_id ที่ระบุ" });
        }

        const [gym] = await pool.query('SELECT * FROM gyms WHERE id = ?', [gym_id]);
        if (gym.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลฟิสเนตตาม gym_id ที่ระบุ" });
        }

        if (trainer_id !== undefined && trainer_id !== null) {
            const [trainer] = await pool.query('SELECT * FROM trainers WHERE id = ?', [trainer_id]);
            if (trainer.length === 0) {
                return res.status(404).json({ message: "ไม่พบข้อมูลเทรนเนอร์ตาม trainer_id ที่ระบุ" });
            }
        }

        const [result] = await pool.query(
            'UPDATE memberships SET member_id = ?, gym_id = ?, startDate = ?, endDate = ?, trainer_id = ? WHERE id = ?',
            [member_id, gym_id, startDate, endDate ?? null, trainer_id ?? null, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการสมัครสมาชิก" });
        }

        res.status(200).json({
            message: "แก้ไขข้อมูลการสมัครสมาชิกสำเร็จ",
            data: { id: req.params.id, member_id, gym_id, startDate, endDate: endDate ?? null, trainer_id: trainer_id ?? null }
        });
    } catch (err) {
        next(err);
    }
});

// 5. DELETE /memberships/:id - ลบข้อมูลการสมัครสมาชิกตาม id
router.delete('/:id', async (req, res, next) => {
    try {
        const [result] = await pool.query('DELETE FROM memberships WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการสมัครสมาชิก" });
        }

        res.status(200).json({ message: "ลบข้อมูลการสมัครสมาชิกสำเร็จ" });
    } catch (err) {
        next(err);
    }
});


module.exports = router;