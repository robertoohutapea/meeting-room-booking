import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Snackbar,
  TextField,
} from "@mui/material";
import {
  ROOMS,
  isRoomId,
  EQUIPMENT,
  GOOGLE_CALENDAR_URL,
  type RoomId,
} from "../../shared/config";
import {
  minimumBookingDate,
  isWorkingDay,
  thaiDate,
  TIME_OPTIONS,
  timestamp,
  validDate,
} from "../../shared/dates";
import type { Availability, Booking } from "../../shared/types";
import { validateBooking } from "../../shared/validation";
import { overlaps } from "../../shared/overlap";
import { api, ClientError } from "../features/api";
import { Asset } from "../components/Asset";
import { Timeline } from "../components/Timeline";
import { canStartAt, isTimeRangeAvailable } from "../features/timeSelection";
import { PolicyDialog } from "../components/PolicyDialog";
import { BookingConfirmDialog } from '../components/BookingConfirmDialog';
import { formatPhone, validPhone } from '../../shared/phone';
import { validEmail } from '../../shared/email';
// A deployed Pages build always uses its same-origin Functions API. The public
// flag is only a local-development switch so production cannot accidentally
// ship with the in-memory demo adapter when a build variable is omitted.
const isDemo =
  import.meta.env.DEV && import.meta.env.VITE_CALENDAR_ENABLED !== "true";
