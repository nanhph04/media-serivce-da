process.env.TZ = 'UTC';

import { readdirSync, statSync } from 'node:fs';
import { open } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import type { INestApplicationContext } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../../../../app.module';
import { CategoryOrmEntity } from '../../../../modules/categories/infrastructure/persistence/category.orm-entity';
import {
  ChannelStatus,
  MembershipReviewStatus,
} from '../../../../modules/channels/domain/entities/channel.entity';
import { ChannelOrmEntity } from '../../../../modules/channels/infrastructure/persistence/channel.orm-entity';
import { StartVideoUploadUseCase } from '../../../../modules/videos/application/use-cases/start-video-upload.use-case';
import { CreateVideoUploadPartUrlsUseCase } from '../../../../modules/videos/application/use-cases/create-video-upload-part-urls.use-case';
import { RecordVideoUploadPartCompletedUseCase } from '../../../../modules/videos/application/use-cases/record-video-upload-part-completed.use-case';
import { CompleteVideoUploadUseCase } from '../../../../modules/videos/application/use-cases/complete-video-upload.use-case';
import { ConfirmVideoUploadUseCase } from '../../../../modules/videos/application/use-cases/confirm-video-upload.use-case';
import { VideoVisibility } from '../../../../modules/videos/domain/entities/video.entity';
import type { VideoUploadPartUrlResponse } from '../../../../modules/videos/application/dtos/video-upload-session.response';

interface DemoUser {
  email: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  gender: 'female' | 'male';
  isCreator: boolean;
}

interface DemoVideoFile {
  categoryName: string;
  categorySlug: string;
  filePath: string;
  fileName: string;
  sizeBytes: number;
  lastModified: Date;
}

interface UploadDependencies {
  startVideoUploadUseCase: StartVideoUploadUseCase;
  createVideoUploadPartUrlsUseCase: CreateVideoUploadPartUrlsUseCase;
  recordVideoUploadPartCompletedUseCase: RecordVideoUploadPartCompletedUseCase;
  completeVideoUploadUseCase: CompleteVideoUploadUseCase;
  confirmVideoUploadUseCase: ConfirmVideoUploadUseCase;
}

interface UploadTask {
  taskNumber: number;
  totalTasks: number;
  userId: string;
  categoryId: string;
  videoFile: DemoVideoFile;
}

interface UploadResult {
  task: UploadTask;
  videoId: string;
}

const DEFAULT_VIDEO_ROOT = 'E:\\doan\\video';
const MAX_VIDEOS_PER_CATEGORY = 5;
const SUPPORTED_VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mov',
  '.mkv',
  '.webm',
  '.avi',
]);
const FOLDER_CATEGORY_SLUGS = new Map<string, string>([
  ['âm nhạc và biểu diễn', 'am-nhac-bieu-dien'],
  ['công nghệ và khoa học', 'cong-nghe-khoa-hoc'],
  ['đồ họa và kỹ xảo', 'do-hoa-ky-xao'],
  ['giáo dục và kỹ năng', 'giao-duc-ky-nang'],
  ['giải trí', 'giai-tri'],
  ['khám phá', 'kham-pha'],
  ['phim ngắn', 'phim-ngan'],
  ['vlog và trải nghiệm', 'vlog-trai-nghiem'],
]);

