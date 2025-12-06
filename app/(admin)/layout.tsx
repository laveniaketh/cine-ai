import AdminNav from "@/components/AdminNav"

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="">
            <AdminNav />
            {children}
        </div>
    )
}
export default Layout
