USE gyms_api;

INSERT INTO gyms (name, address, monthlyFee) VALUES
  ('Fitness First Central Chonburi', 'เซ็นทรัล ชลบุรี', 1500.00),
  ('Fit Plus Gym', 'บางแสน ชลบุรี', 1200.00);

INSERT INTO members (name, email, phone) VALUES
  ('สมชาย ใจดี', 'somchai@example.com', '0812345678'),
  ('สมหญิง รักเรียน', 'somying@example.com', '0898765432'),
  ('กิตติพงษ์ สุขใจ', 'kittipong@example.com', '0865432109'),
  ('นภัสสร รักสุขภาพ', 'napatsorn@example.com', '0823456789');

INSERT INTO trainers (name, specialty, gym_id) VALUES
  ('ธนา ฟิตเนส', 'Weight Training', 1),
  ('พิมพ์ชนก เทรนเนอร์', 'Cardio Training', 1),
  ('อนุชา แข็งแรง', 'Muscle Building', 2);

INSERT INTO memberships (member_id, gym_id, startDate, endDate, trainer_id) VALUES
  (1, 1, '2026-08-01', '2026-08-31', 1),
  (2, 1, '2026-08-05', '2026-09-04', 2),
  (3, 2, '2026-08-10', '2026-09-09', 3),
  (4, 1, '2026-08-15', '2026-09-14', NULL);