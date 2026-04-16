"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entity = void 0;
class Entity {
    props;
    id;
    createdAt;
    updatedAt;
    constructor(props) {
        this.id = props.id;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
        this.props = props;
    }
    equals(object) {
        if (object == null || object === undefined)
            return false;
        if (this === object)
            return true;
        if (!(object instanceof Entity))
            return false;
        return this.id === object.id;
    }
    toObject() {
        return {
            id: this.id,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            ...this.props,
        };
    }
}
exports.Entity = Entity;
//# sourceMappingURL=base.entity.js.map