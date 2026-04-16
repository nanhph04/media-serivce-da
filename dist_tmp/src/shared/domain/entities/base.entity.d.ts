export declare abstract class Entity<TProps> {
    protected props: TProps;
    readonly id: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    constructor(props: TProps & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
    });
    equals(object?: Entity<TProps>): boolean;
    toObject(): TProps & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
    };
}
