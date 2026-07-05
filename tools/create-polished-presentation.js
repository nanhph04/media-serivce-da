const path = require('path');
const PptxGenJS = require(
  'C:/Users/titin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/pptxgenjs@4.0.1/node_modules/pptxgenjs',
);
const workspaceRoot = path.resolve(__dirname, '..');

function nextNumberedPath(baseName) {
  const docsDir = path.resolve(workspaceRoot, 'docs');
  for (let index = 1; index < 1000; index += 1) {
    const candidate = path.join(docsDir, `${baseName}-${index}.pptx`);
    if (!require('fs').existsSync(candidate)) return candidate;
  }
  throw new Error(`Cannot find an available filename for ${baseName}`);
}

const outputPath = process.argv[2] || nextNumberedPath('do-an-media-system-presentation-polished');

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Codex';
pptx.company = 'Distributed Media System';
pptx.subject = 'Đồ án tốt nghiệp';
pptx.title = 'Thiết kế và xây dựng hệ thống quản lý và phân phối media';
pptx.lang = 'vi-VN';
pptx.defineLayout({ name: 'LAYOUT_WIDE', width: 13.333, height: 7.5 });
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'vi-VN',
};

const C = {
  navy: '0B1220',
  navy2: '111827',
  ink: '172033',
  slate: '475569',
  muted: '748094',
  line: 'DDE4EE',
  paper: 'F7FAFC',
  white: 'FFFFFF',
  blue: '2563EB',
  sky: '0EA5E9',
  teal: '0F766E',
  emerald: '059669',
  amber: 'D97706',
  red: 'E11D48',
  violet: '7C3AED',
  purple: '9333EA',
  lime: '65A30D',
};

function addText(slide, text, opt) {
  slide.addText(text, {
    fontFace: 'Aptos',
    color: C.ink,
    margin: 0,
    breakLine: false,
    fit: 'shrink',
    ...opt,
  });
}

function addTopBar(slide, no, section) {
  slide.background = { color: C.paper };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: C.paper },
    line: { color: C.paper },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.18,
    fill: { color: C.navy },
    line: { color: C.navy },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0.18,
    w: 2.1,
    h: 7.32,
    fill: { color: C.navy },
    line: { color: C.navy },
  });
  addText(slide, String(no).padStart(2, '0'), {
    x: 0.42,
    y: 0.62,
    w: 0.85,
    h: 0.42,
    fontFace: 'Aptos Display',
    fontSize: 24,
    bold: true,
    color: C.white,
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 0.42,
    y: 1.22,
    w: 0.82,
    h: 0,
    line: { color: C.sky, width: 2.2 },
  });
  addText(slide, section, {
    x: 0.42,
    y: 1.48,
    w: 1.18,
    h: 2.6,
    rotate: 270,
    fontSize: 8.5,
    bold: true,
    color: 'CBD5E1',
    charSpace: 1.2,
  });
  addText(slide, 'Distributed Media System', {
    x: 0.42,
    y: 6.95,
    w: 1.2,
    h: 0.18,
    fontSize: 6.5,
    color: '94A3B8',
  });
}

function addSlideTitle(slide, title, subtitle) {
  addText(slide, title, {
    x: 2.55,
    y: 0.55,
    w: 8.9,
    h: 0.48,
    fontFace: 'Aptos Display',
    fontSize: 25,
    bold: true,
    color: C.ink,
  });
  if (subtitle) {
    addText(slide, subtitle, {
      x: 2.58,
      y: 1.13,
      w: 7.8,
      h: 0.25,
      fontSize: 9.2,
      bold: true,
      color: C.sky,
      charSpace: 0.4,
    });
  }
}

function makeSlide(no, title, section, subtitle) {
  const slide = pptx.addSlide();
  addTopBar(slide, no, section);
  addSlideTitle(slide, title, subtitle);
  return slide;
}

