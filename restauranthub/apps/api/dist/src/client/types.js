"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationCategory = exports.NotificationType = exports.VendorOrderStatus = exports.ProductStatus = exports.ProductCategory = exports.InterviewStatus = exports.InterviewType = exports.ApplicationStatus = exports.JobStatus = exports.ExperienceLevel = exports.WorkLocation = exports.EmploymentType = exports.RefundStatus = exports.PaymentStatus = exports.PaymentGateway = exports.PaymentMethod = exports.OrderType = exports.OrderStatus = exports.RestaurantStatus = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "CUSTOMER";
    UserRole["RESTAURANT_OWNER"] = "RESTAURANT_OWNER";
    UserRole["RESTAURANT_STAFF"] = "RESTAURANT_STAFF";
    UserRole["DELIVERY_PARTNER"] = "DELIVERY_PARTNER";
    UserRole["VENDOR"] = "VENDOR";
    UserRole["HR_MANAGER"] = "HR_MANAGER";
    UserRole["JOB_SEEKER"] = "JOB_SEEKER";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["INACTIVE"] = "INACTIVE";
    UserStatus["SUSPENDED"] = "SUSPENDED";
    UserStatus["PENDING_VERIFICATION"] = "PENDING_VERIFICATION";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var RestaurantStatus;
