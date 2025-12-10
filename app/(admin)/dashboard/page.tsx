import BentoDashboard from "@/components/BentoDashboard"

const Dashboard = () => {
    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Overview</h1>
                <p className="text-gray-400">Track  cinema&apos;s performance with real-time analytics and insights</p>
            </div>
            <BentoDashboard />
        </div>
    )
}
export default Dashboard
