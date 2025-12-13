

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
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Filter, ArrowUpDown, ChevronDown, BadgeCheckIcon } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

type TicketData = {
    id: string
    date: string
    time: string
    seats: string[]
    qty: number
    total: number
    status: "paid" | "pending" | "cancelled" | "refunded"
    platform: "website" | "kiosk"
    paymentMethod: "online" | "cash"
    createdAt: Date
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case "paid":
            return <Badge
                variant="secondary"
                className=" text-white dark:bg-green-900"
            >
                <BadgeCheckIcon />
                Paid
            </Badge>
        case "pending":
            return <Badge variant="secondary" >Pending</Badge>
        case "cancelled":
            return <Badge variant="destructive" >Cancelled</Badge>
        case "refunded":
            return <Badge variant="default" >Refunded</Badge>
        default:
            return <Badge variant="default" >{status}</Badge>
    }
}

const Tickets = () => {
    const [activeTab, setActiveTab] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [sortBy, setSortBy] = useState("date")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
    const [tickets, setTickets] = useState<TicketData[]>([])
    const [currentTime, setCurrentTime] = useState(new Date())
    const [loading, setLoading] = useState(true)
    const itemsPerPage = 8

    // Fetch tickets from database
    const fetchTickets = async () => {
        try {
            setLoading(true)
            const response = await fetch("/api/tickets")
            const data = await response.json()

            if (response.ok && data.tickets) {
                // Transform API data to match component format
                const transformedTickets: TicketData[] = data.tickets.map((ticket: any) => {
                    const createdDate = new Date(ticket.createdAt)
                    return {
                        id: `TKT-${String(ticket.ticket_id).padStart(3, '0')}`,
                        date: createdDate.toISOString().split('T')[0],
                        time: createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                        seats: ticket.reservedSeats || [],
                        qty: ticket.reservedSeats?.length || 0,
                        total: ticket.payment?.paymentAmount || 0,
                        status: ticket.payment?.paymentStatus || "pending",
                        platform: ticket.platform || "website",
                        paymentMethod: ticket.platform === "kiosk" ? "cash" : "online",
                        createdAt: createdDate
                    }
                })
                setTickets(transformedTickets)
            }
        } catch (error) {
            console.error("Failed to fetch tickets:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTickets()
    }, [])

    // Auto-cancel expired kiosk payments
    useEffect(() => {
        const cancelExpiredTicket = async (ticketId: string) => {
            const numericId = parseInt(ticketId.replace("TKT-", ""))
            try {
                await fetch(`/api/tickets/${numericId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentStatus: "cancelled" }),
                })
            } catch (error) {
                console.error("Failed to auto-cancel ticket:", error)
            }
        }

        const timer = setInterval(() => {
            setCurrentTime(new Date())
            setTickets(prevTickets =>
                prevTickets.map(ticket => {
                    if (
                        ticket.status === "pending" &&
                        ticket.platform === "kiosk" &&
                        ticket.paymentMethod === "cash"
                    ) {
                        const timeDiff = (Date.now() - ticket.createdAt.getTime()) / (1000 * 60)
                        if (timeDiff >= 20) {
                            // Call API to update status in database
                            cancelExpiredTicket(ticket.id)
                            return { ...ticket, status: "cancelled" as const }
                        }
                    }
                    return ticket
                })
            )
        }, 1000) // Update every second

        return () => clearInterval(timer)
    }, [])

    // Calculate remaining time for kiosk cash payments
    const getRemainingTime = (ticket: any) => {
        if (
            ticket.status !== "pending" ||
            ticket.platform !== "kiosk" ||
            ticket.paymentMethod !== "cash"
        ) {
            return null
        }

        const timeDiff = (currentTime.getTime() - ticket.createdAt.getTime()) / (1000 * 60)
        const remainingMinutes = Math.max(0, 20 - timeDiff)
        const minutes = Math.floor(remainingMinutes)
        const seconds = Math.floor((remainingMinutes - minutes) * 60)

        if (remainingMinutes <= 0) return "Expired"
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    // Filter and search tickets
    const filteredTickets = tickets.filter((ticket) => {
        const matchesTab =
            activeTab === "all" ? true :
                activeTab === "kiosk" ? ticket.platform === "kiosk" :
                    activeTab === "website" ? ticket.platform === "website" : true
        const matchesSearch =
            ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.seats.some(seat => seat.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
        return matchesTab && matchesSearch && matchesStatus
    })

    // Sort tickets
    const sortedTickets = [...filteredTickets].sort((a, b) => {
        let comparison = 0
        switch (sortBy) {
            case "date":
                comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
                break
            case "total":
                comparison = a.total - b.total
                break
            case "qty":
                comparison = a.qty - b.qty
                break
            case "ticketId":
                comparison = a.id.localeCompare(b.id)
                break
            default:
                comparison = 0
        }
        return sortOrder === "asc" ? comparison : -comparison
    })

    const totalPages = Math.ceil(sortedTickets.length / itemsPerPage)

    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentTickets = sortedTickets.slice(startIndex, endIndex)

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    const handleStatusChange = async (ticketId: string, newStatus: string) => {
        // Extract numeric ticket_id from formatted string (e.g., "TKT-001" -> 1)
        const numericId = parseInt(ticketId.replace("TKT-", ""))

        try {
            const response = await fetch(`/api/tickets/${numericId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ paymentStatus: newStatus }),
            })

            if (response.ok) {
                // Refetch tickets to get updated data from server
                await fetchTickets()
            } else {
                const data = await response.json()
                console.error("Failed to update status:", data.message)
            }
        } catch (error) {
            console.error("Error updating payment status:", error)
        }
    }

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortBy(field)
            setSortOrder("asc")
        }
        setCurrentPage(1)
    }

    const handleTabChange = (value: string) => {
        setActiveTab(value)
        setCurrentPage(1)
        setSearchTerm("")
        setStatusFilter("all")
    }

    if (loading) {
        return (
            <div className="p-4 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Ticket Orders</h1>
                        <p className="text-gray-400">Manage and track all ticket orders</p>
                    </div>
                </div>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Ticket Orders</h1>
                    <p className="text-gray-400 ">Manage and track all ticket orders</p>
                </div>
                <div className="text-sm text-gray-400">
                    Showing {startIndex + 1}-{Math.min(endIndex, sortedTickets.length)} of {sortedTickets.length} orders
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="dark:bg-neutral-800 border ">
                    <TabsTrigger value="all" className="data-[state=active]:bg-neutral-900  text-white">
                        All Orders ({tickets.length})
                    </TabsTrigger>
                    <TabsTrigger value="kiosk" className="data-[state=active]:bg-neutral-900 text-white">
                        Kiosk Orders ({tickets.filter(t => t.platform === "kiosk").length})
                    </TabsTrigger>
                    <TabsTrigger value="website" className="data-[state=active]:bg-neutral-900 text-white">
                        Website Orders ({tickets.filter(t => t.platform === "website").length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4 space-y-6">

                    {/* Search and Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between dark:bg-neutral-800 p-4 rounded-lg border ">
                        <div className="flex flex-col sm:flex-row gap-3 flex-1">
                            {/* Search Input */}
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search by Ticket ID or Seat..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="pl-9 bg-neutral-800 border-neutral-700 text-white placeholder-gray-400"
                                />
                            </div>

                            {/* Status Filter */}
                            <Select value={statusFilter} onValueChange={(value) => {
                                setStatusFilter(value)
                                setCurrentPage(1)
                            }}>
                                <SelectTrigger className="w-40 bg-neutral-800 border-neutral-700 text-white">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Filter by Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Sort Options */}
                        <div className="flex gap-2">
                            <Select value={sortBy} onValueChange={(value) => {
                                setSortBy(value)
                                setCurrentPage(1)
                            }}>
                                <SelectTrigger className="w-40 bg-neutral-800 border-neutral-700 text-white">
                                    <ArrowUpDown className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700">
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="total">Amount</SelectItem>
                                    <SelectItem value="qty">Quantity</SelectItem>
                                    <SelectItem value="ticketId">Ticket ID</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                                className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700"
                            >
                                {sortOrder === "asc" ? "↑" : "↓"}
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="dark:bg-neutral-800 rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-neutral-800 ">
                                    <TableHead className="text-white font-semibold">#</TableHead>
                                    <TableHead
                                        className="text-white font-semibold cursor-pointer hover:text-gray-300"
                                        onClick={() => handleSort("ticketId")}
                                    >
                                        Ticket ID {sortBy === "ticketId" && (sortOrder === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    <TableHead className="text-white font-semibold">Seat(s)</TableHead>
                                    <TableHead
                                        className="text-white font-semibold cursor-pointer hover:text-gray-300"
                                        onClick={() => handleSort("date")}
                                    >
                                        Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    <TableHead className="text-white font-semibold">Time</TableHead>
                                    <TableHead
                                        className="text-white font-semibold cursor-pointer hover:text-gray-300"
                                        onClick={() => handleSort("qty")}
                                    >
                                        Qty {sortBy === "qty" && (sortOrder === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    <TableHead className="text-white font-semibold">Platform</TableHead>
                                    <TableHead className="text-white font-semibold">Payment Method</TableHead>
                                    <TableHead className="text-white font-semibold">Timer</TableHead>
                                    <TableHead
                                        className="text-white font-semibold cursor-pointer hover:text-gray-300"
                                        onClick={() => handleSort("total")}
                                    >
                                        Total Payment {sortBy === "total" && (sortOrder === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    <TableHead className="text-white font-semibold">Payment Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentTickets.map((ticket, index) => (
                                    <TableRow key={ticket.id} className="border-neutral-700 hover:bg-neutral-700">
                                        <TableCell className="text-gray-300">
                                            {startIndex + index + 1}
                                        </TableCell>
                                        <TableCell className="text-white font-mono">
                                            {ticket.id}
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            <div className="flex flex-wrap gap-1">
                                                {ticket.seats.map((seat) => (
                                                    <Badge
                                                        key={seat}
                                                        // className="bg-[#fcd14f] text-black hover:bg-[#fcd14f]/80"
                                                        variant="outline"
                                                    >
                                                        {seat}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-300">{ticket.date}</TableCell>
                                        <TableCell className="text-gray-300">{ticket.time}</TableCell>
                                        <TableCell className="text-white font-semibold">{ticket.qty}</TableCell>
                                        <TableCell className="text-gray-300">
                                            <Badge variant={ticket.platform === "website" ? "default" : "secondary"}>
                                                {ticket.platform === "website" ? "Website" : "Kiosk"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            <Badge variant={ticket.paymentMethod === "online" ? "default" : "secondary"}>
                                                {ticket.paymentMethod === "online" ? "Online" : "Cash"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            {ticket.status === "pending" && ticket.platform === "kiosk" && ticket.paymentMethod === "cash" ? (
                                                <div className="flex items-center gap-1 ">
                                                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                                                    <span className="text-red-400 text-sm ">
                                                        {getRemainingTime(ticket)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-green-400 font-semibold">
                                            ₱{ticket.total.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {(ticket.platform === "website" && ticket.paymentMethod === "online") || ticket.status === "paid" ? (
                                                // Website online payments or paid tickets are not editable
                                                <div className="flex items-center gap-1">
                                                    {getStatusBadge(ticket.status)}
                                                </div>
                                            ) : (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 p-0 dark:hover:bg-transparent">
                                                            <div className="flex items-center gap-1">
                                                                {getStatusBadge(ticket.status)}
                                                                <ChevronDown className="h-3 w-3 text-gray-400" />
                                                            </div>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="bg-neutral-800 border-neutral-700">
                                                        <DropdownMenuItem
                                                            onClick={() => handleStatusChange(ticket.id, "paid")}
                                                            className="text-white hover:bg-neutral-700"
                                                        >
                                                            Paid
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleStatusChange(ticket.id, "pending")}
                                                            className="text-white hover:bg-neutral-700"
                                                        >
                                                            Pending
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleStatusChange(ticket.id, "cancelled")}
                                                            className="text-white hover:bg-neutral-700"
                                                        >
                                                            Cancelled
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleStatusChange(ticket.id, "refunded")}
                                                            className="text-white hover:bg-neutral-700"
                                                        >
                                                            Refunded
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between dark:text-white">
                        <div className="text-sm dark:text-white">
                            Page {currentPage} of {totalPages}
                        </div>
                        <Pagination >
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>

                                {/* Page numbers */}
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            onClick={() => handlePageChange(page)}
                                            isActive={currentPage === page}
                                            className="cursor-pointer"
                                        >
                                            {page}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default Tickets
