import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Tag, TagStatus } from '../domain/entities/tag.entity';
import {
  TAG_REPOSITORY,
  type ITagRepository,
} from '../domain/repositories/tag.repository';

const DEFAULT_TAGS = [
  'Hanh dong',
  'Am nhac',
  'Tinh cam',
  'Kinh di',
  'Hai huoc',
  'Hoc duong',
  'Drama',
  'Phieu luu',
  'Co trang',
  'Vien tuong',
  'Buon',
  'Audio',
  'Dem khuya',
  'Kiem hiep',
  'Doi song',
  'Lap trinh',
  'Web',
  'Frontend',
];

@Injectable()
export class DefaultTagBootstrap implements OnModuleInit {
  constructor(
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: ITagRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const name of DEFAULT_TAGS) {
      const slug = Tag.convertNameToSlug(name);
      const existing = await this.tagRepository.findBySlug(slug);

      if (existing) {
        continue;
      }

      await this.tagRepository.save(
        Tag.create({
          name,
          status: TagStatus.ACTIVE,
        }),
      );
    }
  }
}
