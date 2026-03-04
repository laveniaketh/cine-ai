"use client"

import { useState, useEffect } from "react"
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
    DialogClose,
} from "@/components/ui/dialog"
import { Shield, ShieldCheck } from "lucide-react"

type User = {
    _id: string
    fullName: string
    email: string
    username: string
    role: "admin" | "cashier"
    createdAt: string
}

interface EditUserProps {
    user: User | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    onError: (message: string) => void
}

const EditUser = ({ user, open, onOpenChange, onSuccess, onError }: EditUserProps) => {
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        username: "",
        password: "",
        role: "cashier" as string,
    })

    useEffect(() => {
        if (user) {
            setForm({
                fullName: user.fullName,
                email: user.email,
                username: user.username,
                password: "",
                role: user.role,
            })
        }
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setLoading(true)

        try {
            const payload: Record<string, string> = {}
            if (form.fullName !== user.fullName) payload.fullName = form.fullName
            if (form.email !== user.email) payload.email = form.email
            if (form.username !== user.username) payload.username = form.username
            if (form.role !== user.role) payload.role = form.role
            if (form.password) payload.password = form.password

            if (Object.keys(payload).length === 0) {
                onOpenChange(false)
                return
            }

            const response = await fetch(`/api/admin/users/${user._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            const data = await response.json()

            if (response.ok) {
                onOpenChange(false)
                onSuccess()
            } else {
                onError(data.message)
            }
        } catch {
            onError("Failed to update user")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[50vw] overflow-y-auto bg-neutral-900 border-neutral-700">
                <DialogHeader>
                    <DialogTitle className="text-white">Edit User</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Update user details and role for {user?.fullName}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-white">Full Name</Label>
                            <Input
                                value={form.fullName}
                                onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))}
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
                                required
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Username</Label>
                            <Input
                                value={form.username}
                                onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                                required
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">New Password (leave blank to keep current)</Label>
                            <Input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                                placeholder="••••••••"
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
                            <p className="text-xs text-gray-500 mt-1">
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
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default EditUser
