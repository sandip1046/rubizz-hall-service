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
exports.HallModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const HallSchema = new mongoose_1.Schema({
    name: { type: String, required: true, index: true },
    description: { type: String, default: null },
    capacity: { type: Number, required: true, index: true },
    area: { type: Number, required: true, default: 0 },
    location: { type: String, required: true, index: true },
    amenities: { type: [String], default: [] },
    baseRate: { type: Number, required: true },
    hourlyRate: { type: Number, default: null },
    dailyRate: { type: Number, default: null },
    weekendRate: { type: Number, default: null },
    isActive: { type: Boolean, default: true, index: true },
    isAvailable: { type: Boolean, default: true, index: true },
    images: { type: [String], default: [] },
    floorPlan: { type: String, default: null },
}, { timestamps: true, collection: 'halls' });
HallSchema.index({ name: 1 }, { unique: true, sparse: true });
exports.HallModel = mongoose_1.default.models.Hall || mongoose_1.default.model('Hall', HallSchema);
exports.default = exports.HallModel;
//# sourceMappingURL=Hall.js.map