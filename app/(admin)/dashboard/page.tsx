import BentoDashboard from "@/components/dashboard/BentoDashboard"
import { LoaderOne } from "@/components/ui/loader"
import { Suspense } from "react"

const Dashboard = () => {
    return (
        <div className="p-4 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Overview</h1>
                <p className="text-gray-400">Track  cinema&apos;s performance with real-time analytics and insights</p>
            </div>
            <Suspense fallback={<LoaderOne />}>
                <BentoDashboard />
            </Suspense>

        </div>
    )
}
export default Dashboard
