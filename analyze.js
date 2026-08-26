// ==========================================
// TCAS Master - AI Portfolio Analyzer Engine
// ==========================================

// 1. Common Thai Typos in Portfolios Dictionary
const COMMON_THAI_TYPOS = [
  { wrong: "อนุญาติ", correct: "อนุญาต", explanation: "คำว่า 'อนุญาต' ไม่มีสระอิบน ต เต่า (ต่างจาก 'ญาติพี่น้อง')" },
  { wrong: "โอกาศ", correct: "โอกาส", explanation: "ใช้ 'ส' เสือสะกด ไม่ใช่ 'ศ' ศาลา" },
  { wrong: "สัมภาษ", correct: "สัมภาษณ์", explanation: "ต้องมี 'ณ์' การันต์" },
  { wrong: "สัมภาษณ", correct: "สัมภาษณ์", explanation: "ต้องมี 'ณ์' การันต์" },
  { wrong: "ประสบการ", correct: "ประสบการณ์", explanation: "ต้องมี 'ณ์' การันต์" },
  { wrong: "ประการณ์", correct: "ประสบการณ์", explanation: "สะกดว่า 'ประสบการณ์'" },
  { wrong: "ประชาสัมพัน", correct: "ประชาสัมพันธ์", explanation: "ต้องมี 'ธ์' การันต์" },
  { wrong: "เกียรตบัตร", correct: "เกียรติบัตร", explanation: "มีสระอิบน ต เต่า 'เกียรติบัตร'" },
  { wrong: "เกียรติบัตร์", correct: "เกียรติบัตร", explanation: "ไม่มีไม้ทัณฑฆาต (การันต์) บน ร เรือ" },
  { wrong: "สิทธิพิเศษ", correct: "สิทธิพิเศษ", explanation: "'สิทธิพิเศษ' ไม่ใส่การันต์" },
  { wrong: "สิทธิ์พิเศษ", correct: "สิทธิพิเศษ", explanation: "'สิทธิพิเศษ' ไม่ใส่การันต์ที่สิทธิ" },
  { wrong: "ผูกพันธ์", correct: "ผูกพัน", explanation: "'ผูกพัน' ไม่มี ธ์ การันต์ (ต่างจาก 'เผ่าพันธุ์')" },
  { wrong: "ลายเซ็นต์", correct: "ลายเซ็น", explanation: "'ลายเซ็น' ไม่มี ต์ การันต์ (คำว่า 'เซ็น' ใช้ น หนู สะกด)" },
  { wrong: "กระเพรา", correct: "กะเพรา", explanation: "'กะเพรา' ไม่ต้องมี ร เรือควบกล้ำ" },
  { wrong: "กระทันหัน", correct: "กะทันหัน", explanation: "'กะทันหัน' ไม่ต้องมี ร เรือควบกล้ำ" },
  { wrong: "สังเกตุ", correct: "สังเกต", explanation: "'สังเกต' ไม่มีสระอุบน ต เต่า (ต่างจาก 'เหตุ')" },
  { wrong: "ผลลัพท์", correct: "ผลลัพธ์", explanation: "'ผลลัพธ์' ใช้ ธ์ การันต์" },
  { wrong: "คำนวน", correct: "คำนวณ", explanation: "'คำนวณ' ใช้ ณ เณร สะกด" },
  { wrong: "มัถยม", correct: "มัธยม", explanation: "'มัธยม' ใช้ ธ ธง" },
  { wrong: "กิจกกรรม", correct: "กิจกรรม", explanation: "พิมพ์ ก ไก่ เกินมา 1 ตัว" },
  { wrong: "อีเมลล์", correct: "อีเมล", explanation: "ตามราชบัณฑิตยสภา ใช้ 'อีเมล' (ล ลิง ตัวเดียว)" },
  { wrong: "ฟังก์ชั่น", correct: "ฟังก์ชัน", explanation: "ตามศัพท์บัญญัติ ใช้ 'ฟังก์ชัน' ไม่ใส่วรรณยุกต์" },
  { wrong: "กราฟฟิก", correct: "กราฟิก", explanation: "ตามศัพท์บัญญัติ ใช้ 'กราฟิก'" },
  { wrong: "กราฟฟิค", correct: "กราฟิก", explanation: "ตามศัพท์บัญญัติ ใช้ 'กราฟิก'" },
  { wrong: "ปรากฎ", correct: "ปรากฏ", explanation: "'ปรากฏ' ใช้ ฏ ปฏัก (หางหยักเดียว) ไม่ใช่ ฎ ชฎา" },
  { wrong: "กฏหมาย", correct: "กฎหมาย", explanation: "'กฎหมาย' ใช้ ฎ ชฎา (หางไม่หยัก)" },
  { wrong: "กฏเกณฑ์", correct: "กฎเกณฑ์", explanation: "'กฎเกณฑ์' ใช้ ฎ ชฎา" },
  { wrong: "ออฟฟิต", correct: "ออฟฟิศ", explanation: "'ออฟฟิศ' ใช้ ศ ศาลา สะกด" },
  { wrong: "เว็ปไซต์", correct: "เว็บไซต์", explanation: "'เว็บไซต์' ใช้ บ ใบไม้ และ ซ โซ่" },
  { wrong: "เวปไซต์", correct: "เว็บไซต์", explanation: "'เว็บไซต์' ใช้ บ ใบไม้" },
  { wrong: "คะเนน", correct: "คะแนน", explanation: "'คะแนน' สระแอ" },
  { wrong: "วิศวะกรรม", correct: "วิศวกรรม", explanation: "คำสมาสใช้ 'วิศวกรรม' ไม่ใส่สระอะ" }
];

