import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { InitVideoUploadRequestDto } from './init-video-upload.request';

describe('InitVideoUploadRequestDto', () => {
  it('fails when categoryId is omitted', async () => {
    const dto = plainToInstance(InitVideoUploadRequestDto, {
      title: 'Video title',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'categoryId')).toBe(true);
  });

  it('fails when categoryId is blank', async () => {
    const dto = plainToInstance(InitVideoUploadRequestDto, {
      title: 'Video title',
      categoryId: '',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'categoryId')).toBe(true);
  });

  it('accepts categoryId and trims tag ids', async () => {
    const dto = plainToInstance(InitVideoUploadRequestDto, {
      title: 'Video title',
      categoryId: 'category-1',
      tagIds: [' tag-1 '],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.tagIds).toEqual(['tag-1']);
  });
});
