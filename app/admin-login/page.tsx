import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import CircularText from "@/components/CircularText"

const AdminLogin = () => {
    return (
        <div className='flex flex-col relative items-center space-y-7 mx-auto justify-center '>
            <div className='flex items-center'>

                <h1 className='text-gradient text-center text-9xl font-extrabold font-figtree '>Cine<span
                    className='text-white mr-2'>Al</span></h1>
                <Image src="/big-logo.png" alt="CineAI Logo" width={150} height={150} className="rotate-10" />

            </div>


            <div className="relative flex w-250 h-100 items-center justify-center bg-[#1b1a16] rounded-lg shadow-md shadow-gray-700 border-none ">

                {/* POPCORN Circulartext DESIGN */}
                <div className="absolute -bottom-12 -left-12 transform -rotate-6 pointer-events-none z-0 bg-contain ">
                    <div className="relative w-[320px] h-80">
                        <CircularText
                            text="REACT*BITS*COMPONENTS*"
                            onHover="slowDown"
                            spinDuration={20}
                            className=""
                        />
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <Image src="/popcorn-box (1).png" alt="Admin Icon" width={200} height={200} className="-rotate-6" />
                        </div>
                    </div>
                </div>





                {/* LOGIN FORM */}
                <Card className="text-white relative overflow-hidden w-sm bg-[#1b1a16] border-none  justify-end-safe">

                    <CardHeader className="text-center">



                        <CardTitle className="text-xl mt-4">
                            CineAi Management System


                        </CardTitle>
                        <CardDescription>
                            Login to your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent >
                        {/* <div
                            className="absolute -bottom-8 -right-20 bg-no-repeat bg-contain opacity-15 rotate-6 pointer-events-none z-0"
                        >
                            <Image src="/popcorn-box (1).png" alt="Admin Icon" width={380} height={380} />
                        </div> */}



                        <div className="relative z-10">
                            <FieldSet>
                                <FieldGroup >
                                    <Field>
                                        <FieldLabel htmlFor="username">Username</FieldLabel>
                                        <Input id="username" type="text" placeholder="Write your username" className="bg-[#1b1a16]" />

                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="password">Password</FieldLabel>

                                        <Input id="password" type="password" placeholder="••••••••" className="bg-[#1b1a16]" />
                                    </Field>
                                </FieldGroup>
                            </FieldSet>
                        </div>
                    </CardContent >
                    <CardFooter className="flex-col gap-2 z-10">
                        <Button type="submit" className="w-full">
                            Login
                        </Button>
                        {/* <Button variant="outline" className="w-full">
                        Sign Up
                    </Button> */}
                    </CardFooter>
                </Card >


            </div>





        </div >
    )
}
export default AdminLogin
