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
exports.HallQuotationModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const HallQuotationSchema = new mongoose_1.Schema({
    hallId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Hall', required: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, default: 'Customer' },
    customerEmail: { type: String, default: 'customer@example.com' },
    customerPhone: { type: String, default: '+0000000000' },
    quotationNumber: { type: String, required: true, unique: true, index: true },
    eventName: { type: String, required: true },
    eventType: { type: String, required: true },
    eventDate: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    guestCount: { type: Number, required: true },
    baseAmount: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    validUntil: { type: Date, required: true },
    status: { type: String, required: true, default: 'DRAFT', index: true },
    isAccepted: { type: Boolean, default: false },
    isExpired: { type: Boolean, default: false },
    acceptedAt: { type: Date, default: null },
}, { timestamps: true, collection: 'hall_quotations' });
HallQuotationSchema.index({ hallId: 1, status: 1 });
exports.HallQuotationModel = mongoose_1.default.models.HallQuotation || mongoose_1.default.model('HallQuotation', HallQuotationSchema);
exports.default = exports.HallQuotationModel;
//# sourceMappingURL=HallQuotation.js.map