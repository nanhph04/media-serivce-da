const fs = require('fs');
const path = require('path');
const PptxGenJS = require(
  'C:/Users/titin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/pptxgenjs@4.0.1/node_modules/pptxgenjs',
);
const workspaceRoot = path.resolve(__dirname, '..');

const inputPath =
  process.argv[2] ||
  'C:/Users/titin/.codex/attachments/91639f2a-644a-415a-9827-923058d03986/pasted-text.txt';

function nextNumberedPath(baseName) {
  const docsDir = path.resolve(workspaceRoot, 'docs');
  for (let index = 1; index < 1000; index += 1) {
    const candidate = path.join(docsDir, `${baseName}-${index}.pptx`);
    if (!fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`Cannot find an available filename for ${baseName}`);
}

const outputPath = process.argv[3] || nextNumberedPath('do-an-media-system-presentation');

const rawHtml = fs.readFileSync(inputPath, 'utf8');

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function htmlToText(value) {
  return decodeEntities(
    value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|li|h1|h2|h3)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  );
}

function extractFirst(section, tagNames) {
  for (const tagName of tagNames) {
    const match = section.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
    if (match) return htmlToText(match[1]);
  }
  return '';
}

function removeNestedLists(listItemHtml) {
  return listItemHtml.replace(/<ul[\s\S]*?<\/ul>/gi, '');
}

function extractTopLevelItems(section) {
  const listMatch = section.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);
  if (!listMatch) return [];

  const items = [];
  const regex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = regex.exec(listMatch[1]))) {
    const text = htmlToText(removeNestedLists(match[1]));
    if (text) items.push(text);
  }
  return items;
}

function parseSections(html) {
  return [...html.matchAll(/<section[^>]*>([\s\S]*?)<\/section>/gi)].map((match, index) => {
    const section = match[1];
    const heading = extractFirst(section, ['h1', 'h2', 'h3']);
    const paragraphs = [...section.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((item) => htmlToText(item[1]))
      .filter(Boolean);
    const placeholders = [...section.matchAll(/<div[^>]*class="box"[^>]*>([\s\S]*?)<\/div>/gi)]
      .map((item) => htmlToText(item[1]).replace(/^\[|\]$/g, ''))
      .filter(Boolean);

    return {
      index: index + 1,
      heading,
      paragraphs,
      bullets: extractTopLevelItems(section),
      placeholder: placeholders[0] || '',
    };
  });
}

const sourceSlides = parseSections(rawHtml);
const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Codex';
pptx.company = 'Distributed Media System';
pptx.subject = 'Đồ án tốt nghiệp';
pptx.title = 'Thiết kế và xây dựng hệ thống quản lý và phân phối media';
pptx.lang = 'vi-VN';
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'vi-VN',
};
pptx.defineLayout({ name: 'LAYOUT_WIDE', width: 13.333, height: 7.5 });

const C = {
  ink: '172033',
  slate: '334155',
  muted: '64748B',
  line: 'D7DEE8',
  paper: 'F8FAFC',
  white: 'FFFFFF',
  blue: '2563EB',
  cyan: '0891B2',
  green: '0F766E',
  orange: 'EA580C',
  red: 'DC2626',
  violet: '7C3AED',
  gold: 'CA8A04',
};

function addBg(slide, sectionNo, label) {
  slide.background = { color: C.paper };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.12,
    fill: { color: C.blue },
    line: { color: C.blue },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 7.22,
    w: 13.333,
    h: 0.28,
    fill: { color: C.ink },
    line: { color: C.ink },
  });
  slide.addText(label || 'Distributed Media System', {
    x: 0.45,
    y: 7.27,
    w: 5.8,
    h: 0.14,
    fontFace: 'Aptos',
    fontSize: 6.8,
    color: 'CBD5E1',
    margin: 0,
  });
  slide.addText(String(sectionNo).padStart(2, '0'), {
    x: 12.45,
    y: 7.25,
    w: 0.45,
    h: 0.16,
    fontFace: 'Aptos',
    fontSize: 7,
    bold: true,
    color: C.white,
    align: 'right',
    margin: 0,
  });
}

