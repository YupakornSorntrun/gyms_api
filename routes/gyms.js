const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM gyms');
        res.status(200).json({ message: "สำเร็จ", data: rows });
    } catch (err) {
        next(err);
    }
});

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


module.exports = router;