function card(slide, x, y, w, h, title, body, color, opts = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.04,
    fill: { color: opts.fill || C.white },
    line: { color: opts.line || C.line, width: 1 },
    shadow: { type: 'outer', color: 'CBD5E1', opacity: 0.18, blur: 2, angle: 45, distance: 1 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h: 0.08,
    fill: { color },
    line: { color },
  });
  addText(slide, title, {
    x: x + 0.26,
    y: y + 0.22,
    w: w - 0.52,
    h: 0.26,
    fontSize: opts.titleSize || 13,
    bold: true,
    color,
  });
  addText(slide, body, {
    x: x + 0.26,
    y: y + 0.62,
    w: w - 0.52,
    h: h - 0.85,
    fontSize: opts.bodySize || 10,
    color: opts.bodyColor || C.slate,
    valign: 'mid',
  });
}

function stat(slide, x, y, value, label, color) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w: 2.05,
    h: 1.05,
    rectRadius: 0.04,
    fill: { color: C.white },
    line: { color: 'E2E8F0' },
  });
  addText(slide, value, {
    x: x + 0.22,
    y: y + 0.18,
    w: 1.6,
    h: 0.32,
    fontFace: 'Aptos Display',
    fontSize: 20,
    bold: true,
    color,
    align: 'center',
  });
  addText(slide, label, {
    x: x + 0.18,
    y: y + 0.62,
    w: 1.72,
    h: 0.18,
    fontSize: 7.7,
    bold: true,
    color: C.muted,
    align: 'center',
  });
}

function pill(slide, x, y, w, text, color) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h: 0.42,
    rectRadius: 0.09,
    fill: { color },
    line: { color },
  });
  addText(slide, text, {
    x,
    y: y + 0.12,
    w,
    h: 0.14,
    fontSize: 8.2,
    bold: true,
    color: C.white,
    align: 'center',
  });
}

function arrow(slide, x1, y1, x2, y2, color = C.muted, width = 1.5) {
  slide.addShape(pptx.ShapeType.line, {
    x: x1,
    y: y1,
    w: x2 - x1,
    h: y2 - y1,
    line: { color, width, endArrowType: 'triangle' },
  });
}

function leftArrow(slide, x1, y1, x2, y2, color = C.muted, width = 1.5) {
  slide.addShape(pptx.ShapeType.line, {
    x: x2,
    y: y2,
    w: x1 - x2,
    h: y1 - y2,
    line: { color, width, beginArrowType: 'triangle', endArrowType: 'none' },
  });
}

function node(slide, x, y, w, h, title, body, color, fill = C.white) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.04,
    fill: { color: fill },
    line: { color, width: 1.4 },
  });
  addText(slide, title, {
    x: x + 0.15,
    y: y + 0.16,
    w: w - 0.3,
    h: 0.2,
    fontSize: 10.5,
    bold: true,
    color,
    align: 'center',
  });
  addText(slide, body, {
    x: x + 0.16,
    y: y + 0.48,
    w: w - 0.32,
    h: h - 0.6,
    fontSize: 7.4,
    color: C.slate,
    align: 'center',
    valign: 'mid',
  });
}

function bullet(slide, items, x, y, w, h, size = 13) {
  addText(
    slide,
    items.map((item) => ({ text: item, options: { bullet: { indent: 14 }, hanging: 4 } })),
    {
      x,
      y,
      w,
      h,
      fontSize: size,
      color: C.slate,
      paraSpaceAfterPt: 8,
    },
  );
}

