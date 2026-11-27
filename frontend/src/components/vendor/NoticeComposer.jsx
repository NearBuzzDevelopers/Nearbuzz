import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../api/axios';
import { UPDATE_TYPE_LABELS, formatTimeAgo } from '../../utils/constants';

const DEFAULT_NOTICE_TEMPLATES = [
  'Open today — walk in anytime or WhatsApp us!',
  'Special discount for college students this week',
  'Updated today’s availability — check prices now',
];

const EXPIRY_OPTIONS = [
  { value: '12', label: 'Show for 12 hours' },
  { value: '24', label: 'Show for 24 hours (Today)' },
  { value: '72', label: 'Show for 3 days' },
  { value: '168', label: 'Show for 1 week' },
  { value: '0', label: 'Keep until I delete it' },
];

/**
 * NoticeComposer — Shared Emerald Green announcement publisher for all 6 vendor portals.
 * Features:
 *   - 1-Tap Ready Message Templates
 *   - Voice-to-Text Microphone button (Web Speech API `en-IN` with graceful fallback)
 *   - Live posted notices feed with Delete button
 */
export default function NoticeComposer({
  businessId,
  templates = DEFAULT_NOTICE_TEMPLATES,
  offerings = [],
  onUpdatesChanged,
}) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateType, setUpdateType] = useState('ANNOUNCEMENT');
  const [linkedOfferingId, setLinkedOfferingId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [expiresHours, setExpiresHours] = useState('24');
  const [publishing, setPublishing] = useState(false);
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  const loadNotices = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const res = await api.get(`/businesses/${businessId}/updates`);
      setNotices(res.data);
      if (onUpdatesChanged) onUpdatesChanged(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load posted notices.');
    } finally {
      setLoading(false);
    }
  }, [businessId, onUpdatesChanged]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  function applyTemplate(tplText) {
    setError('');
    setTitle(tplText);
    if (!content.trim()) {
      setContent(tplText);
    }
    setFeedback('Template filled! Edit if needed or tap "Post Notice".');
  }

  function handleVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice typing is not supported in this browser. Please type normally.');
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;

      setError('');
      setFeedback('');
      setListening(true);

      recognition.onresult = (event) => {
        const spoken = event.results?.[0]?.[0]?.transcript?.trim();
        if (spoken) {
          setContent((prev) => (prev.trim() ? `${prev.trim()} ${spoken}` : spoken));
          if (!title.trim()) {
            setTitle(spoken.slice(0, 120));
          }
          setFeedback('Voice text added!');
        }
        setListening(false);
      };

      recognition.onerror = () => {
        setListening(false);
        setError('Could not hear clearly. Please tap Speak again or type.');
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
    } catch {
      setListening(false);
      setError('Microphone access unavailable. Please type your notice instead.');
    }
  }

  async function handlePublishNotice(e) {
    e.preventDefault();
    const finalContent = content.trim();
    const finalTitle = (title.trim() || finalContent.slice(0, 90)).trim();
    if (!finalContent) {
      setError('Please tap a template, speak, or type a message first.');
      return;
    }

    setPublishing(true);
    setError('');
    setFeedback('');
    try {
      const hrs = Number(expiresHours);
      const expiresAt = hrs > 0 ? new Date(Date.now() + hrs * 3600 * 1000).toISOString() : null;
      await api.post(`/businesses/${businessId}/updates`, {
        offeringId: linkedOfferingId || null,
        updateType,
        title: finalTitle,
        content: finalContent,
        expiresAt,
      });
      setTitle('');
      setContent('');
      setFeedback('Notice posted to nearby students!');
      await loadNotices();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post notice.');
    } finally {
      setPublishing(false);
    }
  }

  async function handleDeleteNotice(updateId) {
    setError('');
    try {
      await api.delete(`/updates/${updateId}`);
      setFeedback('Notice deleted.');
      await loadNotices();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete notice.');
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 sm:p-6 space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A]">
          📢 Post a Notice for Students
        </h2>
        <p className="text-sm text-slate-600 mt-0.5">
          Tap any ready-made message below or speak using the mic button.
        </p>
      </div>

      {/* 1-Tap Ready Templates */}
      <div className="space-y-2">
        <p className="text-xs font-extrabold uppercase tracking-wider text-[#047857]">
          ⚡ 1-Tap Ready Messages:
        </p>
        <div className="grid grid-cols-1 gap-2.5">
          {templates.map((tpl) => (
            <button
              key={tpl}
              type="button"
              onClick={() => applyTemplate(tpl)}
              className="text-left p-3.5 rounded-xl bg-[#ECFDF5]/80 hover:bg-emerald-100 border border-emerald-200 text-sm font-bold text-[#0F172A] flex items-center justify-between gap-3 cursor-pointer transition"
            >
              <span>&ldquo;{tpl}&rdquo;</span>
              <span className="px-2.5 py-1 rounded-lg bg-white text-[#047857] text-xs font-extrabold border border-emerald-200 shrink-0">
                Tap to Use
              </span>
            </button>
          ))}
        </div>
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

      {/* Composer Form */}
      <form onSubmit={handlePublishNotice} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={updateType}
            onChange={(e) => setUpdateType(e.target.value)}
            className="min-h-[46px] px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-semibold bg-white focus:outline-none focus:border-[#059669]"
          >
            {Object.entries(UPDATE_TYPE_LABELS).map(([k, lbl]) => (
              <option key={k} value={k}>{lbl}</option>
            ))}
          </select>

          <select
            value={linkedOfferingId}
            onChange={(e) => setLinkedOfferingId(e.target.value)}
            className="min-h-[46px] px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-semibold bg-white focus:outline-none focus:border-[#059669]"
          >
            <option value="">General shop notice</option>
            {offerings.map((o) => (
              <option key={o.id} value={o.id}>About: {o.title}</option>
            ))}
          </select>

          <select
            value={expiresHours}
            onChange={(e) => setExpiresHours(e.target.value)}
            className="min-h-[46px] px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-semibold bg-white focus:outline-none focus:border-[#059669]"
          >
            {EXPIRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short Headline (optional — auto-filled from your message)"
          className="w-full min-h-[48px] px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-[#0F172A] bg-white focus:outline-none focus:border-[#059669]"
        />

        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#0F172A]">Your Notice Message</label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type or speak your announcement..."
              className="flex-1 p-4 rounded-xl bg-white border-2 border-slate-200 text-base text-[#0F172A] focus:outline-none focus:border-[#059669]"
            />
            <button
              type="button"
              onClick={handleVoiceInput}
              aria-label="Speak to type notice"
              className={`min-h-[52px] sm:w-32 px-4 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer transition ${
                listening
                  ? 'bg-red-600 border-red-600 text-white mic-pulse'
                  : 'bg-[#ECFDF5] hover:bg-emerald-100 border-emerald-300 text-[#047857]'
              }`}
            >
              <span className="text-lg">🎙️</span>
              <span>{listening ? 'Listening...' : 'Speak'}</span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={publishing}
          className="w-full sm:w-auto min-h-[52px] px-7 py-3 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-base shadow-sm cursor-pointer disabled:opacity-50 transition"
        >
          {publishing ? 'Posting...' : '📢 Post Notice'}
        </button>
      </form>

      {/* Live Notices List */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          Live Notices ({notices.length})
        </h3>

        {loading ? (
          <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
        ) : notices.length === 0 ? (
          <p className="text-sm text-slate-500">No active notices posted yet.</p>
        ) : (
          notices.map((n) => (
            <div
              key={n.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
            >
              <div>
                <span className="inline-block text-[11px] font-extrabold uppercase tracking-wide text-[#047857]">
                  {UPDATE_TYPE_LABELS[n.updateType] || n.updateType}
                </span>
                <p className="text-sm sm:text-base font-bold text-[#0F172A] mt-0.5">{n.title}</p>
                {n.content && n.content !== n.title && (
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">{n.content}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">🕒 {formatTimeAgo(n.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteNotice(n.id)}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 hover:text-red-700 border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer shrink-0 transition"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
