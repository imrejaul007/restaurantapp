"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUserRole = exports.CurrentUserId = exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
});
exports.CurrentUserId = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id;
});
exports.CurrentUserRole = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.role;
});
//# sourceMappingURL=current-user.decorator.js.map