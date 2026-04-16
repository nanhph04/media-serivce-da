"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUserRole = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUserRole = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-user-role'];
});
//# sourceMappingURL=user-role.decorator.js.map