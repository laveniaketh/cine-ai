"use client";
import { cn } from "@/lib/utils";
import { BentoGrid, BentoGridItem } from "../ui/bento-grid";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import NowShowingSkeleton from "./NowShowingSkeleton";
import SeatMapSkeleton from "./SeatMapSkeleton";
import SalesAnalyticsSkeleton from "./SalesAnalyticsSkeleton";
import SeatsAvailabilitySkeleton from "./SeatsAvailabilitySkeleton";
import { LoaderOne } from "../ui/loader";
import { Suspense } from "react";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const BentoDashboard = () => {
    return (
        <Suspense fallback={<LoaderOne />}>
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

        </Suspense>

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
        title: "Seats Availability",
        description: "Real-time seat availability for current movies.",
        header: <SeatsAvailabilitySkeleton />,
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

