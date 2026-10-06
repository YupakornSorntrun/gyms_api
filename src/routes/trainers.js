const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1. GET /trainers - ดึงข้อมูลเทรนเนอร์ทั้งหมด
router.get('/', async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM trainers');
        res.status(200).json({ message: "สำเร็จ", data: rows });
    } catch (err) {
        next(err);
    }
});

// 2. GET /trainers/:id - ดึงข้อมูลเทรนเนอร์ตาม id
router.get('/:id', async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM trainers WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลเทรนเนอร์" });
        }
        res.status(200).json({ message: "สำเร็จ", data: rows[0] });
    } catch (err) {
        next(err);
    }
});

// 3. POST /trainers - เพิ่มข้อมูลเทรนเนอร์ใหม่
router.post('/', async (req, res, next) => {
    try {
        const { name, specialty, gym_id } = req.body;

        // ตรวจสอบว่าใส่ข้อมูลครบถ้วนหรือไม่ (specialty เป็น optional ตาม schema)
        if (name === undefined || gym_id === undefined) {
            return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
        }

        // ตรวจสอบว่ามี gym ตาม gym_id นี้อยู่จริงหรือไม่ (ตรงตาม schema: FOREIGN KEY gym_id -> gyms(id))
        const [gym] = await pool.query('SELECT * FROM gyms WHERE id = ?', [gym_id]);

        if (gym.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลฟิสเนตตาม gym_id ที่ระบุ" });
        }

        const [result] = await pool.query('INSERT INTO trainers (name, specialty, gym_id) VALUES (?, ?, ?)', [name, specialty ?? null, gym_id]);

        res.status(201).json({ message: "เพิ่มข้อมูลเทรนเนอร์สำเร็จ", data: { id: result.insertId, name, specialty: specialty ?? null, gym_id } });

    } catch (err) {
        next(err);
    }
});

// 4. PUT /trainers/:id - แก้ไขข้อมูลเทรนเนอร์ตาม id
router.put('/:id', async (req, res, next) => {
    try {
        const { name, specialty, gym_id } = req.body;

        if (name === undefined || gym_id === undefined) {
            return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
        }

        // ตรวจสอบว่ามี gym ตาม gym_id นี้อยู่จริงหรือไม่
        const [gym] = await pool.query('SELECT * FROM gyms WHERE id = ?', [gym_id]);

        if (gym.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลฟิสเนตตาม gym_id ที่ระบุ" });
        }

        const [trainer] = await pool.query('SELECT * FROM trainers WHERE id = ?', [req.params.id]);

        if (trainer.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลเทรนเนอร์" });
        }

        const [result] = await pool.query('UPDATE trainers SET name = ?, specialty = ?, gym_id = ? WHERE id = ?', [name, specialty ?? null, gym_id, req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลเทรนเนอร์" });
        }

        res.status(200).json({ message: "แก้ไขข้อมูลเทรนเนอร์สำเร็จ", data: { id: req.params.id, name, specialty: specialty ?? null, gym_id } });
    } catch (err) {
        next(err);
    }
});

// 5. DELETE /trainers/:id - ลบข้อมูลเทรนเนอร์ตาม id
router.delete('/:id', async (req, res, next) => {
    try {
        const [result] = await pool.query('DELETE FROM trainers WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลเทรนเนอร์" });
        }

        res.status(200).json({ message: "ลบข้อมูลเทรนเนอร์สำเร็จ" });
    } catch (err) {
        // ดักจับกรณีลบไม่ได้เพราะมี memberships ผูกอยู่ (Foreign Key constraint ที่ trainer_id)
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(409).json({ message: "ไม่สามารถลบข้อมูลเทรนเนอร์นี้ได้ เนื่องจากมีการสมัครสมาชิก (membership) ผูกอยู่กับเทรนเนอร์นี้" });
        }
        next(err);
    }
});


module.exports = router;