function addTitle(slide, title, kicker) {
  slide.addText(kicker || 'Đồ án tốt nghiệp', {
    x: 0.65,
    y: 0.38,
    w: 4.3,
    h: 0.25,
    fontSize: 9,
    bold: true,
    color: C.blue,
    charSpace: 0,
    margin: 0,
  });
  slide.addText(title, {
    x: 0.65,
    y: 0.76,
    w: 9.7,
    h: 0.58,
    fontFace: 'Aptos Display',
    fontSize: 24,
    bold: true,
    color: C.ink,
    margin: 0,
    fit: 'shrink',
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 0.65,
    y: 1.55,
    w: 2.25,
    h: 0,
    line: { color: C.blue, width: 2.2 },
  });
}

function addCard(slide, x, y, w, h, title, body, color) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.05,
    fill: { color: C.white },
    line: { color: C.line, width: 1 },
    shadow: { type: 'outer', color: 'D9E2EF', opacity: 0.18, blur: 1, angle: 45, distance: 1 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.08,
    h,
    fill: { color },
    line: { color },
  });
  slide.addText(title, {
    x: x + 0.22,
    y: y + 0.18,
    w: w - 0.42,
    h: 0.28,
    fontSize: 12.5,
    bold: true,
    color,
    margin: 0,
    fit: 'shrink',
  });
  slide.addText(body, {
    x: x + 0.22,
    y: y + 0.58,
    w: w - 0.44,
    h: h - 0.75,
    fontSize: 10,
    color: C.slate,
    breakLine: false,
    fit: 'shrink',
    margin: 0.03,
    valign: 'mid',
  });
}

function addBulletList(slide, items, x, y, w, h, fontSize = 14) {
  const safeItems = items.filter(Boolean).map((item) => ({
    text: item.replace(/\s+/g, ' '),
    options: { bullet: { indent: 14 }, hanging: 4 },
  }));
  slide.addText(safeItems, {
    x,
    y,
    w,
    h,
    fontFace: 'Aptos',
    fontSize,
    color: C.slate,
    breakLine: false,
    paraSpaceAfterPt: 7,
    fit: 'shrink',
    margin: 0,
  });
}

function addPill(slide, x, y, w, text, color) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h: 0.45,
    rectRadius: 0.08,
    fill: { color },
    line: { color },
  });
  slide.addText(text, {
    x,
    y: y + 0.12,
    w,
    h: 0.16,
    fontSize: 9,
    bold: true,
    color: C.white,
    align: 'center',
    margin: 0,
    fit: 'shrink',
  });
}

function addFlowNode(slide, x, y, w, title, body, color) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h: 0.92,
    rectRadius: 0.05,
    fill: { color: C.white },
    line: { color, width: 1.3 },
  });
  slide.addText(title, {
    x: x + 0.08,
    y: y + 0.13,
    w: w - 0.16,
    h: 0.2,
    fontSize: 10.5,
    bold: true,
    color,
    align: 'center',
    margin: 0,
  });
  slide.addText(body, {
    x: x + 0.12,
    y: y + 0.43,
    w: w - 0.24,
    h: 0.28,
    fontSize: 7.5,
    color: C.muted,
    align: 'center',
    fit: 'shrink',
    margin: 0,
  });
}

function addArrow(slide, x1, y1, x2, y2, color = C.muted) {
  slide.addShape(pptx.ShapeType.line, {
    x: x1,
    y: y1,
    w: x2 - x1,
    h: y2 - y1,
    line: { color, width: 1.5, beginArrowType: 'none', endArrowType: 'triangle' },
  });
}

function titleOnly(slideNo, title, kicker) {
  const slide = pptx.addSlide();
  addBg(slide, slideNo, 'Media service presentation');
  addTitle(slide, title, kicker);
  return slide;
}

