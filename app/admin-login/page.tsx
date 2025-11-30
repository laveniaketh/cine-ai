import {Button} from "@/components/ui/button"
import {
    Card,
    CardAction,
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
import {Input} from "@/components/ui/input"

const AdminLogin = () => {
    return (
        <div className='flex flex-col relative items-center space-y-10 mx-auto justify-center '>
            <div className='flex items-center'>

                <h1 className='text-gradient text-center text-9xl font-extrabold font-figtree '>Cine<span
                    className='text-white mr-2'>Al</span></h1>
                <img src="/big-logo.png" alt="logo" className="w-40 h-40 rotate-10"/>

            </div>



            <Card className="w-full max-w-sm  bg-gray-950 bg-clip-padding backdrop-filter  backdrop-blur-none bg-opacity-0 backdrop-saturate-100 backdrop-contrast-75">
                <CardHeader>
                    <CardTitle>Welcome</CardTitle>
                    <CardDescription>
                        Enter your username below to login to your account
                    </CardDescription>
                    {/*<CardAction>*/}
                    {/*    <Button variant="link">Sign Up</Button>*/}
                    {/*</CardAction>*/}
                </CardHeader>
                <CardContent>
                    <FieldSet>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="username">Username</FieldLabel>
                                <Input id="username" type="text" placeholder="Write your username"/>

                            </Field>
                            <Field>
                                <FieldLabel htmlFor="password">Password</FieldLabel>

                                <Input id="password" type="password" placeholder="••••••••"/>
                            </Field>
                        </FieldGroup>
                    </FieldSet>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                    <Button type="submit" className="w-full">
                        Login
                    </Button>
                    <Button variant="outline" className="w-full">
                        Sign Up
                    </Button>
                </CardFooter>
            </Card>


        </div>
    )
}
export default AdminLogin
