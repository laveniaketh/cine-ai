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
import { signup } from "@/app/actions/auth"
import Link from "next/link"

const RegisterForm = () => {
    const [state, action, pending] = useActionState(signup, undefined)

    return (
        <Card className="text-white relative overflow-hidden w-sm border-neutral-700 bg-neutral-800 border-none">
            <form action={action}>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl mt-4">
                        Create Admin Account
                    </CardTitle>
                    <CardDescription>
                        Register a new admin account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative z-1">
                        <FieldSet>
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                                    <Input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        placeholder="Enter your full name"
                                        required
                                        disabled={pending}
                                    />
                                    {state?.errors?.fullName && (
                                        <p className="text-sm text-red-500 mt-1">{state.errors.fullName}</p>
                                    )}
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="email">Email</FieldLabel>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        required
                                        disabled={pending}
                                    />
                                    {state?.errors?.email && (
                                        <p className="text-sm text-red-500 mt-1">{state.errors.email}</p>
                                    )}
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="username">Username</FieldLabel>
                                    <Input
                                        id="username"
                                        name="username"
                                        type="text"
                                        placeholder="Choose a username"
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
                </CardContent>
                <CardFooter className="flex-col gap-2 mt-4">
                    <Button type="submit" className="w-full" disabled={pending}>
                        {pending ? "Creating Account..." : "Create Account"}
                    </Button>
                    <Link href="/login/admin" className="text-sm text-neutral-400 hover:text-white transition-colors">
                        Already have an account? Login
                    </Link>
                </CardFooter>
            </form>
        </Card>
    )
}

export default RegisterForm
