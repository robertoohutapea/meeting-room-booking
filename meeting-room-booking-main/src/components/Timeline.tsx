import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import { Button, Chip } from "@mui/material";
import { BUSINESS } from "../../shared/config";
import { TIME_OPTIONS, timestamp, thaiTime } from "../../shared/dates";
import { overlaps } from "../../shared/overlap";
import type { BusyPeriod } from "../../shared/types";
import { dragTimeRange, EMPTY_RANGE, selectTimeSlot, type TimeRange } from "../features/timeSelection";

interface Gesture { id: number; anchor: number; initial: TimeRange; erase: boolean }
export function Timeline({ date, busy, startTime, endTime, disabled, onSelect }: {
  date: string; busy: BusyPeriod[]; startTime: string; endTime: string; disabled: boolean;
  onSelect: (range: TimeRange) => void;
}) {
  const grid = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const [dragging, setDragging] = useState(false);
  const selected = (time: string) => !!startTime && !!endTime && time >= startTime && time < endTime;
  const apply = (target: number) => {
    const g = gesture.current;
    if (g && !disabled) onSelect(dragTimeRange(date, g.anchor, target, g.initial, g.erase, busy));
  };
  function start(event: PointerEvent<HTMLButtonElement>, index: number) {
    if (disabled || !event.isPrimary || event.button !== 0 || gesture.current) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    gesture.current = { id: event.pointerId, anchor: index, initial: { startTime, endTime }, erase: selected(TIME_OPTIONS[index]) };
    grid.current?.setPointerCapture(event.pointerId);
    setDragging(true);
    apply(index);
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (gesture.current?.id !== event.pointerId) return;
    const element = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-time-index]");
    if (element && grid.current?.contains(element)) apply(Number(element.dataset.timeIndex));
  }
  function finish(event: PointerEvent<HTMLDivElement>, cancel = false) {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    if (cancel) onSelect(g.initial);
    gesture.current = null;
    setDragging(false);
    if (grid.current?.hasPointerCapture(event.pointerId)) grid.current.releasePointerCapture(event.pointerId);
  }
  return (
    <div>
      <div className="timeline-legend">
        <span>เวลาทำการ {BUSINESS.opening}–{BUSINESS.closing}</span>
        <Chip size="small" label="ว่าง" color="primary" variant="outlined" />
        <Chip size="small" label="เลือกแล้ว" color="primary" />
        <Chip size="small" label="⊘ จองแล้ว · เลือกไม่ได้" sx={{ bgcolor: "#48404c", color: "#ffffff", fontWeight: 700 }} />
      </div>
      <p className="timeline-help" id="timeline-help">กดค้างแล้วลากบนช่องว่างเพื่อเลือก · ลากจากช่องสีชมพูเข้มเพื่อลบ · แตะช่องที่เลือกเพื่อเอาออก</p>
      <div ref={grid} className={`timeline ${dragging ? "is-dragging" : ""}`} role="group" aria-label="ตารางเวลาห้องประชุม" aria-describedby="timeline-help" onPointerMove={move} onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)} onLostPointerCapture={event => finish(event, true)} onKeyDown={event => {
        if (event.key === "Escape" && gesture.current) {
          onSelect(gesture.current.initial);
          const id = gesture.current.id;
          gesture.current = null; setDragging(false);
          if (grid.current?.hasPointerCapture(id)) grid.current.releasePointerCapture(id);
        }
      }}>
        {TIME_OPTIONS.slice(0, -1).map((time, i) => {
          const booked = busy.some(p => overlaps(timestamp(date, time), timestamp(date, TIME_OPTIONS[i + 1]), p.start, p.end));
          const active = !booked && selected(time);
          return <button type="button" key={time} data-time-index={i} disabled={booked || disabled} aria-disabled={booked || disabled} aria-pressed={active}
            aria-label={`${time}–${TIME_OPTIONS[i + 1]} ${booked ? "มีการจองแล้ว" : active ? "เลือกแล้ว กดเพื่อลบ" : "ว่าง กดเพื่อเลือก"}`}
            onPointerDown={event => { if (!booked) start(event, i); }}
            onClick={event => {
              // Pointer gestures already applied the change; keyboard clicks still work.
              if (event.detail !== 0 || booked || disabled) return;
              const range = active ? dragTimeRange(date, i, i, { startTime, endTime }, true, busy) : selectTimeSlot(date, time, startTime, busy);
              if (range) onSelect(range);
            }}
            className={`time-slot ${booked ? "busy" : ""} ${active ? "selected" : ""}`}>
            <strong>{time}</strong><span>{booked ? "⊘ จองแล้ว" : active ? "✓ เลือกแล้ว" : "ว่าง"}</span>
          </button>;
        })}
      </div>
      <div className="timeline-selection">
        <span role="status" aria-live="polite">{startTime && endTime ? `เลือกเวลา ${startTime}–${endTime}` : "ยังไม่ได้เลือกเวลา"}</span>
        <Button size="small" onClick={() => onSelect(EMPTY_RANGE)} disabled={disabled || (!startTime && !endTime)}>ล้างเวลาที่เลือก</Button>
      </div>
      <p className="timeline-help">เลือกได้ครั้งละหนึ่งช่วงต่อเนื่อง หากลบตรงกลาง ระบบจะเก็บช่วงก่อนหน้าไว้</p>
      <div className="busy-list">{busy.length ? busy.map((p, i) => <span key={i}>{thaiTime(p.start)}–{thaiTime(p.end)} · มีการจองแล้ว</span>) : <span>ยังไม่มีการจองในวันที่เลือก</span>}</div>
    </div>
  );
}
