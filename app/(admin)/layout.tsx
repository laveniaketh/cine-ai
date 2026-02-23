import AdminNav from "@/components/AdminNav"
import { verifySession } from "@/lib/dal"

const Layout = async ({ children }: { children: React.ReactNode }) => {
    const session = await verifySession()

    return (
        <div className="">
            <AdminNav role={session.role} />
            {children}
        </div>
    )
}
export default Layout