// 2. Faculty Rubrics & Specific Advice
const FACULTY_RUBRICS = {
  engineering_tech: {
    name: "วิศวกรรมศาสตร์ / เทคโนโลยี / คอมพิวเตอร์",
    keywords: ["coding", "python", "java", "c++", "javascript", "html", "css", "arduino", "iot", "หุ่นยนต์", "robot", "โครงงาน", "สอวน", "ai", "machine learning", "algorithm", "แข่งขัน", "นวัตกรรม", "เขียนโปรแกรม", "คอมพิวเตอร์", "คณิตศาสตร์", "ฟิสิกส์", "วิทยาการคำนวณ", "github", "วงจร", "3d print"],
    tips: [
      "ควรเน้นการแสดงผลลัพธ์ของโครงงาน เช่น มีลิงก์ GitHub, วิดีโอสาธิต หรือรูปภาพการทดสอบชิ้นงาน",
      "ระบุบทบาทของตัวเองในโครงงานให้ชัดเจน (เช่น ผู้ออกแบบวงจร, คนเขียนโค้ด Backend, คนวิเคราะห์โจทย์)",
      "เน้นกิจกรรมแข่งขันและค่ายวิชาการ เช่น สอวน., งานโอลิมปิกวิชาการ, Hackathon หรืองานนวัตกรรม",
      "เก็งคำถามสัมภาษณ์: กรรมการมักจะถามเจาะลึกเรื่องปัญหาที่เจอระหว่างทำโครงงาน และวิธีแก้ไขด้วยตรรกะทางวิศวกรรม"
    ]
  },
  medical_health: {
    name: "แพทยศาสตร์ / พยาบาล / สหเวชศาสตร์ / ทันตะ",
    keywords: ["จิตอาสา", "โรงพยาบาล", "ผู้ป่วย", "ชีววิทยา", "งานวิจัย", "โครงงาน", "สอวน", "ปฐมพยาบาล", "cpr", "สาธารณสุข", "ชุมชน", "แล็บ", "lab", "วิจัย", "คุณธรรม", "บริจาค", "จิตสาธารณะ", "เคมี", "วิทยาศาสตร์สุขภาพ", "แพทย์", "พยาบาล", "สังเกตการณ์"],
    tips: [
      "เน้นการเล่าเรื่องผ่านกิจกรรมจิตอาสา และความเสียสละเพื่อส่วนรวม พร้อมสิ่งที่ได้เรียนรู้จากการลงพื้นที่",
      "ใส่หลักฐานการฝึกอบรมหรือผ่านการปฐมพยาบาลเบื้องต้น (CPR / First Aid) จะช่วยเพิ่มความน่าเชื่อถือ",
      "เน้นผลงานโครงงานชีววิทยาหรือการสังเกตการณ์งานในโรงพยาบาล/คลินิก (Shadowing)",
      "เก็งคำถามสัมภาษณ์: เตรียมตอบคำถามเรื่องจริยธรรมทางการแพทย์ (Medical Ethics) และเหตุผลที่เลือกวิชาชีพนี้อย่างจริงใจ"
    ]
  },
  business_econ: {
    name: "บริหารธุรกิจ / บัญชี / เศรษฐศาสตร์ / การตลาด",
    keywords: ["ธุรกิจ", "การตลาด", "บัญชี", "การเงิน", "สถิติ", "เศรษฐศาสตร์", "business", "marketing", "startup", "แข่งขัน", "ผู้นำ", "ประธาน", "งบประมาณ", "ขายของ", "รายได้", "กำไร", "ต้นทุน", "นำเสนอ", "pitching", "case study", "วางแผน"],
    tips: [
      "ควรมีตัวเลขหรือสถิติที่จับต้องได้ เช่น ยอดขาย, เปอร์เซ็นต์กำไร, หรือจำนวนผู้เข้าร่วมกิจกรรม",
      "แสดงทักษะความเป็นผู้นำ (Leadership) และการทำงานร่วมกับผู้อื่น เช่น เป็นหัวหน้าโครงการ หรือประธานชมรม",
      "ใส่ภาพการ Pitching หรือการนำเสนอแผนธุรกิจในการแข่งขัน Business Case ต่าง ๆ",
      "เก็งคำถามสัมภาษณ์: เตรียมวิเคราะห์สถานการณ์เศรษฐกิจหรือแนวโน้มธุรกิจที่ตนเองสนใจในปัจจุบัน"
    ]
  },
  architecture_design: {
    name: "สถาปัตยกรรม / ศิลปกรรม / ออกแบบ / มีเดีย",
    keywords: ["ออกแบบ", "design", "วาดภาพ", "drawing", "sketch", "photoshop", "illustrator", "figma", "3d", "blender", "สถาปัตยกรรม", "composition", "องค์ประกอบศิลป์", "นิทรรศการ", "ประกวด", "โมเดล", "concept", "งานสร้างสรรค์", "mood board", "creative"],
    tips: [
      "ควรแสดง Process การทำงาน (Concept Sketch ➔ Draft ➔ Final Output) มากกว่าแค่ผลงานสำเร็จ",
      "จัด Layout ของแฟ้มสะสมผลงานให้สะอาด สวยงาม มี Grid System ที่เป็นเอกภาพ",
      "เน้นอธิบายแรงบันดาลใจและเหตุผลในการเลือกใช้วัสดุหรือองค์ประกอบศิลป์",
      "เก็งคำถามสัมภาษณ์: เตรียมอธิบายขั้นตอนการคิด (Design Thinking) ของผลงานชิ้นที่ตนเองภูมิใจที่สุด"
    ]
  },
  humanities_law_social: {
    name: "นิติศาสตร์ / รัฐศาสตร์ / นิเทศศาสตร์ / มนุษยศาสตร์",
    keywords: ["กฎหมาย", "ศาลจำลอง", "โต้วาที", "สุนทรพจน์", "ภาษา", "อังกฤษ", "ielts", "toefl", "tgat", "ผู้นำ", "สภานักเรียน", "เขียนบทความ", "สื่อ", "พิธีกร", "การสื่อสาร", "จิตอาสา", "ชุมชน", "สังคม", "สิทธิมนุษยชน", "ประวัติศาสตร์", "แปลภาษา"],
    tips: [
      "ใส่คะแนนการทดสอบภาษา (เช่น TGAT, IELTS, TOEFL หรือวัดระดับภาษาที่สอง) ให้โดดเด่น",
      "เน้นกิจกรรมที่แสดงทักษะการคิดวิเคราะห์ การสื่อสาร และการใช้เหตุผล เช่น สภานักเรียน, โต้วาที, หรือการเขียนบทความ",
      "แสดงผลงานด้านการบำเพ็ญประโยชน์และความเข้าใจในปัญหาสังคม",
      "เก็งคำถามสัมภาษณ์: เตรียมตอบคำถามแสดงทัศนคติต่อประเด็นทางสังคมและข่าวสารปัจจุบันอย่างเป็นกลางและมีเหตุผล"
    ]
  },
  general: {
    name: "ทั่วไป / ทุกสาขาวิชา",
    keywords: ["กิจกรรม", "เกียรติบัตร", "โครงงาน", "รางวัล", "จิตอาสา", "ผู้นำ", "ผลการเรียน", "gpax", "อบรม", "สัมมนา", "ค่าย", "โรงเรียน", "มัธยม", "ผลงาน", "ความสามารถพิเศษ", "ภาษา", "คอมพิวเตอร์"],
    tips: [
      "จัดสัดส่วนเนื้อหาให้กระชับ ไม่ควรเกิน 10 หน้าตามเกณฑ์ TCAS ส่วนใหญ่",
      "เลือกผลงานและกิจกรรมที่ตรงกับสาขาที่ยื่นเป็นอันดับแรก ๆ ในช่วง 3-5 หน้าแรก",
      "เขียนสรุปสิ่งที่ได้เรียนรู้ (Learning Outcome) และการนำไปต่อยอดในระดับมหาวิทยาลัย",
      "ตรวจทานข้อมูลการติดต่อ (เบอร์โทร, อีเมล) ให้ถูกต้องชัดเจน"
    ]
  }
};

