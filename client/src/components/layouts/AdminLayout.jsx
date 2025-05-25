import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "../custom/AppSidebar"


const AdminLayout = ({ children }) => {
    return (
        <SidebarProvider>
            <div className="flex flex-col md:flex-row min-h-screen">
                <AppSidebar />
                <main className="flex-1 p-4">
                    <SidebarTrigger />
                    {children}
                </main>
            </div>
        </SidebarProvider>
    )
}

export default AdminLayout