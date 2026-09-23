import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled || dismissed) return null;

  return (
    <>
      <div className="mx-4 mb-3 p-3.5 bg-gradient-to-r from-teal-700 to-emerald-700 text-white rounded-2xl shadow-md flex items-center justify-between gap-3 border border-teal-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-teal-100" />
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
              Cài app lên Android
              <span className="text-[10px] uppercase font-bold bg-teal-400 text-teal-950 px-1.5 py-0.5 rounded-full">APK/PWA</span>
            </h4>
            <p className="text-xs text-teal-100/90 leading-tight mt-0.5">
              Dùng mượt mà không cần mở trình duyệt, ghi chép offline!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isInstallable ? (
            <button
              onClick={install}
              className="px-3.5 py-1.5 bg-white text-teal-800 text-xs font-bold rounded-xl shadow hover:bg-teal-50 active:scale-95 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Cài đặt
            </button>
          ) : isIOS ? (
            <button
              onClick={() => setShowIOSModal(true)}
              className="px-3 py-1.5 bg-white/20 text-white text-xs font-semibold rounded-xl hover:bg-white/30 active:scale-95 transition"
            >
              Hướng dẫn
            </button>
          ) : (
            <button
              onClick={() => alert('Trên Android Chrome: Nhấn dấu 3 chấm ⋮ ở góc trên bên phải > Chọn "Cài đặt ứng dụng" hoặc "Thêm vào Màn hình chính"')}
              className="px-3 py-1.5 bg-white text-teal-800 text-xs font-bold rounded-xl shadow hover:bg-teal-50 active:scale-95 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Cài đặt
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-teal-200 hover:text-white rounded-lg hover:bg-white/10"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-teal-600" />
                Cài đặt vào màn hình chính
              </h3>
              <button onClick={() => setShowIOSModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                <span>Nhấn biểu tượng <strong>Chia sẻ</strong> (Share) trên thanh trình duyệt.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                <span>Cuộn xuống và chọn <strong>"Thêm vào Màn hình chính"</strong> (Add to Home Screen).</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                <span>Nhấn <strong>Thêm</strong> ở góc trên bên phải để hoàn tất!</span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 active:scale-98 transition"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
