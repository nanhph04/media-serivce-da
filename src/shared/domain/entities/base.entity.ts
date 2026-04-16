export abstract class Entity<TProps> {
  protected props: TProps;
  public readonly id: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(
    props: TProps & { id: string; createdAt: Date; updatedAt: Date },
  ) {
    this.id = props.id;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.props = props;
  }

  public equals(object?: Entity<TProps>): boolean {
    if (object == null || object === undefined) return false;
    if (this === object) return true;
    if (!(object instanceof Entity)) return false;
    return this.id === object.id;
  }

  public toObject(): TProps & { id: string; createdAt: Date; updatedAt: Date } {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      ...this.props,
    };
  }
}
