import {
  Category,
  CategoryStatus,
} from '../../../categories/domain/entities/category.entity';
import { mapVideoEntityToListItem } from './video-list-item.response';
import {
  VideoEntity,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { Tag, TagStatus } from '../../../tags/domain/entities/tag.entity';

describe('mapVideoEntityToListItem', () => {
  it('maps category and tag entities into slugs', () => {
    const video = VideoEntity.create({
      channelId: 'channel-1',
      ownerId: 'user-1',
      title: 'Video',
      description: '',
      category: new Category({
        id: 'cat-1',
        name: 'Music',
        slug: 'music',
        description: null,
        status: CategoryStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      tags: [
        new Tag({
          id: 'tag-1',
          name: 'Action',
          slug: 'action',
          status: TagStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ],
      visibility: VideoVisibility.PUBLIC,
      price: 0,
      requiredTierLevel: null,
      rawFileKey: 'raw-key',
    });

    const result = mapVideoEntityToListItem(video);

    expect(result.category).toBe('music');
    expect(result.tags).toEqual(['action']);
  });
});
