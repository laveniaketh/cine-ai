"use client";
import React, { useState, useEffect } from "react";
import { Line } from 'react-chartjs-2';
import { Info } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button";

const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: 'top' as const,
            labels: {
                color: '#ffffff',
                font: {
                    size: 10,
                    family: 'Figtree',
                },
                usePointStyle: true,
                filter: (legendItem: any) => !legendItem.text.includes('AI'),
            }
        },
        tooltip: {
            backgroundColor: '#1f2937',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#4b5563',
            borderWidth: 1
        }
    },
    scales: {
        x: {
            ticks: {
                color: '#ffffff',
                font: {
                    family: 'Figtree',
                    size: 10
                }
            },
            grid: {
                color: '#374151'
            }
        },
        y: {
            type: 'linear' as const,
            display: true,
            position: 'left' as const,
            ticks: {
                color: '#fcd14f',
                font: {
                    family: 'Figtree',
                    size: 10
                }
            },
            grid: {
                color: '#374151'
            },
            title: {
                display: true,
                text: 'Tickets',
                color: '#fcd14f',
                font: {
                    size: 11
                }
            }
        },
        y1: {
            type: 'linear' as const,
            display: true,
            position: 'right' as const,
            ticks: {
                color: '#f97316',
                font: {
                    family: 'Figtree',
                    size: 10
                },
                callback: function (value: any) {
                    return '₱' + value.toLocaleString();
                }
            },
            grid: {
                drawOnChartArea: false,
            },
            title: {
                display: true,
                text: 'Revenue (₱)',
                color: '#f97316',
                font: {
                    size: 11
                }
            }
        }
    }
};

