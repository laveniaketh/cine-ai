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

const LoginForm = () => {
    return (
        <Card className="text-white relative overflow-hidden w-sm bg-[#2c2a26] border-none  justify-end-safe">

            <CardHeader className="text-center">
                <CardTitle className="text-xl mt-4">
                    CineAi Management System
                </CardTitle>
                <CardDescription>
                    Login to your account
                </CardDescription>
            </CardHeader>
            <CardContent >
                <div className="relative z-1">
                    <FieldSet>
                        <FieldGroup >
                            <Field>
                                <FieldLabel htmlFor="username">Username</FieldLabel>
                                <Input id="username" type="text" placeholder="Write your username" />

                            </Field>
                            <Field>
                                <FieldLabel htmlFor="password">Password</FieldLabel>

                                <Input id="password" type="password" placeholder="••••••••" />
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
    )
}

export default LoginForm
