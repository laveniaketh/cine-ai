import AdminNav from "@/components/AdminNav"
// import { Suspense } from "react"
// import Loading from "./loading"

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="">
            {/* <Suspense fallback={<Loading />}> */}
            <AdminNav />
            {children}
            {/* </Suspense> */}

        </div>
    )
}
export default Layout
