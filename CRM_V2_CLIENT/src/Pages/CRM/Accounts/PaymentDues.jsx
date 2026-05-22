
import React, { useState, useEffect, useMemo } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { ArrowLeft, Filter, RefreshCw, Calendar, AlertTriangle, CheckCircle, Clock, DollarSign, FolderKanban, Activity, CircleDashed, Info, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPaymentDues } from '../../../services/paymentService';
import { CardSkeleton } from '../../../Components/Loading';
import { PageGuard } from '@/Pages/utils/permissions';
import { getProjectNames } from '../../../services/paymentService';
import { TourGuide } from '../../../Components/TourGuide/TourGuide';
import { paymentDuesTourSteps } from '../../../Components/TourGuide/steps/paymentDuesTourSteps';

export const PaymentDues = () => {
    const navigate = useNavigate();
    const [allDues, setAllDues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [projects, setProjects] = useState([]);

    // Filters
    const [selectedProject, setSelectedProject] = useState('');
    const [dateRange, setDateRange] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [showCrossedDueOnly, setShowCrossedDueOnly] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'overdue'
    const [sortOrder, setSortOrder] = useState(null); // null | 'asc' | 'desc'

    const checkIsOverdue = (dateString) => {
        if (!dateString) return false;
        return dayjs(dateString).isBefore(dayjs(), 'day');
    };

    const fetchAllDues = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getPaymentDues({});
            setAllDues(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const data = await getProjectNames();
            setProjects(data || []);
        } catch (err) {
            console.error("Failed to fetch projects", err);
        }
    };

    useEffect(() => {
        fetchProjects();
        fetchAllDues();
    }, []);

    const filteredDues = useMemo(() => {
        return allDues.filter(due => {
            // 1. Project Filter
            if (selectedProject && due.projectId?._id !== selectedProject) return false;

            // 2. Status Filter
            if (statusFilter !== 'all') {
                if (statusFilter === 'unscheduled') {
                    if (!due.isSynthetic) return false;
                    // Synthetic rows whose project end date has passed show as Overdue — exclude them here
                    const isOverdue = checkIsOverdue(due.dueDate);
                    const derivedStatus = isOverdue ? 'overdue' : (due.isSynthetic ? 'unscheduled' : 'pending');
                    if (statusFilter !== derivedStatus) return false;
                }
                else {
                    // For synthetic rows: only allow them through if filter is 'overdue' AND their end date has crossed
                    if (due.isSynthetic) {
                        const isSyntheticOverdue = checkIsOverdue(due.dueDate);
                        if (statusFilter !== 'overdue' || !isSyntheticOverdue) return false;
                    } else {
                        const isOverdue = checkIsOverdue(due.dueDate);
                        if (statusFilter === 'overdue' && !isOverdue && due.status !== 'overdue') return false;
                        if (statusFilter === 'pending' && isOverdue) return false;
                    }
                }
            }

            // 3. Date Range Filter — rows without a dueDate are hidden in custom range
            if ((dateRange === 'custom' || dateRange === 'thisMonth' || dateRange === 'lastMonth') && !due.dueDate) return false;
            if (dateRange !== 'all' && due.dueDate) {
                const dueTime = new Date(due.dueDate).getTime();
                const now = new Date();
                let start, end;

                if (dateRange === 'thisMonth') {
                    start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();
                } else if (dateRange === 'lastMonth') {
                    start = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
                    end = new Date(now.getFullYear(), now.getMonth(), 0).getTime();
                } else if (dateRange === 'custom' && customStartDate && customEndDate) {
                    start = new Date(customStartDate).getTime();
                    end = new Date(customEndDate).getTime();
                }

                if (start && end) {
                    if (dueTime < start || dueTime > end) return false;
                }
            }

            // 4. Crossed Due Date filter — synthetic rows are excluded (they have no scheduled due date)
            // Fixed — allows synthetic rows that are actually overdue (crossed end date)
            if (showCrossedDueOnly) {
                const isOverdue = checkIsOverdue(due.dueDate);
                if (!isOverdue) return false; // this naturally excludes synthetics with no dueDate too
            }

            return true;
        });
    }, [allDues, selectedProject, dateRange, customStartDate, customEndDate, showCrossedDueOnly, statusFilter]);

    const sortedDues = useMemo(() => {
        if (!sortOrder) return filteredDues;
        return [...filteredDues].sort((a, b) => {
            // Rows with no dueDate always sink to the bottom
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            const diff = new Date(a.dueDate) - new Date(b.dueDate);
            return sortOrder === 'asc' ? diff : -diff;
        });
    }, [filteredDues, sortOrder]);

    const toggleSort = () => {
        setSortOrder(prev => prev === null ? 'asc' : prev === 'asc' ? 'desc' : null);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const getStatusBadge = (due) => {
        const isOverdue = checkIsOverdue(due.dueDate);

        // 1. If the date has crossed midnight, it is Overdue (Synthetic or not)
        if (isOverdue) {
            return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1"><AlertTriangle size={12} /> Overdue</span>;
        }

        // 2. If it is NOT overdue, and it's synthetic, it's Unscheduled
        if (due.isSynthetic) {
            return (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                    <CircleDashed size={12} /> Unscheduled
                </span>
            );
        }

        // 3. Otherwise, it is a normal scheduled payment that hasn't crossed the date
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={12} /> Pending</span>;
    };

    const totalDueAmount = filteredDues.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const overdueCount = filteredDues.filter(d => checkIsOverdue(d.dueDate)).length;
    const pendingCount = filteredDues.filter(d => !checkIsOverdue(d.dueDate)).length;

    return (
        <PageGuard page="6">
            <TourGuide steps={paymentDuesTourSteps} tourKey="payment-dues-tour" />
            <div className="p-6 lg:pl-4 bg-gray-50 min-h-screen">
                <div className="max-w-[1800px] mx-auto space-y-6">
                    {/* Header */}
                    <div id="payment-dues-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <button
                                    onClick={() => navigate('/accounts/overview')}
                                    className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    <ArrowLeft size={20} className="text-gray-600" />
                                </button>
                                <h1 className="text-2xl font-bold text-primary-dark">Payment Dues</h1>
                            </div>
                            <p className="text-sm text-gray-600 ml-8">Track all pending and overdue payments across projects</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchAllDues}
                                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div id="payment-dues-stats" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <DollarSign size={20} />
                                </div>
                                <span className="text-sm font-medium text-gray-500">Total Outstanding</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalDueAmount)}</div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-red-50 rounded-lg text-red-600">
                                    <AlertTriangle size={20} />
                                </div>
                                <span className="text-sm font-medium text-gray-500">Overdue</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{overdueCount}</div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                                    <Clock size={20} />
                                </div>
                                <span className="text-sm font-medium text-gray-500">Pending & Unscheduled</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div id="payment-dues-filters" className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-gray-800">
                                <Filter size={18} className="text-primary-dark" />
                                <h3 className="font-semibold text-sm">Filter Dues</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedProject('');
                                    setDateRange('all');
                                    setCustomStartDate('');
                                    setCustomEndDate('');
                                    setStatusFilter('all');
                                    setShowCrossedDueOnly(false);
                                }}
                                className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            >
                                Clear Filters
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Project Filter */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Project</label>
                                <div className="relative">
                                    <FolderKanban size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <select
                                        className="w-full text-sm pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-dark/20 focus:border-primary-dark transition-all bg-gray-50/50 hover:bg-white text-gray-700"
                                        value={selectedProject}
                                        onChange={(e) => setSelectedProject(e.target.value)}
                                    >
                                        <option value="">All Projects</option>
                                        {projects.map(p => (
                                            <option key={p._id} value={p._id}>{p.projectTitle}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Date Range Filter */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date Range</label>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <select
                                        className="w-full text-sm pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-dark/20 focus:border-primary-dark transition-all bg-gray-50/50 hover:bg-white text-gray-700"
                                        value={dateRange}
                                        onChange={(e) => setDateRange(e.target.value)}
                                    >
                                        <option value="all">All Time</option>
                                        <option value="thisMonth">This Month</option>
                                        <option value="lastMonth">Last Month</option>
                                        <option value="custom">Custom Range</option>
                                    </select>
                                </div>
                            </div>

                            {/* Status Filter — no "Paid" option */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                                <div className="relative">
                                    <Activity size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <select
                                        className="w-full text-sm pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-dark/20 focus:border-primary-dark transition-all bg-gray-50/50 hover:bg-white text-gray-700"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending </option>
                                        <option value="overdue">Overdue</option>
                                        <option value="unscheduled">Unscheduled</option>
                                    </select>
                                </div>
                            </div>

                            {/* Checkbox for Crossed Due */}
                            <div className="flex items-end pb-1">
                                <label className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg w-full cursor-pointer hover:bg-gray-50 transition-colors group h-[38px]">
                                    <input
                                        type="checkbox"
                                        checked={showCrossedDueOnly}
                                        onChange={(e) => setShowCrossedDueOnly(e.target.checked)}
                                        className="rounded text-primary-dark focus:ring-primary-dark border-gray-300 group-hover:border-primary-dark transition-colors"
                                    />
                                    <span className="text-sm text-gray-700 font-medium group-hover:text-primary-dark transition-colors">Crossed Due Only</span>
                                </label>
                            </div>
                        </div>

                        {/* Custom Date Inputs */}
                        {dateRange === 'custom' && (
                            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-down">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-500">Start Date</label>
                                    <DatePicker
                                        className="w-full border-gray-200 rounded-lg py-2 hover:border-primary-dark focus:border-primary-dark"
                                        value={customStartDate ? dayjs(customStartDate) : null}
                                        format="DD/MM/YYYY"
                                        onChange={(date) => setCustomStartDate(date ? date.format('YYYY-MM-DD') : '')}
                                        placeholder="Select start date"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-500">End Date</label>
                                    <DatePicker
                                        className="w-full border-gray-200 rounded-lg py-2 hover:border-primary-dark focus:border-primary-dark"
                                        value={customEndDate ? dayjs(customEndDate) : null}
                                        format="DD/MM/YYYY"
                                        onChange={(date) => setCustomEndDate(date ? date.format('YYYY-MM-DD') : '')}
                                        placeholder="Select end date"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    {loading ? (
                        <CardSkeleton count={3} />
                    ) : error ? (
                        <div className="text-center py-10 bg-white rounded-xl border border-red-200">
                            <p className="text-red-600">{error}</p>
                            <button onClick={fetchAllDues} className="mt-2 text-primary-dark underline hover:no-underline">Try Again</button>
                        </div>
                    ) : filteredDues.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                            <div className="bg-gray-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No payment dues found</h3>
                            <p className="text-gray-500 mt-1">Adjust your filters to see more results</p>
                        </div>
                    ) : (
                        <div id="payment-dues-table" className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 font-medium text-gray-700">
                                                <button
                                                    onClick={toggleSort}
                                                    className="flex items-center gap-1.5 hover:text-primary-dark transition-colors group"
                                                    title={sortOrder === 'asc' ? 'Sorted: Oldest first' : sortOrder === 'desc' ? 'Sorted: Newest first' : 'Click to sort by date'}
                                                >
                                                    Due Date
                                                    {sortOrder === 'asc'
                                                        ? <ArrowUp size={14} className="text-primary-dark" />
                                                        : sortOrder === 'desc'
                                                            ? <ArrowDown size={14} className="text-primary-dark" />
                                                            : <ArrowUpDown size={14} className="text-gray-400 group-hover:text-primary-dark" />}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3 font-medium text-gray-700">Description</th>
                                            <th className="px-6 py-3 font-medium text-gray-700">Project</th>
                                            <th className="px-6 py-3 font-medium text-gray-700 text-right">Amount</th>
                                            <th className="px-6 py-3 font-medium text-gray-700 text-center">Status</th>
                                            <th className="px-6 py-3 font-medium text-gray-700">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {sortedDues.map((due) => (
                                            <tr
                                                key={due._id}
                                                className={`hover:bg-gray-50 transition-colors ${due.isSynthetic ? 'bg-purple-50/40' : ''}`}
                                            >
                                                <td className="px-6 py-4 text-gray-900 font-medium">
                                                    {due.dueDate
                                                        ? formatDate(due.dueDate)
                                                        : due.isSynthetic
                                                            ? <span className="text-xs text-purple-400 font-medium italic">Not Decided</span>
                                                            : <span className="text-gray-300">—</span>}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    <span className={`inline-flex items-center gap-1.5 ${due.isSynthetic ? 'italic text-purple-700 font-medium' : ''}`}>
                                                        {due.isSynthetic ? 'Remaining Payment' : due.description}
                                                        {due.isSynthetic && (
                                                            <span className="relative group">
                                                                <Info size={13} className="text-purple-400 cursor-help flex-shrink-0" />
                                                                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg leading-relaxed">
                                                                    This amount has not been scheduled.
                                                                    <span className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-800" />
                                                                </span>
                                                            </span>
                                                        )}
                                                    </span>
                                                    {due.notes && <div className="text-xs text-gray-400 mt-0.5">{due.notes}</div>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">
                                                        {due.projectId?.projectTitle || 'Unknown Project'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {due.projectId?.clientName}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                    {formatCurrency(due.amount)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        {getStatusBadge(due)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => navigate(`/project/${due.projectId?._id}`)}
                                                        className="text-primary-dark hover:text-primary-dark/80 font-medium text-xs"
                                                    >
                                                        View Project
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PageGuard>
    );
};
