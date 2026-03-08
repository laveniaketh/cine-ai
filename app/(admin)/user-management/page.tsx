"use client"

import { useState, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Pencil, Trash2, Shield, ShieldCheck } from "lucide-react"
import AddUser from "@/components/user-management/AddUser"
import EditUser from "@/components/user-management/EditUser"

type User = {
    _id: string
    fullName: string
    email: string
    username: string
    role: "admin" | "cashier"
        phoneNumber?: string
    createdAt: string
}

const ROLE_CONFIG = {
    admin: {
        label: "Admin",
        icon: ShieldCheck,
        badgeClass: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        permissions: ["Dashboard", "Movies", "Tickets", "User Management"],
    },
    cashier: {
        label: "Cashier",
        icon: Shield,
        badgeClass: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        permissions: ["Dashboard", "Tickets"],
    },
}

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    // Edit user dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [deletingUser, setDeletingUser] = useState<User | null>(null)

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await fetch("/api/admin/users")
            const data = await response.json()

            if (response.ok) {
                setUsers(data.users)
            } else {
                setError(data.message)
            }
        } catch {
            setError("Failed to fetch users")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    // Auto-dismiss messages
    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [successMsg])

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000)
            return () => clearTimeout(timer)
        }
    }, [error])



    const handleDeleteUser = async () => {
        if (!deletingUser) return
        setDeleteLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/admin/users/${deletingUser._id}`, {
                method: "DELETE",
            })

            const data = await response.json()

            if (response.ok) {
                setSuccessMsg("User deleted successfully")
                setDeleteDialogOpen(false)
                setDeletingUser(null)
                await fetchUsers()
            } else {
                setError(data.message)
            }
        } catch {
            setError("Failed to delete user")
        } finally {
            setDeleteLoading(false)
        }
    }

    const openEditDialog = (user: User) => {
        setEditingUser(user)
        setEditDialogOpen(true)
    }

    const openDeleteDialog = (user: User) => {
        setDeletingUser(user)
        setDeleteDialogOpen(true)
    }

    // Filter users
    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
        const matchesRole = roleFilter === "all" || user.role === roleFilter
        return matchesSearch && matchesRole
    })

    if (loading) {
        return (
            <div className="p-4 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">User Management</h1>
                        <p className="text-gray-400">Manage users and roles</p>
                    </div>
                </div>

                <div className="dark:bg-neutral-800 rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-neutral-800">
                                <TableHead className="text-white font-semibold">#</TableHead>
                                <TableHead className="text-white font-semibold">Full Name</TableHead>
                                <TableHead className="text-white font-semibold">Username</TableHead>
                                <TableHead className="text-white font-semibold">Email</TableHead>
                                <TableHead className="text-white font-semibold">Role</TableHead>
                                <TableHead className="text-white font-semibold">Permissions</TableHead>
                                <TableHead className="text-white font-semibold">Created</TableHead>
                                <TableHead className="text-white font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index} className="border-neutral-700">
                                    <TableCell><div className="h-4 w-4 bg-neutral-700 rounded animate-pulse" /></TableCell>
                                    <TableCell><div className="h-4 w-28 bg-neutral-700 rounded animate-pulse" /></TableCell>
                                    <TableCell><div className="h-4 w-20 bg-neutral-700 rounded animate-pulse" /></TableCell>
                                    <TableCell><div className="h-4 w-40 bg-neutral-700 rounded animate-pulse" /></TableCell>
                                    <TableCell><div className="h-6 w-16 bg-neutral-700 rounded-full animate-pulse" /></TableCell>
                                    <TableCell><div className="flex gap-1"><div className="h-6 w-16 bg-neutral-700 rounded-full animate-pulse" /><div className="h-6 w-16 bg-neutral-700 rounded-full animate-pulse" /></div></TableCell>
                                    <TableCell><div className="h-4 w-24 bg-neutral-700 rounded animate-pulse" /></TableCell>
                                    <TableCell><div className="h-8 w-8 bg-neutral-700 rounded animate-pulse" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">User Management</h1>
                    <p className="text-gray-400">
                        Manage users and their access privileges ({users.length} total)
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex gap-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                            {users.filter(u => u.role === "admin").length} Admins
                        </span>
                        <span className="flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5 text-blue-400" />
                            {users.filter(u => u.role === "cashier").length} Cashiers
                        </span>
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {successMsg && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm">
                    {successMsg}
                </div>
            )}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Search, Filter, and Add User */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between dark:bg-neutral-800 p-4 rounded-lg border">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search by name, email, or username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-neutral-800 border-neutral-700 text-white placeholder-gray-400"
                        />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-40 bg-neutral-800 border-neutral-700 text-white">
                            <Shield className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Filter by Role" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700">
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="cashier">Cashier</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Add User Button */}
                <AddUser
                    onSuccess={() => {
                        setSuccessMsg("User created successfully")
                        fetchUsers()
                    }}
                    onError={(msg) => setError(msg)}
                />
            </div>

            {/* Users Table */}
            <div className="dark:bg-neutral-800 rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow className="border-neutral-800">
                            <TableHead className="text-white font-semibold">#</TableHead>
                            <TableHead className="text-white font-semibold">Full Name</TableHead>
                            <TableHead className="text-white font-semibold">Username</TableHead>
                            <TableHead className="text-white font-semibold">Email</TableHead>
                            <TableHead className="text-white font-semibold">Phone</TableHead>
                            <TableHead className="text-white font-semibold">Role</TableHead>
                            <TableHead className="text-white font-semibold">Permissions</TableHead>
                            <TableHead className="text-white font-semibold">Created</TableHead>
                            <TableHead className="text-white font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-gray-400 py-12">
                                    {searchTerm || roleFilter !== "all"
                                        ? "No users match your search criteria."
                                        : "No users found. Add one to get started."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user, index) => {
                                const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.cashier
                                const RoleIcon = roleConfig.icon
                                return (
                                    <TableRow key={user._id} className="border-neutral-700 hover:bg-neutral-700/50">
                                        <TableCell className="text-gray-300">{index + 1}</TableCell>
                                        <TableCell className="text-white font-medium">{user.fullName}</TableCell>
                                        <TableCell className="text-gray-300 font-mono text-sm">{user.username}</TableCell>
                                        <TableCell className="text-gray-300">{user.email}</TableCell>
                                        <TableCell className="text-gray-300">{user.phoneNumber || "-"}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={roleConfig.badgeClass}>
                                                <RoleIcon className="h-3 w-3" />
                                                {roleConfig.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {roleConfig.permissions.map((perm) => (
                                                    <Badge key={perm} variant="outline" className="text-gray-400 border-neutral-600 text-xs">
                                                        {perm}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-300 text-sm">
                                            {new Date(user.createdAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-neutral-800 border-neutral-700">
                                                    <DropdownMenuItem
                                                        onClick={() => openEditDialog(user)}
                                                        className="text-white hover:bg-neutral-700 cursor-pointer"
                                                    >
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit User
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => openDeleteDialog(user)}
                                                        className="text-red-400 hover:bg-neutral-700 cursor-pointer"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Role Privileges Reference */}
            <div className="dark:bg-neutral-800 rounded-lg border p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Role Privileges
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(Object.entries(ROLE_CONFIG) as [string, typeof ROLE_CONFIG.admin][]).map(([role, config]) => {
                        const Icon = config.icon
                        return (
                            <div key={role} className="bg-neutral-800 rounded-lg p-3 border border-neutral-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className="h-4 w-4 text-white" />
                                    <span className="text-white font-medium">{config.label}</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {config.permissions.map((perm) => (
                                        <Badge key={perm} variant="outline" className="text-gray-400 border-neutral-600 text-xs">
                                            {perm}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Edit User Dialog */}
            <EditUser
                user={editingUser}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onSuccess={() => {
                    setSuccessMsg("User updated successfully")
                    setEditingUser(null)
                    fetchUsers()
                }}
                onError={(msg) => setError(msg)}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="w-full max-w-md mx-auto bg-neutral-900 border-neutral-700 p-5 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="text-white">Delete User</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Are you sure you want to delete <span className="text-white font-medium">{deletingUser?.fullName}</span>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button variant="outline" className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteUser}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? "Deleting..." : "Delete User"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default UserManagement