const client = isDemo ? (await import("../features/demo")).demo : api;
const empty = (
  date = minimumBookingDate(),
  roomId: RoomId = "ROOM_1",
): Booking => ({
  date,
  roomId,
  startTime: "",
  endTime: "",
  requesterName: "",
  department: "",
  internalPhone: "",
  subject: "",
  equipment: [],
  email: "",
});
export default function App() {
  const [form, setForm] = useState<Booking>(() => {
    const params = new URLSearchParams(location.search); const date = params.get('date'); const room = params.get('room');
    return empty(validDate(date) && isWorkingDay(date) ? date : undefined, isRoomId(room) ? room : undefined);
  });
  const [availability, setAvailability] = useState<Availability>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [revision, setRevision] = useState(0);
  const [success, setSuccess] = useState<Booking>();
  const [reviewBooking,setReviewBooking] = useState<Booking>();
  const [phoneTouched,setPhoneTouched] = useState(false);
  const [emailTouched,setEmailTouched] = useState(false);
  const [dateSelectionError, setDateSelectionError] = useState("");
  const submitLock = useRef(false);
  const update = <K extends keyof Booking>(key: K, value: Booking[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setAvailability(undefined);
    setLoadError("");
    setLoading(true);
    if (!validDate(form.date)) {
      setLoadError("กรุณาระบุวันที่ให้ถูกต้อง");
      setLoading(false);
      return;
    }
    client
      .availability(form.date, form.roomId, controller.signal)
      .then((result) => {
        if (active) setAvailability(result);
      })
      .catch((e) => {
        if (active) setLoadError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [form.date, form.roomId, revision]);
  const current =
    availability?.date === form.date && availability?.room === form.roomId
      ? availability
      : undefined;
  const conflict =
    current &&
    form.startTime &&
    form.endTime &&
    current.busy.some((p) =>
      overlaps(
        timestamp(form.date, form.startTime),
        timestamp(form.date, form.endTime),
        p.start,
        p.end,
      ),
    );
  const advanceError = validDate(form.date) && form.date < minimumBookingDate();
  const room = ROOMS.find((r) => r.id === form.roomId)!;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitLock.current) return;
    setPhoneTouched(true);setEmailTouched(true);
    const result = validateBooking(form);
    setError("");
    setSuccess(undefined);
    if (!result.data) {
      setError(result.errors.join(" / "));
      return;
    }
    if (!current || conflict) {
      setError("กรุณาตรวจสอบเวลาว่างก่อนยืนยันการจอง");
      return;
    }
    setReviewBooking(result.data);
  }
  async function confirmBooking() {
    if (submitLock.current || !reviewBooking) return;
    const result = {data:reviewBooking};
    submitLock.current = true;
    setSubmitting(true);
    try {
      await client.book(result.data);
      setSuccess(result.data);
      setForm(empty(result.data.date, result.data.roomId));
      setPhoneTouched(false);setEmailTouched(false);
      setRevision((r) => r + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
      setRevision((r) => r + 1);
      if (e instanceof ClientError && e.code === "BOOKING_CONFLICT")
        setForm((f) => ({ ...f, startTime: "", endTime: "" }));
    } finally {
      submitLock.current = false;
      setSubmitting(false);
      setReviewBooking(undefined);
    }
  }
  return (
    <>
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-symbol">+</span>
          <span>
            บริการห้องประชุม<small>ชั้น 3 · อาคารผู้ป่วยนอกและอุบัติเหตุ</small>
          </span>
        </a>
        <Chip label="ระบบจองออนไลน์" color="primary" variant="outlined" />
      </header>
      <Snackbar
        open={!!success}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ top: { xs: 12, sm: 20 }, width: { xs: "calc(100% - 24px)", sm: "auto" } }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccess(undefined)}
          sx={{ width: { xs: "100%", sm: 620 }, boxShadow: 6, alignItems: "flex-start" }}
        >
          <strong>{isDemo ? "บันทึกการจองตัวอย่างเรียบร้อยแล้ว" : "จองห้องประชุมเรียบร้อยแล้ว"}</strong>
          {success && (
            <div className="success-details">
              {ROOMS.find((r) => r.id === success.roomId)!.name} · {thaiDate(success.date)} · {success.startTime}–{success.endTime}
              <br />
              หัวข้อ: {success.subject}
            </div>
          )}
        </Alert>
      </Snackbar>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">MEETING ROOM BOOKING</span>
            <h1>
              พื้นที่พร้อม
              <br />
              สำหรับทุกการประชุม
            </h1>
            <p>
              ระบบจองห้องประชุม
              <br />
              ชั้น 3 อาคารผู้ป่วยนอกและอุบัติเหตุ
            </p>
            <div className="hero-actions">
              <Button variant="contained" href="#booking">
                จองห้องประชุม
              </Button>
              <Button
                variant="outlined"
                href={GOOGLE_CALENDAR_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ดูตารางห้องประชุมใน Google Calendar (เปิดแท็บใหม่)"
              >
                ดูตารางห้องประชุม ↗
              </Button>
            </div>
          </div>
          <Asset
            src="/images/building-cover.jpg"
            alt="อาคารผู้ป่วยนอกและอุบัติเหตุ"
            className="hero-image"
          />
        </section>
        {isDemo && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            โหมดสาธิต — ข้อมูลตัวอย่างเท่านั้น การจองจะไม่ถูกส่งไปยัง Google
            Calendar และจะหายเมื่อโหลดหน้าใหม่
          </Alert>
        )}
        <PolicyDialog />
        <form id="booking" onSubmit={submit}>
          <fieldset disabled={submitting}>
            <section className="panel">
              <div className="section-heading">
                <span className="step">01</span>
                <div>
                  <h2>เลือกวันและห้องประชุม</h2>
                  <p>ตรวจสอบเวลาว่างของแต่ละห้องก่อนจอง</p>
                </div>
              </div>
              <div className="date-row">
                <TextField
                  required
                  type="date"
                  label="วันที่จองห้องประชุม"
                  value={form.date}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    if (validDate(selectedDate) && !isWorkingDay(selectedDate)) {
                      setDateSelectionError("ไม่สามารถเลือกวันเสาร์หรือวันอาทิตย์ได้ กรุณาเลือกวันจันทร์–ศุกร์");
                      return;
                    }
                    setDateSelectionError("");
                    setForm((f) => ({
                      ...f,
                      date: selectedDate,
                      startTime: "",
                      endTime: "",
                    }));
                  }}
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { min: minimumBookingDate() },
                  }}
                  error={!!advanceError || !!dateSelectionError}
                  helperText={
                    dateSelectionError || (advanceError
                      ? "กรุณาจองล่วงหน้าอย่างน้อย 1 วันทำการ (ไม่นับเสาร์–อาทิตย์)"
                      : thaiDate(form.date))
                  }
                />
                <p className="muted">
                  เลือกได้ตั้งแต่ {thaiDate(minimumBookingDate())}
                  <br />
                  <small>
                    นับวันทำการจันทร์–ศุกร์ ยังไม่รวมวันหยุดนักขัตฤกษ์
                  </small>
                </p>
              </div>
              <div
                className="room-grid"
                role="group"
                aria-label="เลือกห้องประชุม"
              >
                {ROOMS.map((r) => (
                  <Card
                    key={r.id}
                    variant="outlined"
                    className={`room-card ${form.roomId === r.id ? "selected" : ""}`}
                  >
                    <CardActionArea
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          roomId: r.id,
                          startTime: "",
                          endTime: "",
                        }))
                      }
                      aria-pressed={form.roomId === r.id}
                    >
                      <Asset
                        src={r.image}
                        alt={r.name}
                        className="room-image"
                      />
                      <div className="room-copy">
                        <strong>{r.name}</strong>
                        <span className="selection-dot" aria-hidden="true">
                          {form.roomId === r.id ? "✓" : ""}
                        </span>
                        <small>{r.capacityText || "พื้นที่ทำงานร่วมกัน"}</small>
                      </div>
                    </CardActionArea>
                  </Card>
                ))}
              </div>
            </section>
            <section className="panel" id="availability">
              <div className="section-heading">
                <span className="step">02</span>
                <div>
                  <h2>เลือกช่วงเวลาที่ต้องการ</h2>
                  <p>
                    {room.name} · {thaiDate(form.date)}
                  </p>
                </div>
                <Button
                  onClick={() => setRevision((r) => r + 1)}
                  disabled={loading}
                >
                  อัปเดตตาราง
                </Button>
              </div>
              <div aria-live="polite">
                {loading ? (
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <CircularProgress size={28} />
                    <p>กำลังตรวจสอบเวลาว่าง…</p>
                  </Box>
                ) : loadError ? (
                  <Alert
                    severity="error"
                    action={
                      <Button
                        color="inherit"
                        onClick={() => setRevision((r) => r + 1)}
                      >
                        ลองใหม่
                      </Button>
                    }
                  >
                    {loadError}
                  </Alert>
                ) : (
                  current && <Timeline date={form.date} busy={current.busy} startTime={form.startTime} endTime={form.endTime} disabled={submitting} onSelect={(range) => setForm(f => ({ ...f, ...range }))} />
                )}
              </div>
              <div className="fields time-fields">
                <TextField
                  required
                  select
                  label="เวลาเริ่มใช้งาน"
                  value={form.startTime}
                  onChange={(e) => {
                    const start = e.target.value;
                    if (!current || !canStartAt(form.date, start, current.busy)) return;
                    const end = isTimeRangeAvailable(form.date, start, form.endTime, current.busy) ? form.endTime : TIME_OPTIONS[TIME_OPTIONS.indexOf(start) + 1];
                    setForm(f => ({ ...f, startTime: start, endTime: end }));
                  }}
                  disabled={!current}
                >
                  {TIME_OPTIONS.slice(0, -1).map((t) => (
                    <MenuItem key={t} value={t} disabled={!current || !canStartAt(form.date, t, current.busy)}>
                      {t}{current && !canStartAt(form.date, t, current.busy) ? " — จองแล้ว" : ""}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  required
                  select
                  label="เวลาสิ้นสุดการใช้งาน"
                  value={form.endTime}
                  onChange={(e) => {
                    if (current && isTimeRangeAvailable(form.date, form.startTime, e.target.value, current.busy)) update("endTime", e.target.value);
                  }}
                  disabled={!current || !form.startTime}
                >
                  {TIME_OPTIONS.slice(1).map((t) => (
                    <MenuItem key={t} value={t} disabled={!current || !isTimeRangeAvailable(form.date, form.startTime, t, current.busy)}>
                      {t}{current && t > form.startTime && form.startTime && !isTimeRangeAvailable(form.date, form.startTime, t, current.busy) ? " — ทับช่วงจองแล้ว" : ""}
                    </MenuItem>
                  ))}
                </TextField>
              </div>
              {conflict && (
                <Alert severity="warning">
                  ช่วงเวลาที่เลือกมีการจองแล้ว กรุณาเลือกช่วงเวลาใหม่
                </Alert>
              )}
            </section>
            <section className="panel">
              <div className="section-heading">
                <span className="step">03</span>
                <div>
                  <h2>ข้อมูลการจอง</h2>
                  <p>กรอกข้อมูลสำหรับประสานงาน · ช่องที่มี <span style={{ color: "#d32f2f" }}>*</span> จำเป็นต้องกรอก</p>
                </div>
              </div>
              <div className="fields">
                {(
                  [
                    ["requesterName", "ชื่อผู้จองห้องประชุม", 150],
                    ["department", "ภารกิจ / หน่วยงาน / กลุ่มงาน", 200],
                    ["subject", "หัวข้อ / เรื่องในการประชุม", 300],
                  ] as const
                ).map(([key, label, maxLength]) => (
                  <TextField
                    key={key}
                    required
                    label={label}
                    value={form[key]}
                    onChange={(e) => update(key, e.target.value)}
                    slotProps={{ htmlInput: { maxLength } }}
                  />
                ))}
                <TextField required type="tel" label="เบอร์ติดต่อ / เบอร์ภายใน" value={form.internalPhone}
                  placeholder="7002 หรือ 081-234-5678"
                  onChange={e=>update('internalPhone',formatPhone(e.target.value))}
                  onBlur={()=>{setPhoneTouched(true);update('internalPhone',formatPhone(form.internalPhone.trim()));}}
                  error={phoneTouched&&!validPhone(form.internalPhone)}
                  helperText={phoneTouched&&!validPhone(form.internalPhone)?'ใช้เบอร์ภายใน 3–6 หลัก หรือเบอร์ไทย 9–10 หลักขึ้นต้นด้วย 0':'เช่น 7002, 02-123-4567 หรือ 081-234-5678'}
                  slotProps={{htmlInput:{inputMode:'tel',autoComplete:'tel-national',maxLength:20}}}/>
                <TextField
                  required
                  type="email"
                  label="อีเมลสำหรับติดต่อ"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  onBlur={()=>{setEmailTouched(true);update('email',form.email.trim());}}
                  placeholder="name@example.com"
                  error={emailTouched&&!validEmail(form.email.trim())}
                  helperText={emailTouched&&!validEmail(form.email.trim())?'กรุณากรอกอีเมลให้ถูกต้อง เช่น name@example.com':'สำหรับให้ผู้ดูแลติดต่อกลับ'}
                  slotProps={{ htmlInput: { maxLength: 254, inputMode:'email',autoComplete:'email',autoCapitalize:'none',spellCheck:false } }}
                />
              </div>
              <div className="equipment">
                <strong>
                  มีความประสงค์ขอใช้อุปกรณ์สำนักงาน{" "}
                  <small className="muted">(ไม่บังคับ)</small>
                </strong>
                <div>
                  {(Object.keys(EQUIPMENT) as (keyof typeof EQUIPMENT)[]).map(
                    (key) => (
                      <FormControlLabel
                        key={key}
                        control={
                          <Checkbox
                            checked={form.equipment.includes(key)}
                            onChange={(_, checked) =>
                              update(
                                "equipment",
                                checked
                                  ? [...form.equipment, key]
                                  : form.equipment.filter((e) => e !== key),
                              )
                            }
                          />
                        }
                        label={EQUIPMENT[key]}
                      />
                    ),
                  )}
                </div>
              </div>
            </section>
            <section className="panel summary">
              <div className="section-heading">
                <span className="step">04</span>
                <div>
                  <h2>ตรวจสอบและยืนยัน</h2>
                  <p>กรุณาตรวจสอบข้อมูลก่อนส่งการจอง</p>
                </div>
              </div>
              <h3>{room.name}</h3>
              <dl>
                {[
                  ["วันที่", thaiDate(form.date)],
                  [
                    "เวลา",
                    form.startTime && form.endTime
                      ? `${form.startTime}–${form.endTime}`
                      : "—",
                  ],
                  ["หัวข้อ", form.subject],
                  ["ผู้จอง", form.requesterName],
                  ["หน่วยงาน", form.department],
                  [
                    "อุปกรณ์",
                    form.equipment.map((e) => EQUIPMENT[e]).join(", ") ||
                      "ไม่ระบุ",
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value || "—"}</dd>
                  </div>
                ))}
              </dl>
              {error && (
                <Alert severity="error" sx={{ my: 2 }}>
                  {error}
                </Alert>
              )}
              <div className="submit-row">
                <small>กดยืนยันเพื่อบันทึกการจอง ระบบจะตรวจสอบเวลาว่างอีกครั้ง</small>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={
                    submitting ||
                    loading ||
                    !current ||
                    !!conflict ||
                    !!advanceError
                  }
                >
                  {submitting ? (
                    <>
                      <CircularProgress
                        size={18}
                        color="inherit"
                        sx={{ mr: 1 }}
                      />
                      กำลังบันทึก…
                    </>
                  ) : isDemo ? (
                    "ยืนยันการจองตัวอย่าง"
                  ) : (
                    "ตรวจสอบการจอง"
                  )}
                </Button>
              </div>
            </section>
          </fieldset>
        </form>
        <BookingConfirmDialog booking={reviewBooking} busy={submitting} demo={isDemo} onClose={()=>setReviewBooking(undefined)} onConfirm={confirmBooking}/>
        <footer>ระบบจองห้องประชุม · ชั้น 3 อาคารผู้ป่วยนอกและอุบัติเหตุ</footer>
      </main>
    </>
  );
}
