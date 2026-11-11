# meeting-room-booking

ระบบจองห้องประชุมภาษาไทยด้วย React, TypeScript, Vite, MUI และ Cloudflare Pages Functions โดยใช้ Google Calendar เดิมเป็นแหล่งข้อมูลการจองเพียงแห่งเดียว ไม่มีฐานข้อมูลและไม่มีระบบส่งอีเมล

คู่มือใช้งานและดูแล Cloudflare ของเว็บปัจจุบัน: [CLOUDFLARE_GUIDE.md](CLOUDFLARE_GUIDE.md)

## การทำงาน

1. หน้าเว็บเลือกวัน ห้อง และช่วงเวลา แล้วเรียก `GET /api/availability`
2. ผู้ใช้กรอกข้อมูลและตรวจสอบใน confirmation modal
3. `POST /api/bookings` ตรวจข้อมูลและอ่าน Google Calendar ซ้ำเพื่อป้องกันช่วงเวลาชน
4. หากว่าง ระบบสร้าง Google Calendar event แล้วแสดง notification ด้านบนที่กดปิดได้
5. หากเวลาถูกจองก่อนกดยืนยัน API คืน `409 BOOKING_CONFLICT` และหน้าเว็บโหลดตารางใหม่

ปุ่ม **ดูตารางห้องประชุม** เปิด Google Calendar ตัวจริงในแท็บใหม่ ส่วนตารางเวลาในฟอร์มยังอ่านเฉพาะสถานะว่าง/จองแล้วผ่าน API โดยไม่เปิดเผยรายละเอียดการประชุม

อีเมลจากฟอร์มเก็บไว้ในรายละเอียด Calendar เพื่อใช้ติดต่อเท่านั้น ระบบไม่ส่งคำเชิญหรืออีเมลยืนยัน

## เริ่มต้นในเครื่อง

ต้องใช้ Node.js 22 ขึ้นไป:

```sh
npm install
```

คัดลอก `.env.example` เป็น `.env.local` และตั้ง:

```env
VITE_CALENDAR_ENABLED=true
```

คัดลอก `.dev.vars.example` เป็น `.dev.vars` แล้วใส่ Google credentials จากนั้นรัน:

```sh
npm run dev
```

คำสั่งนี้เปิดทั้ง Vite และ Pages Functions ให้เข้า URL ของ `WEB` ซึ่งปกติคือ `http://localhost:5173` หากต้องการทดสอบเฉพาะ UI ด้วยข้อมูลจำลอง ให้ตั้ง `VITE_CALENDAR_ENABLED=false` แล้วใช้ `npm run dev:web`

## Environment variables

| ชื่อ | รายละเอียด |
|---|---|
| `GOOGLE_CALENDAR_ID` | Calendar ID ของปฏิทินเดิม |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | ค่า `client_email` จาก Service Account JSON |
| `GOOGLE_PRIVATE_KEY` | ค่า `private_key` จาก Service Account JSON |

เก็บค่าจริงไว้ใน `.dev.vars` สำหรับเครื่อง local และ Cloudflare Pages → Settings → Variables and Secrets สำหรับ production ห้ามใช้คำนำหน้า `VITE_` กับ credentials และห้าม commit `.dev.vars`, `.env.local` หรือไฟล์ Service Account JSON

Private key รองรับทั้ง newline จริงและ `\n` ภายในค่า environment variable

## ตั้งค่า Google Calendar

1. เปิด Google Cloud Console และเลือก project
2. เปิดใช้งาน Google Calendar API
3. สร้าง Service Account และดาวน์โหลด JSON key
4. เปิด Google Calendar → Settings → เลือก Calendar → Share with specific people or groups
5. เพิ่ม `GOOGLE_SERVICE_ACCOUNT_EMAIL` และให้สิทธิ์ **Make changes to events**
6. ไปที่ Integrate calendar แล้วคัดลอก **Calendar ID** มาใส่ `GOOGLE_CALENDAR_ID`

อย่าใช้ Public URL, Embed code หรือ iCal URL แทน Calendar ID

## Cloudflare Pages deployment

เว็บที่ deploy ปัจจุบันอยู่ที่ `https://meeting-room-booking-ag8.pages.dev` โดยใช้ Pages Direct Upload จาก CLI จึงแสดง `No Git connection` ใน Cloudflare Dashboard และการ push GitHub จะไม่ deploy เว็บนี้อัตโนมัติ Cloudflare ไม่รองรับการเพิ่ม Git integration ให้โปรเจกต์ Direct Upload เดิม หากต้องการ Git integration ต้องสร้าง Pages project ใหม่ด้วย **Connect to Git** แล้วเลือก repository `Ch4Iz/meeting-room-booking` และตั้งค่า:

```text
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: เว้นว่าง
```

เพิ่ม Production secrets ทั้งสามรายการในหัวข้อ Environment variables ของโปรเจกต์ใหม่ (`GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`) ก่อนใช้งานจริง ห้ามใส่ private key ลงใน Git แนะนำเพิ่ม build variable `NODE_VERSION=22` โปรเจกต์ใหม่จะได้ URL ใหม่ ส่วนโปรเจกต์ Direct Upload เดิมยังใช้งานได้จนกว่าจะย้ายผู้ใช้ไป URL ใหม่

