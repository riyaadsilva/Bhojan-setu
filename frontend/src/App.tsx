import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { UserProvider } from "./contexts/UserContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Intro from "./pages/Intro";
import Apple from "./pages/Apple";
import About from "./pages/About";
import SelectRole from "./pages/SelectRole";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ContactNGOs from "./pages/ContactNGOs";
import ImpactStories from "./pages/ImpactStories";
import Analytics from "./pages/Analytics";
import ConnectedRestaurants from "./pages/ConnectedRestaurants";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <BrowserRouter>
        <Toaster theme="dark" position="top-right" richColors />
        <Routes>
          <Route path="/" element={<Intro />} />
          <Route path="/experience" element={<Apple />} />
          <Route path="/about" element={<About />} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/contact-ngos" element={<ProtectedRoute roles={["individual", "restaurant"]}><ContactNGOs /></ProtectedRoute>} />
          <Route path="/impact-stories" element={<ProtectedRoute><ImpactStories /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute roles={["restaurant", "individual"]}><Analytics /></ProtectedRoute>} />
          <Route path="/connected" element={<ProtectedRoute roles={["ngo"]}><ConnectedRestaurants /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
