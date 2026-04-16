export interface VideoPurchaseUnlockProps {
  id: string;
  videoId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class VideoPurchaseUnlockEntity {
  constructor(private readonly props: VideoPurchaseUnlockProps) {}

  get id(): string {
    return this.props.id;
  }

  get videoId(): string {
    return this.props.videoId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static create(input: {
    videoId: string;
    userId: string;
  }): VideoPurchaseUnlockEntity {
    const now = new Date();
    return new VideoPurchaseUnlockEntity({
      id: crypto.randomUUID(),
      videoId: input.videoId,
      userId: input.userId,
      createdAt: now,
      updatedAt: now,
    });
  }
}
