"use strict";
var _a;
exports.__esModule = true;
exports.notificationTypeMap = exports.NotificationType = void 0;
var NotificationType;
(function (NotificationType) {
    NotificationType[NotificationType["ERROR"] = 0] = "ERROR";
    NotificationType[NotificationType["WARNING"] = 1] = "WARNING";
    NotificationType[NotificationType["INFORMATION"] = 2] = "INFORMATION";
    NotificationType[NotificationType["SUCCESS"] = 3] = "SUCCESS";
})(NotificationType = exports.NotificationType || (exports.NotificationType = {}));
exports.notificationTypeMap = (_a = {},
    _a[NotificationType.ERROR] = "error",
    _a[NotificationType.WARNING] = "warning",
    _a[NotificationType.INFORMATION] = "info",
    _a[NotificationType.SUCCESS] = "success",
    _a);
