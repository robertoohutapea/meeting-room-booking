import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import type { Booking } from '../../shared/types';
import { ROOMS, EQUIPMENT } from '../../shared/config';
import { thaiDate } from '../../shared/dates';
import { formatPhone } from '../../shared/phone';
export function BookingConfirmDialog({booking,busy,demo,onClose,onConfirm}: {
  booking?:Booking;busy:boolean;demo:boolean;onClose:()=>void;onConfirm:()=>void;
}) {
  return <Dialog open={!!booking} onClose={()=>{if(!busy)onClose();}} fullWidth maxWidth="sm" aria-labelledby="booking-confirm-title" aria-describedby="booking-confirm-description" slotProps={{paper:{sx:{borderRadius:4}}}}>
    <DialogTitle id="booking-confirm-title" sx={{fontWeight:700,color:'primary.main'}}>ตรวจสอบและยืนยันการจอง</DialogTitle>
    <DialogContent dividers className="summary">
      {booking&&<><h2>{ROOMS.find(r=>r.id===booking.roomId)?.name}</h2><dl>{[
        ['วันที่',thaiDate(booking.date)],['เวลา',`${booking.startTime}–${booking.endTime}`],['หัวข้อ',booking.subject],['ผู้จอง',booking.requesterName],['หน่วยงาน',booking.department],['เบอร์ติดต่อ',formatPhone(booking.internalPhone)],['อีเมล',booking.email],['อุปกรณ์',booking.equipment.map(e=>EQUIPMENT[e]).join(', ')||'ไม่ระบุ'],
      ].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></>}
      <p id="booking-confirm-description">{demo?'เป็นการจองตัวอย่างเท่านั้น':'กดยืนยันเพื่อบันทึกลง Google Calendar ระบบจะตรวจสอบเวลาว่างอีกครั้ง'}</p>
    </DialogContent>
    <DialogActions sx={{p:2,gap:1,flexWrap:'wrap'}}>
      <Button autoFocus disabled={busy} onClick={onClose}>กลับไปแก้ไข</Button>
      <Button variant="contained" disabled={busy} onClick={onConfirm}>{busy?<><CircularProgress size={18} color="inherit" sx={{mr:1}}/>กำลังดำเนินการ…</>:demo?'ยืนยันการจองตัวอย่าง':'ยืนยันการจอง'}</Button>
    </DialogActions>
  </Dialog>;
}