const DEMO_USERS: DemoUser[] = [
  {
    email: 'minh.anh.tran01@gmail.com',
    displayName: 'Tran Minh Anh',
    avatarUrl: 'https://randomuser.me/api/portraits/women/65.jpg',
    bio: 'Product designer thich phim tai lieu, podcast va playlist nhe khi lam viec.',
    gender: 'female',
    isCreator: true,
  },
  {
    email: 'duc.huy.nguyen02@gmail.com',
    displayName: 'Nguyen Duc Huy',
    avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'Backend developer hay chia se ghi chu ve kien truc microservice.',
    gender: 'male',
    isCreator: true,
  },
  {
    email: 'bao.ngoc.le03@gmail.com',
    displayName: 'Le Bao Ngoc',
    avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    bio: 'Quan tam den skincare, sach tam ly hoc va cac vlog du lich cham.',
    gender: 'female',
    isCreator: false,
  },
  {
    email: 'quang.khai.pham04@gmail.com',
    displayName: 'Pham Quang Khai',
    avatarUrl: 'https://randomuser.me/api/portraits/men/75.jpg',
    bio: 'Freelancer lam video short ve cafe, nang suat va setup ban lam viec.',
    gender: 'male',
    isCreator: true,
  },
  {
    email: 'thao.nhi.vo05@gmail.com',
    displayName: 'Vo Thao Nhi',
    avatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    bio: 'Sinh vien marketing, hay luu video ve brand, thoi trang va mon ngon.',
    gender: 'female',
    isCreator: false,
  },
  {
    email: 'hoang.nam.bui06@gmail.com',
    displayName: 'Bui Hoang Nam',
    avatarUrl: 'https://randomuser.me/api/portraits/men/41.jpg',
    bio: 'Ky su phan mem, thich review cong cu dev va hanh trinh tap gym.',
    gender: 'male',
    isCreator: false,
  },
  {
    email: 'kim.chi.dang07@gmail.com',
    displayName: 'Dang Kim Chi',
    avatarUrl: 'https://randomuser.me/api/portraits/women/22.jpg',
    bio: 'Content writer yeu bep va cong thuc an uong de lam sau gio lam.',
    gender: 'female',
    isCreator: true,
  },
  {
    email: 'gia.bao.ho08@gmail.com',
    displayName: 'Ho Gia Bao',
    avatarUrl: 'https://randomuser.me/api/portraits/men/12.jpg',
    bio: 'Fan bong da, thich phan tich highlight va cac cau chuyen the thao.',
    gender: 'male',
    isCreator: false,
  },
  {
    email: 'lan.huong.do09@gmail.com',
    displayName: 'Do Lan Huong',
    avatarUrl: 'https://randomuser.me/api/portraits/women/76.jpg',
    bio: 'Ke toan vien, hay xem noi dung tai chinh ca nhan va du lich ngan ngay.',
    gender: 'female',
    isCreator: false,
  },
  {
    email: 'tuan.kiet.dinh10@gmail.com',
    displayName: 'Dinh Tuan Kiet',
    avatarUrl: 'https://randomuser.me/api/portraits/men/85.jpg',
    bio: 'Mobile developer, thich thu nghiem app moi va chia se meo lap trinh.',
    gender: 'male',
    isCreator: true,
  },
  {
    email: 'mai.phuong.ngo11@gmail.com',
    displayName: 'Ngo Mai Phuong',
    avatarUrl: 'https://randomuser.me/api/portraits/women/11.jpg',
    bio: 'Giao vien tieng Anh, quan tam den ngon ngu, phim sitcom va journaling.',
    gender: 'female',
    isCreator: false,
  },
  {
    email: 'viet.anh.truong12@gmail.com',
    displayName: 'Truong Viet Anh',
    avatarUrl: 'https://randomuser.me/api/portraits/men/53.jpg',
    bio: 'Nhiep anh nghiep du, hay dang anh duong pho va hau truong chinh mau.',
    gender: 'male',
    isCreator: true,
  },
  {
    email: 'ngan.ha.ly13@gmail.com',
    displayName: 'Ly Ngan Ha',
    avatarUrl: 'https://randomuser.me/api/portraits/women/49.jpg',
    bio: 'Thich bullet journal, yoga va cac video nho ve song cham.',
    gender: 'female',
    isCreator: false,
  },
  {
    email: 'nhat.minh.cao14@gmail.com',
    displayName: 'Cao Nhat Minh',
    avatarUrl: 'https://randomuser.me/api/portraits/men/60.jpg',
    bio: 'Data analyst, hay xem dashboard, bong ro va cac kenh giai thich cong nghe.',
    gender: 'male',
    isCreator: false,
  },
  {
    email: 'yen.linh.ma15@gmail.com',
    displayName: 'Ma Yen Linh',
    avatarUrl: 'https://randomuser.me/api/portraits/women/33.jpg',
    bio: 'Chu shop nho, thich noi dung kinh doanh online va chup anh san pham.',
    gender: 'female',
    isCreator: true,
  },
  {
    email: 'phuc.long.lam16@gmail.com',
    displayName: 'Lam Phuc Long',
    avatarUrl: 'https://randomuser.me/api/portraits/men/18.jpg',
    bio: 'Sinh vien IT, dang hoc cloud, chess va thich nghe lo-fi khi code.',
    gender: 'male',
    isCreator: false,
  },
  {
    email: 'ha.my.phung17@gmail.com',
    displayName: 'Phung Ha My',
    avatarUrl: 'https://randomuser.me/api/portraits/women/90.jpg',
    bio: 'Lam nhan su, quan tam den workplace culture va sach non-fiction.',
    gender: 'female',
    isCreator: false,
  },
  {
    email: 'khanh.duy.ta18@gmail.com',
    displayName: 'Ta Khanh Duy',
    avatarUrl: 'https://randomuser.me/api/portraits/men/26.jpg',
    bio: 'Editor video, thich preset mau, may anh cu va tutorial hau ky.',
    gender: 'male',
    isCreator: true,
  },
  {
    email: 'thu.trang.luu19@gmail.com',
    displayName: 'Luu Thu Trang',
    avatarUrl: 'https://randomuser.me/api/portraits/women/58.jpg',
    bio: 'Doc sach moi toi, thich phim Han, nau an va meo quan ly chi tieu.',
    gender: 'female',
    isCreator: false,
  },
  {
    email: 'son.tung.vu20@gmail.com',
    displayName: 'Vu Son Tung',
    avatarUrl: 'https://randomuser.me/api/portraits/men/71.jpg',
    bio: 'Quan ly san pham, hay luu noi dung ve UX, startup va chay bo.',
    gender: 'male',
    isCreator: true,
  },
];