function renderCover(data) {
  const slide = pptx.addSlide();
  slide.background = { color: 'EEF6FF' };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: 'EEF6FF' },
    line: { color: 'EEF6FF' },
  });
  slide.addShape(pptx.ShapeType.arc, {
    x: 8.2,
    y: -0.75,
    w: 5.4,
    h: 5.4,
    adjustPoint: 0.4,
    fill: { color: 'DBEAFE', transparency: 12 },
    line: { color: 'DBEAFE', transparency: 100 },
    rotate: 20,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 9.0,
    y: 4.55,
    w: 4.5,
    h: 1.0,
    fill: { color: C.ink },
    line: { color: C.ink },
    rotate: -15,
  });
  slide.addShape(pptx.ShapeType.chevron, {
    x: 9.6,
    y: 2.35,
    w: 1.4,
    h: 1.2,
    fill: { color: C.blue },
    line: { color: C.blue },
    rotate: 15,
  });
  slide.addText('ĐỒ ÁN TỐT NGHIỆP', {
    x: 0.78,
    y: 0.72,
    w: 3.3,
    h: 0.25,
    fontSize: 10,
    bold: true,
    color: C.blue,
    margin: 0,
  });
  slide.addText(data.heading.replace(/\n/g, ' '), {
    x: 0.76,
    y: 1.2,
    w: 8.2,
    h: 2.15,
    fontFace: 'Aptos Display',
    fontSize: 26,
    bold: true,
    color: C.ink,
    margin: 0,
    fit: 'shrink',
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 0.78,
    y: 3.65,
    w: 3.2,
    h: 0,
    line: { color: C.blue, width: 3 },
  });
  slide.addText(data.paragraphs.join('\n'), {
    x: 0.78,
    y: 4.05,
    w: 5.2,
    h: 1.0,
    fontSize: 15,
    color: C.slate,
    margin: 0,
    breakLine: false,
  });
  addPill(slide, 0.78, 5.6, 1.35, 'NestJS', C.red);
  addPill(slide, 2.28, 5.6, 1.35, 'Kafka', C.ink);
  addPill(slide, 3.78, 5.6, 1.35, 'Redis', C.orange);
  addPill(slide, 5.28, 5.6, 1.35, 'MinIO', C.green);
  slide.addText('2026', {
    x: 11.5,
    y: 6.65,
    w: 1.1,
    h: 0.25,
    fontSize: 12,
    bold: true,
    color: C.white,
    margin: 0,
    align: 'right',
  });
}

function renderProblem(data) {
  const slide = titleOnly(data.index, 'Bài toán đặt ra', 'Bối cảnh');
  addCard(
    slide,
    0.78,
    1.92,
    5.7,
    3.85,
    'Thực trạng',
    'Creator Economy tạo ra khối lượng lớn video mỗi ngày. Hệ thống cần xử lý, lưu trữ và phân phối nội dung liên tục với trải nghiệm ổn định.',
    C.blue,
  );
  addCard(
    slide,
    6.85,
    1.92,
    5.7,
    3.85,
    'Giới hạn của Monolithic',
    'Khó mở rộng cục bộ khi upload/video processing quá tải; rủi ro single point of failure; chi phí máy chủ tăng khi xử lý tác vụ đa phương tiện nặng.',
    C.red,
  );
  slide.addText('Yêu cầu cốt lõi: mở rộng độc lập, chịu lỗi tốt, chi phí vận hành hợp lý.', {
    x: 1.15,
    y: 6.08,
    w: 11,
    h: 0.36,
    fontSize: 14,
    bold: true,
    color: C.ink,
    align: 'center',
    margin: 0,
  });
}