const SalesAnalyticsSkeleton = () => {
    const [viewMode, setViewMode] = useState('daily');
    const [salesData, setSalesData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSalesData = async () => {
            try {
                const response = await fetch('/api/analytics/sales');
                const data = await response.json();
                console.log('Sales data received:', data);
                console.log('AI Prediction:', data.aiPrediction);
                setSalesData(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching sales data:', error);
                setLoading(false);
            }
        };

        fetchSalesData();
    }, []);

    if (loading || !salesData) {
        return (
            <div className="flex flex-1 w-full h-full min-h-[6rem] items-center justify-center">
                <div className="text-white text-sm">Loading sales data...</div>
            </div>
        );
    }

    // Daily sales data from database
    const dailySalesData = {
        labels: salesData.daily.map((d: any) => d.label),
        datasets: [
            {
                label: 'Daily Ticket Sales',
                data: salesData.daily.map((d: any) => d.tickets),
                borderColor: '#fcd14f',
                backgroundColor: '#fcd14f20',
                borderWidth: 2,
                pointBackgroundColor: '#fcd14f',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                tension: 0.3,
                fill: false,
                yAxisID: 'y'
            },
            {
                label: 'Daily Revenue (₱)',
                data: salesData.daily.map((d: any) => d.revenue),
                borderColor: '#f97316',
                backgroundColor: '#f9731620',
                borderWidth: 2,
                pointBackgroundColor: '#f97316',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                tension: 0.3,
                fill: false,
                yAxisID: 'y1'
            }
        ]
    };

    // Weekly sales data from database
    const weeklySalesData = {
        labels: [...salesData.weekly.map((w: any) => w.label), 'AI Prediction'],
        datasets: [
            {
                label: 'Weekly Ticket Sales',
                data: [...salesData.weekly.map((w: any) => w.tickets), null],
                borderColor: '#fcd14f',
                backgroundColor: '#fcd14f20',
                borderWidth: 2,
                pointBackgroundColor: '#fcd14f',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                tension: 0.3,
                fill: false,
                yAxisID: 'y'
            },
            {
                label: 'Weekly Revenue (₱)',
                data: [...salesData.weekly.map((w: any) => w.revenue), null],
                borderColor: '#f97316',
                backgroundColor: '#f9731620',
                borderWidth: 2,
                pointBackgroundColor: '#f97316',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                tension: 0.3,
                fill: false,
                yAxisID: 'y1'
            },
            {
                label: 'AI Weekly Prediction',
                data: [null, null, null, null, salesData.aiPrediction?.nextWeekTickets || 0],
                borderColor: '#10b981',
                backgroundColor: '#10b98120',
                borderWidth: 2,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                borderDash: [5, 5],
                fill: false,
                yAxisID: 'y'
            },
            {
                label: 'AI Revenue Prediction (₱)',
                data: [null, null, null, null, salesData.aiPrediction?.nextWeekRevenue || 0],
                borderColor: '#8b5cf6',
                backgroundColor: '#8b5cf620',
                borderWidth: 2,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                borderDash: [5, 5],
                fill: false,
                yAxisID: 'y1'
            }
        ]
    };

    const currentData = viewMode === 'daily' ? dailySalesData : weeklySalesData;

    // Calculate totals from real data
    const currentWeekTickets = salesData.daily.reduce((sum: number, d: any) => sum + d.tickets, 0);
    const currentWeekRevenue = salesData.daily.reduce((sum: number, d: any) => sum + d.revenue, 0);
    const avgDailyTickets = salesData.summary.averageDailyTickets;
    const avgDailySales = salesData.summary.averageDailyRevenue;

    // AI performance statement from real analysis
    const getPerformanceStatement = () => {
        if (!salesData.aiPrediction ||
            salesData.aiPrediction.nextWeekRevenue === null ||
            salesData.aiPrediction.nextWeekRevenue === undefined ||
            salesData.aiPrediction.nextWeekTickets === null ||
            salesData.aiPrediction.nextWeekTickets === undefined ||
            isNaN(salesData.aiPrediction.nextWeekRevenue) ||
            isNaN(salesData.aiPrediction.nextWeekTickets)) {
            return 'Analyzing sales data...';
        }

        const confidence = salesData.aiPrediction.confidence || 0;
        const trendIcon = salesData.aiPrediction.trendDirection === 'increasing' ? '📈' :
            salesData.aiPrediction.trendDirection === 'decreasing' ? '📉' : '📊';

        return `${trendIcon} ${salesData.aiPrediction.insight} AI predicts ${salesData.aiPrediction.nextWeekTickets} tickets (${salesData.aiPrediction.growthRate >= 0 ? '+' : ''}${salesData.aiPrediction.growthRate}% growth) and ₱${salesData.aiPrediction.nextWeekRevenue.toLocaleString()} revenue. Confidence: ${confidence}%`;
    };

    return (
        <div className="flex flex-1 w-full h-full min-h-[6rem] p-2 ">
            <div className="flex flex-col w-full space-y-2">
                <div className="flex items-center justify-between">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button size="sm" className="h-6 w-6 p-0">
                                <Info className="h-3 w-3" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-neutral-900 border-neutral-700">
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-neutral-800 rounded p-2">
                                        <div className="text-gray-400">Week Total</div>
                                        <div className="text-white font-semibold">{currentWeekTickets} tickets</div>
                                        <div className="text-green-400">₱{currentWeekRevenue.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-neutral-800 rounded p-2">
                                        <div className="text-gray-400">Daily Average</div>
                                        <div className="text-white font-semibold">{avgDailyTickets} tickets</div>
                                        <div className="text-green-400">₱{avgDailySales.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="bg-neutral-800 rounded p-2">
                                    <div className="text-xs text-blue-400 font-medium mb-1">AI Performance Analysis</div>
                                    <div className="text-xs text-gray-300">{getPerformanceStatement()}</div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <div className="flex items-center space-x-2">
                        <Button
                            size="sm"
                            variant={viewMode === 'daily' ? 'default' : 'outline'}
                            onClick={() => setViewMode('daily')}
                            className="h-6 text-xs"
                        >
                            Daily
                        </Button>
                        <Button
                            size="sm"
                            variant={viewMode === 'weekly' ? 'default' : 'outline'}
                            onClick={() => setViewMode('weekly')}
                            className="h-6 text-xs"
                        >
                            Weekly
                        </Button>
                    </div>
                </div>

                <div className="flex-1 relative">
                    <Line data={currentData} options={lineChartOptions} />
                </div>

                <div className="flex items-center justify-center">
                    <div className="flex items-center space-x-3 text-xs">
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-[#fcd14f] rounded-full"></div>
                            <span className="text-white">Tickets</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-[#f97316] rounded-full"></div>
                            <span className="text-white">Revenue</span>
                        </div>
                        {viewMode === 'weekly' && (
                            <>
                                <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-[#10b981] rounded-full"></div>
                                    <span className="text-white">AI Tickets</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-[#8b5cf6] rounded-full"></div>
                                    <span className="text-white">AI Revenue</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesAnalyticsSkeleton;
