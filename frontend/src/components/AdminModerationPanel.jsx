import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { formatTimeAgo } from '../utils/constants';

export default function AdminModerationPanel() {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await api.get('/admin/reports', { params });
      setReports(res.data);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load admin moderation queue.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  async function handleResolve(reportId, status, suspendBusiness) {
    setMessage('');
    try {
      await api.patch(`/admin/reports/${reportId}`, { status, suspendBusiness });
      setMessage(`Report marked ${status}${suspendBusiness ? ' and business suspended' : ''}.`);
      loadReports();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Action failed.');
    }
  }

  async function handleVerifyBusiness(businessId) {
    setMessage('');
    try {
      await api.patch(`/admin/businesses/${businessId}/verification`, {
        verificationStatus: 'VERIFIED',
      });
      setMessage('Business verification restored to VERIFIED.');
      loadReports();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Verification update failed.');
    }
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-red-200 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
            Admin Moderation Queue
          </span>
          <h2 className="text-xl font-bold text-gray-900">Listing Reports</h2>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="OPEN">Open Reports</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
          <option value="">All Reports</option>
        </select>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-sm text-indigo-800">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading moderation queue...</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-gray-500">No reports matching this filter.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{r.businessName}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {r.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    Listing: {r.businessVerificationStatus}
                  </span>
                </div>
                <p className="text-sm text-red-700 font-medium">{r.reason}</p>
                {r.description && <p className="text-xs text-gray-600 mt-1">{r.description}</p>}
                <p className="text-[11px] text-gray-400 mt-1">
                  Reported by {r.reporterEmail} • {formatTimeAgo(r.createdAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {r.status === 'OPEN' && (
                  <>
                    <button
                      onClick={() => handleResolve(r.id, 'RESOLVED', true)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer"
                    >
                      Resolve & Suspend
                    </button>
                    <button
                      onClick={() => handleResolve(r.id, 'RESOLVED', false)}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
                    >
                      Resolve Only
                    </button>
                    <button
                      onClick={() => handleResolve(r.id, 'DISMISSED', false)}
                      className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold hover:bg-gray-300 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </>
                )}
                {r.businessVerificationStatus === 'SUSPENDED' && (
                  <button
                    onClick={() => handleVerifyBusiness(r.businessId)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                  >
                    Restore Verified
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
