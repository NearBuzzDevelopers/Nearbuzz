import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { DAY_NAMES } from '../../utils/constants';

/**
 * Display Monday–Sunday cleanly while preserving backend dayOfWeek indices (0=Sun .. 6=Sat).
 */
const ORDERED_DAY_INDICES = [1, 2, 3, 4, 5, 6, 0];

function buildDefaultSchedule() {
  return DAY_NAMES.map((_, dayOfWeek) => ({
    dayOfWeek,
    opensAt: '08:00',
    closesAt: '21:00',
    isClosed: dayOfWeek === 0,
  }));
}

/**
 * WeeklyOpeningHoursEditor — Shared Emerald Green weekly schedule editor.
 * Includes the 1-tap "Copy Monday to All Days" shortcut for non-tech shopkeepers
 * and saves directly to PUT /api/v1/businesses/{businessId}/hours.
 */
export default function WeeklyOpeningHoursEditor({
  businessId,
  initialSchedule = null,
  onSaved,
}) {
  const [schedule, setSchedule] = useState(() => initialSchedule || buildDefaultSchedule());
  const [loading, setLoading] = useState(!initialSchedule);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const loadHours = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const res = await api.get(`/businesses/${businessId}/hours`);
      if (res.data?.schedule?.length > 0) {
        const byDay = Object.fromEntries(res.data.schedule.map((d) => [d.dayOfWeek, d]));
        setSchedule(
          DAY_NAMES.map((_, idx) => {
            const found = byDay[idx];
            if (!found) {
              return { dayOfWeek: idx, opensAt: '08:00', closesAt: '21:00', isClosed: true };
            }
            return {
              dayOfWeek: idx,
              opensAt: found.opensAt ? found.opensAt.slice(0, 5) : '08:00',
              closesAt: found.closesAt ? found.closesAt.slice(0, 5) : '21:00',
              isClosed: found.isClosed,
            };
          })
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load opening hours.');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (!initialSchedule && businessId) {
      loadHours();
    }
  }, [initialSchedule, businessId, loadHours]);

  function toggleDayOpen(dayIndex) {
    setFeedback('');
    setSchedule((prev) =>
      prev.map((entry) =>
        entry.dayOfWeek === dayIndex ? { ...entry, isClosed: !entry.isClosed } : entry
      )
    );
  }

  function updateDayTime(dayIndex, field, value) {
    setFeedback('');
    setSchedule((prev) =>
      prev.map((entry) =>
        entry.dayOfWeek === dayIndex ? { ...entry, [field]: value } : entry
      )
    );
  }

  function handleCopyMondayToAll() {
    const monday = schedule.find((d) => d.dayOfWeek === 1) || {
      opensAt: '08:00',
      closesAt: '21:00',
      isClosed: false,
    };
    setSchedule((prev) =>
      prev.map((entry) => ({
        ...entry,
        opensAt: monday.opensAt,
        closesAt: monday.closesAt,
        isClosed: monday.isClosed,
      }))
    );
    setError('');
    setFeedback('Copied Monday hours to all 7 days! Tap "Save Weekly Hours" below to publish.');
  }

  async function handleSaveHours(e) {
    e.preventDefault();
    if (!businessId) return;
    setSaving(true);
    setError('');
    setFeedback('');
    try {
      const payload = schedule.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        opensAt: d.isClosed ? null : `${d.opensAt}:00`,
        closesAt: d.isClosed ? null : `${d.closesAt}:00`,
        isClosed: d.isClosed,
      }));
      const res = await api.put(`/businesses/${businessId}/hours`, { schedule: payload });
      setFeedback('Weekly opening hours saved!');
      if (onSaved) onSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save opening hours.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="h-64 rounded-2xl bg-white border border-emerald-100 animate-pulse" />;
  }

  return (
    <form
      onSubmit={handleSaveHours}
      className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 sm:p-6 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A]">
            🕒 Weekly Opening Hours
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Set when your shop is open so students know before walking over.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyMondayToAll}
          className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#ECFDF5] hover:bg-emerald-100 text-[#047857] border border-emerald-200 font-bold text-sm cursor-pointer transition shrink-0"
        >
          📋 Copy Monday to All Days
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-emerald-200 text-sm font-bold text-[#047857]">
          ✅ {feedback}
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm font-semibold text-red-700">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-2.5">
        {ORDERED_DAY_INDICES.map((dayIdx) => {
          const entry = schedule.find((d) => d.dayOfWeek === dayIdx);
          if (!entry) return null;
          const isOpen = !entry.isClosed;

          return (
            <div
              key={dayIdx}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                isOpen ? 'border-emerald-100 bg-white' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between sm:justify-start gap-4 min-w-[200px]">
                <span className="font-extrabold text-base text-[#0F172A] w-28">
                  {DAY_NAMES[dayIdx]}
                </span>
                <button
                  type="button"
                  onClick={() => toggleDayOpen(dayIdx)}
                  className={`min-h-[40px] px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm cursor-pointer transition ${
                    isOpen
                      ? 'bg-[#059669] text-white shadow-2xs'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {isOpen ? '✓ Open' : 'Closed'}
                </button>
              </div>

              {isOpen ? (
                <div className="flex items-center gap-2.5 flex-wrap">
                  <input
                    type="time"
                    value={entry.opensAt}
                    onChange={(e) => updateDayTime(dayIdx, 'opensAt', e.target.value)}
                    aria-label={`${DAY_NAMES[dayIdx]} opening time`}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 border-2 border-slate-200 font-bold text-sm text-[#0F172A] focus:outline-none focus:border-[#059669]"
                  />
                  <span className="text-sm font-bold text-slate-400">to</span>
                  <input
                    type="time"
                    value={entry.closesAt}
                    onChange={(e) => updateDayTime(dayIdx, 'closesAt', e.target.value)}
                    aria-label={`${DAY_NAMES[dayIdx]} closing time`}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 border-2 border-slate-200 font-bold text-sm text-[#0F172A] focus:outline-none focus:border-[#059669]"
                  />
                </div>
              ) : (
                <span className="text-sm font-semibold text-slate-400">
                  Shop closed on {DAY_NAMES[dayIdx]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full sm:w-auto min-h-[52px] px-7 py-3 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-base shadow-sm cursor-pointer disabled:opacity-50 transition"
      >
        {saving ? 'Saving Hours...' : '✓ Save Weekly Opening Hours'}
      </button>
    </form>
  );
}