function cover() {
  const slide = pptx.addSlide();
  slide.background = { color: C.navy };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: C.navy },
    line: { color: C.navy },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: C.navy2, transparency: 18 },
    line: { color: C.navy2, transparency: 100 },
  });
  for (let i = 0; i < 7; i += 1) {
    slide.addShape(pptx.ShapeType.line, {
      x: 7.15 + i * 0.56,
      y: 0.35,
      w: -1.2,
      h: 6.75,
      line: { color: i % 2 === 0 ? C.sky : C.violet, transparency: 48, width: 1 },
    });
  }
  slide.addShape(pptx.ShapeType.chevron, {
    x: 8.5,
    y: 1.25,
    w: 2.8,
    h: 2.05,
    fill: { color: C.blue, transparency: 5 },
    line: { color: C.blue, transparency: 100 },
    rotate: 18,
  });
  slide.addShape(pptx.ShapeType.chevron, {
    x: 9.75,
    y: 3.1,
    w: 2.55,
    h: 1.86,
    fill: { color: C.teal, transparency: 6 },
    line: { color: C.teal, transparency: 100 },
    rotate: 18,
  });
  addText(slide, 'ĐỒ ÁN TỐT NGHIỆP', {
    x: 0.75,
    y: 0.72,
    w: 2.5,
    h: 0.2,
    fontSize: 9,
    bold: true,
    color: '93C5FD',
    charSpace: 1.3,
  });
  addText(
    slide,
    'THIẾT KẾ VÀ XÂY DỰNG HỆ THỐNG\nQUẢN LÝ & PHÂN PHỐI MEDIA',
    {
      x: 0.72,
      y: 1.25,
      w: 8.05,
      h: 1.55,
      fontFace: 'Aptos Display',
      fontSize: 27,
      bold: true,
      color: C.white,
    },
  );
  addText(slide, 'Dựa trên kiến trúc phân tán', {
    x: 0.75,
    y: 3.03,
    w: 4.7,
    h: 0.34,
    fontFace: 'Aptos Display',
    fontSize: 18,
    bold: true,
    color: '38BDF8',
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 0.76,
    y: 3.72,
    w: 2.75,
    h: 0,
    line: { color: C.sky, width: 3 },
  });
  addText(slide, 'Sinh viên thực hiện: Phạm Nhật Anh\nLớp: 64CNTT.NB\nNăm: 2026', {
    x: 0.78,
    y: 4.08,
    w: 4.2,
    h: 0.7,
    fontSize: 12.5,
    color: 'E2E8F0',
  });
  ['Microservices', 'Kafka', 'Redis/BullMQ', 'MinIO', 'HLS'].forEach((text, index) => {
    pill(slide, 0.78 + index * 1.48, 5.55, 1.22, text, [C.blue, C.purple, C.amber, C.teal, C.red][index]);
  });
  addText(slide, '01', {
    x: 11.72,
    y: 6.43,
    w: 0.75,
    h: 0.36,
    fontFace: 'Aptos Display',
    fontSize: 22,
    bold: true,
    color: C.white,
    align: 'right',
  });
}

function problem() {
  const slide = makeSlide(2, 'Bài toán đặt ra', 'CONTEXT', 'Creator Economy cần nền tảng media có khả năng mở rộng độc lập');
  card(
    slide,
    2.55,
    1.8,
    3.25,
    2.75,
    'Nội dung tăng nhanh',
    'Mỗi ngày hệ thống phải tiếp nhận, lưu trữ và phân phối lượng lớn video từ nhà sáng tạo.',
    C.blue,
  );
  card(
    slide,
    6.05,
    1.8,
    3.25,
    2.75,
    'Tác vụ nặng',
    'Upload, transcoding, moderation và streaming tạo tải không đều giữa các chức năng.',
    C.amber,
  );
  card(
    slide,
    9.55,
    1.8,
    2.95,
    2.75,
    'Rủi ro monolith',
    'Một điểm nghẽn có thể kéo theo downtime toàn hệ thống và tăng chi phí vận hành.',
    C.red,
  );
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 3.18,
    y: 5.3,
    w: 8.55,
    h: 0.72,
    rectRadius: 0.04,
    fill: { color: 'E0F2FE' },
    line: { color: 'BAE6FD' },
  });
  addText(slide, 'Mục tiêu: mở rộng cục bộ, chịu lỗi tốt, vẫn kiểm soát được chi phí hạ tầng.', {
    x: 3.38,
    y: 5.54,
    w: 8.15,
    h: 0.2,
    fontSize: 11.5,
    bold: true,
    color: C.blue,
    align: 'center',
  });
}

