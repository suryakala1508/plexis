/**
 * @desc Get AI Financial Insights based on 6-month trend analysis
 * @route GET /api/project/financial-insights
 */
import { AuthRequest } from "../../core/middleware";
import { Response } from "express";
import mongoose from "mongoose";
import { QuotationModel } from "../../models/quotationModel";
import { ExpenseModel } from "../../models/expenseModel";


export const getFinancialInsights = async (req: AuthRequest, res: Response) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user!._id);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Fetch last 6 months of data
        const last6Months: any[] = [];
        for (let i = 5; i >= 0; i--) {
            const targetDate = new Date(currentYear, currentMonth - i, 1);
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();

            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);

            const [quotations, expenses] = await Promise.all([
                QuotationModel.find({
                    userId: userId,
                    status: 'accepted',
                    isDeleted: false
                }).populate('client', 'email').lean(),
                ExpenseModel.find({
                    createdBy: userId,
                    date: { $gte: startDate, $lte: endDate }
                }).lean()
            ]);

            let monthlyRevenue = 0;
            let monthlyExpenses = 0;

            quotations.forEach(quote => {
                (quote.paymentMilestones || []).forEach(milestone => {
                    const dueDate = new Date(milestone.dueDate);
                    if (dueDate.getFullYear() === year && dueDate.getMonth() === month) {
                        if (milestone.paid) {
                            monthlyRevenue += milestone.amount;
                        }
                    }
                });
            });

            expenses.forEach(exp => {
                monthlyExpenses += (exp.amount || 0);
            });

            last6Months.push({
                month: targetDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
                revenue: Math.round(monthlyRevenue),
                expenses: Math.round(monthlyExpenses),
                profit: Math.round(monthlyRevenue - monthlyExpenses)
            });
        }

        // Trend Analysis
        const insights: any[] = [];

        if (last6Months.length >= 2) {
            const currentMonthData = last6Months[last6Months.length - 1];
            const previousMonthData = last6Months[last6Months.length - 2];

            // 1. Expense Trend Analysis
            const expenseChange = ((currentMonthData.expenses - previousMonthData.expenses) / previousMonthData.expenses) * 100;
            if (expenseChange > 15) {
                insights.push({
                    type: 'warning',
                    priority: 1,
                    message: `Expenses increased by ${Math.round(expenseChange)}% compared to last month. Review recent purchases and identify cost-saving opportunities.`,
                    icon: 'trending-up',
                    color: 'amber'
                });
            } else if (expenseChange < -10) {
                insights.push({
                    type: 'success',
                    priority: 5,
                    message: `Great job! Expenses decreased by ${Math.abs(Math.round(expenseChange))}% from last month. Keep monitoring to maintain this trend.`,
                    icon: 'trending-down',
                    color: 'emerald'
                });
            }

            // 2. Revenue Trend Analysis
            const revenueChange = ((currentMonthData.revenue - previousMonthData.revenue) / previousMonthData.revenue) * 100;
            if (revenueChange < -20) {
                insights.push({
                    type: 'critical',
                    priority: 1,
                    message: `Revenue dropped by ${Math.abs(Math.round(revenueChange))}% this month. Focus on client outreach and closing pending deals immediately.`,
                    icon: 'alert-triangle',
                    color: 'red'
                });
            } else if (revenueChange > 20) {
                insights.push({
                    type: 'success',
                    priority: 4,
                    message: `Revenue surged by ${Math.round(revenueChange)}% this month! Consider reinvesting in marketing or expanding team capacity.`,
                    icon: 'trending-up',
                    color: 'emerald'
                });
            }

            // 3. Profit Margin Analysis
            const currentMargin = currentMonthData.revenue > 0 ? (currentMonthData.profit / currentMonthData.revenue) * 100 : 0;
            if (currentMonthData.profit < 0) {
                insights.push({
                    type: 'critical',
                    priority: 1,
                    message: `Operating at a loss this month. Urgent: reduce discretionary expenses and accelerate payment collections.`,
                    icon: 'alert-circle',
                    color: 'red'
                });
            } else if (currentMargin < 20 && currentMargin > 0) {
                insights.push({
                    type: 'info',
                    priority: 3,
                    message: `Profit margin is ${Math.round(currentMargin)}%. Target 30%+ by either increasing project rates or optimizing operational costs.`,
                    icon: 'lightbulb',
                    color: 'blue'
                });
            }

            // 4. Volatility Check (3-month average comparison)
            if (last6Months.length >= 3) {
                const last3Months = last6Months.slice(-3);
                const avgExpenses = last3Months.reduce((sum, m) => sum + m.expenses, 0) / 3;
                const expenseVolatility = Math.abs(currentMonthData.expenses - avgExpenses) / avgExpenses * 100;

                if (expenseVolatility > 30) {
                    insights.push({
                        type: 'warning',
                        priority: 2,
                        message: `Expense pattern is unusually volatile. Unexpected spike detected - review all recent transactions for anomalies.`,
                        icon: 'activity',
                        color: 'amber'
                    });
                }
            }
        }

        // Sort by priority and return top insight
        const topInsight = insights.sort((a, b) => a.priority - b.priority)[0] || {
            type: 'info',
            message: 'Keep tracking your finances regularly. You\'re building a strong foundation for business growth.',
            icon: 'check-circle',
            color: 'blue',
            priority: 10
        };

        res.status(200).json({
            success: true,
            data: {
                insight: topInsight,
                trend: last6Months
            }
        });

    } catch (err: any) {
        console.error('Financial Insights Error:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};
