import type { ConfigService } from '@shared/infrastructure/config/config.service';
import { ZaiVideoMetadataSuggestionGeneratorService } from './zai-video-metadata-suggestion-generator.service';

describe('ZaiVideoMetadataSuggestionGeneratorService', () => {
  const originalFetch = global.fetch;

  afterEach((): void => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('calls Z.AI chat completion and parses metadata JSON', async () => {
    const fetchMock = mockSuccessfulFetch();
    const service = new ZaiVideoMetadataSuggestionGeneratorService(
      createConfigService({
        ZAI_API_KEY: 'zai-key',
        ZAI_METADATA_MODEL: 'glm-4.5-flash',
      }),
    );

    const result = await service.generate({
      title: 'Video title',
      description: 'Current description',
      categoryName: 'Programming',
      categorySlug: 'programming',
      selectedTags: [{ id: 'tag-1', name: 'Backend', slug: 'backend' }],
      allowedTags: [{ id: 'tag-1', name: 'Backend', slug: 'backend' }],
      language: 'vi',
      tone: 'natural',
      maxDescriptionLength: 1200,
      traceId: 'trace-1',
    });

    const requestInit = getLastRequestInit(fetchMock);
    const body = JSON.parse(requestInit.body as string) as {
      model: string;
      messages: Array<{ role: string; content: string }>;
      stream: boolean;
      thinking: { type: string };
    };

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.z.ai/api/paas/v4/chat/completions',
    );
    expect(getHeaderValue(requestInit.headers, 'authorization')).toBe(
      'Bearer zai-key',
    );
    expect(body.model).toBe('glm-4.5-flash');
    expect(body.stream).toBe(false);
    expect(body.thinking.type).toBe('disabled');
    expect(body.messages[1]?.content).toContain('allowedTags');
    expect(result).toEqual({
      title: 'Better title',
      description: 'Better description',
      hashtags: ['#NestJS'],
      suggestedTagSlugs: ['backend'],
      provider: 'z-ai',
      model: 'glm-4.5-flash',
    });
  });

  it('requires ZAI_API_KEY before calling provider', async () => {
    const fetchMock = mockSuccessfulFetch();
    const service = new ZaiVideoMetadataSuggestionGeneratorService(
      createConfigService({}),
    );

    await expect(service.generate(createInput())).rejects.toThrow(
      'Config key "ZAI_API_KEY" is not defined',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

function mockSuccessfulFetch(): jest.MockedFunction<typeof fetch> {
  const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(
    () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    title: 'Better title',
                    description: 'Better description',
                    hashtags: ['#NestJS'],
                    suggestedTagSlugs: ['backend'],
                  }),
                },
              },
            ],
          }),
          { status: 200 },
        ),
      ),
  );

  global.fetch = fetchMock;

  return fetchMock;
}

function getLastRequestInit(
  fetchMock: jest.MockedFunction<typeof fetch>,
): RequestInit {
  const requestInit = fetchMock.mock.calls[0]?.[1];

  if (!requestInit) {
    throw new Error('Expected fetch to be called with request options');
  }

  return requestInit;
}

function getHeaderValue(
  headers: HeadersInit | undefined,
  name: string,
): string {
  if (!headers) {
    throw new Error(`Expected request header "${name}" to be set`);
  }

  if (headers instanceof Headers) {
    const value = headers.get(name);

    if (!value) {
      throw new Error(`Expected request header "${name}" to be set`);
    }

    return value;
  }

  if (Array.isArray(headers)) {
    const match = headers.find(
      ([headerName]) => headerName.toLowerCase() === name.toLowerCase(),
    );

    if (!match) {
      throw new Error(`Expected request header "${name}" to be set`);
    }

    return match[1];
  }

  const value = headers[name];

  if (!value) {
    throw new Error(`Expected request header "${name}" to be set`);
  }

  return value;
}

function createConfigService(values: Record<string, string>): ConfigService {
  return {
    get<T = string>(key: string, defaultValue?: T): T {
      if (key in values) {
        return values[key] as T;
      }

      return defaultValue ?? (null as T);
    },
    getOrThrow<T = string>(key: string): T {
      if (key in values) {
        return values[key] as T;
      }

      throw new Error(`Config key "${key}" is not defined`);
    },
    getNumber(key: string, defaultValue: number): number {
      if (!(key in values)) {
        return defaultValue;
      }

      const parsed = Number(values[key]);
      return Number.isNaN(parsed) ? defaultValue : parsed;
    },
  } as ConfigService;
}

function createInput(): Parameters<
  ZaiVideoMetadataSuggestionGeneratorService['generate']
>[0] {
  return {
    title: 'Video title',
    description: 'Current description',
    categoryName: 'Programming',
    categorySlug: 'programming',
    selectedTags: [],
    allowedTags: [],
    language: 'vi',
    tone: 'natural',
    maxDescriptionLength: 1200,
  };
}
