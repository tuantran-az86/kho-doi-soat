/**
 * Google Apps Script backend v1.0.0 for SPRINTER NỘI BỘ
 * Deploy as a Web App: 
 *   - Execute as: "Me"
 *   - Who has access: "Anyone"
 * 
 * Set your Google Sheet columns exactly as requested:
 *   - DU_LIEU_GOC: ma_don, ten_khach, sdt, san_pham, trang_thai, thoi_gian_quet, nhan_vien_quet, ca_lam, ngay_tao, ghi_chu
 *   - DON_BAN_GIAO: copy of DU_LIEU_GOC for successfully hand-over
 *   - LAY_HANG_KHONG_THANH_CONG: copy of DU_LIEU_GOC for missing items
 *   - SCAN_LOG: timestamp, nhan_vien, ca_lam, ma_don, action
 */

function doGet(e) {
  var action = e.parameter.action;
  if (action === "list") {
    return handleList();
  }
  return createJsonResponse({ status: "error", message: "Invalid action" });
}

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var payload = JSON.parse(rawData);
    var action = payload.action;

    if (action === "update") {
      return handleUpdate(payload);
    } else if (action === "log") {
      return handleLogOnly(payload);
    }
    return createJsonResponse({ status: "error", message: "Invalid action" });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function handleList() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("DU_LIEU_GOC");
  if (!sheet) {
    return createJsonResponse({ status: "error", message: "Sheet DU_LIEU_GOC not found" });
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var list = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var item = {};
    for (var j = 0; j < headers.length; j++) {
      var key = toCamelCase(headers[j]);
      item[key] = row[j];
    }
    list.push(item);
  }
  
  // Return list of orders and recent scan logs
  var logsSheet = ss.getSheetByName("SCAN_LOG");
  var logs = [];
  if (logsSheet) {
    var logData = logsSheet.getDataRange().getValues();
    var logHeaders = logData[0];
    for (var k = 1; k < Math.min(logData.length, 100); k++) {
      var lRow = logData[k];
      var logObj = {};
      for (var l = 0; l < logHeaders.length; l++) {
        logObj[toCamelCase(logHeaders[l])] = lRow[l];
      }
      logs.push(logObj);
    }
  }
  
  return createJsonResponse({ status: "success", info: list, logs: logs });
}

function handleUpdate(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("DU_LIEU_GOC");
  if (!sheet) {
    return createJsonResponse({ status: "error", message: "Sheet DU_LIEU_GOC not found" });
  }

  var checkCode = payload.ma_don || payload.ma_vận_đơn || payload.maVanDon;
  var statusValue = payload.trang_thai || payload.trangThai;
  var staffValue = payload.nhan_vien || payload.nhanVien;
  var shiftValue = payload.ca_lam || payload.caLam;
  var dateStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  var maDonColIndex = headers.indexOf("ma_don");
  if (maDonColIndex === -1) maDonColIndex = headers.indexOf("mã vận đơn");
  if (maDonColIndex === -1) maDonColIndex = 0; // Default first col
  
  var statusColIndex = headers.indexOf("trang_thai");
  if (statusColIndex === -1) statusColIndex = headers.indexOf("trạng thái");
  if (statusColIndex === -1) statusColIndex = 4;

  var thoiGianColIndex = headers.indexOf("thoi_gian_quet");
  if (thoiGianColIndex === -1) thoiGianColIndex = headers.indexOf("thời gian quét");
  if (thoiGianColIndex === -1) thoiGianColIndex = 5;

  var staffColIndex = headers.indexOf("nhan_vien_quet");
  if (staffColIndex === -1) staffColIndex = headers.indexOf("nhân viên scan");
  if (staffColIndex === -1) staffColIndex = 6;

  var caLamColIndex = headers.indexOf("ca_lam");
  if (caLamColIndex === -1) caLamColIndex = headers.indexOf("ca lâm");
  if (caLamColIndex === -1) caLamColIndex = 7;

  var foundRow = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][maDonColIndex]).trim() === String(checkCode).trim()) {
      foundRow = i + 1;
      break;
    }
  }

  // Double write safety: Update or Insert row
  if (foundRow !== -1) {
    sheet.getCell(foundRow, statusColIndex + 1).setValue(statusValue);
    sheet.getCell(foundRow, thoiGianColIndex + 1).setValue(dateStr);
    sheet.getCell(foundRow, staffColIndex + 1).setValue(staffValue);
    sheet.getCell(foundRow, caLamColIndex + 1).setValue(shiftValue);
  } else {
    // Inserts a brand new unknown order code
    var rowValues = [];
    for (var col = 0; col < headers.length; col++) {
      var hName = headers[col].toLowerCase();
      if (hName === "ma_don" || hName === "mã vận đơn" || hName === "mã đơn") {
        rowValues.push(checkCode);
      } else if (hName === "trang_thai" || hName === "trạng thái") {
        rowValues.push(statusValue);
      } else if (hName === "thoi_gian_quet" || hName === "ngay" || hName === "ngày") {
        rowValues.push(dateStr);
      } else if (hName === "nhan_vien_quet" || hName === "nhân viên scan") {
        rowValues.push(staffValue);
      } else if (hName === "ca_lam") {
        rowValues.push(shiftValue);
      } else if (hName === "ten_khach" || hName === "tên khách") {
        rowValues.push("Khách Vãng Lai Scan");
      } else if (hName === "sdt" || hName === "số điện thoại") {
        rowValues.push("0900000000");
      } else if (hName === "ngay_tao" || hName === "ngày tạo") {
        rowValues.push(dateStr);
      } else {
        rowValues.push("");
      }
    }
    sheet.appendRow(rowValues);
  }

  // Log inside custom tables for J&T Logistics accountability reports:
  syncSeparateSegmentTables(ss, checkCode, statusValue, staffValue, shiftValue, dateStr);
  writeLocalScanLog(ss, dateStr, staffValue, shiftValue, checkCode, "Quét " + statusValue.toUpperCase());

  return createJsonResponse({ status: "success", time: dateStr, details: "Update successful" });
}

