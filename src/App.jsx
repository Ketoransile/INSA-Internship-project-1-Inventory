import { Outlet } from "react-router-dom";
const App = ()=>{
  return(
    <div className="">
     
      <div className="px-10 py-4">
        <Outlet/>
      </div>
    </div>

  )
}
export default App;