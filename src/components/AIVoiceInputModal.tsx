import React, { useState, useEffect } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { parseTextWithAI, ParsedTextResult } from '../services/aiService';
import { triggerHaptic } from '../utils/formatters';

interface AIVoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIVoiceInputModal: React.FC<AIVoiceInputModalProps> = ({ isOpen, onClose }) => {
  const { categories, wallets, addTransaction, formatMoney } = useExpense();

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedTextResult | null>(null);

  // Web Speech recognition ref
  const [speechSupported, setSpeechSupported] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const recognitionRef = React.useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  if (!isOpen) return null;

  const requestMicPermission = async () => {
    try {
      if (Boolean(navigator?.mediaDevices?.getUserMedia)) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release tracks immediately
        stream.getTracks().forEach(track => track.stop());
        setPermissionDenied(false);
        setError(null);
        return true;
      }
    } catch (err: any) {
      console.warn('Microphone permission request error:', err);
      setPermissionDenied(true);
      setError('Trình duyệt chưa cho phép truy cập Micro. Hãy chạm vào biểu tượng ổ khóa/cài đặt cạnh thanh địa chỉ (URL) và Cho phép (Allow) Micro, sau đó thử lại.');
      return false;
    }
    return false;
  };

  const toggleSpeech = async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Trình duyệt này chưa hỗ trợ nhận diện giọng nói Web Speech API. Bạn có thể gõ trực tiếp nội dung hoặc bấm các mẫu câu gợi ý phía dưới.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    // Attempt to prompt/test mic access via getUserMedia first to trigger browser prompt cleanly
    if (Boolean(navigator?.mediaDevices?.getUserMedia) && permissionDenied) {
      const ok = await requestMicPermission();
      if (!ok) return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'vi-VN';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setPermissionDenied(false);
        triggerHaptic('medium');
        setError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setPermissionDenied(true);
          setError('Micro bị chặn (not-allowed). Hãy bấm "Cấp quyền Micro" bên dưới hoặc mở ứng dụng trong tab mới để trình duyệt hỏi quyền micro.');
        } else if (event.error === 'no-speech') {
          setError('Chưa nghe thấy giọng nói. Vui lòng nói to và rõ hơn.');
        } else if (event.error === 'audio-capture') {
          setError('Không tìm thấy thiết bị thu âm/micro trên máy.');
        } else {
          setError(`Lỗi nhận diện âm thanh (${event.error}). Bạn có thể nhập tay nội dung.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        triggerHaptic('light');
      };

      recognition.start();
    } catch (e: any) {
      console.error('Recognition start exception:', e);
      setIsListening(false);
      if (e?.name === 'NotAllowedError') {
        setPermissionDenied(true);
        setError('Quyền truy cập micro đã bị từ chối.');
      } else {
        setError('Không thể khởi động micro. Bạn hãy gõ nội dung hoặc dùng các gợi ý nhanh.');
      }
    }
  };

  const handleParse = async (textToParse = inputText) => {
    if (!textToParse.trim()) {
      setError('Vui lòng nói hoặc nhập nội dung giao dịch!');
      return;
    }

    setIsProcessing(true);
    setError(null);
    triggerHaptic('light');

    try {
      const result = await parseTextWithAI(textToParse, categories, wallets);
      setParsedResult(result);
      triggerHaptic('success');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Không thể bóc tách câu nói. Vui lòng thử lại.');
      triggerHaptic('warning');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAdd = () => {
    if (!parsedResult) return;

    const matchedCat = categories.find(c => c.id === parsedResult.categoryId) || categories[0];
    const matchedWallet = wallets.find(w => w.id === parsedResult.walletId) || wallets[0];

    addTransaction({
      type: parsedResult.type === 'transfer' ? 'expense' : parsedResult.type,
      amount: parsedResult.amount,
      categoryId: matchedCat.id,
      walletId: matchedWallet.id,
      date: parsedResult.date || new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      note: parsedResult.note || inputText,
    });

    triggerHaptic('success');
    onClose();
  };

  const samplePrompts = [
    'Ăn sáng bún bò 45k ví tiền mặt',
    'Đổ xăng xe máy 70 nghìn ví Momo',
    'Nhận lương tháng 18 triệu vào MB Bank',
    'Đi chợ mua rau thịt 120k tiền mặt',
    'Uống cà phê với bạn 35k',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                Nhập Bằng Giọng Nói AI
                <span className="text-[9px] font-semibold bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30">
                  Smart Voice
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">Nói hoặc nhập tự nhiên, AI tự điền đầy đủ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Voice Mic Button */}
          <div className="flex flex-col items-center justify-center py-2">
            <button
              onClick={toggleSpeech}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 active:scale-95 ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-300'
                  : 'bg-gradient-to-tr from-purple-600 to-indigo-500 text-white hover:opacity-95 ring-4 ring-purple-100'
              }`}
              title={isListening ? 'Nhấn để dừng nghe' : 'Nhấn để nói'}
            >
              {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>
            <span className="text-xs font-semibold mt-2.5 text-slate-700">
              {isListening ? 'Đang lắng nghe... hãy nói tự nhiên' : 'Chạm vào micro để nói'}
            </span>
          </div>

          {/* Text Input area */}
          <div className="space-y-1.5">
            <div className="relative">
              <textarea
                rows={3}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Ví dụ: 'Ăn trưa cơm tấm 35k tiền mặt' hoặc 'Đổ xăng 70k Momo'..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-purple-500 resize-none leading-relaxed"
              />
              {inputText && (
                <button
                  onClick={() => setInputText('')}
                  className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => handleParse()}
              disabled={isProcessing || !inputText.trim()}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>AI đang phân tích câu nói...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Phân tích & Tự động điền</span>
                </>
              )}
            </button>
          </div>

          {/* Quick sample chips */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Gợi ý mẫu:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(p);
                    handleParse(p);
                  }}
                  className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 rounded-lg transition border border-slate-200/80 active:scale-95 text-left"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message with action to grant permission */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl space-y-2 text-rose-700 dark:text-rose-300 text-xs">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <div className="flex-1 leading-relaxed">{error}</div>
              </div>
              {permissionDenied && (
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      triggerHaptic('light');
                      const ok = await requestMicPermission();
                      if (ok) {
                        toggleSpeech();
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 active:scale-95"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    Thử lại cấp quyền Micro
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setError(null);
                    }}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50 transition"
                  >
                    Bỏ qua
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Parsed Result Preview */}
          {parsedResult && !isProcessing && (
            <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between pb-1.5 border-b border-purple-200/60">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Kết quả nhận diện
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white text-purple-700 border border-purple-200">
                  {parsedResult.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Số tiền:</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {formatMoney(parsedResult.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Ngày:</span>
                  <span className="font-semibold text-slate-800">{parsedResult.date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Danh mục:</span>
                  <span className="font-semibold text-slate-800">
                    {categories.find(c => c.id === parsedResult.categoryId)?.name || 'Khác'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Ví:</span>
                  <span className="font-semibold text-slate-800">
                    {wallets.find(w => w.id === parsedResult.walletId)?.name || wallets[0]?.name}
                  </span>
                </div>
              </div>

              <div className="text-xs pt-1 border-t border-purple-100">
                <span className="text-[10px] text-slate-500 block">Ghi chú:</span>
                <span className="font-medium text-slate-800">{parsedResult.note}</span>
              </div>

              <button
                onClick={handleConfirmAdd}
                className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận & Thêm giao dịch</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