function handleLogOnly(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dateStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
  writeLocalScanLog(ss, dateStr, payload.nhan_vien, payload.ca_lam, payload.ma_don, payload.action);
  return createJsonResponse({ status: "success", info: "Logged action successfully" });
}

function syncSeparateSegmentTables(ss, maDon, statusValue, staff, shift, dateStr) {
  var activeSheetName = (statusValue === "đã bàn giao") ? "DON_BAN_GIAO" : "LAY_HANG_KHONG_THANH_CONG";
  var sheet = ss.getSheetByName(activeSheetName);
  var sourceSheet = ss.getSheetByName("DU_LIEU_GOC");
  if (!sheet || !sourceSheet) return;

  var sourceData = sourceSheet.getDataRange().getValues();
  var sourceHeaders = sourceData[0];
  var foundRowValues = null;

  for (var i = 1; i < sourceData.length; i++) {
    var maDonCol = sourceHeaders.indexOf("ma_don");
    if (maDonCol === -1) maDonCol = 0;
    if (String(sourceData[i][maDonCol]).trim() === String(maDon).trim()) {
      foundRowValues = sourceData[i];
      break;
    }
  }

  // Append or overwrite within segmented logs sheets
  var destData = sheet.getDataRange().getValues();
  var destHeaders = destData[0];
  var destRow = -1;
  
  var destMaDonCol = destHeaders.indexOf("ma_don");
  if (destMaDonCol === -1) destMaDonCol = 0;

  for (var k = 1; k < destData.length; k++) {
    if (String(destData[k][destMaDonCol]).trim() === String(maDon).trim()) {
      destRow = k + 1;
      break;
    }
  }

  var rowValues = foundRowValues ? Array.from(foundRowValues) : [];
  if (rowValues.length === 0) {
    // Scaffold initial order attributes
    rowValues = [maDon, "Khách Vãng Lai", "0900000000", "Sản phẩm bổ trợ", statusValue, dateStr, staff, shift, dateStr, "Tạo tự động"];
  }

  if (destRow !== -1) {
    for (var j = 0; j < rowValues.length; j++) {
      sheet.getCell(destRow, j + 1).setValue(rowValues[j]);
    }
  } else {
    sheet.appendRow(rowValues);
  }
}

function writeLocalScanLog(ss, dateStr, nhanVien, caLam, maDon, action) {
  var sheet = ss.getSheetByName("SCAN_LOG");
  if (!sheet) return;
  // LOG columns: timestamp, nhan_vien, ca_lam, ma_don, action
  sheet.appendRow([dateStr, nhanVien, caLam, maDon, action]);
}

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