Production build เรียก `/api` แบบ relative URL บน origin เดียวกับหน้าเว็บ จึงรองรับทั้ง `*.pages.dev` และ custom domain โดยไม่ต้องตั้ง API URL หรือ `VITE_CALENDAR_ENABLED` บน Cloudflare โฟลเดอร์ `functions/` จะถูก deploy เป็น Pages Functions เมื่อ deploy จาก repository root

หากใช้ Preview deployments ให้ใช้ Calendar สำหรับทดสอบแยกจาก production เพราะการกดยืนยันใน preview จะสร้าง event จริง

สามารถ deploy ผ่าน CLI หลัง login และสร้าง Pages project แล้วได้เช่นกัน:

```sh
npm run deploy
```

## รูปภาพ

เก็บไฟล์จริงไว้ที่:

```text
public/images/building-cover.jpg
public/images/meeting-policy.jpg
public/images/room-1.jpg
public/images/room-2.jpg
public/images/room-3.jpg
public/images/coworking.jpg
```

หากรูปใดหาย หน้าเว็บจะแสดง placeholder โดยไม่สร้างภาพปลอม มาตรการห้องประชุมแสดงเป็นข้อความใน modal ที่ `src/components/PolicyDialog.tsx`

## Calendar event ใหม่

ชื่อ event ใช้รูปแบบ `[ห้อง 1] หัวข้อประชุม` และเก็บ `extendedProperties.private.room_id` เพื่อระบุห้อง รายละเอียดเก็บชื่อผู้จอง หน่วยงาน เบอร์ติดต่อ อุปกรณ์ และอีเมล ไม่มี credentials หรือ metadata ทางเทคนิคใน description

Event ที่สร้างผ่านเว็บกำหนดสีใน Google Calendar ตามห้อง โดยคงข้อความรูปแบบเดิม: ห้องประชุม 1 สีฟ้า, ห้องประชุม 2 สีชมพู, ห้องประชุม 3 สีเขียว และ Co-Working Space สีม่วง รายการเดิมจะไม่ถูกเปลี่ยนสีย้อนหลัง

ปุ่มดูตารางเปิดลิงก์ Google Calendar แบบ Embed ที่กำหนดไว้ หน้า Embed จะแสดงสีระดับปฏิทินเพียงสีเดียว แม้ event จะเก็บสีเฉพาะของแต่ละห้องไว้แล้ว

ระบบอ่าน event ทั้งวันตาม Asia/Bangkok ด้วย `singleEvents=true` และแบ่ง availability ต่อห้อง ไม่ใช้ freeBusy เพราะทุกห้องอยู่ใน Calendar เดียวกัน

## Legacy room parser

`server/google/roomParser.ts` ตรวจ `extendedProperties.private.room_id` ก่อน หากไม่มีจึงอ่านชื่อ event เดิม เช่น `ห้อง 1`, `ห้อง1`, `ห้องประชุม 1`, รูปแบบของห้อง 2/3 และ `Co-Working Space`, `Coworking`, `Co Working`

รายการที่ระบุห้องไม่ได้คืน `UNKNOWN`, log เฉพาะ event ID และไม่บล็อกห้องอื่น

## กฎสำคัญ

- เวลาทำการ 08:00–16:30 และเลือกครั้งละ 30 นาที กำหนดส่วนกลางใน `shared/config.ts`
- ต้องจองล่วงหน้าอย่างน้อย 1 วันทำการ โดยนับจันทร์ถึงศุกร์และเตรียม holiday set ไว้ต่อยอด
- ไม่รับการจองวันเสาร์และวันอาทิตย์ โดยตรวจทั้งหน้าเว็บและ Pages Function
- ช่วงเวลาชนเมื่อ `newStart < existingEnd` และ `newEnd > existingStart`; เวลาที่ต่อกันพอดีจองได้
- Server ตรวจ availability ซ้ำก่อนสร้าง event ทุกครั้ง
- API availability ส่งเฉพาะห้องและเวลา ไม่ส่งหัวข้อ ผู้จอง หน่วยงาน เบอร์ หรืออีเมล
- Calendar ID อ่านจาก server environment เท่านั้น ผู้ใช้ส่ง Calendar ID เองไม่ได้

Google Calendar list และ insert ไม่ใช่ transaction เดียวกัน จึงลด race condition ด้วยการตรวจซ้ำก่อน insert แต่ Google Calendar API ไม่รับประกัน atomic room locking สำหรับคำขอสองรายการที่มาถึงพร้อมกันพอดี

## ตรวจสอบโครงการ

```sh
npm test
npm run build
npm run functions:check
```

Tests ครอบคลุม validation, Bangkok timezone, legacy parser, room isolation, overlap, drag selection, contact format, origin protection และ Google authentication โดยไม่สร้าง event จริง
