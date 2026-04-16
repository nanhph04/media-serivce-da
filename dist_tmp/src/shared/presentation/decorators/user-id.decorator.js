"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUserId = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUserId = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];
    if (!userId) {
        throw new common_1.UnauthorizedException('Missing user identity from gateway headers');
    }
    return userId;
});
//# sourceMappingURL=user-id.decorator.js.map