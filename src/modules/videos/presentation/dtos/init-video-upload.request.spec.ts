import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { InitVideoUploadRequestDto } from './init-video-upload.request';

describe('InitVideoUploadRequestDto', () => {
  it('fails when categories is omitted', async () => {
    const dto = plainToInstance(InitVideoUploadRequestDto, {
      title: 'Video title',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'categories')).toBe(true);
  });

  it('fails when categories is an empty array', async () => {
    const dto = plainToInstance(InitVideoUploadRequestDto, {
      title: 'Video title',
      categories: [],
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'categories')).toBe(true);
  });

  it('fails when categories contains only blank values', async () => {
    const dto = plainToInstance(InitVideoUploadRequestDto, {
      title: 'Video title',
      categories: ['   '],
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'categories')).toBe(true);
  });

  it('trims categories and accepts a valid non-empty array', async () => {
    const dto = plainToInstance(InitVideoUploadRequestDto, {
      title: 'Video title',
      categories: [' music '],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.categories).toEqual(['music']);
  });
});
