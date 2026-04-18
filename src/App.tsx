import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import StoryDetail from "./pages/StoryDetail";
import Sources from "./pages/Sources";
import Trending from "./pages/Trending";
import Transparency from "./pages/Transparency";
import SearchResults from "./pages/SearchResults";
import Submit from "./pages/Submit";
import About from "./pages/About";
import MyBias from "./pages/MyBias";
import Research from "./pages/Research";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Bookmarks from "./pages/Bookmarks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/story/:id" element={<StoryDetail />} />
            <Route path="/sources" element={<Sources />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/transparency" element={<Transparency />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/about" element={<About />} />
            <Route path="/my-bias" element={<MyBias />} />
            <Route path="/research" element={<Research />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
