import { useEffect } from 'react';
import { CATEGORY_LABELS, VENDOR_CATEGORY_CONFIG, getBusinessType } from '../../utils/constants';

/**
 * StudentPreviewModal — Shared Indigo & Blue "Student App View" modal wrapper.
 * Wraps any business-specific offerings preview (`children`) with a live header card,
 * Call/WhatsApp/Directions action buttons, and active owner notice banner.
 */
export default function StudentPreviewModal({
  open,
  onClose,
  business,
  badges = [],
  facilities = [],
  activeNotice = null,
  children,
}) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !business) return null;

  const businessType = getBusinessType(business);
  const categoryCfg = VENDOR_CATEGORY_CONFIG[business.category] || { icon: '🏪' };
  const categoryLabel = CATEGORY_LABELS[business.category] || businessType;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Student App Preview"
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Indigo & Blue Student App Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              Student App View
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold mt-1">
              How Students See Your Listing
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close student preview"
            className="w-11 h-11 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-lg flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Preview Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50">
          {/* Shop Overview Card */}
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-3xl shrink-0">
                {categoryCfg.icon}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold">
                    {categoryLabel}
                  </span>
                  {business.verificationStatus === 'VERIFIED' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">{business.name}</h3>
                <p className="text-sm text-slate-600">📍 {business.address}</p>
              </div>
            </div>

            {business.description && (
              <p className="text-xs sm:text-sm text-slate-600">{business.description}</p>
            )}

            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="px-3 py-1 rounded-xl bg-blue-50 text-blue-800 text-xs font-bold"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {/* Student Action Preview Buttons */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="min-h-[46px] rounded-xl bg-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5">
                📞 Call
              </div>
              <div className="min-h-[46px] rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5">
                💬 WhatsApp
              </div>
              <div className="min-h-[46px] rounded-xl bg-blue-50 text-blue-800 border border-blue-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5">
                🗺️ Directions
              </div>
            </div>

            {facilities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {facilities.map((fac) => (
                  <span
                    key={fac}
                    className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold"
                  >
                    ✓ {fac}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Active Notice Card */}
          {activeNotice && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800">
                📢 Owner Notice
              </span>
              <p className="text-sm font-bold text-slate-900">
                {activeNotice.title || activeNotice.text}
              </p>
              {activeNotice.content && activeNotice.content !== activeNotice.title && (
                <p className="text-xs text-slate-700">{activeNotice.content}</p>
              )}
            </div>
          )}

          {/* Category-specific Preview Content */}
          {children}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Changes you save appear on the student app right away.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm cursor-pointer transition"
          >
            Back to Owner Portal
          </button>
        </div>
      </div>
    </div>
  );
}