async function main(): Promise<void> {
  const videoRoot = process.env.DEMO_VIDEO_ROOT ?? DEFAULT_VIDEO_ROOT;
  const uploadConcurrency = readPositiveIntegerEnv(
    'DEMO_UPLOAD_CONCURRENCY',
    1,
  );
  const uploadLimit = readOptionalPositiveIntegerEnv('DEMO_UPLOAD_LIMIT');
  const shouldCleanupPrevious = process.env.DEMO_CLEAN_PREVIOUS !== 'false';
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const dataSource = app.get(DataSource);
    const discoveredVideoFiles = discoverDemoVideos(videoRoot);
    const videoFiles =
      uploadLimit === null
        ? discoveredVideoFiles
        : discoveredVideoFiles.slice(0, uploadLimit);
    const categoryBySlug = await ensureCategories(dataSource, videoFiles);
    const channelByUserId = await ensureChannels(dataSource);
    if (shouldCleanupPrevious) {
      await cleanupPreviousDemoVideos(dataSource);
    }

    const uploadDependencies = getUploadDependencies(app);
    const creatorUsers = DEMO_USERS.filter((user) => user.isCreator);
    const uploadOwners = creatorUsers.length > 0 ? creatorUsers : DEMO_USERS;
    const uploadTasks: UploadTask[] = [];

    for (const [index, videoFile] of videoFiles.entries()) {
      const owner = uploadOwners[index % uploadOwners.length];
      const ownerId = createStableUuid(`demo-user:${owner.email}`);
      const channel = channelByUserId.get(ownerId);
      const category = categoryBySlug.get(videoFile.categorySlug);

      if (!channel || !category) {
        continue;
      }

      uploadTasks.push({
        taskNumber: uploadTasks.length + 1,
        totalTasks: videoFiles.length,
        userId: ownerId,
        categoryId: category.id,
        videoFile,
      });
    }

    const startedAt = Date.now();
    let completedUploads = 0;
    const results = await runConcurrently(
      uploadTasks,
      uploadConcurrency,
      async (task) => {
        const videoId = await uploadLikeUser({
          dependencies: uploadDependencies,
          userId: task.userId,
          categoryId: task.categoryId,
          videoFile: task.videoFile,
        });
        return { task, videoId };
      },
      (result) => {
        completedUploads += 1;
        const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
        const { task } = result;
        console.log(
          `Uploaded ${completedUploads}/${uploadTasks.length} ` +
            `(task ${task.taskNumber}/${task.totalTasks}, ${elapsedSeconds}s): ` +
            `${task.videoFile.fileName} -> ${result.videoId}`,
        );
      },
    );

    for (const result of results) {
      console.log(
        `Result: ${result.task.videoFile.fileName} -> ${result.videoId}`,
      );
    }

    console.log('Demo user upload flow completed');
    console.log(`Video root: ${videoRoot}`);
    console.log(`Categories: ${categoryBySlug.size}`);
    console.log(`Channels: ${channelByUserId.size}`);
    console.log(`Discovered videos: ${discoveredVideoFiles.length}`);
    console.log(`Selected videos: ${videoFiles.length}`);
    console.log(`Upload concurrency: ${uploadConcurrency}`);
    console.log(`Cleaned previous demo videos: ${shouldCleanupPrevious}`);
    console.log(`Uploaded via user flow: ${results.length}`);
  } finally {
    await app.close();
  }
}

