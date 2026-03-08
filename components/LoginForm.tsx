"use client"

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
import { useActionState } from "react"
import { login } from "@/app/actions/auth"

const LoginForm = () => {
    const [state, action, pending] = useActionState(login, undefined)

    return (
        <Card className="text-white relative overflow-hidden w-sm border-neutral-700 bg-neutral-800 border-none  justify-end-safe">
            <form action={action}>
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
                                        <Input
                                            id="username"
                                            name="username"
                                            type="text"
                                            placeholder="Write your username"
                                            required
                                            disabled={pending}
                                        />
                                    {state?.errors?.username && (
                                        <p className="text-sm text-red-500 mt-1">{state.errors.username}</p>
                                    )}
                                </Field>
                                    <Field>
                                        <FieldLabel htmlFor="password">Password</FieldLabel>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            placeholder="••••••••"
                                            required
                                            disabled={pending}
                                        />
                                        {state?.errors?.password && (
                                            <p className="text-sm text-red-500 mt-1">{state.errors.password}</p>
                                        )}
                                    </Field>
                                {state?.message && (
                                    <p className="text-sm text-red-500 mt-2">{state.message}</p>
                                )}
                            </FieldGroup>
                        </FieldSet>
                    </div>
                </CardContent >
                <CardFooter className="flex-col gap-2 mt-6">
                    <Button type="submit" className="w-full" disabled={pending}>
                        {pending ? "Logging in..." : "Login"}
                    </Button>
                    {/* <Link href="/login/admin/register" className="text-sm text-neutral-400 hover:text-white transition-colors">
                        Don't have an account? Register
                    </Link> */}
                </CardFooter>

            </form>
        </Card >
    )
}

export default LoginForm
