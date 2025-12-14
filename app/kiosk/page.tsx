import Image from 'next/image'
import Link from 'next/link'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'

const Hero = () => {
    return (
        <div className="flex flex-col relative items-center mx-auto my-auto justify-center ">
            <div className='flex flex-col items-center justify-center text-center relative'>
                {/* Banner positioned behind the CineAI logo */}
                <div className="absolute top-35 left-1/2 -translate-x-1/2 -z-10 scale-[3.5]">
                    <Image
                        src="/banner2.png"
                        alt="Hero Banner"
                        width={4000}
                        height={600}
                        className="w-full h-auto object-contain opacity-80"
                    />
                </div>

                <div className='flex items-center justify-center mt-50 '>
                    <h1 className='text-gradient text-center text-[200px] font-extrabold font-figtree '>Cine<span
                        className='text-white mr-2'>Al</span></h1>
                    <Image src="/big-logo.png" alt="CineAI Logo" width={150} height={150} className="rotate-10" />
                </div>
                <p className="text-lg font-light text-white dark:te xt-[#777777] max-w-3xl ">
                    A CAREFULLY CURATED FILMS FOR ALL
                </p>
                <p className="text-lg font-light text-white dark:text-[#777777] max-w-3xl mb-4 ">
                    showcases independent, classic, and world cinema, serving as a
                    hub for film communities to nurture local filmmakers and support
                    local stories and narratives.
                </p>
                <Link href="kiosk/movie-selection">
                    <HoverBorderGradient
                        containerClassName="rounded-xl"
                        as="button"
                        className="border dark:bg-neutral-800 shadow-xs hover:bg-accent   dark:border-input dark:hover:bg-input/50 flex items-center text-2xl px-8 py-2 h-auto rounded-xl"
                    >
                        <span>Buy Ticket</span>
                    </HoverBorderGradient>
                </Link>


            </div>


        </div>
    )
}

export default Hero