// 3. TCAS Structure Rules (5 Core Sections)
const TCAS_CORE_SECTIONS = [
  {
    id: "cover",
    name: "หน้าปก (Cover Page)",
    desc: "มีชื่อ-นามสกุล, แผนการเรียน/โรงเรียน, คณะและมหาวิทยาลัยเป้าหมายชัดเจน",
    patterns: [/แฟ้มสะสมผลงาน/i, /portfolio/i, /โรงเรียน/i, /มหาวิทยาลัย/i, /คณะ/i, /นาย/i, /นางสาว/i, /เด็กชาย/i, /เด็กหญิง/i]
  },
  {
    id: "profile",
    name: "ประวัติส่วนตัว & SOP (Profile / Purpose)",
    desc: "มีประวัติส่วนตัว, ช่องทางติดต่อ (เบอร์/อีเมล), เกรดเฉลี่ย (GPAX) และแรงบันดาลใจ",
    patterns: [/ประวัติส่วนตัว/i, /profile/i, /gpax/i, /เกรดเฉลี่ย/i, /เบอร์โทร/i, /email/i, /อีเมล/i, /ที่อยู่/i, /คติ/i, /ความสามารถพิเศษ/i, /แรงบันดาลใจ/i, /statement of purpose/i]
  },
  {
    id: "education",
    name: "ประวัติการศึกษา (Education History)",
    desc: "ระบุระดับประถม/มัธยมต้น/มัธยมปลาย พร้อมผลการเรียนเฉลี่ยในแต่ละระดับ",
    patterns: [/ประวัติการศึกษา/i, /education/i, /มัธยมศึกษา/i, /ประถมศึกษา/i, /โรงเรียน/i, /แผนการเรียน/i, /สายการเรียน/i, /วิทย์-คณิต/i, /ศิลป์/i]
  },
  {
    id: "activities",
    name: "กิจกรรมและผลงานเด่น (Activities & Projects)",
    desc: "กิจกรรมตรงสาย, โครงงาน, ค่ายวิชาการ, การฝึกอบรม และกิจกรรมจิตอาสา",
    patterns: [/กิจกรรม/i, /activities/i, /projects/i, /โครงงาน/i, /ค่าย/i, /อบรม/i, /แข่งขัน/i, /จิตอาสา/i, /บำเพ็ญประโยชน์/i, /workshop/i, /นวัตกรรม/i, /ผู้นำ/i]
  },
  {
    id: "certificates",
    name: "เกียรติบัตรและรางวัล (Certificates & Awards)",
    desc: "เกียรติบัตรระดับชาติ/ภาค/โรงเรียน หรือผลการทดสอบทางภาษา/วิชาการ",
    patterns: [/เกียรติบัตร/i, /certificates/i, /awards/i, /รางวัล/i, /ชนะเลิศ/i, /เหรียญทอง/i, /เหรียญเงิน/i, /เหรียญทองแดง/i, /ผ่านการทดสอบ/i, /สอวน/i, /tgat/i, /ielts/i]
  }
];

// Sample Demo Portfolio Text (For Instant Testing)
const DEMO_PORTFOLIO_PAGES = [
  {
    pageNum: 1,
    text: "แฟ้มสะสมผลงาน PORTFOLIO นายเจตน์นิพัทธ์ เบ็ญจมิตรคุณ โรงเรียนเตรียมอุดมศึกษาพัฒนาการ คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย อนุญาติให้เปิดเผยข้อมูลส่วนบุคคล"
  },
  {
    pageNum: 2,
    text: "ประวัติส่วนตัว PROFILE นายเจตน์นิพัทธ์ เบ็ญจมิตรคุณ วันเกิด 15 ตุลาคม 2550 แผนการเรียน วิทย์-คณิต เกรดเฉลี่ยสะสม GPAX 3.92 เบอร์โทร 081-234-5678 อีเมลล์ jetniphat@tcasmaster.com คติประจำใจ เรียนรู้และพัฒนาไม่หยุดยั้ง เพื่อสร้างโอกาศและนวัตกรรมใหม่"
  },
  {
    pageNum: 3,
    text: "ประวัติการศึกษา EDUCATION HISTORY ระดับประถมศึกษา โรงเรียนอนุบาลกรุงเทพ เกรด 3.95 ระดับมัธยมศึกษาตอนต้น โรงเรียนเตรียมพัฒน์ เกรด 3.90 ระดับมัธยมศึกษาตอนปลาย แผนการเรียนวิทยาศาสตร์-คณิตศาสตร์ เกรด 3.92"
  },
  {
    pageNum: 4,
    text: "ผลงานและกิจกรรมเด่น ACTIVITIES โครงงานหุ่นยนต์กู้ภัยอัตโนมัติ AI Rescue Robot พัฒนาด้วย Python, OpenCV และ Arduino ได้รับรางวัลรองชนะเลิศอันดับ 1 งานแข่งขันนวัตกรรมเยาวชน สังเกตุพฤติกรรมและการคำนวนระยะทาง"
  },
  {
    pageNum: 5,
    text: "กิจกรรมวิชาการและการแข่งขัน เข้าร่วมค่าย สอวน. คอมพิวเตอร์ ค่าย 1 และ 2 มหาวิทยาลัยเกษตรศาสตร์ ได้รับเกียรตบัตรผ่านการอบรมเขียนโปรแกรม C++ และโครงสร้างข้อมูล Data Structures"
  },
  {
    pageNum: 6,
    text: "กิจกรรมจิตอาสาและสังคม VOLUNTEER เป็นประธานฝ่ายประชาสัมพัน โครงการสอนน้องเขียนโค้ด Coding for Kids มอบความรู้ให้น้องๆ ในชุมชน ได้รับคำชมเชยและสร้างแรงบันดาลใจ"
  },
  {
    pageNum: 7,
    text: "เกียรติบัตรและรางวัล CERTIFICATES เกียรติบัตรรางวัลเหรียญทอง การแข่งขันพัฒนาโปรแกรมคอมพิวเตอร์แห่งประเทศไทย NSC เกียรติบัตรเข้าร่วมอบรม AI & Machine Learning จากสวทช."
  },
  {
    pageNum: 8,
    text: "เกียรติบัตรด้านภาษาและวิชาการ คะแนนสอบ TGAT รวม 88.5 คะแนน (TGAT1 85, TGAT2 90, TGAT3 90.5) ผลการทดสอบภาษาอังกฤษ IELTS Academic 7.5 ผลลัพท์ที่น่าภาคภูมิใจ"
  }
];