function architecture() {
  const slide = makeSlide(3, 'Giải pháp: Microservices', 'ARCHITECTURE', 'Phân tách theo năng lực nghiệp vụ, giao tiếp qua Gateway và event');
  node(slide, 5.42, 1.65, 2.3, 0.82, 'API Gateway', 'Định tuyến, auth context', C.navy, 'EFF6FF');
  const services = [
    ['Identity', 'JWT, OAuth2, user state', C.blue, 2.7, 3.15],
    ['Media', 'Channel, video metadata, HLS', C.teal, 5.0, 4.38],
    ['Processing', 'Worker, FFmpeg jobs', C.amber, 7.25, 3.15],
    ['Moderation', 'Local AI review', C.violet, 9.5, 4.38],
    ['Finance', 'Coin, ledger, payout', C.red, 10.3, 2.4],
  ];
  services.forEach(([name, body, color, x, y]) => {
    if (name === 'Identity') {
      leftArrow(slide, 4.8, 2.52, x + 1.85, y + 0.35, color, 1.25);
    } else {
      arrow(slide, 6.57, 2.48, x + 0.85, y, color, 1.25);
    }
    node(slide, x, y, 1.85, 0.98, name, body, color);
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 3.25,
    y: 6.05,
    w: 8.35,
    h: 0.52,
    rectRadius: 0.04,
    fill: { color: C.navy },
    line: { color: C.navy },
  });
  addText(slide, 'Kafka cho Integration Events  •  Redis/BullMQ cho background jobs  •  PostgreSQL riêng theo service', {
    x: 3.45,
    y: 6.22,
    w: 7.95,
    h: 0.15,
    fontSize: 8.2,
    bold: true,
    color: C.white,
    align: 'center',
  });
}

function tech() {
  const slide = makeSlide(4, 'Nền tảng công nghệ', 'STACK', 'Mỗi công nghệ gắn với một vai trò vận hành cụ thể');
  stat(slide, 2.75, 1.85, 'NestJS', 'Backend TypeScript', C.red);
  stat(slide, 5.1, 1.85, 'Next.js', 'Frontend', C.ink);
  stat(slide, 7.45, 1.85, 'Docker', 'Deployment', C.blue);
  stat(slide, 9.8, 1.85, 'MinIO', 'Object Storage', C.teal);
  card(slide, 2.75, 3.45, 2.6, 1.55, 'PostgreSQL', 'Mỗi service sở hữu database độc lập để giảm coupling dữ liệu.', C.blue);
  card(slide, 5.65, 3.45, 2.6, 1.55, 'Redis/BullMQ', 'Điều phối background jobs cho xử lý video.', C.amber);
  card(slide, 8.55, 3.45, 2.6, 1.55, 'Kafka', 'Phát Integration Events giữa các services.', C.violet);
  card(slide, 11.45, 3.45, 1.0, 1.55, 'AI', 'Cloud + Local.', C.emerald, { titleSize: 10, bodySize: 8 });
}

function mediaFlow() {
  const slide = makeSlide(5, 'Luồng xử lý Media', 'PIPELINE', 'Tách upload khỏi xử lý nặng bằng hàng đợi bất đồng bộ');
  const steps = [
    ['Upload', 'Multipart video gốc', C.blue],
    ['MinIO', 'Lưu object gốc', C.teal],
    ['BullMQ', 'Đưa job vào worker', C.amber],
    ['FFmpeg', 'Transcode thành HLS', C.red],
    ['Viewer', 'Stream từng segment', C.violet],
  ];
  steps.forEach(([title, body, color], index) => {
    const x = 2.55 + index * 1.95;
    node(slide, x, 2.35, 1.55, 1.08, title, body, color);
    if (index < steps.length - 1) arrow(slide, x + 1.58, 2.9, x + 1.92, 2.9, C.muted, 1.3);
  });
  card(
    slide,
    3.15,
    4.65,
    8.55,
    1.15,
    'Kết quả trải nghiệm',
    'Người xem không cần đợi tải toàn bộ file lớn; hệ thống có thể tăng worker xử lý video độc lập với phần API.',
    C.emerald,
    { bodySize: 11.5 },
  );
}

function hybridAi() {
  const slide = makeSlide(6, 'Tích hợp trí tuệ nhân tạo', 'AI', 'Hybrid AI: dùng cloud cho sáng tạo, local cho kiểm duyệt nhạy cảm');
  card(slide, 2.75, 1.8, 4.35, 3.45, 'Cloud AI - ZAI Copilot', 'Tự động gợi ý tiêu đề và mô tả video cho nhà sáng tạo thông qua API.', C.blue, {
    bodySize: 12,
  });
  card(slide, 7.55, 1.8, 4.35, 3.45, 'Local AI - Moderation', 'Cắt frame, phân tích NSFW nội bộ trước khi cho phép xuất bản video.', C.violet, {
    bodySize: 12,
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 4.0,
    y: 5.72,
    w: 6.8,
    h: 0.52,
    rectRadius: 0.04,
    fill: { color: 'ECFDF5' },
    line: { color: 'A7F3D0' },
  });
  addText(slide, 'Ưu điểm: bảo vệ quyền riêng tư video gốc và tối ưu chi phí hạ tầng.', {
    x: 4.18,
    y: 5.9,
    w: 6.42,
    h: 0.14,
    fontSize: 9.3,
    bold: true,
    color: C.emerald,
    align: 'center',
  });
}

