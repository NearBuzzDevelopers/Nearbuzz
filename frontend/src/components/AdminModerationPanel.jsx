import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { CATEGORY_LABELS, formatTimeAgo } from '../utils/constants';

const STATUS_BADGE = {
  VERIFIED: 'bg-emerald-100 text-emerald-800',
  PENDING: 'bg-amber-100 text-amber-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  OPEN: 'bg-red-100 text-red-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  DISMISSED: 'bg-gray-200 text-gray-700',
};

export default function AdminModerationPanel() {
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'businesses' | 'users'
  const [overview, setOverview] = useState(null);

  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('OPEN');

  const [businesses, setBusinesses] = useState([]);
  const [bizFilter, setBizFilter] = useState('');
  const [bizSearch, setBizSearch] = useState('');

  const [users, setUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAllAdminData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ovRes, repRes, bizRes, usrRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/reports', { params: statusFilter ? { status: statusFilter } : {} }),
        api.get('/admin/businesses', { params: bizFilter ? { verificationStatus: bizFilter } : {} }),
        api.get('/admin/users', { params: userRoleFilter ? { role: userRoleFilter } : {} }),
      ]);
      setOverview(ovRes.data);
      setReports(repRes.data);
      setBusinesses(bizRes.data);
      setUsers(usrRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load Admin Control Center data.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, bizFilter, userRoleFilter]);

  useEffect(() => {
    loadAllAdminData();
  }, [loadAllAdminData]);

  function notify(msg) {
    setError('');
    setMessage(msg);
  }

  async function handleResolveReport(reportId, status, suspendBusiness) {
    setMessage('');
    try {
      await api.patch(`/admin/reports/${reportId}`, { status, suspendBusiness });
      notify(`Report marked ${status}${suspendBusiness ? ' and shop suspended' : ''}.`);
      loadAllAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update report.');
    }
  }

  async function handleVerificationChange(businessId, verificationStatus, shopName) {
    setMessage('');
    try {
      await api.patch(`/admin/businesses/${businessId}/verification`, { verificationStatus });
      notify(`"${shopName}" updated to ${verificationStatus}.`);
      loadAllAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update shop verification.');
    }
  }

  async function handleUserStatusChange(userId, status, email) {
    setMessage('');
    try {
      await api.patch(`/admin/users/${userId}/status`, { status });
      notify(`Account "${email}" marked ${status}.`);
      loadAllAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update user status.');
    }
  }

  const filteredBusinesses = businesses.filter((b) => {
    const q = bizSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      b.name?.toLowerCase().includes(q) ||
      b.address?.toLowerCase().includes(q) ||
      b.ownerName?.toLowerCase().includes(q)
    );
  });

  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q);
  });

  const statCards = overview
    ? [
        { label: 'Open Reports', value: overview.openReports, accent: 'text-red-700 bg-red-50 border-red-200' },
        { label: 'Total Shops', value: overview.totalBusinesses, accent: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
        { label: 'Verified Shops', value: overview.verifiedBusinesses, accent: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        { label: 'Suspended Shops', value: overview.suspendedBusinesses, accent: 'text-amber-800 bg-amber-50 border-amber-200' },
        { label: 'Total Users', value: overview.totalUsers, accent: 'text-slate-700 bg-slate-100 border-slate-200' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {statCards.length > 0 && (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statCards.map((card) => (
            <div key={card.label} className={`rounded-2xl border p-4 ${card.accent}`}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </section>
      )}

      {/* Main Control Panel */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
              activeTab === 'reports' ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🚩 Reports Queue ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('businesses')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
              activeTab === 'businesses' ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🏪 All Shops ({businesses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
              activeTab === 'users' ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            👥 Users ({users.length})
          </button>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-medium">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* TAB 1: REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900">Student Listing Reports</h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
              >
                <option value="OPEN">Open Reports</option>
                <option value="RESOLVED">Resolved</option>
                <option value="DISMISSED">Dismissed</option>
                <option value="">All Reports</option>
              </select>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500">Loading reports...</p>
            ) : reports.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center bg-gray-50 rounded-xl">
                No reports match this filter.
              </p>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div
                    key={r.id}
                    className="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Link
                          to={`/businesses/${r.businessId}`}
                          className="font-bold text-gray-900 hover:text-indigo-700 hover:underline"
                        >
                          {r.businessName}
                        </Link>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[r.status] || 'bg-gray-100'}`}>
                          {r.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[r.businessVerificationStatus] || 'bg-gray-100'}`}>
                          Shop: {r.businessVerificationStatus}
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
                            onClick={() => handleResolveReport(r.id, 'RESOLVED', true)}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer"
                          >
                            Resolve & Suspend Shop
                          </button>
                          <button
                            onClick={() => handleResolveReport(r.id, 'RESOLVED', false)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
                          >
                            Resolve Only
                          </button>
                          <button
                            onClick={() => handleResolveReport(r.id, 'DISMISSED', false)}
                            className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold hover:bg-gray-300 cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                      {r.businessVerificationStatus === 'SUSPENDED' && (
                        <button
                          onClick={() => handleVerificationChange(r.businessId, 'VERIFIED', r.businessName)}
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
          </div>
        )}

        {/* TAB 2: ALL BUSINESSES */}
        {activeTab === 'businesses' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={bizSearch}
                onChange={(e) => setBizSearch(e.target.value)}
                placeholder="Search shop name, address, or owner..."
                className="flex-1 px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
              />
              <select
                value={bizFilter}
                onChange={(e) => setBizFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
              >
                <option value="">All Statuses</option>
                <option value="VERIFIED">Verified</option>
                <option value="PENDING">Pending</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            {filteredBusinesses.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center bg-gray-50 rounded-xl">
                No shops found.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredBusinesses.map((b) => (
                  <div
                    key={b.id}
                    className="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Link
                          to={`/businesses/${b.id}`}
                          className="font-bold text-gray-900 hover:text-indigo-700 hover:underline"
                        >
                          {b.name}
                        </Link>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                          {CATEGORY_LABELS[b.category] || b.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[b.verificationStatus] || 'bg-gray-100'}`}>
                          {b.verificationStatus}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{b.address}</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Owner: {b.ownerName} • Added {formatTimeAgo(b.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {b.verificationStatus !== 'VERIFIED' && (
                        <button
                          onClick={() => handleVerificationChange(b.id, 'VERIFIED', b.name)}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
                        >
                          ✓ Verify Shop
                        </button>
                      )}
                      {b.verificationStatus !== 'SUSPENDED' && (
                        <button
                          onClick={() => handleVerificationChange(b.id, 'SUSPENDED', b.name)}
                          className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Suspend
                        </button>
                      )}
                      <Link
                        to={`/businesses/${b.id}`}
                        className="px-3 py-1.5 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-lg text-xs font-semibold"
                      >
                        View Page
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: USERS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user name or email..."
                className="flex-1 px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
              >
                <option value="">All Roles</option>
                <option value="STUDENT">Students</option>
                <option value="VENDOR">Shop Owners</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>

            {filteredUsers.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center bg-gray-50 rounded-xl">
                No users match this search.
              </p>
            ) : (
              <div className="space-y-2.5">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{u.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                          {u.role}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[u.status] || 'bg-gray-100'}`}>
                          {u.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{u.email}</p>
                    </div>

                    <div className="flex gap-2">
                      {u.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleUserStatusChange(u.id, 'SUSPENDED', u.email)}
                          className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Suspend User
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserStatusChange(u.id, 'ACTIVE', u.email)}
                          className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Activate User
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
