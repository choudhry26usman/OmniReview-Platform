import Login from '../../pages/Login';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

export default function LoginExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Login />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
