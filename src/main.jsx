// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'


// import { useState } from 'react';
// import * as React from "react";
// import * as ReactDOM from "react-dom";
// import {
//   createBrowserRouter,
//   RouterProvider,
// } from "react-router-dom";
// import Home from './pages/Home';
// import CreateInventoryCount from './components/InventoryCount/CreateInventoryCount.jsx';
// import Login from './pages/Login';


// const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <App />,
//     // loader: rootLoader,
//     children: [
//       {
//         index: true,
//         element: <Home/>
//       },
//       {
//         path: "/create-inventory",
//         element: <CreateInventoryCount/>
//       },
//       {
//         path: "/login",
//         element: <Login/>
//       }
//     ],
//   },
// ]);

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <RouterProvider router={router} />
// );

// // createRoot(document.getElementById("root")).render(
// //   <StrictMode>

// //       <RouterProvider router={router} />
 
// //   </StrictMode>
// // );
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import React from 'react'
const AuthProvider = React.lazy(() => import('shell/AuthContext').then(module => ({ default: module.AuthProvider })));

createRoot(document.getElementById('root')).render(
  <AuthProvider>
  <StrictMode>
    <App />
  </StrictMode>
   </AuthProvider>
)
