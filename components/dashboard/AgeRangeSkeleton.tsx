"use client";
import React from "react";
import { Pie } from 'react-chartjs-2';

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

const AgeRangeSkeleton = () => {
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

export default AgeRangeSkeleton;