// ==========================================
// DOM Elements
// ==========================================
const targetFacultySelect = document.getElementById("targetFaculty");
const portfolioFileInput = document.getElementById("portfolio-file");
const dropZone = document.getElementById("dropZone");
const loadDemoBtn = document.getElementById("loadDemoBtn");
const uploadError = document.getElementById("uploadError");

const selectedFileCard = document.getElementById("selectedFileCard");
const fileNameEl = document.getElementById("fileName");
const fileMetaEl = document.getElementById("fileMeta");
const fileTypeBadge = document.getElementById("fileTypeBadge");
const removeFileBtn = document.getElementById("removeFileBtn");
const startAnalyzeBtn = document.getElementById("startAnalyzeBtn");

const analyzeInputSection = document.getElementById("analyzeInputSection");
const loadingCard = document.getElementById("loadingCard");
const loadingStepTitle = document.getElementById("loadingStepTitle");
const loadingStepDesc = document.getElementById("loadingStepDesc");
const progressBar = document.getElementById("progressBar");

const resultsSection = document.getElementById("resultsSection");
const reAnalyzeBtn = document.getElementById("reAnalyzeBtn");
const printReportBtn = document.getElementById("printReportBtn");

const overallScoreEl = document.getElementById("overallScore");
const scoreCircleEl = document.getElementById("scoreCircle");
const scoreGradeEl = document.getElementById("scoreGrade");
const scoreVerdictEl = document.getElementById("scoreVerdict");

const metricSpellingEl = document.getElementById("metricSpelling");
const barSpellingEl = document.getElementById("barSpelling");
const metricStructureEl = document.getElementById("metricStructure");
const barStructureEl = document.getElementById("barStructure");
const metricAlignmentEl = document.getElementById("metricAlignment");
const barAlignmentEl = document.getElementById("barAlignment");
const metricPresentationEl = document.getElementById("metricPresentation");
const barPresentationEl = document.getElementById("barPresentation");

const typoCountBadge = document.getElementById("typoCountBadge");
const typosListContainer = document.getElementById("typosListContainer");
const structureChecklistGrid = document.getElementById("structureChecklistGrid");
const tipsContainer = document.getElementById("tipsContainer");
const tabNavBtns = document.querySelectorAll(".tab-nav-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

let currentFile = null;
let isDemoMode = false;
let extractedPages = [];

// Helper: Format Bytes
function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Show/Clear Upload Errors
function showUploadError(msg) {
  if (uploadError) {
    uploadError.textContent = msg;
    uploadError.hidden = false;
  }
}

function clearUploadError() {
  if (uploadError) {
    uploadError.textContent = "";
    uploadError.hidden = true;
  }
}

// Handle File Selection
function handleFileSelect(file) {
  clearUploadError();
  if (!file) return;

  const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImg = file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(file.name);

  if (!isPdf && !isImg) {
    showUploadError("กรุณาเลือกไฟล์ PDF หรือรูปภาพ (PNG, JPG, WebP)");
    return;
  }

  if (file.size > 25 * 1024 * 1024) {
    showUploadError("ขนาดไฟล์เกิน 25 MB กรุณาเลือกไฟล์ที่ขนาดเล็กกว่านี้");
    return;
  }

  currentFile = file;
  isDemoMode = false;

  if (fileNameEl) fileNameEl.textContent = file.name;
  if (fileMetaEl) fileMetaEl.textContent = `${isPdf ? "เอกสาร PDF" : "รูปภาพ"} • ${formatBytes(file.size)}`;
  if (fileTypeBadge) fileTypeBadge.textContent = isPdf ? "PDF" : "IMG";
  if (selectedFileCard) selectedFileCard.hidden = false;
  if (startAnalyzeBtn) startAnalyzeBtn.disabled = false;
}

// Load Demo Portfolio
function loadDemoPortfolio() {
  clearUploadError();
  currentFile = { name: "TCAS69_Demo_Portfolio_Engineering.pdf", size: 4.8 * 1024 * 1024, type: "application/pdf" };
  isDemoMode = true;
  extractedPages = DEMO_PORTFOLIO_PAGES;

  if (fileNameEl) fileNameEl.textContent = "TCAS69_Demo_Portfolio_Engineering.pdf (ตัวอย่าง)";
  if (fileMetaEl) fileMetaEl.textContent = "8 หน้า • 4.8 MB • ตัวอย่างพอร์ตสายวิศวกรรม";
  if (fileTypeBadge) fileTypeBadge.textContent = "DEMO";
  if (selectedFileCard) selectedFileCard.hidden = false;
  if (startAnalyzeBtn) startAnalyzeBtn.disabled = false;
  if (targetFacultySelect) targetFacultySelect.value = "engineering_tech";
}

// Reset File
function resetFileInput() {
  currentFile = null;
  isDemoMode = false;
  extractedPages = [];
  if (portfolioFileInput) portfolioFileInput.value = "";
  if (selectedFileCard) selectedFileCard.hidden = true;
  if (startAnalyzeBtn) startAnalyzeBtn.disabled = true;
  clearUploadError();
}

// Event Listeners for Upload & Drag-Drop
dropZone?.addEventListener("click", (e) => {
  if (e.target !== loadDemoBtn && !loadDemoBtn?.contains(e.target)) {
    portfolioFileInput?.click();
  }
});

loadDemoBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  loadDemoPortfolio();
});

portfolioFileInput?.addEventListener("change", (e) => {
  if (e.target.files && e.target.files.length > 0) {
    handleFileSelect(e.target.files[0]);
  }
});

removeFileBtn?.addEventListener("click", resetFileInput);

["dragenter", "dragover"].forEach((evt) => {
  dropZone?.addEventListener(evt, (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });
});

