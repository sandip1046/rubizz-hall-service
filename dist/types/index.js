"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineItemType = exports.QuotationStatus = exports.PaymentType = exports.PaymentMode = exports.PaymentStatus = exports.BookingStatus = exports.EventType = void 0;
var EventType;
(function (EventType) {
    EventType["WEDDING"] = "WEDDING";
    EventType["CORPORATE"] = "CORPORATE";
    EventType["BIRTHDAY"] = "BIRTHDAY";
    EventType["ANNIVERSARY"] = "ANNIVERSARY";
    EventType["CONFERENCE"] = "CONFERENCE";
    EventType["SEMINAR"] = "SEMINAR";
    EventType["PARTY"] = "PARTY";
    EventType["MEETING"] = "MEETING";
    EventType["OTHER"] = "OTHER";
})(EventType || (exports.EventType = EventType = {}));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "PENDING";
    BookingStatus["CONFIRMED"] = "CONFIRMED";
    BookingStatus["CHECKED_IN"] = "CHECKED_IN";
    BookingStatus["COMPLETED"] = "COMPLETED";
    BookingStatus["CANCELLED"] = "CANCELLED";
    BookingStatus["NO_SHOW"] = "NO_SHOW";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PROCESSING"] = "PROCESSING";
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
    PaymentStatus["PARTIALLY_REFUNDED"] = "PARTIALLY_REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentMode;
(function (PaymentMode) {
    PaymentMode["CASH"] = "CASH";
    PaymentMode["CARD"] = "CARD";
    PaymentMode["UPI"] = "UPI";
    PaymentMode["NET_BANKING"] = "NET_BANKING";
    PaymentMode["WALLET"] = "WALLET";
    PaymentMode["CHEQUE"] = "CHEQUE";
    PaymentMode["BANK_TRANSFER"] = "BANK_TRANSFER";
})(PaymentMode || (exports.PaymentMode = PaymentMode = {}));
var PaymentType;
(function (PaymentType) {
    PaymentType["DEPOSIT"] = "DEPOSIT";
    PaymentType["ADVANCE"] = "ADVANCE";
    PaymentType["FULL_PAYMENT"] = "FULL_PAYMENT";
    PaymentType["REFUND"] = "REFUND";
})(PaymentType || (exports.PaymentType = PaymentType = {}));
var QuotationStatus;
(function (QuotationStatus) {
    QuotationStatus["DRAFT"] = "DRAFT";
    QuotationStatus["SENT"] = "SENT";
    QuotationStatus["ACCEPTED"] = "ACCEPTED";
    QuotationStatus["REJECTED"] = "REJECTED";
    QuotationStatus["EXPIRED"] = "EXPIRED";
})(QuotationStatus || (exports.QuotationStatus = QuotationStatus = {}));
var LineItemType;
(function (LineItemType) {
    LineItemType["HALL_RENTAL"] = "HALL_RENTAL";
    LineItemType["CHAIR"] = "CHAIR";
    LineItemType["TABLE"] = "TABLE";
    LineItemType["DECORATION"] = "DECORATION";
    LineItemType["LIGHTING"] = "LIGHTING";
    LineItemType["AV_EQUIPMENT"] = "AV_EQUIPMENT";
    LineItemType["CATERING"] = "CATERING";
    LineItemType["SECURITY"] = "SECURITY";
    LineItemType["GENERATOR"] = "GENERATOR";
    LineItemType["CLEANING"] = "CLEANING";
    LineItemType["PARKING"] = "PARKING";
    LineItemType["OTHER"] = "OTHER";
})(LineItemType || (exports.LineItemType = LineItemType = {}));
//# sourceMappingURL=index.js.map