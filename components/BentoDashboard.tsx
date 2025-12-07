"use client";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { BentoGrid, BentoGridItem } from "./ui/bento-grid";
import { motion } from "motion/react";
import Image from "next/image";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { Info } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

// Chart configuration - moved outside component for better performance
const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'left' as const,
            labels: {
                color: '#ffffff',
                font: {
                    size: 14,
                    family: 'Figtree',
                },
                padding: 15,
                usePointStyle: true,
                pointStyle: 'circle'
            }
        },
        tooltip: {
            backgroundColor: '#1f2937',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#4b5563',
            borderWidth: 1
        }
    }
};

// Line chart configuration for sales prediction
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

// DropdownMenu
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button";


//popover
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"


const BentoDashboard = () => {
    return (
        <BentoGrid className=" mx-auto md:auto-rows-[20rem] mt-10 font-figtree">
            {items.map((item, i) => (
                <BentoGridItem
                    key={i}
                    title={item.title}
                    description={item.description}
                    header={item.header}
                    className={cn("[&>p:text-lg]", item.className)}
                // icon={item.icon}
                />
            ))}
        </BentoGrid>
    )
}
export default BentoDashboard
const SkeletonTwo = () => {
    const [selectedMovie, setSelectedMovie] = useState("Movie 1");

    // Mock seat data - in real app, this would come from API
    const seatData = {
        "A1": 0, "A2": 0, "A3": 0, "A4": 0, "A5": 0, "A6": 0, "A7": 0, "A8": 0,
        "B1": 0, "B2": 1, "B3": 0, "B4": 0, "B5": 0, "B6": 0, "B7": 0, "B8": 0, "B9": 0, "B10": 0,
        "C1": 0, "C2": 0, "C3": 0, "C4": 0, "C5": 0, "C6": 1, "C7": 0, "C8": 0, "C9": 0, "C10": 0, "C11": 0, "C12": 0,
        "D1": 0, "D2": 0, "D3": 0, "D4": 0, "D5": 2, "D6": 0, "D7": 2, "D8": 0, "D9": 0, "D10": 0, "D11": 1, "D12": 0,
        "E1": 0, "E2": 0, "E3": 0, "E4": 0, "E5": 0, "E6": 1, "E7": 0, "E8": 0, "E9": 0, "E10": 0, "E11": 0, "E12": 0,
        "F1": 0, "F2": 0, "F3": 0, "F4": 0, "F5": 2, "F6": 0, "F7": 2, "F8": 0, "F9": 2, "F10": 0, "F11": 0, "F12": 0,
        "G1": 0, "G2": 0, "G3": 0, "G4": 0, "G5": 0, "G6": 0, "G7": 1, "G8": 0, "G9": 0, "G10": 2, "G11": 0, "G12": 0, "G13": 0, "G14": 0,
        "H1": 0, "H2": 0, "H3": 0, "H4": 0, "H5": 0, "H6": 0, "H7": 0, "H8": 0, "H9": 0, "H10": 0, "H11": 0, "H12": 0, "H13": 0, "H14": 0
    };

    // Seat layout configuration - number of seats per row
    const seatLayout = [
        8,   // Row A: 8 seats
        10,  // Row B: 10 seats
        12,  // Row C: 12 seats
        12,  // Row D: 12 seats
        12,  // Row E: 12 seats
        12,  // Row F: 12 seats
        14,  // Row G: 14 seats
        14   // Row H: 14 seats
    ];

    const getSeatColor = (status: number) => {
        switch (status) {
            case 0: return "bg-[#fcd14f]"; // Available
            case 1: return "bg-[#666761]"; // Pending
            case 2: return "bg-[#cacac1]"; // Booked
            default: return "bg-orange-200";
        }
    };

    const getSeatStatus = (rowIndex: number, seatIndex: number) => {
        const rowLetter = String.fromCharCode(65 + rowIndex); // A, B, C, etc.
        const seatNumber = seatIndex + 1;
        const seatId = `${rowLetter}${seatNumber}`;
        return seatData[seatId] || 0; // Default to available if not found
    };

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center ">
            {/* Movie Selector Dropdown */}
            <div className="absolute top-2 left-2 z-10" >
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" >Movie 1</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>Movie 1</DropdownMenuItem>
                        <DropdownMenuItem>Movie 2</DropdownMenuItem>
                        <DropdownMenuItem>Movie 3</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div >

            <div className="flex flex-col items-center w-full mt-6">
                {/* Screen */}
                <div className="flex flex-col items-center">
                    <div className="w-50 h-1 bg-neutral-900 rounded-full flex items-center justify-center m-2">

                    </div>
                    <span className="text-xs text-white font-medium mb-2">Screen</span>
                </div>
                {/* Seat Layout */}
                <div className="flex flex-col items-center space-y-2">
                    {seatLayout.map((seatsInRow, rowIndex) => (
                        <div key={rowIndex} className="flex items-center space-x-2">
                            {/* Row Label */}
                            <div className="w-4 flex justify-center">
                                <span className="text-xs text-white font-medium">
                                    {String.fromCharCode(65 + rowIndex)}
                                </span>
                            </div>

                            {/* Seats in this row */}
                            <div className="flex space-x-2">
                                {Array.from({ length: seatsInRow }).map((_, seatIndex) => {
                                    const seatStatus = getSeatStatus(rowIndex, seatIndex);
                                    const seatId = `${String.fromCharCode(65 + rowIndex)}${seatIndex + 1}`;

                                    return (
                                        <div
                                            key={seatIndex}
                                            title={seatId}
                                            className={`w-4 h-4 rounded-xs transition-colors cursor-pointer hover:opacity-80 ${getSeatColor(seatStatus)}`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center space-x-4 mt-4 text-xs">
                    <div className="flex items-center space-x-1 ">
                        <div className="w-3 h-3 bg-[#fcd14f] rounded-xs"></div>
                        <span className="text-white">Available</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-[#666761] rounded-xs"></div>
                        <span className="text-white">Pending</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-[#cacac1] rounded-xs"></div>
                        <span className="text-white">Booked</span>
                    </div>
                </div>
            </div>
        </div>

    );
};

const SkeletonOne = () => {
    const first = {
        initial: {
            x: 20,
            rotate: -5,
        },
        hover: {
            x: 0,
            rotate: 0,
        },
    };
    const second = {
        initial: {
            x: -20,
            rotate: 5,
        },
        hover: {
            x: 0,
            rotate: 0,
        },
    };
    return (
        <motion.div
            initial="initial"
            animate="animate"
            whileHover="hover"
            className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-row space-x-3 p-3"
        >
            <motion.div
                variants={first}
                className="h-full w-1/3 rounded-2xl bg-white dark:bg-black dark:border-white/[0.1] border border-neutral-200 relative overflow-hidden"
            >
                <Image
                    src="https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop"
                    alt="Movie 2"
                    fill
                    className="object-cover"
                />
                <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg z-10">
                    <span className="text-white font-bold text-sm">2</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-sm text-white font-semibold">
                        Movie 2
                    </p>
                </div>
            </motion.div>
            <motion.div className="h-full relative z-20 w-1/3 rounded-2xl bg-white dark:bg-black dark:border-white/[0.1] border border-neutral-200 relative overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop"
                    alt="Movie 1"
                    fill
                    className="object-cover"
                />
                <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg z-10">
                    <span className="text-white font-bold text-sm">1</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-sm text-white font-semibold">
                        Movie 1
                    </p>
                </div>
            </motion.div>
            <motion.div
                variants={second}
                className="h-full w-1/3 rounded-2xl bg-white dark:bg-black dark:border-white/[0.1] border border-neutral-200 relative overflow-hidden"
            >
                <Image
                    src="https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop"
                    alt="Movie 3"
                    fill
                    className="object-cover"
                />
                <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-r from-amber-600 to-amber-800 rounded-full flex items-center justify-center shadow-lg z-10">
                    <span className="text-white font-bold text-sm">3</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-sm text-white font-semibold">
                        Movie 3
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

const SkeletonThree = () => {
    // Age range data - percentages with theme-aligned colors
    const ageData = {
        labels: ['18-25 yrs old', '26-35 yrs old', '36-45 yrs old', '46-55 yrs old', '55+ yrs old'],
        datasets: [
            {
                data: [35, 28, 22, 10, 5],
                backgroundColor: [
                    '#fcd14f', // Yellow - matches cinema theme
                    '#f97316', // Orange
                    '#666761', // Dark gray
                    '#cacac1', // Light gray
                    '#a3a3a3'  // Lighter gray
                ],
                borderWidth: 0,
                hoverOffset: 4
            }
        ]
    };

    return (
        <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl p-2 ">
            <div className="flex-1 relative font-figtree">
                <Pie data={ageData} options={pieChartOptions} />
            </div>
        </div>
    );
};

const SkeletonFour = () => {
    const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'weekly'

    // Daily sales data - last 7 days actual + AI predicted weekly sales
    const dailySalesData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Daily Ticket Sales',
                data: [245, 189, 167, 203, 298, 421, 389],
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
                data: [36750, 28350, 25050, 30450, 44700, 63150, 58350],
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

    // Weekly sales data - last 4 weeks + AI prediction
    const weeklySalesData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'AI Prediction'],
        datasets: [
            {
                label: 'Weekly Ticket Sales',
                data: [1823, 1967, 1912, 1847, null],
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
                data: [273450, 295050, 286800, 277050, null],
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
                data: [null, null, null, null, 1925],
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
                data: [null, null, null, null, 288750],
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

    // Calculate totals
    const currentWeekTickets = dailySalesData.datasets[0].data.reduce((sum, val) => sum + val, 0);
    const currentWeekRevenue = dailySalesData.datasets[1].data.reduce((sum, val) => sum + val, 0);
    const avgDailyTickets = Math.round(currentWeekTickets / 7);
    const avgDailySales = Math.round(currentWeekRevenue / 7);

    // AI performance statement
    const getPerformanceStatement = () => {
        if (avgDailyTickets >= 250) {
            return `Strong performance! At ${avgDailyTickets} tickets/day average, AI predicts sustained growth with 1,925 tickets next week.`;
        } else if (avgDailyTickets >= 200) {
            return `Stable performance. Maintaining ${avgDailyTickets} tickets/day, AI forecasts 1,925 tickets for next week.`;
        } else {
            return `Below target. Current ${avgDailyTickets} tickets/day needs improvement. AI suggests promotional strategies.`;
        }
    };

    return (
        <div className="flex flex-1 w-full h-full min-h-[6rem] p-2 ">
            <div className="flex flex-col w-full space-y-2">
                <div className="flex items-center justify-between">
                    {/* <div>
                        <h3 className="text-white text-sm font-semibold">Sales Analytics & AI Prediction</h3>
                        <p className="text-xs text-gray-400">Real-time ticket & revenue tracking</p>
                    </div> */}
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

// const Skeleton = () => (
//     //display p[]
//     <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl   dark:bg-dot-white/[0.2] bg-dot-black/[0.2]  bg-neutral-100 dark:bg-neutral-800"></div>
// );

const items = [
    {
        title: "Top 3 Most Watched Films",
        description: "The most popular movies trending this week in cinema.",
        header: <SkeletonOne />,
        className: "md:col-span-2",
    },
    {

        header: <SkeletonTwo />,
        className: "md:col-span-1",
    },
    {
        title: "Age Range for People Who Goes to Cinema",
        description: "Age groups that visit the  cinema most frequently.",
        header: <SkeletonThree />,
        className: "md:col-span-1",
    },
    {
        title: "Sales Analytics & AI Prediction",
        description: "Real-time ticket & revenue tracking",
        header: <SkeletonFour />,
        className: "md:col-span-2",
    },
];


