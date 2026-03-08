"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"
import { Shield, ShieldCheck, UserPlus } from "lucide-react"

interface AddUserProps {
    onSuccess: () => void
    onError: (message: string) => void
}

const AddUser = ({ onSuccess, onError }: AddUserProps) => {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        username: "",
        password: "",
        role: "cashier" as string,
        phoneNumber: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // simple phone format check before sending
            const phoneRegex = /^09\d{9}$/
            if (!phoneRegex.test(form.phoneNumber)) {
                onError("Phone number must be a valid Philippine mobile number")
                setLoading(false)
                return
            }

            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })

            const data = await response.json()

            if (response.ok) {
                setOpen(false)
                setForm({ fullName: "", email: "", username: "", password: "", role: "cashier", phoneNumber: "" })
                onSuccess()
            } else {
                onError(data.message)
            }
        } catch {
            onError("Failed to create user")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-white text-black hover:bg-gray-200">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-lg mx-auto bg-neutral-900 border-neutral-700 p-5 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="text-white">Add New User</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Create a user account and assign a role.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-3 py-1">
                        <div className="space-y-2">
                            <Label className="text-white">Full Name</Label>
                            <Input
                                value={form.fullName}
                                onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))}
                                placeholder="Enter full name"
                                required
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Email</Label>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="Enter email address"
                                required
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Username</Label>
                            <Input
                                value={form.username}
                                onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                                placeholder="Enter username"
                                required
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Phone Number</Label>
                            <Input
                                type="tel"
                                value={form.phoneNumber}
                                onChange={(e) => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                                placeholder="09XXXXXXXXX"
                                required
                                pattern="^09\d{9}$"
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                            <p className="text-xs text-gray-500">
                                Philippine mobile format (start with 09 followed by 9 digits).
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Password</Label>
                            <Input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                                placeholder="Minimum 6 characters"
                                required
                                minLength={6}
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Role</Label>
                            <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v }))}>
                                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700">
                                    <SelectItem value="admin">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-amber-400" />
                                            Admin — Full access
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="cashier">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-blue-400" />
                                            Cashier — Dashboard & Tickets
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">
                                {form.role === "admin"
                                    ? "Access: Dashboard, Movies, Tickets, User Management"
                                    : "Access: Dashboard, Tickets"}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" className="bg-white text-black hover:bg-gray-200" disabled={loading}>
                            {loading ? "Creating..." : "Create User"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default AddUser
