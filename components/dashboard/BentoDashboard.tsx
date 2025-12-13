"use client";
import { cn } from "@/lib/utils";
import React from "react";
import { BentoGrid, BentoGridItem } from "../ui/bento-grid";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import NowShowingSkeleton from "./NowShowingSkeleton";
import SeatMapSkeleton from "./SeatMapSkeleton";
import AgeRangeSkeleton from "./AgeRangeSkeleton";
import SalesAnalyticsSkeleton from "./SalesAnalyticsSkeleton";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

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
                />
            ))}
        </BentoGrid>
    )
}

const items = [
    {
        title: "Now Showing",
        description: "Currently playing movies this week.",
        header: <NowShowingSkeleton />,
        className: "md:col-span-2",
    },
    {
        header: <SeatMapSkeleton />,
        className: "md:col-span-1",
    },
    {
        title: "Age Range for People Who Goes to Cinema",
        description: "Age groups that visit the  cinema most frequently.",
        header: <AgeRangeSkeleton />,
        className: "md:col-span-1",
    },
    {
        title: "Sales Analytics & AI Prediction",
        description: "Real-time ticket & revenue tracking",
        header: <SalesAnalyticsSkeleton />,
        className: "md:col-span-2",
    },
];

export default BentoDashboard


