import { useLocation } from "react-router-dom"
import Navbar from "./component/Navbar"
import Home from "./component/pages/Home"


function App() {
 const isOwnerPath = useLocation().pathname.includes('owner')

  return (
    <>
      {!isOwnerPath && <Navbar />}
      <Home/>
    </>
  )
}

export default App
