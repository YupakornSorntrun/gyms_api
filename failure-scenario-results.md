# บันทึกผลการทดสอบ Failure Scenario

| สถานการณ์ | วิธีจำลอง | ผลลัพธ์ที่คาดหวัง | ผลลัพธ์จริง | ผ่าน/ไม่ผ่าน |
|---|---|---|---|---|
| Network error (โดเมนไม่มีอยู่จริง) | เปลี่ยน url เป็น `https://this-domain-does-not-exist-12345.example` | Retry 2 ครั้ง แล้ว fallback พร้อมข้อความชัดเจน | Retry 2 ครั้ง error คือ `getaddrinfo ENOTFOUND` โดย attempt 1 รอ 714ms และ attempt 2 รอ 1605ms (อยู่ในช่วง jitter 500-1000ms และ 1000-2000ms) แล้วคืน 200 พร้อม `rate_source: fallback` | ผ่าน |
| Timeout | ตั้ง `timeoutMs = 1` | เกิด timeout แล้ว retry 2 ครั้ง และ fallback | Retry 2 ครั้ง error คือ `timeout of 1ms exceeded` โดย attempt 1 รอ 941ms และ attempt 2 รอ 1216ms (อยู่ในช่วง jitter 500-1000ms และ 1000-2000ms) แล้วคืน 200 พร้อม `rate_source: fallback` | ผ่าน |
| External API คืน 500 | เปลี่ยน url เป็น mock server (`localhost:4000`) ที่คืน 500 | Retry เนื่องจากเป็น 5xx แล้ว fallback | Retry 2 ครั้ง error คือ `Request failed with status code 500` โดย attempt 1 รอ 917ms และ attempt 2 รอ 1195ms (อยู่ในช่วง jitter 500-1000ms และ 1000-2000ms) แล้วคืน 200 พร้อม `rate_source: fallback` | ผ่าน |

## หลักฐานประกอบการทดสอบ

### ทดสอบปกติ (เรียก external API สำเร็จ)

ได้ 200 และ `rate_source: "external"`

![ผลทดสอบปกติ ได้ rate_source external](images/results%28postman1%29.png)

### สถานการณ์ที่ 1 — Network error (โดเมนไม่มีอยู่จริง)

Response ที่ได้เป็น fallback

![สถานการณ์ที่ 1 response fallback](images/results%28postman2%29.png)

Log ใน terminal แสดง `getaddrinfo ENOTFOUND` และ retry ครบ 2 ครั้ง (714ms และ 1605ms)

![สถานการณ์ที่ 1 log ENOTFOUND](images/results%28cmd1%29.png)

### สถานการณ์ที่ 2 — Timeout

Response ใน Postman ได้ 200 และ `rate_source: "fallback"`

![สถานการณ์ที่ 2 response fallback](images/results%28postman2%29.png)

Log ใน terminal แสดง `timeout of 1ms exceeded` และ retry ครบ 2 ครั้ง (941ms และ 1216ms)

![สถานการณ์ที่ 2 log timeout](images/results%28cmd2%29.png)

### สถานการณ์ที่ 3 — External API คืน 500

Log ใน terminal แสดง `Request failed with status code 500` และ retry ครบ 2 ครั้ง (917ms และ 1195ms)

![สถานการณ์ที่ 3 log status 500](images/results%28cmd3%29.png)