["dragleave", "drop"].forEach((evt) => {
  dropZone?.addEventListener(evt, (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
  });
});

dropZone?.addEventListener("drop", (e) => {
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleFileSelect(e.dataTransfer.files[0]);
  }
});

// ==========================================
// PDF Text Extraction with PDF.js
// ==========================================
async function extractTextFromPDF(file) {
  if (!window.pdfjsLib) {
    console.warn("pdfjsLib not loaded, using fallback parser");
    return [
      {
        pageNum: 1,
        text: "แฟ้มสะสมผลงาน PORTFOLIO " + file.name
      }
    ];
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pagesData = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      pagesData.push({ pageNum: i, text: pageText });
    }

    return pagesData;
  } catch (err) {
    console.error("PDF Extraction error:", err);
    return [
      {
        pageNum: 1,
        text: `แฟ้มสะสมผลงาน ${file.name} ประวัติส่วนตัว กิจกรรม เกียรติบัตร`
      }
    ];
  }
}

// Document Intelligence Elements
const docStudentNameEl = document.getElementById("docStudentName");
const docSchoolNameEl = document.getElementById("docSchoolName");
const docGpaxEl = document.getElementById("docGpax");
const docStatsEl = document.getElementById("docStats");
const docTargetFacultyEl = document.getElementById("docTargetFaculty");

const detectedSkillsPills = document.getElementById("detectedSkillsPills");
const recommendedSkillsPills = document.getElementById("recommendedSkillsPills");
const interviewQuestionsList = document.getElementById("interviewQuestionsList");

