import Image from "next/image"
import LoginForm from "@/components/LoginForm"
const Page = () => {
    return (
        <div className='flex flex-col relative items-center space-y-12 mx-auto justify-center'>
            <div className='flex items-center'>
                <h1 className='text-gradient text-center text-[200px] font-extrabold font-figtree '>Cine<span
                    className='text-white mr-2'>Al</span></h1>
                <Image src="/big-logo.png" alt="CineAI Logo" width={150} height={150} className="rotate-10" />
            </div>

            <div className="relative flex items-center justify-center bg-neutral-800 rounded-lg ">
                <LoginForm />

            </div>




        </div >
    )
}
export default Page