function getUploadDependencies(
  app: INestApplicationContext,
): UploadDependencies {
  return {
    startVideoUploadUseCase: app.get(StartVideoUploadUseCase),
    createVideoUploadPartUrlsUseCase: app.get(CreateVideoUploadPartUrlsUseCase),
    recordVideoUploadPartCompletedUseCase: app.get(
      RecordVideoUploadPartCompletedUseCase,
    ),
    completeVideoUploadUseCase: app.get(CompleteVideoUploadUseCase),
    confirmVideoUploadUseCase: app.get(ConfirmVideoUploadUseCase),
  };
}

async function runConcurrently<TInput, TResult>(
  inputs: TInput[],
  concurrency: number,
  worker: (input: TInput) => Promise<TResult>,
  onCompleted: (result: TResult) => void,
): Promise<TResult[]> {
  const results: TResult[] = [];
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < inputs.length) {
      const input = inputs[nextIndex];
      nextIndex += 1;

      if (input === undefined) {
        continue;
      }

      const result = await worker(input);
      results.push(result);
      onCompleted(result);
    }
  }

  const workerCount = Math.min(concurrency, inputs.length);
  await Promise.all(
    Array.from({ length: workerCount }, async () => runWorker()),
  );

  return results;
}

function readPositiveIntegerEnv(key: string, defaultValue: number): number {
  const value = readOptionalPositiveIntegerEnv(key);
  return value ?? defaultValue;
}

function readOptionalPositiveIntegerEnv(key: string): number | null {
  const value = process.env[key];
  if (!value) {
    return null;
  }

  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }

  return parsedValue;
}