function renderArchitecture(data) {
  const slide = titleOnly(data.index, 'Giải pháp: Kiến trúc Microservices', 'Kiến trúc tổng quan');
  slide.addText('API Gateway', {
    x: 5.28,
    y: 2.0,
    w: 2.8,
    h: 0.44,
    fontSize: 18,
    bold: true,
    color: C.white,
    align: 'center',
    margin: 0,
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.05,
    y: 1.77,
    w: 3.25,
    h: 0.82,
    rectRadius: 0.05,
    fill: { color: C.ink },
    line: { color: C.ink },
  });

  const services = [
    ['Identity', C.blue, 1.05, 3.38],
    ['Media', C.green, 3.48, 4.75],
    ['Processing', C.orange, 5.95, 3.38],
    ['Moderation', C.violet, 8.42, 4.75],
    ['Finance', C.gold, 10.85, 3.38],
  ];

  services.forEach(([name, color, x, y]) => {
    addArrow(slide, 6.68, 2.6, x + 0.8, y, color);
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 1.65,
      h: 0.78,
      rectRadius: 0.05,
      fill: { color },
      line: { color },
    });
    slide.addText(name, {
      x,
      y: y + 0.24,
      w: 1.65,
      h: 0.16,
      fontSize: 9.5,
      bold: true,
      color: C.white,
      align: 'center',
      margin: 0,
      fit: 'shrink',
    });
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 4.1,
    y: 5.75,
    w: 5.1,
    h: 0.62,
    rectRadius: 0.05,
    fill: { color: 'E0F2FE' },
    line: { color: 'BAE6FD' },
  });
  slide.addText('Giao tiếp bất đồng bộ qua Kafka, Redis/BullMQ cho background jobs', {
    x: 4.25,
    y: 5.94,
    w: 4.8,
    h: 0.14,
    fontSize: 8.8,
    bold: true,
    color: C.cyan,
    align: 'center',
    margin: 0,
    fit: 'shrink',
  });
}

function renderTech(data) {
  const slide = titleOnly(data.index, 'Nền tảng công nghệ', 'Technology stack');
  const cards = [
    ['Ứng dụng', 'NestJS cho Backend TypeScript, Next.js cho Frontend.', C.blue],
    ['Triển khai', 'Docker và Docker Compose tạo môi trường nội bộ nhất quán.', C.green],
    ['Dữ liệu', 'PostgreSQL độc lập theo service; MinIO lưu trữ object/video.', C.orange],
    ['Sự kiện', 'Redis/BullMQ cho background jobs; Kafka cho Integration Events.', C.violet],
  ];
  cards.forEach(([title, body, color], i) => {
    const x = i % 2 === 0 ? 0.82 : 6.9;
    const y = i < 2 ? 1.85 : 4.15;
    addCard(slide, x, y, 5.55, 1.55, title, body, color);
  });
}

function renderMediaFlow(data) {
  const slide = titleOnly(data.index, 'Luồng xử lý Media bất đồng bộ', 'Media pipeline');
  const nodes = [
    ['Upload', 'Multipart video gốc', C.blue],
    ['MinIO', 'Object storage', C.green],
    ['BullMQ', 'Hàng đợi xử lý', C.orange],
    ['FFmpeg', 'Transcoding HLS', C.red],
    ['Viewer', 'Streaming từng segment', C.violet],
  ];
  let x = 0.78;
  nodes.forEach(([title, body, color], i) => {
    addFlowNode(slide, x, 2.35, 1.9, title, body, color);
    if (i < nodes.length - 1) addArrow(slide, x + 1.93, 2.8, x + 2.43, 2.8);
    x += 2.55;
  });
  slide.addText(
    'Điểm chính: tác vụ nặng được đẩy ra background worker, người xem nhận HLS segment mượt hơn thay vì tải toàn bộ file lớn.',
    {
      x: 1.1,
      y: 4.55,
      w: 11.1,
      h: 0.75,
      fontSize: 16,
      bold: true,
      color: C.ink,
      align: 'center',
      margin: 0,
      fit: 'shrink',
    },
  );
}

function renderHybridAi(data) {
  const slide = titleOnly(data.index, 'Tích hợp trí tuệ nhân tạo', 'Hybrid AI');
  addCard(
    slide,
    0.82,
    1.85,
    5.65,
    3.65,
    'Cloud AI - ZAI Copilot',
    'Hỗ trợ nhà sáng tạo tự động sinh tiêu đề và mô tả video thông qua API.',
    C.blue,
  );
  addCard(
    slide,
    6.86,
    1.85,
    5.65,
    3.65,
    'Local AI - Moderation Service',
    'Model duyệt video NSFW chạy nội bộ; tự động cắt frame để phân tích nội dung trước khi xuất bản.',
    C.violet,
  );
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 3.05,
    y: 5.9,
    w: 7.3,
    h: 0.48,
    rectRadius: 0.05,
    fill: { color: 'ECFDF5' },
    line: { color: 'A7F3D0' },
  });
  slide.addText('Ưu điểm: bảo vệ quyền riêng tư video gốc và tối ưu chi phí hạ tầng.', {
    x: 3.18,
    y: 6.04,
    w: 7.05,
    h: 0.17,
    fontSize: 9.8,
    bold: true,
    color: C.green,
    align: 'center',
    margin: 0,
  });
}

