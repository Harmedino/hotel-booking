import { useLocation, Routes, Route } from "react-router-dom";
import Navbar from "./component/Navbar";
import Home from "./component/pages/Home";

function App() {
  const isOwnerPath = useLocation().pathname.includes("owner");

  return (
    <>
      {!isOwnerPath && <Navbar />}
      <div className="min-h-[70vh]">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