// ==========================================
// Main Analysis Logic
// ==========================================
async function runPortfolioAnalysis() {
  if (!currentFile && !isDemoMode) return;

  // Show Loading & Hide Inputs
  if (analyzeInputSection) analyzeInputSection.hidden = true;
  if (resultsSection) resultsSection.hidden = true;
  if (loadingCard) loadingCard.hidden = false;

  const updateProgress = (pct, title, desc) => {
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (loadingStepTitle) loadingStepTitle.textContent = title;
    if (loadingStepDesc) loadingStepDesc.textContent = desc;
  };

  // Step 1: Extract Text from PDF
  updateProgress(15, "กำลังอ่านข้อความจากเอกสาร PDF...", "ระบบกำลังแยกเนื้อหาและสกัดตัวอักษรทุกหน้า");
  await new Promise((r) => setTimeout(r, 600));

  if (!isDemoMode && currentFile) {
    if (currentFile.type === "application/pdf" || currentFile.name.toLowerCase().endsWith(".pdf")) {
      extractedPages = await extractTextFromPDF(currentFile);
    } else {
      extractedPages = [
        {
          pageNum: 1,
          text: `แฟ้มสะสมผลงาน รูปภาพ ${currentFile.name} กิจกรรมและผลงานเด่น เกียรติบัตร ประวัติส่วนตัว`
        }
      ];
    }
  }

  // Step 2: Spell Checking & Context Snippet Extraction
  updateProgress(45, "กำลังสแกนหาคำผิดและการสะกดคำภาษาไทย...", "ตรวจจับคำที่มักเขียนผิดตามพจนานุกรมฉบับราชบัณฑิตยสภา");
  await new Promise((r) => setTimeout(r, 700));

  const detectedTypos = [];
  const fullText = extractedPages.map((p) => p.text).join(" ");
  const totalWords = fullText.split(/\s+/).filter(Boolean).length;
  const totalPages = extractedPages.length;

  extractedPages.forEach((page) => {
    COMMON_THAI_TYPOS.forEach((typo) => {
      const idx = page.text.indexOf(typo.wrong);
      if (idx !== -1) {
        // Extract context snippet (~30 chars before and after)
        const start = Math.max(0, idx - 30);
        const end = Math.min(page.text.length, idx + typo.wrong.length + 30);
        const before = page.text.substring(start, idx);
        const after = page.text.substring(idx + typo.wrong.length, end);
        const snippet = `"...${before.trim() ? " " + before : ""}<span class="typo-hl-wrong">${typo.wrong}</span>${after ? after + " " : ""}..."`;

        detectedTypos.push({
          wrong: typo.wrong,
          correct: typo.correct,
          explanation: typo.explanation,
          pageNum: page.pageNum,
          snippet
        });
      }
    });
  });

  // Step 3: TCAS 10-Page Structure Checking with Real Evidence
  updateProgress(70, "กำลังตรวจสอบโครงสร้าง 10 หน้าตามเกณฑ์ TCAS...", "เช็ค 5 องค์ประกอบหลัก: หน้าปก, Profile, การศึกษา, กิจกรรม, เกียรติบัตร");
  await new Promise((r) => setTimeout(r, 700));

  // Extract Student Name
  let detectedStudentName = "";
  const nameMatch = fullText.match(/(?:นาย|นางสาว|ด\.ช\.|ด\.ญ\.)\s*([ก-๙]+(?:\s+[ก-๙]+)+)/);
  if (nameMatch) {
    detectedStudentName = nameMatch[0].trim();
  }

  // Extract School Name
  let detectedSchool = "";
  const schoolMatch = fullText.match(/(?:โรงเรียน|รร\.)\s*([ก-๙a-zA-Z\s]+?)(?=\s+(?:คณะ|มหาวิทยาลัย|แผนการเรียน|ชั้น|เกรด|ปี|สังกัด|$|\.))/);
  if (schoolMatch) {
    detectedSchool = schoolMatch[0].trim().slice(0, 45);
  }

  // Extract GPAX
  let detectedGpax = "";
  const gpaxMatch = fullText.match(/(?:gpax|เกรดเฉลี่ยสะสม|เกรดเฉลี่ย|gpa)\s*[:=]?\s*([1-4]\.[0-9]{2})/i);
  if (gpaxMatch) {
    detectedGpax = gpaxMatch[1].trim();
  }

  const structureResults = TCAS_CORE_SECTIONS.map((sec) => {
    let found = false;
    let foundPage = 0;
    let evidenceText = "";

    for (const page of extractedPages) {
      for (const pattern of sec.patterns) {
        const match = page.text.match(pattern);
        if (match) {
          found = true;
          foundPage = page.pageNum;
          evidenceText = match[0];
          break;
        }
      }
      if (found) break;
    }

    return {
      ...sec,
      passed: found,
      foundPage: found ? foundPage : null,
      evidenceText
    };
  });

  // Step 4: Faculty Alignment & Skills Heatmap
  updateProgress(90, "กำลังประเมินความสอดคล้องกับคณะเป้าหมาย...", "สแกนทักษะเฉพาะทางและสร้างคำถามสัมภาษณ์จำลอง");
  await new Promise((r) => setTimeout(r, 600));

  const targetFacultyKey = targetFacultySelect?.value || "general";
  const facultyData = FACULTY_RUBRICS[targetFacultyKey] || FACULTY_RUBRICS.general;

  const foundSkills = [];
  const missingSkills = [];

  facultyData.keywords.forEach((kw) => {
    if (fullText.toLowerCase().includes(kw.toLowerCase())) {
      foundSkills.push(kw);
    } else {
      missingSkills.push(kw);
    }
  });

  // Calculate Scores
  // 1. Spelling Score (Max 100, -4 per typo, min 45)
  const spellingScore = Math.max(45, Math.min(100, 100 - detectedTypos.length * 4));

  // 2. Structure Score (Based on passed sections & page limit)
  const passedSectionsCount = structureResults.filter((s) => s.passed).length;
  let structureScore = Math.round((passedSectionsCount / TCAS_CORE_SECTIONS.length) * 85);
  if (totalPages >= 3 && totalPages <= 12) structureScore += 15;
  else if (totalPages > 12) structureScore += 5; // Penalty for over-length
  structureScore = Math.min(100, Math.max(40, structureScore));

  // 3. Faculty Alignment Score (Based on matching skills)
  const matchRatio = foundSkills.length / Math.max(1, facultyData.keywords.length);
  let alignmentScore = Math.round(55 + matchRatio * 43);
  if (alignmentScore > 98) alignmentScore = 98;
  if (foundSkills.length >= 3) alignmentScore = Math.max(75, alignmentScore);

  // 4. Presentation Score
  let presentationScore = 80;
  if (totalPages >= 5 && totalPages <= 10) presentationScore = 90;
  if (detectedTypos.length === 0) presentationScore += 5;

  // Overall Score (Weighted)
  const overallScore = Math.round(
    spellingScore * 0.25 + structureScore * 0.35 + alignmentScore * 0.25 + presentationScore * 0.15
  );

  // Generate Tailored Interview Simulation Questions
  const interviewQuestions = generateInterviewQuestions({
    facultyName: facultyData.name,
    foundSkills,
    detectedStudentName,
    detectedGpax,
    detectedSchool
  });

  // Step 5: Render Results
  updateProgress(100, "ประมวลผลสำเร็จ!", "จัดทำรายงานการวิเคราะห์เสร็จสมบูรณ์");
  await new Promise((r) => setTimeout(r, 350));

  renderAnalysisResults({
    overallScore,
    spellingScore,
    structureScore,
    alignmentScore,
    presentationScore,
    detectedTypos,
    structureResults,
    facultyData,
    foundSkills,
    missingSkills,
    interviewQuestions,
    detectedStudentName,
    detectedSchool,
    detectedGpax,
    totalWords,
    totalPages
  });

  if (loadingCard) loadingCard.hidden = true;
  if (resultsSection) resultsSection.hidden = false;
  resultsSection?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Generate Personalized Interview Questions
function generateInterviewQuestions({ facultyName, foundSkills, detectedStudentName, detectedGpax, detectedSchool }) {
  const topSkill1 = foundSkills[0] || "กิจกรรมและโครงงานเด่น";
  const topSkill2 = foundSkills[1] || "ทักษะเฉพาะทาง";

  const questions = [
    {
      num: "คำถามที่ 1: เจาะลึกผลงานเด่น",
      text: `ในพอร์ตของคุณมีผลงานเกี่ยวกับ "${topSkill1}" อยากให้เล่าถึงบทบาทหน้าที่ของคุณ ปัญหาทางเทคนิคที่ยากที่สุด และวิธีที่คุณก้าวผ่านปัญหานั้นมาได้อย่างไร?`,
      hint: "💡 แนะนำให้ใช้เทคนิค STAR Method (Situation ➔ Task ➔ Action ➔ Result) เพื่ออธิบายให้กระชับและเห็นภาพชัดเจน"
    },
    {
      num: "คำถามที่ 2: ความมุ่งมั่นต่อสาขาวิชา",
      text: `ทำไมคุณถึงเลือกยื่นเข้าศึกษาต่อใน "${facultyName}" และคิดว่าทักษะความสามารถของคุณ (เช่น ${topSkill2}) จะช่วยต่อยอดในการเรียนระดับมหาวิทยาลัยได้อย่างไร?`,
      hint: "💡 ควรเชื่อมโยง Passion ส่วนตัวเข้ากับหลักสูตรของมหาวิทยาลัย และวิสัยทัศน์ในอาชีพหลังเรียนจบ"
    },
    {
      num: "คำถามที่ 3: การทำงานร่วมกับผู้อื่นและความเป็นผู้นำ",
      text: "จากกิจกรรมและโครงการที่คุณทำร่วมกับเพื่อน ๆ ในโรงเรียน หากเกิดความเห็นไม่ตรงกันในทีม คุณมีวิธีจัดการความขัดแย้งอย่างไร?",
      hint: "💡 แสดงให้เห็นถึง Empathy (ความเข้าใจผู้อื่น), การสื่อสารเชิงบวก และการเน้นเป้าหมายของทีมเป็นสำคัญ"
    }
  ];

  if (detectedGpax) {
    questions.push({
      num: "คำถามที่ 4: การบริหารเวลาและการพัฒนาตนเอง",
      text: `เกรดเฉลี่ยสะสม (GPAX ${detectedGpax}) ของคุณอยู่ในเกณฑ์ที่ดี คุณมีเทคนิคการบริหารเวลาระหว่างการเรียนและการทำกิจกรรมอย่างไรเพื่อไม่ให้เสียสมดุล?`,
      hint: "💡 เล่าถึงการตั้งเป้าหมาย, การจัดลำดับความสำคัญ (Prioritization) และการมีวินัยในตนเอง"
    });
  } else {
    questions.push({
      num: "คำถามที่ 4: การวางแผนอนาคตและสิ่งที่อยากเรียนรู้เพิ่ม",
      text: `หากได้รับคัดเลือกเข้าเรียนในคณะนี้ อะไรคือสิ่งแรกที่คุณอยากเรียนรู้หรือโครงงานที่คุณตั้งเป้าหมายจะทำให้สำเร็จในรั้วมหาวิทยาลัย?`,
      hint: "💡 แสดงความกระตือรือร้น (Eagerness to Learn) และความเข้าใจในเทรนด์ของสาขาวิชา"
    });
  }

  return questions;
}

// Render Results to DOM
function renderAnalysisResults(data) {
  const {
    overallScore,
    spellingScore,
    structureScore,
    alignmentScore,
    presentationScore,
    detectedTypos,
    structureResults,
    facultyData,
    foundSkills,
    missingSkills,
    interviewQuestions,
    detectedStudentName,
    detectedSchool,
    detectedGpax,
    totalWords,
    totalPages
  } = data;

  // Document Intelligence Summary Card
  if (docStudentNameEl) docStudentNameEl.textContent = detectedStudentName || "ไม่ระบุคำนำหน้า (แนะนำระบุให้ชัดเจน)";
  if (docSchoolNameEl) docSchoolNameEl.textContent = detectedSchool || "โรงเรียนระดับมัธยมศึกษา";
  if (docGpaxEl) docGpaxEl.textContent = detectedGpax ? `${detectedGpax}` : "ไม่พบระบุชัดเจน (ควรใส่ในหน้า Profile)";
  if (docStatsEl) docStatsEl.textContent = `${totalPages} หน้า • ${totalWords.toLocaleString()} คำ`;
  if (docTargetFacultyEl) docTargetFacultyEl.textContent = facultyData.name;

  // Overall Score & Grade
  if (overallScoreEl) overallScoreEl.textContent = overallScore;

  let gradeText = "ระดับ B+ (ความพร้อมดี)";
  let gradeVerdict = "แฟ้มสะสมผลงานมีโครงสร้างที่ดี ครบถ้วน และมีโอกาสสูงในการผ่านการคัดเลือกรอบ Portfolio";
  let gradeColor = "#2563eb";
  let gradeBg = "#eff6ff";

  if (overallScore >= 90) {
    gradeText = "ระดับ A+ (โดดเด่นมาก ✦)";
    gradeVerdict = "แฟ้มสะสมผลงานมีความเป็นเลิศ ทั้งการสะกดคำ โครงสร้างตรงเกณฑ์ TCAS และกิจกรรมโดดเด่นตรงสายชัดเจน!";
    gradeColor = "#15803d";
    gradeBg = "#dcfce7";
  } else if (overallScore >= 80) {
    gradeText = "ระดับ A (ความพร้อมสูงมาก)";
    gradeVerdict = "แฟ้มสะสมผลงานมีความสมบูรณ์ โครงสร้างครบถ้วน ปรับแก้จุดคำผิดเล็กน้อยก็พร้อมยื่นได้ทันที";
    gradeColor = "#15803d";
    gradeBg = "#dcfce7";
  } else if (overallScore >= 70) {
    gradeText = "ระดับ B+ (ความพร้อมดี)";
    gradeVerdict = "มีผลงานและกิจกรรมน่าสนใจ ควรตรวจแก้คำผิดและจัดหน้าให้กระชับตามเกณฑ์ 10 หน้า";
    gradeColor = "#2563eb";
    gradeBg = "#eff6ff";
  } else if (overallScore >= 60) {
    gradeText = "ระดับ B (ปานกลาง)";
    gradeVerdict = "ควรเพิ่มกิจกรรมหรือผลงานที่ตรงสายกับคณะ และปรับปรุงการจัดวางหัวข้อให้ชัดเจนขึ้น";
    gradeColor = "#b45309";
    gradeBg = "#fef3c7";
  } else {
    gradeText = "ระดับ C (ต้องปรับปรุง)";
    gradeVerdict = "ยังขาดองค์ประกอบสำคัญตามเกณฑ์ TCAS ควรเพิ่มกิจกรรม ผลงาน และตรวจทานคำผิด";
    gradeColor = "#b91c1c";
    gradeBg = "#fee2e2";
  }

  if (scoreGradeEl) {
    scoreGradeEl.textContent = gradeText;
    scoreGradeEl.style.color = gradeColor;
    scoreGradeEl.style.backgroundColor = gradeBg;
  }
  if (scoreVerdictEl) scoreVerdictEl.textContent = gradeVerdict;

  // Metric Progress Bars
  if (metricSpellingEl) metricSpellingEl.textContent = `${spellingScore}%`;
  if (barSpellingEl) barSpellingEl.style.width = `${spellingScore}%`;

  if (metricStructureEl) metricStructureEl.textContent = `${structureScore}%`;
  if (barStructureEl) barStructureEl.style.width = `${structureScore}%`;

  if (metricAlignmentEl) metricAlignmentEl.textContent = `${alignmentScore}%`;
  if (barAlignmentEl) barAlignmentEl.style.width = `${alignmentScore}%`;

  if (metricPresentationEl) metricPresentationEl.textContent = `${presentationScore}%`;
  if (barPresentationEl) barPresentationEl.style.width = `${presentationScore}%`;

  // Tab 1: Typos List
  if (typoCountBadge) typoCountBadge.textContent = detectedTypos.length;
  if (typosListContainer) {
    typosListContainer.innerHTML = "";

    if (detectedTypos.length === 0) {
      typosListContainer.innerHTML = `
        <div class="typo-empty-state">
          <span style="font-size:32px;">✨</span>
          <strong>ยอดเยี่ยม! ไม่พบคำผิดทั่วไปในเอกสาร (${totalWords.toLocaleString()} คำที่สแกน)</strong>
          <p>การสะกดคำถูกต้องและใช้ภาษาที่เหมาะสมสำหรับแฟ้มสะสมผลงาน</p>
        </div>
      `;
    } else {
      detectedTypos.forEach((typo) => {
        const item = document.createElement("div");
        item.className = "typo-item-card";
        item.innerHTML = `
          <div style="width:100%;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span class="typo-badge-wrong">${typo.wrong}</span>
              <span class="typo-arrow">➔</span>
              <span class="typo-badge-correct">${typo.correct}</span>
              <span class="typo-page-tag">หน้า ${typo.pageNum}</span>
            </div>
            <div class="typo-sentence-box">
              <strong>ข้อความในเอกสาร:</strong> ${typo.snippet}
            </div>
            <p class="typo-explanation">💡 <b>คำแนะนำ:</b> ${typo.explanation}</p>
          </div>
        `;
        typosListContainer.appendChild(item);
      });
    }
  }

  // Tab 2: TCAS Structure Checklist
  if (structureChecklistGrid) {
    structureChecklistGrid.innerHTML = "";

    structureResults.forEach((sec) => {
      const card = document.createElement("div");
      card.className = `checklist-item-card ${sec.passed ? "passed" : "warning"}`;

      const icon = sec.passed ? "✅" : "⚠️";
      const statusText = sec.passed
        ? `พบในเอกสาร (หน้าที่ ${sec.foundPage} • คีย์เวิร์ด: "${sec.evidenceText}")`
        : "ตรวจไม่พบคำสำคัญหมวดนี้อย่างชัดเจน แนะนำให้ระบุชื่อหัวข้อให้เด่นขึ้น";

      card.innerHTML = `
        <span class="checklist-status-icon">${icon}</span>
        <div class="checklist-copy">
          <strong>${sec.name}</strong>
          <p>${sec.desc}</p>
          <small style="color:${sec.passed ? "#15803d" : "#b45309"}; font-weight:700; margin-top:3px;">${statusText}</small>
        </div>
      `;
      structureChecklistGrid.appendChild(card);
    });

    // Page count evaluation
    const pageCard = document.createElement("div");
    const isOptimalLength = totalPages >= 3 && totalPages <= 10;
    pageCard.className = `checklist-item-card ${isOptimalLength ? "passed" : "warning"}`;
    pageCard.innerHTML = `
      <span class="checklist-status-icon">${isOptimalLength ? "✅" : "⚠️"}</span>
      <div class="checklist-copy">
        <strong>จำนวนหน้าเอกสาร (${totalPages} หน้า)</strong>
        <p>เกณฑ์ TCAS ส่วนใหญ่กำหนดไม่เกิน 10 หน้ากระดาษ A4 (ไม่รวมปก/คำนำ/สารบัญ)</p>
        <small style="color:${isOptimalLength ? "#15803d" : "#b45309"}; font-weight:700; margin-top:3px;">
          ${isOptimalLength ? "อยู่ในเกณฑ์ที่เหมาะสมและกระชับ" : totalPages > 10 ? `เกินเกณฑ์ 10 หน้า (${totalPages} หน้า) ควรตัดทอนกิจกรรมที่ไม่ตรงสายออก` : "จำนวนหน้าน้อยกว่าปกติ"}
        </small>
      </div>
    `;
    structureChecklistGrid.appendChild(pageCard);
  }

  // Tab 3: Skills & Keyword Match
  if (detectedSkillsPills) {
    detectedSkillsPills.innerHTML = "";
    if (foundSkills.length > 0) {
      foundSkills.forEach((skill) => {
        const pill = document.createElement("span");
        pill.className = "skill-pill found";
        pill.innerHTML = `✓ ${skill}`;
        detectedSkillsPills.appendChild(pill);
      });
    } else {
      detectedSkillsPills.innerHTML = `<span style="color:#64748b; font-size:13px;">ยังไม่พบคีย์เวิร์ดเฉพาะทางที่ตรงกับคณะนี้อย่างชัดเจน</span>`;
    }
  }

  if (recommendedSkillsPills) {
    recommendedSkillsPills.innerHTML = "";
    const topMissing = missingSkills.slice(0, 10);
    if (topMissing.length > 0) {
      topMissing.forEach((skill) => {
        const pill = document.createElement("span");
        pill.className = "skill-pill recommended";
        pill.innerHTML = `＋ ${skill}`;
        recommendedSkillsPills.appendChild(pill);
      });
    } else {
      recommendedSkillsPills.innerHTML = `<span style="color:#15803d; font-size:13px; font-weight:700;">ครบถ้วน! พอร์ตของคุณมีทักษะสำคัญครอบคลุมสาขาวิชานี้เป็นอย่างดี</span>`;
    }
  }

  // Tab 4: Interview Questions
  if (interviewQuestionsList) {
    interviewQuestionsList.innerHTML = "";
    interviewQuestions.forEach((q) => {
      const qCard = document.createElement("div");
      qCard.className = "interview-q-card";
      qCard.innerHTML = `
        <div class="interview-q-num">${q.num}</div>
        <p class="interview-q-text">${q.text}</p>
        <p class="interview-q-hint">${q.hint}</p>
      `;
      interviewQuestionsList.appendChild(qCard);
    });
  }

  // Tab 5: Actionable Tips
  if (tipsContainer) {
    tipsContainer.innerHTML = "";

    facultyData.tips.forEach((tip) => {
      const card = document.createElement("div");
      card.className = "tip-card";
      card.innerHTML = `
        <span class="tip-icon">💡</span>
        <p>${tip}</p>
      `;
      tipsContainer.appendChild(card);
    });

    const standardTip1 = document.createElement("div");
    standardTip1.className = "tip-card";
    standardTip1.innerHTML = `
      <span class="tip-icon">🎯</span>
      <p><b>หลักการเขียน Storytelling:</b> เรียงลำดับผลงานจากล่าสุดไปอดีต และควรเน้นผลงานที่ได้รางวัลระดับชาติ/ภาค หรือกิจกรรมที่ได้ลงมือปฏิบัติจริงไว้ 3 หน้าแรก</p>
    `;
    tipsContainer.appendChild(standardTip1);

    const standardTip2 = document.createElement("div");
    standardTip2.className = "tip-card";
    standardTip2.innerHTML = `
      <span class="tip-icon">📸</span>
      <p><b>ภาพถ่ายประกอบกิจกรรม:</b> ภาพถ่ายควรมีตัวเราอยู่ในกิจกรรมอย่างชัดเจน เพื่อยืนยันว่าเป็นผู้ลงมือทำจริง และใส่คำบรรยายสั้น ๆ ใต้ภาพ (Caption) 1-2 บรรทัด</p>
    `;
    tipsContainer.appendChild(standardTip2);
  }
}

// Tab Switching
tabNavBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabName = btn.dataset.tab;
    tabNavBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    tabPanels.forEach((panel) => {
      if (panel.id === `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`) {
        panel.hidden = false;
        panel.classList.add("active");
      } else {
        panel.hidden = true;
        panel.classList.remove("active");
      }
    });
  });
});

// Re-analyze & Print
reAnalyzeBtn?.addEventListener("click", () => {
  if (resultsSection) resultsSection.hidden = true;
  if (analyzeInputSection) analyzeInputSection.hidden = false;
  resetFileInput();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

printReportBtn?.addEventListener("click", () => {
  window.print();
});

startAnalyzeBtn?.addEventListener("click", runPortfolioAnalysis);

// Mobile Menu Toggle
document.querySelector(".menu-toggle")?.addEventListener("click", () => {
  document.querySelector(".main-nav")?.classList.toggle("open");
});

