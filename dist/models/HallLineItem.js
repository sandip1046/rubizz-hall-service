"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HallLineItemModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const HallLineItemSchema = new mongoose_1.Schema({
    hallId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Hall', required: true, index: true },
    bookingId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'HallBooking', default: null },
    quotationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'HallQuotation', default: null },
    itemType: { type: String, required: true },
    itemName: { type: String, required: true },
    description: { type: String, default: null },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
}, { timestamps: true, collection: 'hall_line_items' });
HallLineItemSchema.index({ quotationId: 1 });
HallLineItemSchema.index({ bookingId: 1 });
exports.HallLineItemModel = mongoose_1.default.models.HallLineItem || mongoose_1.default.model('HallLineItem', HallLineItemSchema);
exports.default = exports.HallLineItemModel;
//# sourceMappingURL=HallLineItem.js.map