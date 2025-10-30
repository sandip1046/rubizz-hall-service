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
exports.HallBookingModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const HallBookingSchema = new mongoose_1.Schema({
    hallId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Hall', required: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    eventName: { type: String, required: true },
    eventType: { type: String, required: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, required: true },
    guestCount: { type: Number, required: true },
    baseAmount: { type: Number, required: true },
    additionalCharges: { type: Number, required: true },
    discount: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true, index: true },
    depositAmount: { type: Number, default: null },
    balanceAmount: { type: Number, default: null },
    depositPaid: { type: Boolean, default: false },
    status: { type: String, required: true, default: 'PENDING', index: true },
    paymentStatus: { type: String, required: true, default: 'PENDING', index: true },
    paymentMode: { type: String, default: null },
    isConfirmed: { type: Boolean, default: false, index: true },
    isCancelled: { type: Boolean, default: false, index: true },
    cancellationReason: { type: String, default: null },
    confirmedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    specialRequests: { type: String, default: null },
}, { timestamps: true, collection: 'hall_bookings' });
HallBookingSchema.index({ hallId: 1, startDate: 1, isCancelled: 1 });
exports.HallBookingModel = mongoose_1.default.models.HallBooking || mongoose_1.default.model('HallBooking', HallBookingSchema);
exports.default = exports.HallBookingModel;
//# sourceMappingURL=HallBooking.js.map