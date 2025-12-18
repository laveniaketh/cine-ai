import { LoaderOne } from '@/components/ui/loader'


const Loading = () => {
    return (
        <div className="fixed inset-0 w-screen h-screen overflow-hidden flex items-center justify-center">
            <LoaderOne />
        </div>
    )
}

export default Loading
