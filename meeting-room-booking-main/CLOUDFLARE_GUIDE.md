# คู่มือ Meeting บน Cloudflare

เว็บปัจจุบันอยู่ที่ `https://meeting-room-booking-ag8.pages.dev` ใช้ **Cloudflare Pages + Pages Functions** สำหรับหน้าเว็บและ `/api` ข้อมูลการจองอยู่ใน **Google Calendar เดิม** ไม่มี D1 ในโปรเจกต์นี้

## ส่งต่อ repo และติดตั้งบนเครื่องอีกบัญชี

ถ้าเริ่มจากโฟลเดอร์โค้ดที่ **ยังไม่มี Git** ให้สร้าง private repository ว่างบน GitHub ก่อน จากนั้นรันคำสั่งนี้ในโฟลเดอร์โค้ด โดยเปลี่ยน `OWNER` เป็นบัญชีเจ้าของ repo และตรวจ `git status --short` ว่าไม่มีไฟล์ secret ก่อน commit:

```powershell
git init -b main
git add .
git status --short
git commit -m "Initial Meeting source"
git remote add origin https://github.com/OWNER/meeting-room-booking.git
git push -u origin main
```

หากโฟลเดอร์มี `.git` และ remote อยู่แล้ว ให้ใช้ repo เดิมและข้ามชุดคำสั่งนี้

เจ้าของ repo เปิดสิทธิ์ให้ GitHub ของผู้รับเข้าอ่าน **private repo** นี้ที่ **Settings → Collaborators → Add people** และให้ผู้รับรับคำเชิญ หรือย้าย/คัดลอกโค้ดไป private repo ของผู้รับเอง หาก URL repo เปลี่ยน ให้แก้ URL ในคำสั่งด้านล่าง ไม่ต้องทำ repo เป็น public

สิทธิ์ clone อย่างเดียวไม่ใช่การอนุญาต Cloudflare GitHub App หากต้องการ Connect to Git เจ้าของ repo ต้องให้ App เข้าถึง repo นี้ หรือใช้ repo ที่ผู้รับเป็นเจ้าของเอง ขั้นตอน Direct Upload ด้านล่างใช้ Git เพื่อรับโค้ด แต่ไม่ต้องเชื่อม GitHub App กับ Cloudflare

ติดตั้ง Git และ Node.js 22 บนเครื่องผู้รับ แล้วเปิด PowerShell:

```powershell
git clone https://github.com/Ch4Iz/meeting-room-booking.git Meeting
cd Meeting
npm.cmd ci
npx.cmd wrangler login
npx.cmd wrangler whoami
```

ตรวจว่า Wrangler เชื่อมกับ **บัญชี Cloudflare ของผู้รับ** ถ้าโปรเจกต์ `meeting-room-booking` ยังไม่มีในบัญชีนี้ ให้สร้าง Pages แบบ Direct Upload:

```powershell
npx.cmd wrangler pages project create meeting-room-booking --production-branch main
```

`main` ในคำสั่งนี้เป็นชื่อ production branch ของ Pages แม้จะ deploy จากเครื่อง ถ้าชื่อโปรเจกต์ใช้ไม่ได้ ให้เลือกชื่ออื่นและเปลี่ยน `name` ใน `wrangler.toml` ให้ตรงกัน ก่อน deploy ให้ตั้งค่า Google ทั้งสามตัวในบัญชี Cloudflare ของผู้รับตามหัวข้อ **ค่าที่ Pages Functions ต้องมี**: secrets ของบัญชีเดิมและไฟล์ Google JSON ไม่ได้ติดมากับ Git ต้องส่งค่าผ่านช่องทางที่ปลอดภัยหรือสร้าง key ใหม่

```powershell
npm.cmd run build
npx.cmd wrangler pages deploy dist --project-name meeting-room-booking --branch main
```

ถ้าใช้ชื่อโปรเจกต์อื่น ให้เปลี่ยน `--project-name` ด้วย URL ใหม่จะแสดงหลัง deploy หากต้องการให้ Cloudflare ของผู้รับ **เชื่อม Git และ deploy ทุกครั้งที่ push** ให้สร้าง Pages project ใหม่ด้วย **Connect to Git** ใน Dashboard แทนการสร้าง Direct Upload โดยอนุญาต Cloudflare GitHub app ให้เข้าถึง repo นั้น แล้วตั้ง `main`, `npm run build`, `dist` และ secrets ทั้งสามตัว โปรเจกต์ Direct Upload ที่สร้างแล้วเปลี่ยนเป็น Git integration ภายหลังไม่ได้

หลังติดตั้ง ถ้ามีโค้ดใหม่ให้รัน `git pull --ff-only origin main` ในโฟลเดอร์ `Meeting` แล้วใช้ขั้นตอน **อัปเดตเว็บปัจจุบันแบบ Direct Upload** ด้านล่าง หากเปลี่ยน `wrangler.toml` เพื่อใช้ชื่อโปรเจกต์ของผู้รับ ให้เก็บการแก้นั้นใน branch/repo ของผู้รับก่อน pull เพื่อไม่ให้ Git ทับหรือขัดกัน

## เข้าใช้งานและตรวจการทำงาน

เปิด URL ด้านบน เลือกวัน ห้อง และเวลา กรอกข้อมูล แล้วกดยืนยัน หน้าเว็บตรวจเวลาว่างผ่าน `/api/availability` และสร้าง event ผ่าน `/api/bookings` ปุ่มดูตารางห้องประชุมเปิด Google Calendar เดิม หากหน้าเว็บเปิดได้แต่ตารางว่างหรือจองไม่ได้ ให้ตรวจ Google credentials และสิทธิ์ Calendar ตามหัวข้อด้านล่าง