(function (RestaurantStatus) {
    RestaurantStatus["ACTIVE"] = "ACTIVE";
    RestaurantStatus["INACTIVE"] = "INACTIVE";
    RestaurantStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    RestaurantStatus["SUSPENDED"] = "SUSPENDED";
    RestaurantStatus["CLOSED_TEMPORARILY"] = "CLOSED_TEMPORARILY";
})(RestaurantStatus || (exports.RestaurantStatus = RestaurantStatus = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["CONFIRMED"] = "CONFIRMED";
    OrderStatus["PREPARING"] = "PREPARING";
    OrderStatus["READY_FOR_PICKUP"] = "READY_FOR_PICKUP";
    OrderStatus["OUT_FOR_DELIVERY"] = "OUT_FOR_DELIVERY";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["REFUNDED"] = "REFUNDED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var OrderType;
(function (OrderType) {
    OrderType["DELIVERY"] = "DELIVERY";
    OrderType["PICKUP"] = "PICKUP";
    OrderType["DINE_IN"] = "DINE_IN";
})(OrderType || (exports.OrderType = OrderType = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CREDIT_CARD"] = "CREDIT_CARD";
    PaymentMethod["DEBIT_CARD"] = "DEBIT_CARD";
    PaymentMethod["UPI"] = "UPI";
    PaymentMethod["WALLET"] = "WALLET";
    PaymentMethod["NET_BANKING"] = "NET_BANKING";
    PaymentMethod["CASH_ON_DELIVERY"] = "CASH_ON_DELIVERY";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentGateway;
(function (PaymentGateway) {
    PaymentGateway["STRIPE"] = "STRIPE";
    PaymentGateway["RAZORPAY"] = "RAZORPAY";
    PaymentGateway["PAYPAL"] = "PAYPAL";
})(PaymentGateway || (exports.PaymentGateway = PaymentGateway = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PROCESSING"] = "PROCESSING";
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["CANCELLED"] = "CANCELLED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
    PaymentStatus["PARTIALLY_REFUNDED"] = "PARTIALLY_REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var RefundStatus;
(function (RefundStatus) {
    RefundStatus["PENDING"] = "PENDING";
    RefundStatus["PROCESSING"] = "PROCESSING";
    RefundStatus["COMPLETED"] = "COMPLETED";
    RefundStatus["FAILED"] = "FAILED";
})(RefundStatus || (exports.RefundStatus = RefundStatus = {}));
var EmploymentType;
(function (EmploymentType) {
    EmploymentType["FULL_TIME"] = "FULL_TIME";
    EmploymentType["PART_TIME"] = "PART_TIME";
    EmploymentType["CONTRACT"] = "CONTRACT";
    EmploymentType["INTERNSHIP"] = "INTERNSHIP";
    EmploymentType["TEMPORARY"] = "TEMPORARY";
})(EmploymentType || (exports.EmploymentType = EmploymentType = {}));
var WorkLocation;
(function (WorkLocation) {
    WorkLocation["ON_SITE"] = "ON_SITE";
    WorkLocation["REMOTE"] = "REMOTE";
    WorkLocation["HYBRID"] = "HYBRID";
})(WorkLocation || (exports.WorkLocation = WorkLocation = {}));
var ExperienceLevel;
(function (ExperienceLevel) {
    ExperienceLevel["ENTRY_LEVEL"] = "ENTRY_LEVEL";
    ExperienceLevel["MID_LEVEL"] = "MID_LEVEL";
    ExperienceLevel["SENIOR_LEVEL"] = "SENIOR_LEVEL";
    ExperienceLevel["EXECUTIVE"] = "EXECUTIVE";
})(ExperienceLevel || (exports.ExperienceLevel = ExperienceLevel = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["DRAFT"] = "DRAFT";
    JobStatus["PUBLISHED"] = "PUBLISHED";
    JobStatus["PAUSED"] = "PAUSED";
    JobStatus["CLOSED"] = "CLOSED";
    JobStatus["EXPIRED"] = "EXPIRED";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["SUBMITTED"] = "SUBMITTED";
    ApplicationStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    ApplicationStatus["SHORTLISTED"] = "SHORTLISTED";
    ApplicationStatus["INTERVIEWED"] = "INTERVIEWED";
    ApplicationStatus["OFFERED"] = "OFFERED";
    ApplicationStatus["ACCEPTED"] = "ACCEPTED";
    ApplicationStatus["REJECTED"] = "REJECTED";
    ApplicationStatus["WITHDRAWN"] = "WITHDRAWN";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
var InterviewType;
(function (InterviewType) {
    InterviewType["PHONE"] = "PHONE";
    InterviewType["VIDEO"] = "VIDEO";
    InterviewType["IN_PERSON"] = "IN_PERSON";
    InterviewType["TECHNICAL"] = "TECHNICAL";
})(InterviewType || (exports.InterviewType = InterviewType = {}));
var InterviewStatus;
(function (InterviewStatus) {
    InterviewStatus["SCHEDULED"] = "SCHEDULED";
    InterviewStatus["COMPLETED"] = "COMPLETED";
    InterviewStatus["CANCELLED"] = "CANCELLED";
    InterviewStatus["NO_SHOW"] = "NO_SHOW";
})(InterviewStatus || (exports.InterviewStatus = InterviewStatus = {}));
var ProductCategory;
(function (ProductCategory) {
    ProductCategory["FRESH_PRODUCE"] = "FRESH_PRODUCE";
    ProductCategory["MEAT_SEAFOOD"] = "MEAT_SEAFOOD";
    ProductCategory["DAIRY_EGGS"] = "DAIRY_EGGS";
    ProductCategory["PANTRY_STAPLES"] = "PANTRY_STAPLES";
    ProductCategory["BEVERAGES"] = "BEVERAGES";
    ProductCategory["FROZEN_FOODS"] = "FROZEN_FOODS";
    ProductCategory["EQUIPMENT"] = "EQUIPMENT";
    ProductCategory["PACKAGING"] = "PACKAGING";
    ProductCategory["CLEANING_SUPPLIES"] = "CLEANING_SUPPLIES";
    ProductCategory["OTHER"] = "OTHER";
})(ProductCategory || (exports.ProductCategory = ProductCategory = {}));
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["ACTIVE"] = "ACTIVE";
    ProductStatus["INACTIVE"] = "INACTIVE";
    ProductStatus["OUT_OF_STOCK"] = "OUT_OF_STOCK";
    ProductStatus["DISCONTINUED"] = "DISCONTINUED";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var VendorOrderStatus;
(function (VendorOrderStatus) {
    VendorOrderStatus["PENDING"] = "PENDING";
    VendorOrderStatus["CONFIRMED"] = "CONFIRMED";
    VendorOrderStatus["PROCESSING"] = "PROCESSING";
    VendorOrderStatus["SHIPPED"] = "SHIPPED";
    VendorOrderStatus["DELIVERED"] = "DELIVERED";
    VendorOrderStatus["CANCELLED"] = "CANCELLED";
    VendorOrderStatus["RETURNED"] = "RETURNED";
})(VendorOrderStatus || (exports.VendorOrderStatus = VendorOrderStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["INFO"] = "INFO";
    NotificationType["SUCCESS"] = "SUCCESS";
    NotificationType["WARNING"] = "WARNING";
    NotificationType["ERROR"] = "ERROR";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationCategory;
(function (NotificationCategory) {
    NotificationCategory["ORDER"] = "ORDER";
    NotificationCategory["PAYMENT"] = "PAYMENT";
    NotificationCategory["PROMOTION"] = "PROMOTION";
    NotificationCategory["SYSTEM"] = "SYSTEM";
    NotificationCategory["REVIEW"] = "REVIEW";
    NotificationCategory["JOB"] = "JOB";
    NotificationCategory["VENDOR"] = "VENDOR";
})(NotificationCategory || (exports.NotificationCategory = NotificationCategory = {}));
//# sourceMappingURL=types.js.map