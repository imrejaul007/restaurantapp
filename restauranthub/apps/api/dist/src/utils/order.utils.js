"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrderNumber = generateOrderNumber;
async function generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    return `ORD-${year}${month}${day}-${randomNumber}`;
}
//# sourceMappingURL=order.utils.js.map