## อัปเดตเว็บปัจจุบันแบบ Direct Upload

เปิด PowerShell ในโฟลเดอร์ `Meeting` แล้วรัน:

```powershell
npm.cmd ci
npm.cmd run build
npx.cmd wrangler whoami
npx.cmd wrangler pages deploy dist --project-name meeting-room-booking
```

ถ้า `whoami` ยังไม่เชื่อมบัญชี ให้รัน `npx.cmd wrangler login` ก่อน โปรเจกต์ Pages นี้สร้างด้วย **Direct Upload**; Cloudflare จึงแสดง `No Git connection` และการ push GitHub **ไม่** อัปเดตเว็บโดยอัตโนมัติ โฟลเดอร์ `functions/` ใน repo มี API ที่ต้อง deploy ไปพร้อมหน้าเว็บ ใช้ Wrangler CLI สำหรับโปรเจกต์นี้ ไม่ใช้การลากไฟล์ `dist` เข้า Dashboard เพื่ออัปโหลด Functions

หลัง deploy เปิดหน้าเว็บจริงและลองโหลดเวลาว่าง ถ้าต้องการให้ push แล้ว deploy อัตโนมัติ ต้องสร้าง **Pages project ใหม่** แบบ Connect to Git แล้วเลือก `Ch4Iz/meeting-room-booking`, branch `main`, build command `npm run build`, output `dist`, root directory ว่าง และตั้ง secrets ในโปรเจกต์ใหม่อีกครั้ง URL ของโปรเจกต์ใหม่จะต่างจาก URL ปัจจุบัน

## ค่าที่ Pages Functions ต้องมี

ไปที่ Cloudflare Dashboard → **Workers & Pages → meeting-room-booking → Settings → Variables and Secrets** แล้วตั้งค่า Production:

| ชื่อ | ค่า |
|---|---|
| `GOOGLE_CALENDAR_ID` | Calendar ID ของปฏิทินที่ใช้จอง |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` ใน Service Account JSON |
| `GOOGLE_PRIVATE_KEY` | `private_key` ใน Service Account JSON; ตั้งเป็น secret |

ตัวแปรทั้งสามอ่านใน Pages Functions ฝั่ง server อย่าใส่ในตัวแปรที่ขึ้นต้น `VITE_` หรือใน Git หลังเปลี่ยนค่า secret ให้ deploy ใหม่เพื่อให้ Function ใช้ค่าล่าสุด ไฟล์ `.dev.vars` ใช้เฉพาะการทดสอบในเครื่องและถูก Git ignore แล้ว

## หา Google key และ Calendar ID

1. เปิด Google Cloud Console → เลือก project ที่เปิด Google Calendar API → **IAM & Admin → Service Accounts** → เลือก service account → **Keys**
2. ถ้ามีไฟล์ JSON ที่เคยดาวน์โหลดอยู่แล้ว ใช้ค่า `client_email` และ `private_key` จากไฟล์นั้นได้เมื่อ key ยัง Active
3. หน้า Keys แสดงเพียง Key ID; **ไม่สามารถดาวน์โหลด private key เดิมซ้ำ** หากไฟล์หาย ให้ **Add key → Create new key → JSON** แล้วเก็บไฟล์ไว้ในที่ปลอดภัย
4. ใน Google Calendar เดิม เปิด **Settings → เลือกปฏิทิน → Integrate calendar** แล้วคัดลอก Calendar ID
5. ในหัวข้อ **Share with specific people or groups** ของปฏิทินนั้น ให้ service account email มีสิทธิ์ **Make changes to events**
6. อัปเดตค่าใน Cloudflare แล้ว deploy ใหม่ ทดสอบดูเวลาว่างและการจองจริงหนึ่งรายการ จากนั้นลบรายการทดสอบใน Calendar

อย่านำ JSON หรือ private key ไปวางใน chat, issue หรือ repo หาก key เคยเผยแพร่ ให้สร้าง key ใหม่ เปลี่ยน secret และทดสอบก่อนปิด key เก่า โปรเจกต์นี้มีโฟลเดอร์ `.secrets/` ที่ Git ignore สำหรับเก็บไฟล์ในเครื่อง แต่ควรสำรองอย่างปลอดภัยด้วย

## ตรวจปัญหาเร็ว

| อาการ | ตรวจอะไร |
|---|---|
| เว็บเปิดได้ แต่ `/api` ไม่ทำงาน | deploy ด้วย Wrangler จาก repo root และดูว่า `functions/` อยู่ครบ |
| ไม่เห็นเวลาว่างหรือจองไม่ได้ | `GOOGLE_CALENDAR_ID`, service account email, private key, Calendar API และสิทธิ์ในปฏิทิน |
| กดดูตารางแล้วเป็นคนละปฏิทิน | URL สำหรับปุ่มดูตารางใน `shared/config.ts` และ `GOOGLE_CALENDAR_ID` ต้องอ้างถึงปฏิทินเดียวกัน |
| push แล้วเว็บไม่เปลี่ยน | โปรเจกต์ปัจจุบันเป็น Direct Upload; deploy ผ่าน CLI หรือสร้างโปรเจกต์ Git integration ใหม่ |

เอกสารอ้างอิง: [GitHub collaborators](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/inviting-collaborators-to-a-personal-repository), [Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/), [Pages Functions secrets](https://developers.cloudflare.com/pages/functions/bindings/), [Google Service Account keys](https://docs.cloud.google.com/iam/docs/keys-create-delete)