function economy() {
  const slide = makeSlide(7, 'Cơ chế kinh tế ảo', 'FINANCE', 'Tách tiền thật khỏi giao dịch nội bộ để giảm rủi ro và tăng kiểm soát');
  const steps = [
    ['PayOS', 'Nạp/rút tiền thật', C.emerald],
    ['Coin', 'Đơn vị nội bộ', C.blue],
    ['Ledger', 'Double-entry', C.navy],
    ['Creator', 'Payout request', C.amber],
  ];
  steps.forEach(([title, body, color], i) => {
    const x = 2.95 + i * 2.28;
    node(slide, x, 2.0, 1.82, 1.0, title, body, color);
    if (i < steps.length - 1) arrow(slide, x + 1.85, 2.5, x + 2.25, 2.5);
  });
  bullet(
    slide,
    [
      'Tiền pháp định chỉ xuất hiện ở hai điểm: nạp vào và rút ra.',
      'Mọi tương tác trong hệ thống dùng Coin nội bộ.',
      'Sổ cái kép giúp truy vết và tránh sai lệch tài sản.',
    ],
    3.25,
    4.12,
    8.2,
    1.25,
    13,
  );
}

function events() {
  const slide = makeSlide(8, 'Đồng bộ dữ liệu phân tán', 'EVENTS', 'Event-driven giúp các service phản ứng mà không gọi API trực tiếp');
  node(slide, 2.7, 2.45, 1.8, 0.96, 'Identity', 'Admin khóa user', C.blue);
  node(slide, 5.05, 2.45, 1.8, 0.96, 'Kafka', 'user.banned', C.navy);
  node(slide, 7.45, 1.75, 1.9, 0.96, 'Finance', 'Đóng băng ví', C.amber);
  node(slide, 7.45, 3.25, 1.9, 0.96, 'Media', 'Ẩn toàn bộ video', C.teal);
  node(slide, 10.0, 2.45, 1.82, 0.96, 'System', 'Nhất quán cuối cùng', C.violet);
  arrow(slide, 4.52, 2.92, 5.02, 2.92);
  arrow(slide, 6.88, 2.92, 7.42, 2.2, C.amber);
  arrow(slide, 6.88, 2.92, 7.42, 3.72, C.teal);
  arrow(slide, 9.38, 2.22, 9.97, 2.72, C.amber);
  arrow(slide, 9.38, 3.72, 9.97, 3.12, C.teal);
  card(slide, 3.35, 5.35, 7.95, 0.82, 'Thông điệp chính', 'Idempotency theo eventId giúp consumer xử lý an toàn khi event bị gửi lại.', C.red, {
    titleSize: 10,
    bodySize: 9.4,
  });
}

function identity() {
  const slide = makeSlide(9, 'Định danh & phân quyền', 'SECURITY', 'Ba nhóm người dùng rõ ràng, được bảo vệ bằng JWT/OAuth2');
  card(slide, 2.75, 1.82, 2.8, 3.2, 'Viewer', 'Xem HLS, nạp Coin, mua hội viên, mở khóa nội dung.', C.blue);
  card(slide, 6.0, 1.82, 2.8, 3.2, 'Creator Studio', 'Tải video, quản lý kênh, xem doanh thu, yêu cầu rút tiền.', C.teal);
  card(slide, 9.25, 1.82, 2.8, 3.2, 'Admin', 'Quản lý danh mục, duyệt payout, khóa/mở tài khoản vi phạm.', C.red);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 4.05,
    y: 5.75,
    w: 6.65,
    h: 0.48,
    rectRadius: 0.04,
    fill: { color: 'EEF2FF' },
    line: { color: 'C7D2FE' },
  });
  addText(slide, 'Gateway truyền user context xuống service bằng header nội bộ.', {
    x: 4.22,
    y: 5.91,
    w: 6.3,
    h: 0.14,
    fontSize: 9.2,
    bold: true,
    color: C.violet,
    align: 'center',
  });
}

