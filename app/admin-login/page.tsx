
import Image from "next/image"
import CircularText from "@/components/CircularText"
import LoginForm from "@/components/LoginForm"

const AdminLogin = () => {
    return (
        <div className='flex flex-col relative items-center space-y-12 mx-auto justify-center'>
            <div className='flex items-center'>
                <h1 className='text-gradient text-center text-[200px] font-extrabold font-figtree '>Cine<span
                    className='text-white mr-2'>Al</span></h1>
                <Image src="/big-logo.png" alt="CineAI Logo" width={150} height={150} className="rotate-10" />
            </div>

            <div className="relative flex items-center justify-center bg-neutral-800 rounded-lg ">
                {/* POPCORN Circulartext DESIGN */}
                {/* <div className="absolute -bottom-12 -left-12 transform -rotate-6 pointer-events-none z-0 bg-contain ">
                    <div className="relative w-[320px] h-80">
                        <CircularText
                            text="CINEMATHEQUE★DAVAO★"
                            onHover="slowDown"
                            spinDuration={20}
                            className=""
                        />
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <Image src="/popcorn-box (1).png" alt="Admin Icon" width={200} height={200} className="-rotate-6" />
                        </div>
                    </div>
                </div> */}
                {/* LOGIN FORM */}
                <LoginForm />

            </div>





        </div >
    )
}
export default AdminLogin
