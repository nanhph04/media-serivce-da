export interface MembershipTierProps {
    id: string;
    channelId: string;
    name: string;
    level: number;
    priceCoin: number;
    isAcceptingNew: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class MembershipTierEntity {
    private props;
    constructor(props: MembershipTierProps);
    get id(): string;
    get channelId(): string;
    get name(): string;
    get level(): number;
    get priceCoin(): number;
    get isAcceptingNew(): boolean;
    get createdAt(): Date;
    get updatedAt(): Date;
    static create(input: {
        channelId: string;
        name: string;
        level: number;
        priceCoin: number;
    }): MembershipTierEntity;
    update(input: Partial<Pick<MembershipTierProps, 'name' | 'level' | 'priceCoin' | 'isAcceptingNew'>>): void;
    hide(): void;
    show(): void;
}