function renderEconomy(data) {
  const slide = titleOnly(data.index, 'Cơ chế kinh tế ảo', 'Finance flow');
  const steps = [
    ['Nạp tiền', 'PayOS', C.green],
    ['Coin nội bộ', 'Mua hội viên, mở khóa nội dung', C.blue],
    ['Sổ cái kép', 'Ghi nhận debit/credit', C.ink],
    ['Rút tiền', 'Creator yêu cầu payout', C.orange],
  ];
  steps.forEach(([title, body, color], i) => {
    addFlowNode(slide, 1.05 + i * 3.0, 2.2, 2.15, title, body, color);
    if (i < steps.length - 1) addArrow(slide, 3.22 + i * 3.0, 2.65, 3.82 + i * 3.0, 2.65);
  });
  addBulletList(
    slide,
    [
      'Hệ thống chỉ chạm tiền thật ở khâu nạp tiền và rút tiền.',
      'Các giao dịch nội bộ dùng Coin để đơn giản hóa trải nghiệm.',
      'Double-entry giúp hạn chế sai lệch tài sản trong môi trường phân tán.',
    ],
    1.15,
    4.15,
    11.0,
    1.4,
    13.2,
  );
}

function renderEvents(data) {
  const slide = titleOnly(data.index, 'Đồng bộ dữ liệu phân tán', 'Event-driven');
  addFlowNode(slide, 0.95, 2.15, 2.4, 'Identity', 'Admin khóa tài khoản', C.blue);
  addFlowNode(slide, 4.05, 2.15, 2.4, 'Kafka', 'event: user.banned', C.ink);
  addFlowNode(slide, 7.15, 1.55, 2.35, 'Finance', 'Đóng băng ví', C.orange);
  addFlowNode(slide, 7.15, 3.0, 2.35, 'Media', 'Ẩn toàn bộ video', C.green);
  addFlowNode(slide, 10.2, 2.15, 2.25, 'Kết quả', 'Nhất quán cuối cùng', C.violet);
  addArrow(slide, 3.38, 2.6, 4.0, 2.6);
  addArrow(slide, 6.48, 2.6, 7.1, 2.0, C.orange);
  addArrow(slide, 6.48, 2.6, 7.1, 3.42, C.green);
  addArrow(slide, 9.55, 2.0, 10.14, 2.52, C.orange);
  addArrow(slide, 9.55, 3.42, 10.14, 2.72, C.green);
  slide.addText('Không gọi API trực tiếp giữa services khi có thể dùng event để giảm coupling.', {
    x: 1.15,
    y: 5.45,
    w: 11,
    h: 0.35,
    fontSize: 14.5,
    bold: true,
    color: C.ink,
    align: 'center',
    margin: 0,
  });
}

function renderIdentity(data) {
  const slide = titleOnly(data.index, 'Quản lý định danh & phân quyền', 'Security');
  addCard(slide, 0.9, 1.85, 3.6, 3.55, 'Viewer', 'Xem video HLS, nạp Coin, mua hội viên.', C.blue);
  addCard(
    slide,
    4.85,
    1.85,
    3.6,
    3.55,
    'Creator Studio',
    'Tải video, quản lý kênh, xem doanh thu, yêu cầu rút tiền.',
    C.green,
  );
  addCard(
    slide,
    8.8,
    1.85,
    3.6,
    3.55,
    'Admin',
    'Quản lý danh mục, duyệt yêu cầu rút tiền, khóa/mở tài khoản vi phạm.',
    C.red,
  );
  slide.addText('Bảo mật API bằng JWT và OAuth2; quyền người dùng được truyền qua Gateway.', {
    x: 1.15,
    y: 5.95,
    w: 11,
    h: 0.28,
    fontSize: 13.2,
    bold: true,
    color: C.ink,
    align: 'center',
    margin: 0,
  });
}

