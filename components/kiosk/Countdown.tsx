"use client"

import React, { useEffect, useState } from "react"

const Countdown: React.FC = () => {
    const [counter, setCounter] = useState<number>(5)
    const [finished, setFinished] = useState<boolean>(false)

    useEffect(() => {
        const interval = setInterval(() => {
            setCounter((prev) => {
                if (prev === 1) {
                    clearInterval(interval)
                    setFinished(true)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="flex flex-col items-center justify-center w-full mt-6">
            {finished ? (
                <p className="text-lg font-medium text-white max-w-xl text-center px-4">
                    Proceed to facilitator for payment. Thank you and come again!
                </p>
            ) : (
                <>
                    <p className="text-base font-medium text-white mb-2">Generating your ticket... Please wait.</p>
                    <div
                        className="text-6xl font-bold text-white flex items-center justify-center"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {counter}
                    </div>
                </>
            )}
        </div>
    )
}

export default Countdown
