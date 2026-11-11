import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

// Transcribed from the original policy image supplied by the user.
const sections = [
  {
    title: "มาตรการการจัดเตรียมสถานที่",
    items: [
      "การจองห้องประชุม เป็นรูปแบบการจองออนไลน์ เพื่อลดปริมาณการใช้กระดาษในการขอจองเพื่อใช้ห้องประชุม",
      "การจองห้องประชุม ควรจองก่อนวันจัดประชุม อย่างน้อย 1 วันทำการ",
      "การจองห้องประชุม ควรเลือกห้องที่เหมาะสมกับจำนวนผู้เข้าร่วมประชุม",
      "เปิดเครื่องปรับอากาศห้องประชุมที่อุณหภูมิ 25 องศาเซลเซียส",
      "หากมีความประสงค์ยกเลิกหรือเปลี่ยนแปลงการใช้ห้องประชุม โทรสายภายใน 7002",
      "กรณีจองห้องประชุม โดยไม่มีการจัดประชุมหรือได้ยกเลิกการประชุม และไม่มีการแจ้งยกเลิก ส่งผลให้เกิดผลกระทบต่อหน่วยงานอื่นๆ ทางผู้ดูแลระบบขออนุญาตแจ้งเตือนไปยังผู้จอง (กรณีแจ้งเตือน 2 ครั้ง จะขอระงับสิทธิรายชื่อผู้จองทันที)",
      "กรณีที่มีการประชุมด่วน/ประชุมสำคัญขององค์กร ขออนุญาตปรับเปลี่ยนห้องประชุมตามความเหมาะสม โดยจะมีการแจ้งให้ทราบก่อนการเปลี่ยนแปลง",
    ],
  },
  {
    title: "มาตรการการจัดประชุม",
    items: [
      "เนื่องจากห้องประชุม 1 มีขนาดใหญ่ ซึ่งจะอนุญาตให้ใช้ห้องประชุมได้เมื่อมีผู้ใช้งานห้องประชุมจำนวนมากกว่า 15 คน ขึ้นไป",
      "รณรงค์ให้ใช้การสแกน QR CODE แทนการแจกเอกสารประกอบการประชุม",
      "หากจำเป็นต้องใช้เอกสารประกอบการประชุมให้ใช้กระดาษทั้งสองหน้า",
      "ปิดไฟและอุปกรณ์ไฟฟ้าทุกครั้ง เมื่อไม่ใช้งาน",
    ],
  },
  {
    title: "มาตรการการรับประทานอาหาร/เครื่องดื่ม และรักษาความสะอาดในห้องประชุม",
    items: [
      "รณรงค์ให้ผู้เข้าประชุม นำแก้วส่วนตัวมาใช้ทุกครั้ง เพื่อลดปริมาณ ขวด/แก้วพลาสติก",
      "ช่วยกันรักษาความสะอาด เก็บเศษขยะลงถังขยะให้เรียบร้อย",
      "หลังใช้ห้องประชุมเสร็จ รบกวนจัดเก็บโต๊ะ เก้าอี้ ให้อยู่ในสภาพพร้อมใช้งานตามรูปแบบเดิม",
    ],
  },
];

export function PolicyDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <section className="panel policy">
        <div>
          <span className="eyebrow">ก่อนจองห้องประชุม</span>
          <h2>มาตรการใช้บริการห้องประชุม</h2>
          <p>อ่านแนวทางการจอง การจัดประชุม และการดูแลพื้นที่ร่วมกัน</p>
        </div>
        <Button variant="outlined" size="large" onClick={() => setOpen(true)} aria-haspopup="dialog">
          อ่านมาตรการใช้ห้องประชุม
        </Button>
      </section>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md" scroll="paper" aria-labelledby="policy-title" aria-describedby="policy-intro" slotProps={{ paper: { sx: { borderRadius: 4, m: { xs: 2, sm: 4 }, width: { xs: "calc(100% - 32px)" }, maxHeight: "calc(100% - 32px)" } } }}>
        <DialogTitle id="policy-title" sx={{ color: "primary.main", fontWeight: 700, pr: 3 }}>
          มาตรการใช้บริการห้องประชุม
        </DialogTitle>
        <DialogContent dividers className="policy-content">
          <p id="policy-intro">ชั้น 3 อาคารผู้ป่วยนอกและอุบัติเหตุ</p>
          <p className="policy-source">ข้อความตามประกาศมาตรการฉบับต้นฉบับของหน่วยงาน</p>
          {sections.map((section, index) => (
            <section key={section.title} className="policy-section" aria-labelledby={`policy-section-${index}`}>
              <h3 id={`policy-section-${index}`}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{section.title}</h3>
              <ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul>
            </section>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="contained" onClick={() => setOpen(false)}>ปิดมาตรการ</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
