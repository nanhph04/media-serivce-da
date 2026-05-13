import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { CategoryOrmEntity } from '../../../modules/categories/infrastructure/persistence/category.orm-entity';
import { ChannelMembershipOrmEntity } from '../../../modules/channels/infrastructure/persistence/channel-membership.orm-entity';
import { ChannelOrmEntity } from '../../../modules/channels/infrastructure/persistence/channel.orm-entity';
import { MembershipTierOrmEntity } from '../../../modules/channels/infrastructure/persistence/membership-tier.orm-entity';
import { TagOrmEntity } from '../../../modules/tags/infrastructure/persistence/tag.orm-entity';
import { VideoCategoryOrmEntity } from '../../../modules/videos/infrastructure/persistence/video-category.orm-entity';
import { VideoPurchaseUnlockOrmEntity } from '../../../modules/videos/infrastructure/persistence/video-purchase-unlock.orm-entity';
import { VideoTagOrmEntity } from '../../../modules/videos/infrastructure/persistence/video-tag.orm-entity';
import { VideoOrmEntity } from '../../../modules/videos/infrastructure/persistence/video.orm-entity';
import { VideoWatchProgressOrmEntity } from '../../../modules/videos/infrastructure/persistence/video-watch-progress.orm-entity';
import { OutboxMessageOrmEntity } from '../messaging/outbox-message.orm-entity';

const loadEnvironmentFile = (): void => {
  const envFilePath = join(process.cwd(), '.env');
  if (!existsSync(envFilePath)) {
    return;
  }

  const envFileContent = readFileSync(envFilePath, 'utf8');
  const lines = envFileContent.split(/\r?\n/u);

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');
    if (separatorIndex < 0) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};

const getNumber = (value: string | undefined, defaultValue: number): number => {
  if (!value) {
    return defaultValue;
  }

  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? defaultValue : parsedValue;
};

loadEnvironmentFile();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: getNumber(process.env.DB_PORT, 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'password',
  database: process.env.DB_NAME ?? 'media_service_db',
  entities: [
    ChannelOrmEntity,
    ChannelMembershipOrmEntity,
    MembershipTierOrmEntity,
    CategoryOrmEntity,
    TagOrmEntity,
    VideoOrmEntity,
    VideoPurchaseUnlockOrmEntity,
    VideoCategoryOrmEntity,
    VideoTagOrmEntity,
    VideoWatchProgressOrmEntity,
    OutboxMessageOrmEntity,
  ],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
});
