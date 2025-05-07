import { Route, Routes } from "react-router";
import Home from "../pages/Home.jsx";
import Signup from "../pages/Signup.jsx";
import Login from "../pages/Login.jsx";
import Notifications from "../pages/Notifications.jsx";
import Call from "../pages/Call.jsx";
import Chat from "../pages/Chat.jsx";
import Onboarding from "../pages/Onboarding.jsx";

import toast, { Toaster } from "react-hot-toast";

function App() {
  return (
    <div data-theme="night">
      <button onClick={() => toast.success("Hello world")}>
        create a toast
      </button>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/notification" element={<Notifications />} />
        <Route path="/call" element={<Call />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
