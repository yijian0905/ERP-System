import { useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle, Clock, FileText, XCircle } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { get } from '@/lib/api-client';
import { EInvoiceStatusBadge } from './einvoice-status-badge';

// Types
import { type EInvoice } from '@erp/shared-types';

interface EInvoiceSummary {
    totalDraft: number;
    totalPending: number;
    totalSubmitted: number;
    totalValid: number;
    totalInvalid: number;
    totalCancelled: number;
    totalRejected: number;
    totalError: number;
}

export function EInvoiceOverview() {
    const [summary, setSummary] = useState<EInvoiceSummary | null>(null);
    const [recentInvoices, setRecentInvoices] = useState<EInvoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [summaryRes, recentRes] = await Promise.all([
                    get<EInvoiceSummary>('/v1/einvoices/summary'),
                    get<EInvoice[]>('/v1/einvoices?pageSize=5&page=1')
                ]);

                if (summaryRes.success && summaryRes.data) {
                    setSummary(summaryRes.data);
                }
                if (recentRes.success && recentRes.data) {
                    setRecentInvoices(recentRes.data);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return <DashboardSkeleton />;
    }

    const validPercentage = summary
        ? ((summary.totalValid / (summary.totalSubmitted + summary.totalValid + summary.totalInvalid || 1)) * 100).toFixed(1)
        : 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Valid Documents"
                    value={summary?.totalValid || 0}
                    icon={CheckCircle}
                    color="text-green-600"
                    subtext={`${validPercentage}% success rate`}
                />
                <StatsCard
                    title="Pending Submission"
                    value={summary?.totalPending || 0}
                    icon={Clock}
                    color="text-orange-600"
                    subtext={`${summary?.totalDraft || 0} drafts`}
                />
                <StatsCard
                    title="Submitted (In Review)"
                    value={summary?.totalSubmitted || 0}
                    icon={ArrowUpRight}
                    color="text-blue-600"
                />
                <StatsCard
                    title="Errors / Invalid"
                    value={(summary?.totalInvalid || 0) + (summary?.totalError || 0) + (summary?.totalRejected || 0)}
                    icon={XCircle}
                    color="text-red-600"
                    subtext="Action required"
                />
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent E-Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentInvoices.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No recent e-invoices found.
                            </p>
                        ) : (
                            recentInvoices.map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{invoice.longId}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(invoice.createdAt).toLocaleDateString()} • {invoice.type.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <EInvoiceStatusBadge status={invoice.status} />
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link to="/invoices">View</Link>
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, color, subtext }: any) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="text-2xl font-bold">{value}</div>
                {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
            </CardContent>
        </Card>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <Skeleton className="h-4 w-[100px] mb-4" />
                            <Skeleton className="h-8 w-[60px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardHeader><Skeleton className="h-6 w-[200px]" /></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
