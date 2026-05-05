export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');

export interface IEventPublisher {
  emit<T = unknown>(
    topic: string,
    messages: Array<{ key?: string; value: T }>,
  ): Promise<void>;
}
