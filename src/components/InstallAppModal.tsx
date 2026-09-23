import React, { useState, useEffect } from 'react';
import { X, Smartphone, Download, Share2, CheckCircle2, ArrowRight, ExternalLink, QrCode, Copy, Check } from 'lucide-react';
import { triggerHaptic } from '../utils/formatters';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk'>('pwa');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleInstallClick = async () => {
    triggerHaptic('medium');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Fallback instruction
      triggerHaptic('light');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    triggerHaptic('light');
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800/60">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                Cài đặt lên điện thoại Android
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sử dụng như ứng dụng gốc, mượt mà & offline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: PWA vs APK */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('pwa');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'pwa'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Cài đặt trực tiếp (PWA)
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('apk');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'apk'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Xuất file APK (.apk)
          </button>
        </div>

        {activeTab === 'pwa' ? (
          <>
            {/* Status or Direct Install CTA */}
            {deferredPrompt ? (
              <div className="p-4 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-2xl text-white shadow-md space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Download className="w-4 h-4 animate-bounce" />
                  Sẵn sàng cài đặt 1-chạm
                </div>
                <p className="text-xs text-teal-50 leading-relaxed">
                  Trình duyệt của bạn hỗ trợ cài đặt trực tiếp. Nhấn nút bên dưới để thêm ứng dụng vào màn hình chính Android.
                </p>
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3 bg-white text-teal-800 font-extrabold text-sm rounded-xl hover:bg-teal-50 active:scale-98 transition shadow-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Cài đặt ứng dụng ngay
                </button>
              </div>
            ) : isInstalled ? (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                  Ứng dụng đã được cài đặt ở chế độ Độc lập (Standalone) trên thiết bị của bạn!
                </div>
              </div>
            ) : null}

            {/* Step by step instructions for Android */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Các bước cài đặt trên Android (Chrome / Cốc Cốc / Edge)
              </h4>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                {/* Step 1 */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      Mở link ứng dụng trên trình duyệt Chrome trên điện thoại
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Truy cập đường dẫn ứng dụng này trên điện thoại Android của bạn.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      Nhấn vào biểu tượng Menu 3 chấm (⋮) ở góc trên bên phải
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Menu tùy chọn của trình duyệt Chrome hoặc Samsung Internet.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      Chọn &quot;Cài đặt ứng dụng&quot; hoặc &quot;Thêm vào Màn hình chính&quot;
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      (Install app / Add to Home screen). Biểu tượng ứng dụng &quot;Chi Tiêu&quot; sẽ xuất hiện ngoài màn hình chủ điện thoại.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features highlight */}
            <div className="p-3 bg-teal-50/70 dark:bg-teal-950/30 rounded-2xl border border-teal-100 dark:border-teal-900/40 text-[11px] text-teal-800 dark:text-teal-200 space-y-1">
              <p className="font-bold flex items-center gap-1">
                ✨ Ưu điểm vượt trội của PWA so với APK:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-teal-700 dark:text-teal-300">
                <li>Tự động cập nhật tính năng mới nhất mà không cần cài đè file APK.</li>
                <li>Trải nghiệm toàn màn hình như ứng dụng Play Store bản địa.</li>
                <li>Hoạt động ngoại tuyến (Offline) và tự động đồng bộ đám mây Firestore.</li>
                <li>Siêu nhẹ (&lt; 2MB) và an toàn tuyệt đối.</li>
              </ul>
            </div>
          </>
        ) : (
          /* Tab: APK Packaging Guide */
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl space-y-2">
              <h4 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Cách tạo file APK Android miễn phí trong 1 phút
              </h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                Vì đây là ứng dụng Web / PWA, bạn có thể chuyển đổi thành file <strong>.apk</strong> cài đặt trên Android bằng công cụ đóng gói chính thức miễn phí của Microsoft (PWABuilder) hoặc WebIntoApp.
              </p>
            </div>

            <div className="space-y-3">
              <h5 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                3 bước tạo file APK:
              </h5>

              {/* Step 1 */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <div className="space-y-1.5 flex-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    Sao chép đường link ứng dụng
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        Đã sao chép link thành công!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Sao chép link ứng dụng ({currentUrl.substring(0, 28)}...)
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <div className="space-y-1.5 flex-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    Mở trang tạo APK tự động
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Dán link vừa sao chép vào trang PWABuilder (của Microsoft) hoặc WebIntoApp:
                  </p>
                  <a
                    href="https://www.pwabuilder.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 py-2 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl font-bold transition text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                    Mở trang PWABuilder.com
                  </a>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    Nhấn &quot;Package for Android&quot; &amp; Tải file APK về máy
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Hệ thống sẽ tự động đóng gói icon, manifest và tạo file APK để bạn cài trực tiếp vào điện thoại Android.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Copy App Link */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Liên kết ứng dụng của bạn
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 px-3 py-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 outline-none truncate select-all"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  Đã chép
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Chép link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Features highlight */}
        <div className="p-3 bg-teal-50/70 dark:bg-teal-950/30 rounded-2xl border border-teal-100 dark:border-teal-900/40 text-[11px] text-teal-800 dark:text-teal-200 space-y-1">
          <p className="font-bold flex items-center gap-1">
            ✨ Ưu điểm khi cài đặt vào điện thoại Android:
          </p>
          <ul className="list-disc pl-4 space-y-0.5 text-teal-700 dark:text-teal-300">
            <li>Mở nhanh với biểu tượng riêng ngoài màn hình chính.</li>
            <li>Trải nghiệm toàn màn hình như ứng dụng Play Store bản địa.</li>
            <li>Hoạt động ngoại tuyến (Offline) và tự động đồng bộ khi có mạng.</li>
            <li>Không tốn dung lượng bộ nhớ máy (siêu nhẹ &lt; 2MB).</li>
          </ul>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
};