function discoverDemoVideos(videoRoot: string): DemoVideoFile[] {
  return readdirSync(videoRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((categoryDirectory) => {
      const categoryPath = join(videoRoot, categoryDirectory.name);
      return readdirSync(categoryPath, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .filter((fileName) =>
          SUPPORTED_VIDEO_EXTENSIONS.has(extname(fileName).toLowerCase()),
        )
        .sort((left, right) => left.localeCompare(right))
        .slice(0, MAX_VIDEOS_PER_CATEGORY)
        .map((fileName) => {
          const filePath = join(categoryPath, fileName);
          const stats = statSync(filePath);
          const categorySlug = resolveCategorySlug(categoryDirectory.name);

          return {
            categoryName: categoryDirectory.name,
            categorySlug,
            filePath,
            fileName,
            sizeBytes: stats.size,
            lastModified: stats.mtime,
          };
        });
    });
}

function resolveCategorySlug(folderName: string): string {
  const normalizedFolderName = folderName.trim().toLowerCase();
  const categorySlug = FOLDER_CATEGORY_SLUGS.get(normalizedFolderName);

  if (!categorySlug) {
    throw new Error(
      `Folder "${folderName}" is not mapped to an existing category slug.`,
    );
  }

  return categorySlug;
}

async function ensureCategories(
  dataSource: DataSource,
  videoFiles: DemoVideoFile[],
): Promise<Map<string, CategoryOrmEntity>> {
  const categoryRepository = dataSource.getRepository(CategoryOrmEntity);
  const categoryBySlug = new Map<string, CategoryOrmEntity>();
  const requestedCategorySlugs = [
    ...new Set(videoFiles.map((videoFile) => videoFile.categorySlug)),
  ];

  for (const categorySlug of requestedCategorySlugs) {
    const category = await categoryRepository.findOneBy({
      slug: categorySlug,
    });

    if (!category) {
      throw new Error(
        `Category slug "${categorySlug}" was not found in DB. Create/select a valid category first.`,
      );
    }

    if (category.status !== 'active') {
      throw new Error(
        `Category slug "${categorySlug}" exists but is not active.`,
      );
    }

    categoryBySlug.set(categorySlug, category);
  }

  return categoryBySlug;
}

async function ensureChannels(
  dataSource: DataSource,
): Promise<Map<string, ChannelOrmEntity>> {
  const channelRepository = dataSource.getRepository(ChannelOrmEntity);
  const channelByUserId = new Map<string, ChannelOrmEntity>();

  for (const user of DEMO_USERS) {
    const userId = createStableUuid(`demo-user:${user.email}`);
    const existing = await channelRepository.findOneBy({ userId });

    if (existing) {
      channelByUserId.set(userId, existing);
      continue;
    }

    const channel = await channelRepository.save(
      channelRepository.create({
        id: createStableUuid(`demo-channel:${user.email}`),
        userId,
        name: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        bannerUrl: createBannerUrl(user.gender),
        avatarObjectKey: null,
        bannerObjectKey: null,
        status: ChannelStatus.ACTIVE,
        isEligibleForMembership: user.isCreator,
        isMembershipClosedByAdmin: false,
        membershipReviewStatus: user.isCreator
          ? MembershipReviewStatus.APPROVED
          : MembershipReviewStatus.NOT_REQUESTED,
        membershipRejectionReason: null,
        membershipReviewedBy: user.isCreator
          ? createStableUuid('demo-admin:media')
          : null,
        membershipReviewedAt: user.isCreator ? new Date() : null,
        membershipRequestedAt: user.isCreator ? new Date() : null,
      }),
    );
    channelByUserId.set(userId, channel);
  }

  return channelByUserId;
}

async function cleanupPreviousDemoVideos(
  dataSource: DataSource,
): Promise<void> {
  await dataSource.transaction(async (manager) => {
    const videoIds = (await manager.query(
      `SELECT id FROM videos
       WHERE raw_file_key LIKE 'demo/raw/%'
          OR description LIKE 'Uploaded via demo user flow%'`,
    )) as Array<{ id: string }>;
    const ids = videoIds.map((row) => row.id);

    if (ids.length === 0) {
      return;
    }

    await manager.query(
      `DELETE FROM video_upload_parts
       WHERE session_id IN (
         SELECT id FROM video_upload_sessions WHERE video_id = ANY($1)
       )`,
      [ids],
    );
    await manager.query(
      'DELETE FROM video_upload_sessions WHERE video_id = ANY($1)',
      [ids],
    );
    await manager.query('DELETE FROM video_tags WHERE video_id = ANY($1)', [
      ids,
    ]);
    await manager.query('DELETE FROM videos WHERE id = ANY($1)', [ids]);
  });
}

async function uploadLikeUser(input: {
  dependencies: UploadDependencies;
  userId: string;
  categoryId: string;
  videoFile: DemoVideoFile;
}): Promise<string> {
  const title = createVideoTitle(input.videoFile.fileName);
  const upload = await input.dependencies.startVideoUploadUseCase.execute({
    userId: input.userId,
    title,
    description: `Uploaded via demo user flow from ${input.videoFile.categoryName}.`,
    categoryId: input.categoryId,
    tagIds: [],
    visibility: VideoVisibility.PUBLIC,
    price: 0,
    requiredTierLevel: null,
    fileName: input.videoFile.fileName,
    fileSize: input.videoFile.sizeBytes,
    fileLastModified: input.videoFile.lastModified,
  });
  const totalParts = Math.ceil(
    input.videoFile.sizeBytes / upload.partSizeBytes,
  );

  for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
    const partUrlResponse =
      await input.dependencies.createVideoUploadPartUrlsUseCase.execute({
        userId: input.userId,
        videoId: upload.videoId,
        uploadId: upload.uploadId,
        partNumbers: [partNumber],
      });
    const [part] = partUrlResponse.parts;

    if (!part) {
      throw new Error(`Missing presigned URL for part ${partNumber}`);
    }

    const sizeBytes = getPartSize({
      fileSize: input.videoFile.sizeBytes,
      partSizeBytes: upload.partSizeBytes,
      partNumber,
    });
    const etag = await uploadPartToPresignedUrl({
      part,
      filePath: input.videoFile.filePath,
      partSizeBytes: upload.partSizeBytes,
      sizeBytes,
    });

    await input.dependencies.recordVideoUploadPartCompletedUseCase.execute({
      userId: input.userId,
      videoId: upload.videoId,
      uploadId: upload.uploadId,
      partNumber,
      etag,
      sizeBytes,
    });
  }

  await input.dependencies.completeVideoUploadUseCase.execute({
    userId: input.userId,
    videoId: upload.videoId,
    uploadId: upload.uploadId,
  });
  await input.dependencies.confirmVideoUploadUseCase.execute({
    userId: input.userId,
    traceId: `demo-seed-${upload.videoId}`,
    videoId: upload.videoId,
    uploadId: upload.uploadId,
    resolutions: ['480p', '720p'],
    thumbnailObjectKey: null,
  });

  return upload.videoId;
}

async function uploadPartToPresignedUrl(input: {
  part: VideoUploadPartUrlResponse;
  filePath: string;
  partSizeBytes: number;
  sizeBytes: number;
}): Promise<string> {
  const buffer = await readPartBuffer({
    filePath: input.filePath,
    partNumber: input.part.partNumber,
    partSizeBytes: input.partSizeBytes,
    sizeBytes: input.sizeBytes,
  });
  const response = await fetch(input.part.uploadUrl, {
    method: 'PUT',
    body: new Uint8Array(buffer),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to upload part ${input.part.partNumber}: ${response.status} ${response.statusText}`,
    );
  }

  const etag = response.headers.get('etag')?.replace(/"/g, '');
  if (!etag) {
    throw new Error(`Missing ETag for uploaded part ${input.part.partNumber}`);
  }

  return etag;
}

async function readPartBuffer(input: {
  filePath: string;
  partNumber: number;
  partSizeBytes: number;
  sizeBytes: number;
}): Promise<Buffer> {
  const file = await open(input.filePath, 'r');

  try {
    const buffer = Buffer.alloc(input.sizeBytes);
    await file.read(
      buffer,
      0,
      input.sizeBytes,
      (input.partNumber - 1) * input.partSizeBytes,
    );
    return buffer;
  } finally {
    await file.close();
  }
}

function getPartSize(input: {
  fileSize: number;
  partSizeBytes: number;
  partNumber: number;
}): number {
  const offset = (input.partNumber - 1) * input.partSizeBytes;
  return Math.min(input.partSizeBytes, input.fileSize - offset);
}

function createVideoTitle(fileName: string): string {
  return basename(fileName, extname(fileName))
    .replace(/\s+-\s+YouTube$/u, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

function createBannerUrl(gender: DemoUser['gender']): string {
  const bannerId = gender === 'female' ? '1050' : '1039';
  return `https://picsum.photos/id/${bannerId}/1200/320`;
}

function createStableUuid(seed: string): string {
  const hash = createHash('sha256').update(seed).digest('hex');

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join('-');
}

void main()
  .catch((error: unknown) => {
    const message =
      error instanceof Error ? (error.stack ?? error.message) : error;
    console.error(message);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0);
  });
