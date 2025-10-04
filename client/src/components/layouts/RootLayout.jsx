import React from 'react'
import Navbar from '../custom/Navbar'
import BottomNavigation from '../custom/BottomNavigation'
import Footer from '../custom/Footer'
import { useIsMobile } from '../../hooks/use-mobile'

const RootLayout = ({ children }) => {
    const isMobile = useIsMobile()
    
    return (
        <>
            <Navbar />
            <main className={isMobile ? 'pb-20' : ''}>
                {children}
            </main>
            <Footer />
            <BottomNavigation />
        </>
    )
}

export default RootLayout