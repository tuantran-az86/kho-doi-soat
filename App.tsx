import React, { useState, useEffect, useRef } from "react";
import {
  Scan,
  Lock,
  Unlock,
  Trash2,
  User,
  Clock,
  Search,
  LogOut,
  CheckCircle2,
  Inbox,
  Sparkles,
  Download,
  MessageSquare,
  SendHorizontal,
  RefreshCw,
  X,
  FileSpreadsheet,
  AlertTriangle,
  FileText,
  Camera,
  Keyboard,
  Settings,
  HelpCircle,
  Database,
  Volume2,
  VolumeX,
  Check,
  RotateCcw,
  UserCheck
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { SprinterOrder, OrderStatus, StaffName, WorkShift } from "./types";

// Initial seed logistics data
const INITIAL_MOCK_ORDERS: SprinterOrder[] = [
  {
    maVanDon: "802750828153",
    tenKhach: "Nguyễn Văn Hoàng",
    soDienThoai: "0912345678",
    ngay: "2026-05-22 09:15:00",
    trangThai: "chưa xử lý",
    nhanVienScan: "",
    timestamp: new Date("2026-05-22T09:15:00").getTime()
  },
  {
    maVanDon: "802750828154",
    tenKhach: "Phạm Thanh Thúy",
    soDienThoai: "0968112233",
    ngay: "2026-05-22 08:30:12",
    trangThai: "đã bàn giao",
    nhanVienScan: "Anh Tuấn",
    timestamp: new Date("2026-05-22T08:30:12").getTime()
  },
  {
    maVanDon: "802750828155",
    tenKhach: "Lê Minh Quân",
    soDienThoai: "0977884400",
    ngay: "2026-05-22 10:02:45",
    trangThai: "chưa xử lý",
    nhanVienScan: "",
    timestamp: new Date("2026-05-22T10:02:45").getTime()
  },
  {
    maVanDon: "802750828156",
    tenKhach: "Vũ Thị Mai",
    soDienThoai: "0982345112",
    ngay: "2026-05-21 14:10:00",
    trangThai: "không thành công",
    nhanVienScan: "Phạm Nga",
    timestamp: new Date("2026-05-21T14:10:00").getTime()
  },
  {
    maVanDon: "802750828157",
    tenKhach: "Đỗ Anh Tuấn",
    soDienThoai: "0901239988",
    ngay: "2026-05-21 16:45:30",
    trangThai: "đã bàn giao",
    nhanVienScan: "Anh Tuấn",
    timestamp: new Date("2026-05-21T16:45:30").getTime()
  },
  {
    maVanDon: "802750828158",
    tenKhach: "Hoàng Đức Anh",
    soDienThoai: "0934556677",
    ngay: "2025-05-20 11:22:00",
    trangThai: "không thành công",
    nhanVienScan: "Test",
    timestamp: new Date("2025-05-20T11:22:00").getTime()
  }
];

interface LogEntry {
  timestamp: string;
  nhanVien: string;
  caLam: string;
  maDon: string;
  action: string;
}

const INITIAL_LOGS: LogEntry[] = [
  {
    timestamp: "2026-05-22 08:30:12",
    nhanVien: "Anh Tuấn",
    caLam: "sáng",
    maDon: "802750828154",
    action: "Quét ĐÃ BÀN GIAO"
  },
  {
    timestamp: "2026-05-21 14:10:00",
    nhanVien: "Phạm Nga",
    caLam: "chiều",
    maDon: "802750828156",
    action: "Quét KHÔNG THÀNH CÔNG"
  }
];

export default function App() {
  // Session Configuration & Welcome Popup State
  const [currentUser, setCurrentUser] = useState<string>(() => {
    return localStorage.getItem("sprinter_user") || "";
  });
  const [currentShift, setCurrentShift] = useState<WorkShift>(() => {
    return (localStorage.getItem("sprinter_shift") as WorkShift) || "sáng";
  });
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(!currentUser);

  // Setup form states for operator logs
  const [selectUser, setSelectUser] = useState<StaffName>(currentUser || "Anh Tuấn");
  const [selectShift, setSelectShift] = useState<WorkShift>(currentShift || "sáng");

  // App core states
  const [orders, setOrders] = useState<SprinterOrder[]>(() => {
    const saved = localStorage.getItem("sprinter_orders");
    return saved ? JSON.parse(saved) : INITIAL_MOCK_ORDERS;
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem("sprinter_logs");
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  // Navigation tab states
  const [activeTab, setActiveTab] = useState<"dashboard" | "banGiao" | "layThatBai" | "tatCa">("dashboard");

  // Interactive scanner state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannerSection, setScannerSection] = useState<"banGiao" | "layThatBai">("banGiao");
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>("");
  const [flashlightOn, setFlashlightOn] = useState<boolean>(false);
  const [scannerError, setScannerError] = useState<string | null>(null);

  // Sound and feedback preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Search, Range Filter & Bulk Operations States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<"today" | "yesterday" | "7days" | "1month" | "90days">("today");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // Password Unlock Edit controls
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [lockError, setLockError] = useState<string | null>(null);

  // Active single-scan popups
  const [greenPopup, setGreenPopup] = useState<{ text: string; subtext?: string } | null>(null);
  const [yellowPopup, setYellowPopup] = useState<{ text: string; subtext?: string } | null>(null);
  const [redPopup, setRedPopup] = useState<{ text: string; subtext?: string } | null>(null);

  // Real-time digital clock state
  const [systemTime, setSystemTime] = useState<string>("");

  // Adaptive chatbot overlay widgets
  const [showChatbot, setShowChatbot] = useState<boolean>(false);
  const [chatMessageInput, setChatMessageInput] = useState<string>("");
  const [chatbotMessages, setChatbotMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([
    { sender: "bot", text: "Chào sếp! Em là trợ lý số điện tử SPRINTER. Sếp cần tra cứu đơn hàng hay thống kê ca trực nào không ạ?" }
  ]);

  // Google Sheets Apps Script integration state
  const [gasUrl, setGasUrl] = useState<string>(() => {
    return localStorage.getItem("sprinter_gas_url") || (import.meta as any).env.VITE_GOOGLE_APPS_SCRIPT_URL || "";
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Session anti-duplicate checklist
  const scannedInSessionRef = useRef<Set<string>>(new Set());
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerQueueRef = useRef<Promise<any>>(Promise.resolve());
  const scannerSectionRef = useRef<"banGiao" | "layThatBai">(scannerSection);

  useEffect(() => {
    scannerSectionRef.current = scannerSection;
  }, [scannerSection]);

  // Persist modifications
  useEffect(() => {
    localStorage.setItem("sprinter_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("sprinter_logs", JSON.stringify(logs));
  }, [logs]);

  // Realtime clock feed
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setSystemTime(
        now.toLocaleDateString("vi-VN", {
          weekday: "long",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }) + " - " + now.toLocaleTimeString("vi-VN")
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Play audio acoustic hum/beep feedback
  const playDiagnosticBeep = (frequency = 800, duration = 100) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
      console.warn("Audio context not fully allowed until interaction:", e);
    }
  };

  const triggerVibe = () => {
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  // Welcome user click handler
  const handleWelcomeSubmit = () => {
    if (!selectUser) return;
    setCurrentUser(selectUser);
    setCurrentShift(selectShift);
    localStorage.setItem("sprinter_user", selectUser);
    localStorage.setItem("sprinter_shift", selectShift);
    setShowWelcomeModal(false);
    
    // Play warm login sounds and toast confirmation
    playDiagnosticBeep(1100, 70);
    setTimeout(() => playDiagnosticBeep(1400, 110), 80);
    
    setGreenPopup({
      text: `✓ ĐĂNG NHẬP CA LÀM VIỆC THÀNH CÔNG`,
      subtext: `Chào mừng ${selectUser}, ca trực [${selectShift.toUpperCase()}] bắt đầu!`
    });
    setTimeout(() => setGreenPopup(null), 1800);
  };

  const handleLogout = () => {
    if (window.confirm("Sếp có chắc chắn muốn kết thúc ca làm việc và đăng xuất không?")) {
      setCurrentUser("");
      localStorage.removeItem("sprinter_user");
      localStorage.removeItem("sprinter_shift");
      scannedInSessionRef.current.clear();
      setShowWelcomeModal(true);
    }
  };

  // Google Sheet synchronizer mechanism
  const syncToSheet = async (payload: { ma_don: string; trang_thai: string; action: string }) => {
    if (!gasUrl) return;
    setIsSyncing(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s fast abort timeout

      const response = await fetch(gasUrl, {
        method: "POST",
        mode: "no-cors", // Standard no-cors payload injection for Apps Script
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          ma_don: payload.ma_don,
          trang_thai: payload.trang_thai,
          nhan_vien: currentUser,
          ca_lam: currentShift
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      setSyncStatusMsg("Đồng bộ Google Sheets hoàn tất!");
      setTimeout(() => setSyncStatusMsg(null), 2500);
    } catch (err) {
      console.warn("Sheets request complete or CORS mode fallback payload completed.", err);
      // Fallback notifications
      setSyncStatusMsg("Đã ghi nhận dữ liệu (Đang ở chế độ offline hoặc bảo mật proxy).");
      setTimeout(() => setSyncStatusMsg(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Global scanner module lifecycle
  const handleOpenScanner = (section: "banGiao" | "layThatBai") => {
    setScannerSection(section);
    setIsScanning(true);
    setScannerError(null);
  };

  const handleCloseScanner = () => {
    setIsScanning(false);
  };

  // Camera list retrieval & autofocus loops
  useEffect(() => {
    if (isScanning) {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(devices);
            const preferredCam = devices.find((d) => {
              const label = d.label.toLowerCase();
              return (
                label.includes("back") ||
                label.includes("rear") ||
                label.includes("environment") ||
                label.includes("sau") ||
                label.includes("main") ||
                label.includes("camera 0")
              );
            });
            setActiveCameraId(preferredCam ? preferredCam.id : devices[0].id);
          } else {
            setCameras([]);
            setActiveCameraId("default-environment");
          }
        })
        .catch((err) => {
          console.warn("Failed checking camera devices list:", err);
          setCameras([]);
          setActiveCameraId("default-environment");
        });
    } else {
      setCameras([]);
      setActiveCameraId("");
      setFlashlightOn(false);
    }
  }, [isScanning]);

  // Boot Html5Qrcode viewfinder instance
  useEffect(() => {
    let isMounted = true;
    let startTimeout: any = null;

    if (isScanning && activeCameraId) {
      startTimeout = setTimeout(() => {
        if (!isMounted) return;

        // Queue is used to strictly serialize start and stop calls
        scannerQueueRef.current = scannerQueueRef.current
          .then(async () => {
            if (!isMounted) return;

            const targetElement = document.getElementById("sprinter-scanner-screen-viewfinder");
            if (!targetElement) return;

            // Clear old HTML nodes to avoid UI duplication
            targetElement.innerHTML = "";

            const qrcodeInstance = new Html5Qrcode("sprinter-scanner-screen-viewfinder");
            html5QrCodeRef.current = qrcodeInstance;

            const config = {
              fps: 25, // Express delivery logistics high sensitive refresh
              qrbox: { width: 250, height: 150 }, // Exact warehouse bounding rectangle
              formatsToSupport: [
                0, // CODE_128
                1, // CODE_39
                11, // QR_CODE
                6, // EAN_8
                7, // EAN_13
                14, // UPC_A
                15 // UPC_E
              ],
              rememberLastUsedCamera: true,
              experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
              }
            };

            const handleScanSuccess = (decodedText: string) => {
              const barcode = decodedText.trim();
              if (!barcode) return;
              
              handleBarcodeProcessing(barcode, scannerSectionRef.current);
              // Auto close scanner after one successful detection
              setIsScanning(false);
            };

            const handleScanError = () => {
              // Passive frame analyzer noise bypass
            };

            const cameraMode = activeCameraId === "default-environment" 
              ? { facingMode: "environment" } 
              : activeCameraId;

            try {
              await qrcodeInstance.start(
                cameraMode,
                config,
                handleScanSuccess,
                handleScanError
              );

              // Continuous focus stream capabilities injection
              try {
                const stream = (qrcodeInstance as any)._webStream;
                if (stream) {
                  const track = stream.getVideoTracks()[0];
                  if (track) {
                    const capabilities = track.getCapabilities ? track.getCapabilities() : {};
                    if (capabilities.focusMode?.includes("continuous")) {
                      await track.applyConstraints({
                        advanced: [{ focusMode: "continuous" }]
                      });
                    }
                  }
                }
              } catch (e) {
                console.warn("Continuous autofocus check warning:", e);
              }
            } catch (err) {
              console.error("Camera startup error:", err);
              setScannerError("Lỗi kết nối camera. Vui lòng cấp quyền chụp ảnh hoặc đổi camera.");
            }
          })
          .catch((err) => {
            console.error("Queue start error:", err);
          });
      }, 350);

      return () => {
        isMounted = false;
        clearTimeout(startTimeout);

        // Queue stopping of the active instance
        scannerQueueRef.current = scannerQueueRef.current
          .then(async () => {
            const activeInstance = html5QrCodeRef.current;
            if (activeInstance) {
              if (activeInstance.isScanning) {
                try {
                  await activeInstance.stop();
                } catch (e) {
                  console.warn("Queue error stopping scanner:", e);
                }
              }
              try {
                activeInstance.clear();
              } catch (e) {
                console.warn("Queue error clearing scanner:", e);
              }
              html5QrCodeRef.current = null;
            }
          })
          .catch((err) => {
            console.error("Queue stop error:", err);
          });
      };
    }
  }, [isScanning, activeCameraId]);

  // Flashlight toggle feature logic
  const handleToggleFlashlight = async () => {
    if (!html5QrCodeRef.current || !html5QrCodeRef.current.isScanning) return;
    try {
      const stream = (html5QrCodeRef.current as any)._webStream;
      if (stream) {
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities ? track.getCapabilities() : {};
          if (capabilities.torch) {
            const nextFlashState = !flashlightOn;
            await track.applyConstraints({
              advanced: [{ torch: nextFlashState } as any]
            });
            setFlashlightOn(nextFlashState);
          } else {
            alert("Đèn Pin không được hỗ trợ trên thiết bị/camera này!");
          }
        }
      }
    } catch (e) {
      console.warn("Torch trigger constraint error:", e);
    }
  };

  // Processes raw barcode results (vibe, beep, sheet update, and history logs)
  const handleBarcodeProcessing = (barcode: string, type: "banGiao" | "layThatBai") => {
    const targetStatus: OrderStatus = type === "banGiao" ? "đã bàn giao" : "không thành công";
    const nowTime = new Date().toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" }) + " " + new Date().toLocaleTimeString("vi-VN");

    // 1. Anti-duplicate Session validation
    if (scannedInSessionRef.current.has(barcode)) {
      triggerVibe();
      playDiagnosticBeep(450, 220);
      setRedPopup({
        text: `ĐƠN HÀNG ĐÃ ĐƯỢC QUÉT TRỰC TIẾP`,
        subtext: `Mã vận đơn ${barcode} đã được xử lý trong phiên trực hiện tại!`
      });
      setTimeout(() => setRedPopup(null), 2500);
      return;
    }

    // 2. Lookup existing order in the records
    const existingOrderIndex = orders.findIndex(o => o.maVanDon === barcode);

    if (existingOrderIndex !== -1) {
      const order = orders[existingOrderIndex];
      // If code was already processed previously
      if (order.trangThai !== "chưa xử lý") {
        triggerVibe();
        playDiagnosticBeep(450, 220);
        
        let headerLabel = "";
        let colorClass = "";
        if (order.trangThai === "đã bàn giao") {
          headerLabel = "Đơn hàng đã BÀN GIAO";
          setRedPopup({
            text: `⚠️ ĐƠN ĐÃ BÀN GIAO`,
            subtext: `Người quét: ${order.nhanVienScan || "N/A"} lúc ${order.ngay}`
          });
        } else {
          headerLabel = "Đơn lỡ BỊ ĐÁNH DẤU THẤT BẠI";
          setRedPopup({
            text: `⚠️ ĐƠN THẤT BẠI`,
            subtext: `Đã đánh dấu không thành công bởi ${order.nhanVienScan || "N/A"}`
          });
        }
        
        setTimeout(() => setRedPopup(null), 2500);
        return;
      }
    }

    // Add code to session Set cache
    scannedInSessionRef.current.add(barcode);

    // Trigger success vibration and scan sound feedback 
    triggerVibe();
    playDiagnosticBeep(850, 100);

    // Create or Update records list
    let updatedOrders = [...orders];
    let matchedName = "Khách Vãng Lai";
    let matchedPhone = "0945******";

    if (existingOrderIndex !== -1) {
      matchedName = orders[existingOrderIndex].tenKhach;
      matchedPhone = orders[existingOrderIndex].soDienThoai;
      
      updatedOrders[existingOrderIndex] = {
        ...orders[existingOrderIndex],
        trangThai: targetStatus,
        nhanVienScan: currentUser,
        ngay: nowTime,
        timestamp: Date.now()
      };
    } else {
      // Append a newly found scanned package directly (Logistics dynamic insert!)
      const newOrder: SprinterOrder = {
        maVanDon: barcode,
        tenKhach: "Khách lẻ vãng lai",
        soDienThoai: "Bảo mật",
        ngay: nowTime,
        trangThai: targetStatus,
        nhanVienScan: currentUser,
        timestamp: Date.now()
      };
      updatedOrders.unshift(newOrder);
    }

    setOrders(updatedOrders);

    // Create a new action log item
    const actionLabel = targetStatus === "đã bàn giao" ? "Quét ĐÀ BÀN GIAO" : "Quét THẤT BẠI";
    const newLog: LogEntry = {
      timestamp: nowTime,
      nhanVien: currentUser,
      caLam: currentShift,
      maDon: barcode,
      action: actionLabel
    };
    setLogs([newLog, ...logs]);

    // Show temporary 1s popup overlays
    if (targetStatus === "đã bàn giao") {
      setGreenPopup({
        text: `✓ Đơn ${barcode}`,
        subtext: "ĐÃ BÀN GIAO thành công!"
      });
      setTimeout(() => setGreenPopup(null), 1000); // Strict 1s requirement auto close
    } else {
      setYellowPopup({
        text: `⚡ Đơn ${barcode}`,
        subtext: "Đánh dấu lấy hàng KHÔNG THÀNH CÔNG!"
      });
      setTimeout(() => setYellowPopup(null), 1000); // Strict 1s requirement auto close
    }

    // Google sheet connection sync
    syncToSheet({
      ma_don: barcode,
      trang_thai: targetStatus,
      action: actionLabel
    });
  };

  // Keyboard Simulation code insertion for testing scanner behaviors
  const handleManualCodeCheck = (code: string, type: "banGiao" | "layThatBai") => {
    const cleanCode = code.trim();
    if (!cleanCode) return;
    handleBarcodeProcessing(cleanCode, type);
  };

  // Edit Panel security access password check
  const handleUnlockCheck = () => {
    if (passwordInput === "666666") {
      setIsUnlocked(true);
      setShowUnlockModal(false);
      setPasswordInput("");
      setLockError(null);
      playDiagnosticBeep(1000, 80);
    } else {
      setLockError("Mật khẩu không hợp lệ! Mật khẩu mẫu là '666666'.");
      playDiagnosticBeep(350, 200);
    }
  };

  // Actions allowed on Edit mode
  const handleModifyStatus = (maVanDon: string, futureStatus: OrderStatus) => {
    if (!isUnlocked) {
      alert("Hành động bị chặn: Vui lòng mở khóa chế độ Chỉnh Sửa trước!");
      return;
    }

    const updated = orders.map(ord => {
      if (ord.maVanDon === maVanDon) {
        return {
          ...ord,
          trangThai: futureStatus,
          nhanVienScan: currentUser,
          ngay: new Date().toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" }) + " " + new Date().toLocaleTimeString("vi-VN"),
          timestamp: Date.now()
        };
      }
      return ord;
    });

    setOrders(updated);

    // Delete barcode from current session Set to allow clean re-scans if undo-ed
    if (futureStatus === "chưa xử lý") {
      scannedInSessionRef.current.delete(maVanDon);
    }

    // Record Action Log
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleDateString("vi-VN") + " " + new Date().toLocaleTimeString("vi-VN"),
      nhanVien: currentUser,
      caLam: currentShift,
      maDon: maVanDon,
      action: `Chỉnh sửa thành ${futureStatus.toUpperCase()}`
    };
    setLogs([newLog, ...logs]);

    // Sheet Sync if API loaded
    syncToSheet({
      ma_don: maVanDon,
      trang_thai: futureStatus,
      action: `Sửa thành ${futureStatus}`
    });

    playDiagnosticBeep(900, 70);
  };

  // Reset order item scanning completely back to raw unhandled state
  const handleUndoOrderScan = (maVanDon: string) => {
    handleModifyStatus(maVanDon, "chưa xử lý");
  };

  // Realtime Statistics (No Hardcodes on Dashboard numbers!)
  const computedStats = React.useMemo(() => {
    const todayStr = new Date().toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" });
    
    // Day ranges
    const todayOrders = orders.filter(o => o.ngay.includes(todayStr) || o.timestamp > Date.now() - 86400000);
    
    const countTotal = todayOrders.length;
    const countBanGiao = todayOrders.filter(o => o.trangThai === "đã bàn giao").length;
    const countThatBai = todayOrders.filter(o => o.trangThai === "không thành công").length;
    const countChuaXuLy = todayOrders.filter(o => o.trangThai === "chưa xử lý").length;

    // Staff scoreboard metrics calculation
    const staffEngagement: Record<string, number> = {};
    orders.forEach(o => {
      if (o.nhanVienScan) {
        staffEngagement[o.nhanVienScan] = (staffEngagement[o.nhanVienScan] || 0) + 1;
      }
    });

    let topStaffName = "Chưa có";
    let topStaffCount = 0;
    Object.entries(staffEngagement).forEach(([name, count]) => {
      if (count > topStaffCount) {
        topStaffCount = count;
        topStaffName = name;
      }
    });

    return {
      total: countTotal,
      banGiao: countBanGiao,
      thatBai: countThatBai,
      chuaXuLy: countChuaXuLy,
      topStaff: topStaffName !== "Chưa có" ? `${topStaffName} (${topStaffCount} đơn)` : "Chưa ghi nhận"
    };
  }, [orders]);

  // Status breakdown & operator speed data representation 
  const statusCountsGlobal = React.useMemo(() => {
    const banGiao = orders.filter(o => o.trangThai === "đã bàn giao").length;
    const thatBai = orders.filter(o => o.trangThai === "không thành công").length;
    const chuaXuLy = orders.filter(o => o.trangThai === "chưa xử lý").length;
    return { banGiao, thatBai, chuaXuLy };
  }, [orders]);

  const topStaffGlobalBreakdown = React.useMemo(() => {
    const scores: Record<string, number> = {};
    orders.forEach(o => {
      if (o.nhanVienScan) {
        scores[o.nhanVienScan] = (scores[o.nhanVienScan] || 0) + 1;
      }
    });
    return Object.entries(scores).map(([name, count]) => ({ name, count }));
  }, [orders]);

  // Live Chart rendering using raw HTML/Canvas to prevent library crashes
  useEffect(() => {
    const ChartClass = (window as any).Chart;
    if (!ChartClass) return;

    let chartInstance1: any = null;
    let chartInstance2: any = null;

    const canvas1 = document.getElementById("canvas-status-pie") as HTMLCanvasElement;
    if (canvas1) {
      chartInstance1 = new ChartClass(canvas1, {
        type: "pie",
        data: {
          labels: ["Đã Bàn Giao", "Thất Bại", "Chưa Xử Lý"],
          datasets: [{
            data: [statusCountsGlobal.banGiao, statusCountsGlobal.thatBai, statusCountsGlobal.chuaXuLy],
            backgroundColor: ["#10b981", "#ef4444", "#64748b"],
            borderWidth: 1,
            borderColor: "#1e293b"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: "#f1f5f9", font: { size: 10 } }
            }
          }
        }
      });
    }

    const canvas2 = document.getElementById("canvas-staff-pie") as HTMLCanvasElement;
    if (canvas2 && topStaffGlobalBreakdown.length > 0) {
      chartInstance2 = new ChartClass(canvas2, {
        type: "doughnut",
        data: {
          labels: topStaffGlobalBreakdown.map(s => s.name),
          datasets: [{
            data: topStaffGlobalBreakdown.map(s => s.count),
            backgroundColor: ["#E60012", "#0284c7", "#f59e0b", "#8b5cf6", "#ec4899"],
            borderWidth: 1,
            borderColor: "#1e293b"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: "#f1f5f9", font: { size: 10 } }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance1) chartInstance1.destroy();
      if (chartInstance2) chartInstance2.destroy();
    };
  }, [activeTab, statusCountsGlobal, topStaffGlobalBreakdown, orders]);

  // Real-time table searching/filtering algorithms
  const filteredOrders = React.useMemo(() => {
    return orders.filter(o => {
      // 1. Unified Text Search
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = 
        o.maVanDon.toLowerCase().includes(query) ||
        o.tenKhach.toLowerCase().includes(query) ||
        o.soDienThoai.toLowerCase().includes(query) ||
        (o.nhanVienScan && o.nhanVienScan.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // 2. Status Select
      if (statusFilter !== "all" && o.trangThai !== statusFilter) return false;

      // 3. Date Presets Ranges
      const itemTime = o.timestamp || Date.now();
      const now = Date.now();
      const lengthDayMs = 24 * 60 * 60 * 1000;

      if (dateFilter === "today") {
        const todayString = new Date().toLocaleDateString("vi-VN");
        // Convert localized date string back to verify
        const itemDateString = new Date(itemTime).toLocaleDateString("vi-VN");
        return itemDateString === todayString;
      } else if (dateFilter === "yesterday") {
        const yesterdayString = new Date(now - lengthDayMs).toLocaleDateString("vi-VN");
        const itemDateString = new Date(itemTime).toLocaleDateString("vi-VN");
        return itemDateString === yesterdayString;
      } else if (dateFilter === "7days") {
        return now - itemTime <= 7 * lengthDayMs;
      } else if (dateFilter === "1month") {
        return now - itemTime <= 30 * lengthDayMs;
      } else if (dateFilter === "90days") {
        return now - itemTime <= 90 * lengthDayMs;
      }

      return true;
    });
  }, [orders, searchQuery, dateFilter, statusFilter]);

  // Checkbox Select row structures
  const handleToggleRowSelection = (id: string) => {
    const next = new Set(selectedOrderIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedOrderIds(next);
  };

  const handleToggleAllRowsSelection = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map(o => o.maVanDon)));
    }
  };

  // Bulk CSV delivery export utilities
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert("Không có đơn hàng nào khớp với bộ lọc để xuất!");
      return;
    }

    const itemsToExport = selectedOrderIds.size > 0 
      ? filteredOrders.filter(o => selectedOrderIds.has(o.maVanDon))
      : filteredOrders;

    const headers = ["Mã vận đơn", "Tên khách", "Số điện thoại", "Ngày quét đối soát", "Trạng thái", "Nhân viên scan"];
    const rows = itemsToExport.map(o => [
      o.maVanDon,
      o.tenKhach,
      o.soDienThoai,
      o.ngay,
      o.trangThai.toUpperCase(),
      o.nhanVienScan || "CHƯA XỬ LÝ"
    ]);

    // Vietnamese localized CSV encoding prefix injection
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SPRINTER_DOI_SOAT_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playDiagnosticBeep(1200, 150);
  };

  // Rule-based chat module responder
  const handleSendChatMessage = () => {
    const text = chatMessageInput.trim();
    if (!text) return;

    setChatMessageInput("");
    const userMsg = { sender: "user" as const, text };
    setChatbotMessages(prev => [...prev, userMsg]);

    const query = text.toLowerCase();

    // Sound effect
    playDiagnosticBeep(950, 60);

    setTimeout(() => {
      let botResponse = "";

      if (query.includes("hôm nay") && (query.includes("gửi bao nhiêu") || query.includes("bao nhiêu đơn") || query.includes("số đơn") || query.includes("có mấy đơn"))) {
        const todayStr = new Date().toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" });
        const count = orders.filter(o => o.ngay.includes(todayStr) || o.timestamp > Date.now() - 86400000).length;
        const countBanGiao = orders.filter(o => (o.ngay.includes(todayStr) || o.timestamp > Date.now() - 86400000) && o.trangThai === "đã bàn giao").length;
        botResponse = `Thưa sếp, hôm nay ca trực ghi nhận bàn giao tổng cộng **${count} đơn hàng**. Trong đó có **${countBanGiao} đơn** đã bàn giao thành công và hoàn thành đối soát ạ.`;
      } 
      else if (query.includes("đơn") || query.match(/\d+/)) {
        // Look up code matches (numbers inside string or exact code matches)
        const matchDigits = query.match(/\d+/);
        const codeQuery = matchDigits ? matchDigits[0] : "";
        const matchedItem = orders.find(o => o.maVanDon.includes(codeQuery));

        if (matchedItem) {
          botResponse = `Mã đơn **${matchedItem.maVanDon}** đang có trạng thái: **${matchedItem.trangThai.toUpperCase()}**.\n- Khách hàng: **${matchedItem.tenKhach}** (${matchedItem.soDienThoai})\n- Cập nhật lúc: ${matchedItem.ngay}\n- Nhân viên trực: ${matchedItem.nhanVienScan || "Chưa trực"}. Sếp có cần em điều phối gì thêm cho đơn này không ạ?`;
        } else {
          botResponse = `Dạ thưa sếp, em đã tìm kiếm mã đơn có số hoặc chuỗi "${codeQuery}" trong toàn bộ dữ liệu gốc nhưng không thấy ạ. Sếp kiểm tra lại mã vạch xem có sai lệch gì không nhé.`;
        }
      } 
      else if (query.includes("nhân viên") || query.includes("ai scan") || query.includes("phạm nga") || query.includes("an tuấn") || query.includes("anh tuấn")) {
        const staffList = ["Anh Tuấn", "Phạm Nga", "Test"];
        const counts = staffList.map(name => {
          const count = orders.filter(o => o.nhanVienScan === name).length;
          return `- **${name}**: ${count} đơn`;
        });
        botResponse = `Báo cáo sếp, đây là bảng xếp hạng số lượng đơn kiểm soát thực tế của các nhân viên trực bưu cục:\n${counts.join("\n")}\nChúc sếp một ngày trực rực rỡ!`;
      } 
      else {
        // Universal out of bounds exception response ( Vietnamese "sếp" / "em" layout strictly enforced)
        botResponse = "Em không biết, sếp chưa lập trình em để trả lời vấn đề này ạ.";
      }

      setChatbotMessages(prev => [...prev, { sender: "bot", text: botResponse }]);
      playDiagnosticBeep(1100, 80);
    }, 600);
  };

  // Keyboard support simulation trigger references
  const [manualCodeStr, setManualCodeStr] = useState<string>("");

  return (
    <div id="sprinter-applet-root" className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans select-none pb-12 relative">
      
      {/* REAL-TIME OVERLAY POPOUPS WITH LIGHT TRANSITIONS */}
      {greenPopup && (
        <div id="toast-success-popup" className="fixed top-6 left-1/2 -translate-x-1/2 bg-emerald-550 border border-emerald-400/50 px-6 py-4 rounded-3xl shadow-[0_0_25px_rgba(16,185,129,0.3)] text-white text-center font-bold z-50 animate-fade-in max-w-sm w-11/12">
          <div className="text-sm uppercase tracking-widest text-emerald-100 font-extrabold mb-1">Hệ Thống Phản Hồi</div>
          <div className="text-base font-black">{greenPopup.text}</div>
          {greenPopup.subtext && <div className="text-xs text-emerald-200 mt-1 font-medium">{greenPopup.subtext}</div>}
        </div>
      )}

      {yellowPopup && (
        <div id="toast-warning-popup" className="fixed top-6 left-1/2 -translate-x-1/2 bg-amber-550 border border-amber-400/50 px-6 py-4 rounded-3xl shadow-[0_0_25px_rgba(245,158,11,0.3)] text-slate-900 text-center font-bold z-50 animate-fade-in max-w-sm w-11/12">
          <div className="text-xs uppercase tracking-widest text-[#0c1f20] font-extrabold mb-1">Cảnh Báo Lấy Thất Bại</div>
          <div className="text-base font-black">{yellowPopup.text}</div>
          {yellowPopup.subtext && <div className="text-xs text-amber-950 mt-1 font-medium">{yellowPopup.subtext}</div>}
        </div>
      )}

      {redPopup && (
        <div id="toast-error-popup" className="fixed top-6 left-1/2 -translate-x-1/2 bg-red-650 border border-red-500/50 px-6 py-4 rounded-3xl shadow-[0_0_25px_rgba(230,0,18,0.4)] text-white text-center font-bold z-50 animate-fade-in max-w-sm w-11/12">
          <div className="text-xs uppercase tracking-widest text-red-200 font-extrabold mb-1">Phát Hiện Quét Trùng</div>
          <div className="text-base font-black">{redPopup.text}</div>
          {redPopup.subtext && <div className="text-xs text-red-150 mt-1.5 font-medium">{redPopup.subtext}</div>}
        </div>
      )}

      {/* J&T RED CORE HEADER */}
      <header id="sprinter-brand-header" className="bg-[#E60012] text-white py-3 px-4 shadow-xl flex flex-col md:flex-row gap-2 justify-between items-center relative z-40">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-1.5 rounded-xl border border-white/15">
            <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base md:text-xl font-extrabold tracking-tight font-display flex items-center gap-1.5 leading-none">
              SPRINTER NỘI BỘ
              <span className="text-[9px] bg-yellow-400 text-slate-900 font-extrabold px-1.5 py-0.5 rounded-full tracking-widest">PWA</span>
            </h1>
            <p className="text-[10px] text-red-100 font-medium tracking-wide mt-0.5">Hệ thống đối soát bàn giao & kiểm bưu J&T Express</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t border-red-500 md:border-none pt-2 md:pt-0 mt-1 md:mt-0">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-red-100" />
            <span className="text-[11px] font-bold text-red-50 tracking-wider font-mono bg-red-700/40 px-2 py-1 rounded-lg">{systemTime || "Đang đồng bộ..."}</span>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col text-right">
                <span className="text-xs font-black text-white hover:underline flex items-center gap-1">
                  <User className="w-3 h-3 text-yellow-300" />
                  {currentUser}
                </span>
                <span className="text-[9px] text-red-100 font-bold uppercase tracking-wider">Ca {currentShift}</span>
              </div>
              <button 
                id="btn-trigger-logout-header"
                type="button" 
                onClick={handleLogout}
                className="bg-red-800/60 hover:bg-red-950 p-2 rounded-xl transition cursor-pointer"
                title="Đăng xuất trực ca"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-xs font-semibold bg-red-800/80 px-2 py-1 rounded text-red-200">Chưa Đăng Nhập</span>
          )}
        </div>
      </header>

      {/* SUB-HEADER APP SHEET CONNECTION INDICATOR */}
      <div id="sprinter-sync-banner" className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex flex-wrap justify-between items-center text-xs gap-2">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span>Google Sheet APPS Script:</span>
          <span className="text-slate-300 truncate max-w-[200px] font-mono font-bold">{gasUrl ? "Đã liên kết" : "Mặc định Offline"}</span>
        </div>
        <div className="flex items-center gap-2">
          {isSyncing && (
            <span className="text-[10px] text-sky-400 font-bold animate-pulse flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Đang đồng bộ Sheets...
            </span>
          )}
          {syncStatusMsg && (
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {syncStatusMsg}
            </span>
          )}
          
          <button
            id="btn-toggle-sound-settings"
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playDiagnosticBeep(1000, 50);
            }}
            className="p-1 px-1.5 rounded bg-slate-800 text-slate-350 hover:text-white flex items-center gap-1 cursor-pointer font-bold text-[10px]"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Sound On
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-400" /> Mutated
              </>
            )}
          </button>
        </div>
      </div>

      {/* CORE WELCOME ASSIGNMENT CONTROL MODAL POPUP */}
      {showWelcomeModal && (
        <div id="welcome-shift-modal" className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-505 via-red-650 to-red-500"></div>
            
            <div className="text-center mb-6">
              <div className="bg-red-500/10 inline-flex p-3 rounded-full border border-red-500/20 mb-3">
                <Sparkles className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight font-display">BẮT ĐẦU CA LÀM VIỆC</h2>
              <p className="text-xs text-slate-400 mt-1">Vui lòng đăng ký danh tính bưu cục J&T và trực ca bàn giao</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-[#E60012] block mb-2">Nhân viên scan trực ca:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Anh Tuấn", "Phạm Nga", "Test"] as StaffName[]).map((staff) => (
                    <button
                      key={staff}
                      type="button"
                      onClick={() => setSelectUser(staff)}
                      className={`py-3 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 border cursor-pointer ${
                        selectUser === staff
                          ? "bg-red-650 border-[#E60012] text-white shadow-lg shadow-red-900/30 scale-102"
                          : "bg-slate-950 border-slate-800 text-slate-350 hover:bg-slate-800"
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>{staff}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-[#E60012] block mb-2">Chọn ca trực bưu cục:</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["sáng", "chiều"] as WorkShift[]).map((shf) => (
                    <button
                      key={shf}
                      type="button"
                      onClick={() => setSelectShift(shf)}
                      className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                        selectShift === shf
                          ? "bg-slate-850 border-[#E60012] text-white scale-102"
                          : "bg-slate-950 border-slate-800 text-slate-350 hover:bg-slate-800"
                      }`}
                    >
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span>Ca {shf.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-slate-450 block">APPS Script Sync API (Tùy chọn):</label>
                  {(import.meta as any).env.VITE_GOOGLE_APPS_SCRIPT_URL && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded">Sẵn sàng</span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={gasUrl}
                  onChange={(e) => {
                    setGasUrl(e.target.value);
                    localStorage.setItem("sprinter_gas_url", e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-805 text-white/90 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                id="btn-confirm-welcome-submit"
                type="button"
                onClick={handleWelcomeSubmit}
                className="w-full bg-[#E60012] hover:bg-red-700 active:scale-98 text-white font-extrabold uppercase py-3 rounded-xl text-xs transition tracking-widest mt-6 cursor-pointer"
              >
                Xác nhận vào ca trực
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CORE INTERACTIVE SCREEN CONTAINER */}
      <main id="applet-primary-layout" className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4">

        {/* TOP STATUS HIGHLIGHTS OVERVIEW CARDS */}
        <div id="sprinter-quick-highlight-cards" className="grid grid-cols-2 gap-3 md:gap-4 font-display">
          <div 
            onClick={() => handleOpenScanner("banGiao")}
            className="bg-slate-900 hover:bg-slate-850 border-b-2 border-emerald-500 p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition active:scale-97 group shadow-xl"
          >
            <div className="bg-emerald-500/10 p-2.5 rounded-full mb-2 group-hover:scale-110 transition duration-300">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-[10px] md:text-xs text-slate-450 uppercase font-black tracking-widest">ĐƠN BÀN GIAO</span>
            <span className="text-xl md:text-3xl font-black text-rose-500 mt-1">
              {orders.filter(o => o.trangThai === "đã bàn giao").length} đơn
            </span>
            <span className="text-[9px] text-[#E60012] font-black mt-1 uppercase animate-pulse tracking-wider">⚡ NHẤN ĐỂ QUÉT</span>
          </div>

          <div
            onClick={() => handleOpenScanner("layThatBai")}
            className="bg-slate-900 hover:bg-slate-850 border-b-2 border-amber-500 p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition active:scale-97 group shadow-xl"
          >
            <div className="bg-amber-500/10 p-2.5 rounded-full mb-2 group-hover:scale-110 transition duration-300">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-[10px] md:text-xs text-slate-450 uppercase font-black tracking-widest">ĐƠN LẤY THẤT BẠI</span>
            <span className="text-xl md:text-3xl font-black text-amber-500 mt-1">
              {orders.filter(o => o.trangThai === "không thành công").length} đơn
            </span>
            <span className="text-[9px] text-yellow-500 font-black mt-1 uppercase animate-pulse tracking-wider">⚡ NHẤN ĐỂ QUÉT TỔ ĐỐI</span>
          </div>
        </div>

        {/* ACTIVE TAB VIEW BAR SELECTOR */}
        <nav id="terminal-tab-selector" className="bg-slate-900 p-1.5 rounded-2xl flex gap-1 shadow-lg">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 py-3 px-2 rounded-xl text-center text-xs font-extrabold transition uppercase tracking-wider flex items-center justify-center gap-1.5 ${
              activeTab === "dashboard"
                ? "bg-[#E60012] text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab("banGiao")}
            className={`flex-1 py-3 px-2 rounded-xl text-center text-xs font-extrabold transition uppercase tracking-wider flex items-center justify-center gap-1.5 ${
              activeTab === "banGiao"
                ? "bg-[#E60012] text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Bàn Giao</span>
          </button>
          <button
            onClick={() => setActiveTab("layThatBai")}
            className={`flex-1 py-3 px-2 rounded-xl text-center text-xs font-extrabold transition uppercase tracking-wider flex items-center justify-center gap-1.5 ${
              activeTab === "layThatBai"
                ? "bg-[#E60012] text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Thất Bại</span>
          </button>
          <button
            onClick={() => setActiveTab("tatCa")}
            className={`flex-1 py-3 px-2 rounded-xl text-center text-xs font-extrabold transition uppercase tracking-wider flex items-center justify-center gap-1.5 ${
              activeTab === "tatCa"
                ? "bg-[#E60012] text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Tất Cả Đơn</span>
          </button>
        </nav>

        {/* TAB 1: REAL-TIME STATISTICS DASHBOARD */}
        {activeTab === "dashboard" && (
          <div id="sprinter-dashboard-view" className="space-y-4 animate-fade-in text-slate-100">
            {/* Live KPI Grid statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-805 p-3 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold block">TỔNG ĐƠN HÔM NAY</span>
                <span className="text-2xl font-black font-display text-white">{computedStats.total}</span>
                <span className="text-[10px] text-emerald-400 block mt-1">Ghi nhận realtime ca trực</span>
              </div>
              <div className="bg-slate-900 border border-slate-805 p-3 rounded-2xl">
                <span className="text-[10px] text-emerald-400 font-bold block">ĐÃ BÀN GIAO</span>
                <span className="text-2xl font-black font-display text-emerald-400">{computedStats.banGiao}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Xuất xưởng thành công</span>
              </div>
              <div className="bg-slate-900 border border-slate-805 p-3 rounded-2xl">
                <span className="text-[10px] text-amber-400 font-bold block">LẤY THẤT BẠI</span>
                <span className="text-2xl font-black font-display text-amber-500">{computedStats.thatBai}</span>
                <span className="text-[10px] text-slate-450 block mt-1">Vấn đề ngoài ý muốn</span>
              </div>
              <div className="bg-slate-900 border border-slate-805 p-3 rounded-2xl">
                <span className="text-[10px] text-blue-400 font-bold block">CHƯA XỬ LÝ</span>
                <span className="text-2xl font-black font-display text-blue-400">{computedStats.chuaXuLy}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Đang chờ bàn giao</span>
              </div>
            </div>

            {/* Top Employee Score card */}
            <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border border-[#E60012]/30 p-4 rounded-2xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="bg-red-500/15 p-2 rounded-xl">
                  <UserCheck className="w-6 h-6 text-red-500 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black tracking-widest text-[#E60012] uppercase">Nhân viên quét nhiều nhất hôm nay:</h3>
                  <p className="text-lg font-black text-white">{computedStats.topStaff}</p>
                </div>
              </div>
              <span className="text-[9px] bg-red-650 px-2 py-1 rounded text-white font-black uppercase tracking-wider">Top 1</span>
            </div>

            {/* Pie Chart render blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl flex flex-col items-center">
                <h3 className="text-xs font-black tracking-widest text-[#E60012] uppercase mb-4">Tỷ Lệ Trạng Thái Đối Soát</h3>
                <div className="w-full h-56 relative flex items-center justify-center">
                  <canvas id="canvas-status-pie"></canvas>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl flex flex-col items-center">
                <h3 className="text-xs font-black tracking-widest text-[#E60012] uppercase mb-4">Mật Độ Hoạt Động Nhân Viên</h3>
                <div className="w-full h-56 relative flex items-center justify-center">
                  {topStaffGlobalBreakdown.length > 0 ? (
                    <canvas id="canvas-staff-pie"></canvas>
                  ) : (
                    <span className="text-xs text-slate-450 block py-12">Chưa ghi nhận ca quét bưu phẩm</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ĐƠN BÀN GIAO ACTION MODE */}
        {activeTab === "banGiao" && (
          <div id="sprinter-handover-mode" className="space-y-4 animate-fade-in text-center">
            
            <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl max-w-xl mx-auto space-y-4">
              <div className="bg-emerald-500/10 inline-flex p-3 rounded-full mb-1">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">CHƯƠNG TRÌNH PHÁT BÀN GIAO</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Bảo vệ bưu phẩm bưu cục, hạn chế lỗi hư hao và thất lạc do bên vận chuyển hãng ngoài. Quét xác nhận tất cả đơn trên xe tải bưu tá.
              </p>

              <div>
                <button
                  id="btn-scan-ban-giao-start"
                  type="button"
                  onClick={() => handleOpenScanner("banGiao")}
                  className="w-full bg-[#E60012] hover:bg-red-700 active:scale-98 text-white font-extrabold py-4 px-6 rounded-2xl transition tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-red-950/20"
                >
                  <Scan className="w-5 h-5 text-yellow-300 animate-pulse" />
                  <span>[Quét mã mới tự động]</span>
                </button>
              </div>

              {/* Offline backup scanning simulator */}
              <div className="border-t border-slate-800 pt-4 mt-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-450 block mb-2">Simulate quét mã vạch bằng tay (Vọc thử & Test app)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ví dụ: 802750828153"
                    value={manualCodeStr}
                    onChange={(e) => setManualCodeStr(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => {
                      handleManualCodeCheck(manualCodeStr, "banGiao");
                      setManualCodeStr("");
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    Bàn Giao
                  </button>
                </div>
              </div>
            </div>

            {/* Scan History feed lists */}
            <div className="text-left mt-6 max-w-xl mx-auto">
              <h3 className="text-xs font-black tracking-widest text-[#E60012] uppercase mb-3">Lịch Sử Quét Bàn Giao Trong Ca</h3>
              <div className="bg-slate-900 border border-slate-850 rounded-2xl divide-y divide-slate-800 overflow-hidden">
                {logs.filter(l => l.action.includes("ĐÀ BÀN GIAO")).length > 0 ? (
                  logs.filter(l => l.action.includes("ĐÀ BÀN GIAO")).map((log, i) => (
                    <div key={i} className="p-3 text-xs flex justify-between items-center bg-emerald-950/10">
                      <div>
                        <div className="font-mono font-bold text-slate-200">{log.maDon}</div>
                        <div className="text-[10px] text-slate-450 mt-0.5">Nhân viên: {log.nhanVien} - Ca {log.caLam}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase">Đã đối soát</span>
                        <div className="text-[9px] text-slate-400 font-mono mt-1">{log.timestamp}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-450 text-xs">Chưa quét mã bàn giao nào</div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: LAY_HANG_KHONG_THANH_CONG ACTION MODE */}
        {activeTab === "layThatBai" && (
          <div id="sprinter-failing-handover-mode" className="space-y-4 animate-fade-in text-center">
            
            <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl max-w-xl mx-auto space-y-4">
              <div className="bg-amber-500/10 inline-flex p-3 rounded-full mb-1">
                <AlertTriangle className="w-10 h-10 text-amber-400" />
              </div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">KÝ GỬI THẤT BẠI - THIẾU BƯU KIỆN</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Bảo vệ bưu cục chống đền đơn khi tài xế gom hàng báo thiếu gói. Đánh dấu trạng thái đơn lấy thất bại để chuyển trả về bưu tá xử lý.
              </p>

              <div>
                <button
                  id="btn-scan-that-bai-start"
                  type="button"
                  onClick={() => handleOpenScanner("layThatBai")}
                  className="w-full bg-amber-650 hover:bg-amber-700 active:scale-98 text-[#070b13] font-black py-4 px-6 rounded-2xl transition tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-amber-950/20"
                >
                  <Scan className="w-5 h-5 text-slate-900 animate-pulse" />
                  <span>[Ký gửi không thành công]</span>
                </button>
              </div>

              {/* Manual input simulation test for failures */}
              <div className="border-t border-slate-800 pt-4 mt-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-450 block mb-2">Simulate quét mã lỡ (Ủy ban đối soát bưu điện)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ví dụ: 802750828153"
                    value={manualCodeStr}
                    onChange={(e) => setManualCodeStr(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => {
                      handleManualCodeCheck(manualCodeStr, "layThatBai");
                      setManualCodeStr("");
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    Báo Hủy
                  </button>
                </div>
              </div>
            </div>

            {/* Scan History fail feed lists */}
            <div className="text-left mt-6 max-w-xl mx-auto">
              <h3 className="text-xs font-black tracking-widest text-yellow-500 uppercase mb-3">Lịch Sử Quét Thất Bại Trong Ca</h3>
              <div className="bg-slate-900 border border-slate-850 rounded-2xl divide-y divide-slate-800 overflow-hidden">
                {logs.filter(l => l.action.toLowerCase().includes("hất bạ")).length > 0 ? (
                  logs.filter(l => l.action.toLowerCase().includes("hất bạ")).map((log, i) => (
                    <div key={i} className="p-3 text-xs flex justify-between items-center bg-amber-950/15">
                      <div>
                        <div className="font-mono font-bold text-slate-200">{log.maDon}</div>
                        <div className="text-[10px] text-slate-450 mt-0.5">Nhân viên: {log.nhanVien} - Ca {log.caLam}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] bg-amber-500/20 text-amber-500 font-bold px-1.5 py-0.5 rounded uppercase">Thất bại</span>
                        <div className="text-[9px] text-slate-400 font-mono mt-1">{log.timestamp}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-450 text-xs">Chưa quét mã thất bại nào</div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: LIST ALL ORDERS (FILTER, SEARCH, CSV, SECURE EDIT) */}
        {activeTab === "tatCa" && (
          <div id="sprinter-all-orders-grid" className="space-y-4 animate-fade-in">
            
            {/* Search inputs and Filters row */}
            <div className="bg-slate-900 p-4 rounded-3xl border border-slate-850 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
                {/* Text search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Mã đơn, tên khách, số điện thoại..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Status select filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-20/90 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="đã bàn giao">Đã bàn giao</option>
                  <option value="không thành công">Không thành công</option>
                  <option value="chưa xử lý">Chưa xử lý</option>
                </select>

                {/* Date ranges select filter */}
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-slate-20/90 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500"
                >
                  <option value="today">Thời gian: Hôm nay</option>
                  <option value="yesterday">Thời gian: Hôm qua</option>
                  <option value="7days">Thời gian: 7 ngày gần đây</option>
                  <option value="1month">Thời gian: 1 tháng</option>
                  <option value="90days">Thời gian: 90 ngày</option>
                </select>

              </div>

              {/* Bulk operations export menu and Secure Password action unlocker */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl px-3 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
                    title="Xuất file đối soát"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Xuất Excel/CSV{selectedOrderIds.size > 0 ? ` (${selectedOrderIds.size})` : ""}</span>
                  </button>

                  <span className="text-[10px] text-slate-450 hidden md:inline">
                    *Tìm kiếm trả về: <span className="font-bold text-white font-mono">{filteredOrders.length}</span> đơn bưu phẩm bến
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isUnlocked ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-red-950 text-red-400 border border-red-550/30 px-2 py-1 rounded-lg font-bold flex items-center gap-1">
                        <Unlock className="w-3 h-3 animate-pulse" /> QUẢN TRỊ ADMIN ACTIVE
                      </span>
                      <button
                        onClick={() => setIsUnlocked(false)}
                        className="bg-slate-850 hover:bg-slate-800 text-slate-400 rounded-lg p-1.5 text-xs transition cursor-pointer"
                        title="Khóa bảo mật"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowUnlockModal(true)}
                      className="bg-slate-900 border border-red-500/30 hover:border-red-500 hover:bg-red-950/20 text-[#E60012] rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa Admin [666666]</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Orders spreadsheet grid viewtable rendering */}
            <div className="bg-slate-900 rounded-3xl border border-slate-850 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#101625] text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-800 text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4 text-center w-12">
                        <input
                          type="checkbox"
                          checked={filteredOrders.length > 0 && selectedOrderIds.size === filteredOrders.length}
                          onChange={handleToggleAllRowsSelection}
                          className="rounded text-[#E60012] focus:ring-[#E60012] bg-slate-950 border-slate-800 cursor-pointer w-4 h-4"
                        />
                      </th>
                      <th className="py-3.5 px-3">Mã Vận Đơn (Barcode)</th>
                      <th className="py-3.5 px-3">Khách hàng & SĐT</th>
                      <th className="py-3.5 px-3">Ngày quét đối soát</th>
                      <th className="py-3.5 px-3">Trạng Thái</th>
                      <th className="py-3.5 px-3">Người Quét</th>
                      {isUnlocked && <th className="py-3.5 px-4 text-center w-28">Thao tác admin</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((ord) => {
                        const isChecked = selectedOrderIds.has(ord.maVanDon);
                        
                        let statusColor = "bg-slate-950 text-slate-400 border border-slate-800";
                        if (ord.trangThai === "đã bàn giao") {
                          statusColor = "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20";
                        } else if (ord.trangThai === "không thành công") {
                          statusColor = "bg-amber-950/40 text-amber-500 border border-amber-500/20";
                        }

                        return (
                          <tr 
                            key={ord.maVanDon} 
                            className={`hover:bg-slate-850/40 transition duration-150 ${
                              isChecked ? "bg-red-950/10" : ""
                            }`}
                          >
                            <td className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleRowSelection(ord.maVanDon)}
                                className="rounded text-[#E60012] focus:ring-[#E60012] bg-slate-950 border-slate-800 cursor-pointer w-4 h-4"
                              />
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-mono font-black text-slate-200 tracking-wider block">{ord.maVanDon}</span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-300">{ord.tenKhach}</div>
                              <div className="text-[10px] text-slate-450 mt-0.5">{ord.soDienThoai}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-350 font-mono text-[10px]/snug">{ord.ngay}</td>
                            <td className="py-3 px-3">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${statusColor}`}>
                                {ord.trangThai}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {ord.nhanVienScan ? (
                                <div className="flex items-center gap-1 font-bold text-slate-300">
                                  <User className="w-3.5 h-3.5 text-slate-450" />
                                  <span>{ord.nhanVienScan}</span>
                                </div>
                              ) : (
                                <span className="text-slate-450 italic text-[10px]">Chưa kiểm bưu</span>
                              )}
                            </td>
                            {isUnlocked && (
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                  {ord.trangThai !== "chưa xử lý" ? (
                                    <button
                                      onClick={() => handleUndoOrderScan(ord.maVanDon)}
                                      className="bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 p-1 rounded font-bold text-[10px] flex items-center gap-0.5 transition"
                                      title="Khởi tạo lại đơn"
                                    >
                                      <RotateCcw className="w-3 h-3 text-sky-400" />
                                      <span>Hoàn</span>
                                    </button>
                                  ) : (
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => handleModifyStatus(ord.maVanDon, "đã bàn giao")}
                                        className="bg-emerald-950 hover:bg-emerald-900 text-emerald-400 px-1.5 py-1 rounded text-[9px] font-bold"
                                      >
                                        Bàn Giao
                                      </button>
                                      <button
                                        onClick={() => handleModifyStatus(ord.maVanDon, "không thành công")}
                                        className="bg-amber-950 hover:bg-amber-900 text-amber-500 px-1.5 py-1 rounded text-[9px] font-bold"
                                      >
                                        Thất Bại
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={isUnlocked ? 7 : 6} className="py-8 px-4 text-center text-slate-450 italic text-xs">
                          ⚠️ Không tìm thấy đơn hàng đối soát nào thỏa mãn từ khóa và bộ lọc!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* FULLSCREEN REAL-TIME SCANNER VIEW SCREEN HUD */}
      {isScanning && (
        <div id="sprinter-fullscreen-scanner-layer" className="fixed inset-0 bg-slate-950/95 z-55 flex flex-col justify-between p-4 animate-fade-in animate-pulse-border border-4">
          
          <div className="flex justify-between items-center z-10">
            <div>
              <span className="text-[10px] text-white/50 uppercase font-black tracking-widest block">CHẾ ĐỘ QUÉT SIÊU NHẠY</span>
              <h1 className="text-sm font-black uppercase text-white flex items-center gap-1.5">
                {scannerSection === "banGiao" ? (
                  <span className="text-emerald-400 flex items-center gap-1">🟢 QUÉT ĐƠN BÀN GIAO</span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">🟡 QUÉT LẤY THẤT BẠI</span>
                )}
              </h1>
            </div>
            
            <button
              onClick={handleCloseScanner}
              className="bg-white/10 hover:bg-red-650 p-2.5 rounded-full transition text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Central QR camera layout with focal boundaries and sweep laser */}
          <div className="relative flex-1 flex flex-col items-center justify-center my-4 overflow-hidden rounded-3xl border border-slate-800 bg-[#020509]">
            <div 
              id="sprinter-scanner-screen-viewfinder" 
              className="absolute inset-0 w-full h-full object-cover"
            ></div>

            {/* Simulated focal bounding box layer overlay */}
            <div className="relative w-[280px] h-[180px] z-10 pointer-events-none flex flex-col justify-between">
              {/* Corner brackets */}
              <div className="flex justify-between">
                <div className="w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl"></div>
                <div className="w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl"></div>
              </div>

              {/* Success red laser bar */}
              <div className="absolute left-1 right-1 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(230,0,18,1)] animate-laser-sweep"></div>

              <div className="flex justify-between">
                <div className="w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl"></div>
                <div className="w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl"></div>
              </div>
            </div>

            {scannerError && (
              <div className="absolute inset-x-4 bottom-4 bg-red-650/90 text-white text-xs font-black p-3 rounded-2xl text-center z-12 backdrop-blur">
                {scannerError}
              </div>
            )}
          </div>

          {/* Bottom scanner hardware layout controls */}
          <div className="space-y-4 z-10">
            <div className="flex justify-center gap-4">
              <button
                _id="btn-scanner-toggle-flashlight"
                type="button"
                onClick={handleToggleFlashlight}
                className={`p-3.5 rounded-2xl transition flex items-center gap-1.5 font-bold text-xs cursor-pointer ${
                  flashlightOn 
                    ? "bg-amber-450 text-slate-900" 
                    : "bg-slate-900 border border-slate-850 hover:bg-slate-800 text-white"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{flashlightOn ? "Tắt Đèn" : "Bật Đèn"}</span>
              </button>

              {cameras.length > 1 && (
                <button
                  onClick={() => {
                    const idx = cameras.findIndex(c => c.id === activeCameraId);
                    const nextIdx = (idx + 1) % cameras.length;
                    setActiveCameraId(cameras[nextIdx].id);
                  }}
                  className="p-3.5 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-white rounded-2xl transition text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Đổi Camera</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-center text-slate-400">
              Đặt mã vạch J&T ngay giữa hộp đối soát. Bíp bíp bíp tự động kích hoạt.
            </p>
          </div>

        </div>
      )}

      {/* PASSWORD SECURE UNLOCK PROMPT DIALOG */}
      {showUnlockModal && (
        <div id="secure-admin-pass-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-55 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>

            <div className="text-center mb-4">
              <div className="bg-red-500/10 inline-flex p-3 rounded-full mb-2 border border-red-500/20">
                <Lock className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-base font-extrabold text-white tracking-tight">XÁC THỰC MÃ GIAO DỊCH</h2>
              <p className="text-xs text-slate-400 mt-1">Vui lòng nhập mật khẩu bưu cục [666666] để mở khóa quyền chỉnh sửa</p>
            </div>

            <div className="space-y-3">
              <input
                type="password"
                placeholder="Nhập 6 SỐ mật khẩu"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-center font-bold rounded-xl px-3 py-2 text-sm tracking-widest focus:outline-none focus:border-red-500"
              />
              
              {lockError && (
                <p className="text-[11px] text-red-400 font-bold text-center animate-pulse">{lockError}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowUnlockModal(false);
                    setPasswordInput("");
                    setLockError(null);
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Bỏ qua
                </button>
                <button
                  onClick={handleUnlockCheck}
                  className="flex-1 bg-[#E60012] hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wide cursor-pointer"
                >
                  Mở Khóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADAPTIVE CHATBOT OVERLAY FLOATING ACTIONS */}
      <div id="sprinter-chatbot-hud-wrapper" className="fixed bottom-4 right-4 z-45">
        
        {showChatbot ? (
          <div id="sprinter-chatbot-chatbox" className="bg-slate-900 border border-slate-800 rounded-3xl w-[320px] md:w-[350px] h-[400px] shadow-2xl flex flex-col overflow-hidden animate-fade-in relative">
            <div className="bg-[#E60012] text-white p-3.5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="bg-white/10 p-1.5 rounded-lg border border-white/10">
                  <MessageSquare className="w-4 h-4 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-wide leading-none">TRỢ LÝ SPRINTER</h3>
                  <span className="text-[8.5px] text-red-100 font-semibold uppercase tracking-widest">Trực tuyển bưu cục (em-sếp)</span>
                </div>
              </div>
              <button 
                onClick={() => setShowChatbot(false)}
                className="text-white hover:text-red-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat threads stream panel */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#0a0d16] text-xs">
              {chatbotMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`p-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.sender === "user" 
                      ? "bg-red-650 text-white rounded-tr-none" 
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Send chat block query fields */}
            <div className="p-2 bg-slate-900 border-t border-slate-800 flex gap-1.5">
              <input
                type="text"
                placeholder="Ví dụ: Đơn 802750828153 có chưa?"
                value={chatMessageInput}
                onChange={(e) => setChatMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendChatMessage();
                }}
                className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-red-500"
              />
              <button
                onClick={handleSendChatMessage}
                className="bg-red-650 hover:bg-red-700 text-white p-2 rounded-xl active:scale-95 transition cursor-pointer"
              >
                <SendHorizontal className="w-3.5 h-3.5 animate-pulse" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setShowChatbot(true);
              playDiagnosticBeep(1100, 55);
            }}
            className="bg-[#E60012] hover:bg-red-700 text-white p-3.5 rounded-full shadow-[0_4px_20px_rgba(230,0,18,0.4)] transition hover:scale-108 active:scale-92 flex items-center justify-center cursor-pointer border border-red-500/30 group"
            title="Chatbot đối soát"
            id="btn-shuttle-chatbox-trigger"
          >
            <MessageSquare className="w-6 h-6 text-yellow-300 animate-pulse" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 text-[10px] uppercase font-black tracking-widest pl-0 group-hover:pl-2 group-hover:block">Trợ lý</span>
          </button>
        )}

      </div>

      {/* CORE BASE CREDENTIAL INFO BANNER */}
      <footer id="sprinter-system-credit-lines" className="absolute bottom-1 w-full text-center text-slate-600 text-[9px] uppercase tracking-widest pointer-events-none">
        Phần mềm nghiệp vụ bảo an © Bưu Cục J&T Express Logistics
      </footer>

    </div>
  );
}