function screenshotFrame(slide, x, y, w, h, title, color, subtitle) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.04,
    fill: { color: C.white },
    line: { color: C.line },
    shadow: { type: 'outer', color: 'CBD5E1', opacity: 0.2, blur: 2, angle: 45, distance: 1 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h: 0.55,
    fill: { color },
    line: { color },
  });
  addText(slide, title, {
    x: x + 0.2,
    y: y + 0.19,
    w: w - 0.4,
    h: 0.13,
    fontSize: 8.5,
    bold: true,
    color: C.white,
    align: 'center',
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: x + 0.28,
    y: y + 0.82,
    w: w - 0.56,
    h: h - 1.2,
    fill: { color: 'F1F5F9' },
    line: { color: 'CBD5E1', dash: 'dash' },
  });
  addText(slide, subtitle, {
    x: x + 0.55,
    y: y + h / 2 - 0.05,
    w: w - 1.1,
    h: 0.18,
    fontSize: 10.8,
    italic: true,
    color: C.muted,
    align: 'center',
  });
}

function coreUi() {
  const slide = makeSlide(10, 'Giao diện cốt lõi', 'DEMO', 'Hai màn hình nên chèn ảnh thật sau khi quay demo');
  screenshotFrame(slide, 2.7, 1.75, 4.45, 4.05, 'Xem video HLS', C.blue, 'Ảnh màn hình video player');
  screenshotFrame(slide, 7.55, 1.75, 4.45, 4.05, 'Creator Studio', C.teal, 'Ảnh màn hình upload video');
}

function adminUi() {
  const slide = makeSlide(11, 'Quản trị & tài chính', 'DEMO', 'Minh họa rõ hai luồng quan trọng: nạp tiền và vận hành admin');
  screenshotFrame(slide, 2.7, 1.75, 4.45, 4.05, 'QR PayOS nạp tiền', C.amber, 'Ảnh màn hình QR payment');
  screenshotFrame(slide, 7.55, 1.75, 4.45, 4.05, 'Admin quản lý ví/người dùng', C.red, 'Ảnh màn hình admin dashboard');
}

function conclusion() {
  const slide = makeSlide(12, 'Kết luận & rút kinh nghiệm', 'WRAP-UP', 'Tóm tắt giá trị kỹ thuật của hệ thống');
  bullet(
    slide,
    [
      'Hoàn thiện hệ thống phân phối nội dung số theo hướng độc lập service và chịu lỗi tốt.',
      'Xử lý media bất đồng bộ với MinIO, BullMQ, FFmpeg và HLS.',
      'Đồng bộ dữ liệu phân tán bằng event để giảm phụ thuộc giữa services.',
      'Nâng cao kỹ năng debug xuyên suốt container, hàng đợi và luồng sự kiện.',
    ],
    2.95,
    1.85,
    9.15,
    2.1,
    13.5,
  );
  slide.addShape(pptx.ShapeType.line, {
    x: 3.05,
    y: 4.72,
    w: 8.55,
    h: 0,
    line: { color: C.line, width: 1.2 },
  });
  addText(slide, 'XIN TRÂN TRỌNG CẢM ƠN HỘI ĐỒNG', {
    x: 2.65,
    y: 5.18,
    w: 9.6,
    h: 0.42,
    fontFace: 'Aptos Display',
    fontSize: 21,
    bold: true,
    color: C.blue,
    align: 'center',
  });
  addText(slide, 'Mời quý thầy cô đặt câu hỏi.', {
    x: 2.65,
    y: 5.86,
    w: 9.6,
    h: 0.22,
    fontSize: 12,
    italic: true,
    color: C.slate,
    align: 'center',
  });
}

[
  cover,
  problem,
  architecture,
  tech,
  mediaFlow,
  hybridAi,
  economy,
  events,
  identity,
  coreUi,
  adminUi,
  conclusion,
].forEach((render) => render());

pptx
  .writeFile({ fileName: outputPath })
  .then(() => console.log(`Created ${outputPath}`))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
