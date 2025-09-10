import React from 'react'
import Navbar from '../custom/Navbar'
import Footer from '../custom/Footer'
import PerformanceOptimizer from '../custom/PerformanceOptimizer'

const RootLayout = ({ children }) => {
    return (
        <>
            <PerformanceOptimizer />
            <Navbar />
            {children}
            <Footer />
        </>
    )
}

export default RootLayout