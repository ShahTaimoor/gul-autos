import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          zIndex: 9999
        }
      }
      toastOptions={{
        duration: 3000, // 3 seconds for all toasts
        style: {
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
        success: {
          duration: 3000, // 3 seconds
          iconTheme: {
            primary: '#dc2626',
            secondary: 'white',
          },
        },
        error: {
          duration: 3000, // 3 seconds
          iconTheme: {
            primary: '#dc2626',
            secondary: 'white',
          },
        },
        warning: {
          duration: 3000, // 3 seconds
        },
        info: {
          duration: 3000, // 3 seconds
        },
      }}
      {...props} />
  );
}

export { Toaster }
