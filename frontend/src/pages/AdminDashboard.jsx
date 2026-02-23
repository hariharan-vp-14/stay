import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import { apiRequest, getImageUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, LayoutDashboard, ClipboardList, Users, Building2,
  BarChart3, ScrollText, CheckCircle2, XCircle, Trash2, Ban,
  ShieldOff, Eye, ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react';

/* ── Sidebar nav ── */
const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Pending', to: '/admin/pending', icon: ClipboardList },
  { label: 'All Properties', to: '/admin/properties', icon: Building2 },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Owners', to: '/admin/owners', icon: Building2 },
  { label: 'Audit Logs', to: '/admin/audit-logs', icon: ScrollText },
];

/* ── Status badge component ── */
function StatusBadge({ status }) {
  const colors = {
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  };

  return (
    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-medium ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}

/* ── Stat Card ── */
function StatCard({ label, value, icon: Icon, color = 'text-accent', bg = 'bg-accent/10', border = 'border-accent/20' }) {
  return (
    <div className={`rounded-xl border ${border} ${bg} p-4 flex items-center gap-4`}>
      <div className={`h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-mist/60">{label}</p>
      </div>
    </div>
  );
}

/* ── Property Row (expandable) ── */
function PropertyRow({ property, onApprove, onReject, onDelete, actionLoading }) {
  const [expanded, setExpanded] = useState(false);
  const ownerName = property.owner?.name || 'N/A';
  const ownerEmail = property.owner?.email || '';

  return (
    <div className="border border-white/10 rounded-xl bg-white/[0.02] overflow-hidden">
      {/* Main row */}
      <div
        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Thumbnail */}
        <div className="h-12 w-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
          {property.images?.[0] ? (
            <img src={getImageUrl(property.images[0])} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-mist/30 text-xs">No img</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{property.title}</p>
          <p className="text-mist/50 text-xs truncate">{property.address}, {property.city}</p>
        </div>

        <div className="hidden sm:block text-xs text-mist/50 w-28 truncate">{ownerName}</div>
        <div className="hidden md:block text-xs text-mist/50 w-20">{property.type}</div>

        <StatusBadge status={property.status} />

        <div className="flex items-center gap-1">
          {property.status === 'pending' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onApprove(property._id); }}
                disabled={actionLoading}
                className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors disabled:opacity-50"
                title="Approve"
              >
                <CheckCircle2 size={16} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReject(property._id); }}
                disabled={actionLoading}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                title="Reject"
              >
                <XCircle size={16} />
              </button>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(property._id); }}
            disabled={actionLoading}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-50"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
          {expanded ? <ChevronUp size={14} className="text-mist/40" /> : <ChevronDown size={14} className="text-mist/40" />}
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-mist/40">Price</span>
                  <p className="text-white font-medium">₹{property.price?.toLocaleString('en-IN')}/mo</p>
                </div>
                <div>
                  <span className="text-mist/40">Type</span>
                  <p className="text-white font-medium capitalize">{property.type}</p>
                </div>
                <div>
                  <span className="text-mist/40">Gender</span>
                  <p className="text-white font-medium capitalize">{property.gender || 'Unisex'}</p>
                </div>
                <div>
                  <span className="text-mist/40">Owner</span>
                  <p className="text-white font-medium">{ownerName}</p>
                  <p className="text-mist/50">{ownerEmail}</p>
                </div>
              </div>

              {property.description && (
                <div>
                  <span className="text-mist/40 text-xs">Description</span>
                  <p className="text-mist/80 text-sm mt-1">{property.description}</p>
                </div>
              )}

              {/* Images */}
              {property.images?.length > 0 && (
                <div>
                  <span className="text-mist/40 text-xs">Images ({property.images.length})</span>
                  <div className="flex gap-2 mt-1 overflow-x-auto pb-1">
                    {property.images.map((img, i) => (
                      <img
                        key={i}
                        src={getImageUrl(img)}
                        alt={`Property ${i + 1}`}
                        className="h-20 w-28 rounded-lg object-cover flex-shrink-0 border border-white/10"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {property.amenities?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {property.amenities.map((a) => (
                    <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-mist/50">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN ADMIN DASHBOARD
   ══════════════════════════════════════════════════════════════ */
/* ── Map URL pathname → tab id ── */
const pathToTab = {
  '/admin/dashboard': 'overview',
  '/admin/pending': 'pending',
  '/admin/properties': 'properties',
  '/admin/users': 'users',
  '/admin/owners': 'owners',
  '/admin/audit-logs': 'logs',
};

const tabToPath = Object.fromEntries(Object.entries(pathToTab).map(([k, v]) => [v, k]));

export default function AdminDashboard() {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Derive initial tab from URL
  const initialTab = pathToTab[location.pathname] || 'overview';
  const [tab, setTab] = useState(initialTab);
  const [analytics, setAnalytics] = useState(null);
  const [pending, setPending] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [owners, setOwners] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  // ── Loaders ──
  const loadAnalytics = useCallback(async () => {
    try {
      const data = await apiRequest('/admin/analytics', { token });
      setAnalytics(data.analytics);
    } catch {}
  }, [token]);

  const loadPending = useCallback(async () => {
    try {
      const data = await apiRequest('/admin/properties/pending', { token });
      setPending(data.properties || []);
    } catch {}
  }, [token]);

  const loadAllProperties = useCallback(async () => {
    try {
      const q = statusFilter ? `?status=${statusFilter}` : '';
      const data = await apiRequest(`/admin/properties${q}`, { token });
      setAllProperties(data.properties || []);
    } catch {}
  }, [token, statusFilter]);

  const loadUsers = useCallback(async () => {
    try {
      const data = await apiRequest('/admin/users', { token });
      setUsers(data.users || []);
    } catch {}
  }, [token]);

  const loadOwners = useCallback(async () => {
    try {
      const data = await apiRequest('/admin/owners', { token });
      setOwners(data.owners || []);
    } catch {}
  }, [token]);

  const loadAuditLogs = useCallback(async () => {
    try {
      const data = await apiRequest('/admin/audit-logs?limit=50', { token });
      setAuditLogs(data.logs || []);
    } catch {}
  }, [token]);

  // ── Initial load ──
  useEffect(() => {
    setLoading(true);
    Promise.all([loadAnalytics(), loadPending()]).finally(() => setLoading(false));
  }, [loadAnalytics, loadPending]);

  // ── Sync tab when URL changes (sidebar click) ──
  useEffect(() => {
    const tabFromUrl = pathToTab[location.pathname] || 'overview';
    setTab(tabFromUrl);
  }, [location.pathname]);

  // ── Navigate when tab changes (tab button click) ──
  const changeTab = (id) => {
    setTab(id);
    const path = tabToPath[id] || '/admin/dashboard';
    if (location.pathname !== path) navigate(path, { replace: true });
  };

  // ── Tab-based loading ──
  useEffect(() => {
    if (tab === 'properties') loadAllProperties();
    if (tab === 'users') loadUsers();
    if (tab === 'owners') loadOwners();
    if (tab === 'logs') loadAuditLogs();
  }, [tab, loadAllProperties, loadUsers, loadOwners, loadAuditLogs]);

  // ── Actions ──
  const approveProperty = async (id) => {
    setActionLoading(true);
    try {
      await apiRequest(`/admin/properties/${id}/approve`, { method: 'PUT', token });
      await Promise.all([loadPending(), loadAnalytics(), loadAllProperties()]);
    } catch {}
    setActionLoading(false);
  };

  const rejectProperty = async (id) => {
    setActionLoading(true);
    try {
      await apiRequest(`/admin/properties/${id}/reject`, { method: 'PUT', token });
      await Promise.all([loadPending(), loadAnalytics(), loadAllProperties()]);
    } catch {}
    setActionLoading(false);
  };

  const deleteProperty = async (id) => {
    if (!window.confirm('Delete this property permanently?')) return;
    setActionLoading(true);
    try {
      await apiRequest(`/admin/properties/${id}`, { method: 'DELETE', token });
      await Promise.all([loadPending(), loadAnalytics(), loadAllProperties()]);
    } catch {}
    setActionLoading(false);
  };

  const toggleBanUser = async (userId, isBanned) => {
    setActionLoading(true);
    try {
      const action = isBanned ? 'unban' : 'ban';
      await apiRequest(`/admin/users/${userId}/${action}`, { method: 'PUT', token });
      await loadUsers();
    } catch {}
    setActionLoading(false);
  };

  const toggleBanOwner = async (ownerId, isBanned) => {
    setActionLoading(true);
    try {
      const action = isBanned ? 'unban' : 'ban';
      await apiRequest(`/admin/owners/${ownerId}/${action}`, { method: 'PUT', token });
      await loadOwners();
    } catch {}
    setActionLoading(false);
  };

  // ── Tab button renderer ──
  const TabBtn = ({ id, label, icon: Icon, badge }) => (
    <button
      onClick={() => changeTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        tab === id
          ? 'bg-accent/15 text-accent'
          : 'text-mist/60 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={16} />
      {label}
      {badge > 0 && (
        <span className="ml-1 h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
    </button>
  );

  if (loading) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <RefreshCw className="animate-spin text-accent" size={24} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <ShieldCheck size={20} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl text-white font-semibold">Admin Dashboard</h1>
            <p className="text-mist/50 text-xs">Manage properties, users, and platform settings</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
          <TabBtn id="overview" label="Overview" icon={BarChart3} />
          <TabBtn id="pending" label="Pending" icon={ClipboardList} badge={pending.length} />
          <TabBtn id="properties" label="Properties" icon={Building2} />
          <TabBtn id="users" label="Users" icon={Users} />
          <TabBtn id="owners" label="Owners" icon={Building2} />
          <TabBtn id="logs" label="Audit Logs" icon={ScrollText} />
        </div>

        {/* ═══════ OVERVIEW TAB ═══════ */}
        {tab === 'overview' && analytics && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={analytics.totalUsers} icon={Users} color="text-sky-400" bg="bg-sky-500/10" border="border-sky-500/20" />
              <StatCard label="Total Owners" value={analytics.totalOwners} icon={Building2} color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" />
              <StatCard label="Total Properties" value={analytics.totalProperties} icon={LayoutDashboard} color="text-violet-400" bg="bg-violet-500/10" border="border-violet-500/20" />
              <StatCard label="Admins" value={analytics.totalAdmins} icon={ShieldCheck} color="text-red-400" bg="bg-red-500/10" border="border-red-500/20" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard label="Approved" value={analytics.approvedCount} icon={CheckCircle2} color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" />
              <StatCard label="Pending" value={analytics.pendingCount} icon={ClipboardList} color="text-amber-400" bg="bg-amber-500/10" border="border-amber-500/20" />
              <StatCard label="Rejected" value={analytics.rejectedCount} icon={XCircle} color="text-red-400" bg="bg-red-500/10" border="border-red-500/20" />
            </div>
            {(analytics.bannedUsers > 0 || analytics.bannedOwners > 0) && (
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Banned Users" value={analytics.bannedUsers} icon={Ban} color="text-orange-400" bg="bg-orange-500/10" border="border-orange-500/20" />
                <StatCard label="Banned Owners" value={analytics.bannedOwners} icon={Ban} color="text-orange-400" bg="bg-orange-500/10" border="border-orange-500/20" />
              </div>
            )}

            {/* Quick pending list */}
            {pending.length > 0 && (
              <div>
                <h3 className="text-white text-sm font-medium mb-3">Recent Pending ({pending.length})</h3>
                <div className="space-y-2">
                  {pending.slice(0, 5).map((p) => (
                    <PropertyRow
                      key={p._id}
                      property={p}
                      onApprove={approveProperty}
                      onReject={rejectProperty}
                      onDelete={deleteProperty}
                      actionLoading={actionLoading}
                    />
                  ))}
                </div>
                {pending.length > 5 && (
                  <button
                    onClick={() => changeTab('pending')}
                    className="mt-2 text-accent text-xs hover:underline"
                  >
                    View all {pending.length} pending →
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════ PENDING TAB ═══════ */}
        {tab === 'pending' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-sm font-medium">Pending Properties ({pending.length})</h3>
              <button onClick={loadPending} className="text-mist/40 hover:text-accent transition-colors">
                <RefreshCw size={14} />
              </button>
            </div>
            {pending.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 size={40} className="mx-auto text-emerald-400/30 mb-3" />
                <p className="text-mist/50 text-sm">All caught up! No pending properties.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pending.map((p) => (
                  <PropertyRow
                    key={p._id}
                    property={p}
                    onApprove={approveProperty}
                    onReject={rejectProperty}
                    onDelete={deleteProperty}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════ ALL PROPERTIES TAB ═══════ */}
        {tab === 'properties' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-white text-sm font-medium">All Properties ({allProperties.length})</h3>
              <div className="flex gap-2">
                {['', 'pending', 'approved', 'rejected'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      statusFilter === s
                        ? 'bg-accent/20 border-accent/40 text-accent'
                        : 'bg-white/5 border-white/10 text-mist/50 hover:text-white'
                    }`}
                  >
                    {s || 'All'}
                  </button>
                ))}
              </div>
            </div>
            {allProperties.length === 0 ? (
              <div className="text-center py-16">
                <Building2 size={40} className="mx-auto text-mist/20 mb-3" />
                <p className="text-mist/50 text-sm">No properties found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allProperties.map((p) => (
                  <PropertyRow
                    key={p._id}
                    property={p}
                    onApprove={approveProperty}
                    onReject={rejectProperty}
                    onDelete={deleteProperty}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════ USERS TAB ═══════ */}
        {tab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="text-white text-sm font-medium">Users ({users.length})</h3>
            {users.length === 0 ? (
              <p className="text-mist/50 text-sm text-center py-16">No users found.</p>
            ) : (
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="text-left px-4 py-3 text-mist/50 font-medium">Name</th>
                      <th className="text-left px-4 py-3 text-mist/50 font-medium hidden sm:table-cell">Email</th>
                      <th className="text-left px-4 py-3 text-mist/50 font-medium hidden md:table-cell">Joined</th>
                      <th className="text-left px-4 py-3 text-mist/50 font-medium">Status</th>
                      <th className="text-right px-4 py-3 text-mist/50 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-white">{u.name}</td>
                        <td className="px-4 py-3 text-mist/60 hidden sm:table-cell">{u.email}</td>
                        <td className="px-4 py-3 text-mist/50 text-xs hidden md:table-cell">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {u.isBanned ? (
                            <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">Banned</span>
                          ) : (
                            <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Active</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => toggleBanUser(u._id, u.isBanned)}
                            disabled={actionLoading}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                              u.isBanned
                                ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                                : 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                            }`}
                          >
                            {u.isBanned ? <><ShieldOff size={12} className="inline mr-1" />Unban</> : <><Ban size={12} className="inline mr-1" />Ban</>}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════ OWNERS TAB ═══════ */}
        {tab === 'owners' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="text-white text-sm font-medium">Owners ({owners.length})</h3>
            {owners.length === 0 ? (
              <p className="text-mist/50 text-sm text-center py-16">No owners found.</p>
            ) : (
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="text-left px-4 py-3 text-mist/50 font-medium">Name</th>
                      <th className="text-left px-4 py-3 text-mist/50 font-medium hidden sm:table-cell">Email</th>
                      <th className="text-left px-4 py-3 text-mist/50 font-medium hidden md:table-cell">Joined</th>
                      <th className="text-left px-4 py-3 text-mist/50 font-medium">Status</th>
                      <th className="text-right px-4 py-3 text-mist/50 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {owners.map((o) => (
                      <tr key={o._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-white">{o.name}</td>
                        <td className="px-4 py-3 text-mist/60 hidden sm:table-cell">{o.email}</td>
                        <td className="px-4 py-3 text-mist/50 text-xs hidden md:table-cell">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {o.isBanned ? (
                            <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">Banned</span>
                          ) : (
                            <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Active</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => toggleBanOwner(o._id, o.isBanned)}
                            disabled={actionLoading}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                              o.isBanned
                                ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                                : 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                            }`}
                          >
                            {o.isBanned ? <><ShieldOff size={12} className="inline mr-1" />Unban</> : <><Ban size={12} className="inline mr-1" />Ban</>}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════ AUDIT LOGS TAB ═══════ */}
        {tab === 'logs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-sm font-medium">Audit Logs</h3>
              <button onClick={loadAuditLogs} className="text-mist/40 hover:text-accent transition-colors">
                <RefreshCw size={14} />
              </button>
            </div>
            {auditLogs.length === 0 ? (
              <p className="text-mist/50 text-sm text-center py-16">No audit logs yet.</p>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log._id}
                    className="flex items-start gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02]"
                  >
                    <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <ScrollText size={14} className="text-mist/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm">
                        <span className="font-medium">{log.admin?.name || 'Admin'}</span>
                        {' — '}
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          log.action.includes('APPROVE') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          log.action.includes('REJECT') || log.action.includes('DELETE') || log.action.includes('BAN') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        }`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </p>
                      {log.details && <p className="text-mist/50 text-xs mt-0.5 truncate">{log.details}</p>}
                    </div>
                    <span className="text-mist/40 text-[10px] flex-shrink-0 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
