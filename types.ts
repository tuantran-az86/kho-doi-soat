/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Staff options requested: Anh Tuấn, Phạm Nga, Test
export type StaffName = "Anh Tuấn" | "Phạm Nga" | "Test" | string;

// Shift options requested: sáng, chiều
export type WorkShift = "sáng" | "chiều";

// Order statuses requested: đã bàn giao, không thành công, chưa xử lý
export type OrderStatus = "đã bàn giao" | "không thành công" | "chưa xử lý";

/**
 * Main Order model mapping precisely to Google Sheet columns:
 * 1. mã vận đơn (scanned barcode is the shipping/order code itself)
 * 2. tên khách
 * 3. số điện thoại
 * 4. ngày
 * 5. trạng thái
 * 6. nhân viên scan
 */
export interface SprinterOrder {
  maVanDon: string;     // Mã vận đơn (barcode)
  tenKhach: string;     // Tên khách
  soDienThoai: string;  // Số điện thoại
  ngay: string;         // Ngày (YYYY-MM-DD HH:mm:ss)
  trangThai: OrderStatus; // Trạng thái
  nhanVienScan: string; // Nhân viên scan
  timestamp: number;    // Epoch ms for 90 days retention filtering
}

export interface SessionConfig {
  staff: StaffName;
  shift: WorkShift;
  loginTime: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: number;
}

export interface DashboardStats {
  tongDonHomNay: number;
  daBanGiao: number;
  khongThanhCong: number;
  chuaXuLy: number;
  nhanVienScanNhieuNhat: { name: string; count: number } | null;
}