function renderUiPlaceholder(data, title, items, colors) {
  const slide = titleOnly(data.index, title, 'Demo giao diện');
  items.forEach((item, i) => {
    const x = i === 0 ? 0.95 : 6.9;
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 1.85,
      w: 5.45,
      h: 3.9,
      rectRadius: 0.04,
      fill: { color: C.white },
      line: { color: colors[i], width: 1.4, dash: 'dash' },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y: 1.85,
      w: 5.45,
      h: 0.62,
      fill: { color: colors[i] },
      line: { color: colors[i] },
    });
    slide.addText(item, {
      x: x + 0.2,
      y: 2.05,
      w: 5.05,
      h: 0.16,
      fontSize: 9.5,
      bold: true,
      color: C.white,
      align: 'center',
      margin: 0,
      fit: 'shrink',
    });
    slide.addText('Chèn ảnh màn hình demo tại đây', {
      x: x + 0.45,
      y: 3.55,
      w: 4.55,
      h: 0.22,
      fontSize: 13,
      color: C.muted,
      italic: true,
      align: 'center',
      margin: 0,
      fit: 'shrink',
    });
  });
}

function renderConclusion(data) {
  const slide = titleOnly(data.index, 'Kết luận & rút kinh nghiệm', 'Tổng kết');
  addBulletList(
    slide,
    [
      'Hoàn thiện hệ thống phân phối nội dung số theo hướng độc lập service và chịu lỗi tốt.',
      'Xử lý media bất đồng bộ với MinIO, BullMQ, FFmpeg và HLS.',
      'Đồng bộ dữ liệu phân tán bằng event để giảm phụ thuộc giữa services.',
      'Nâng cao kỹ năng debug xuyên suốt container, hàng đợi và luồng sự kiện.',
    ],
    1.2,
    1.85,
    10.9,
    2.3,
    15,
  );
  slide.addShape(pptx.ShapeType.line, {
    x: 2.0,
    y: 5.0,
    w: 9.3,
    h: 0,
    line: { color: C.line, width: 1 },
  });
  slide.addText('XIN TRÂN TRỌNG CẢM ƠN HỘI ĐỒNG', {
    x: 1.0,
    y: 5.48,
    w: 11.4,
    h: 0.38,
    fontFace: 'Aptos Display',
    fontSize: 20,
    bold: true,
    color: C.blue,
    align: 'center',
    margin: 0,
  });
  slide.addText('Mời quý thầy cô đặt câu hỏi.', {
    x: 1.0,
    y: 6.05,
    w: 11.4,
    h: 0.24,
    fontSize: 13,
    italic: true,
    color: C.slate,
    align: 'center',
    margin: 0,
  });
}

sourceSlides.forEach((slideData) => {
  switch (slideData.index) {
    case 1:
      renderCover(slideData);
      break;
    case 2:
      renderProblem(slideData);
      break;
    case 3:
      renderArchitecture(slideData);
      break;
    case 4:
      renderTech(slideData);
      break;
    case 5:
      renderMediaFlow(slideData);
      break;
    case 6:
      renderHybridAi(slideData);
      break;
    case 7:
      renderEconomy(slideData);
      break;
    case 8:
      renderEvents(slideData);
      break;
    case 9:
      renderIdentity(slideData);
      break;
    case 10:
      renderUiPlaceholder(slideData, 'Giao diện cốt lõi', ['Xem video HLS', 'Creator Studio tải video'], [
        C.blue,
        C.green,
      ]);
      break;
    case 11:
      renderUiPlaceholder(
        slideData,
        'Giao diện quản trị & tài chính',
        ['QR PayOS nạp tiền', 'Admin quản lý ví/người dùng'],
        [C.orange, C.red],
      );
      break;
    case 12:
      renderConclusion(slideData);
      break;
    default: {
      const slide = titleOnly(slideData.index, slideData.heading || `Slide ${slideData.index}`, 'Nội dung');
      addBulletList(slide, slideData.bullets.length ? slideData.bullets : slideData.paragraphs, 1.0, 1.9, 11.3, 4.2);
    }
  }
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
pptx
  .writeFile({ fileName: outputPath })
  .then(() => {
    console.log(`Created ${outputPath}`);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
