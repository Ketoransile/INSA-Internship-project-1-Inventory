import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Outlet,
} from "react-router-dom";
import { Typography } from "@mui/material";
import Login from "./pages/Login";
import CreateInventoryCount from "./components/InventoryCount/CreateInventoryCount";
import CreateFixedAssetTransfer from "./components/FixedAssetTransfer/CreateFixedAssetTransfer";
import CreateDisposableAsset from "./components/DisposableAsset/CreateDisposableAsset";
import CreateFixedAssetDisposal from "./components/FixedAssetDisposal/CreateFixedAssetDisposal";
import ListFixedAssetDisposal from "./components/FixedAssetDisposal/ListFixedAssetDisposal";
import UpdateFixedAssetDisposal from "./components/FixedAssetDisposal/UpdateFixedAssetDisposal";
import CreateFixedAssetReturn from "./components/FixedAssetReturn/CreateFixedAssetReturn";
import InventoryBalanceList from "./components/InventoryBalance/InventoryBalanceList";
import CreateInventoryBalance from "./components/InventoryBalance/CreateInventoryBalance";
// import InventoryBalanceDetail from "./components/InventoryBalance/InventoryBalanceDetail";
import UpdateInventoryCount from "./components/InventoryCount/UpdateInventoryCount";
import ListInventoryCount from "./components/InventoryCount/ListInventoryCount";
// import ViewInventoryCount from "./components/InventoryCount/ViewInventoryCount";
import CreateLostFixedAsset from "./components/LostFixedAsset/CreateLostFixedAsset";
import ListLostFixedAsset from "./components/LostFixedAsset/ListLostFixedAsset";
import UpdateLostFixedAsset from "./components/LostFixedAsset/UpdateLostFixedAsset";
import UpdateLostStockItem from "./components/LostStockItem/UpdateLostStockItem";
import LostStockItemList from "./components/LostStockItem/LostStockItemList";
import CreateLostStockItem from "./components/LostStockItem/CreateLostStockItem";
import CreateNeedAssessment from "./components/NeedAssessment/CreateNeedAssessment";
import ListNeedAssessment from "./components/NeedAssessment/ListNeedAssessment";
import UpdateNeedAssessment from "./components/NeedAssessment/UpdateNeedAssessment";
import DeleteNeedAssessment from "./components/NeedAssessment/DeleteNeedAssessment";
import CreateStockDisposal from "./components/StockDisposal/CreateStockDisposal";
import ListStockDisposal from "./components/StockDisposal/ListStockDisposal";
import UpdateStockDisposal from "./components/StockDisposal/UpdateStockDisposal";
import DeleteStockDisposal from "./components/StockDisposal/DeleteStockDisposal";
import ListFixedAssetTransfer from "./components/FixedAssetTransfer/ListFixedAssetTransfer";
import UpdateFixedAssetTransfer from "./components/FixedAssetTransfer/UpdateFixedAssetTransfer";
import DeleteFixedAssetTransfer from "./components/FixedAssetTransfer/DeleteFixedAssetTransfer";
import DeleteInventoryCount from "./components/InventoryCount/DeleteInventoryCount";
import ListDisposableAsset from "./components/DisposableAsset/ListDisposableAsset";
import UpdateDisposableAsset from "./components/DisposableAsset/UpdateDisposableAsset";
import DeleteDisposableAsset from "./components/DisposableAsset/DeleteDisposableAsset";
import DeleteInventoryBalance from "./components/InventoryBalance/DeleteInventoryBalance";
import UpdateInventoryBalance from "./components/InventoryBalance/UpdateInventoryBalance";
import DeleteFixedAssetDisposal from "./components/FixedAssetDisposal/DeleteFixedAssetDisposal";
import ListFixedAssetReturn from "./components/FixedAssetReturn/LIstFixedAssetReturn";
import UpdateFixedAssetReturn from "./components/FixedAssetReturn/UpdateFixedAssetReturn";
import DeleteFixedAssetReturn from "./components/FixedAssetReturn/DeleteFixedAssetReturn";
import LostFixedAssetList from "./components/LostFixedAsset/ListLostFixedAsset";
import DeleteLostFixedAsset from "./components/LostFixedAsset/DeleteLostFixedAsset";
import DeleteLostStockItem from "./components/LostStockItem/DeleteLostStockItem";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/*  */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/* InventoryCount Routes*/}
        <Route
          path="/create-inventory-count"
          element={<CreateInventoryCount />}
        />
        <Route path="/list-inventory-count" element={<ListInventoryCount />} />
        <Route
          path="/update-inventory-count/:id"
          element={<UpdateInventoryCount />}
        />
        <Route
          path="/inventory-count/delete"
          element={<DeleteInventoryCount />}
        />
        {/*  */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/* DisposableRequest Routes */}
        <Route
          path="/create-disposable-asset"
          element={<CreateDisposableAsset />}
        />
        <Route
          path="/list-disposable-asset"
          element={<ListDisposableAsset />}
        />
        <Route
          path="/disposable-asset/update/:id"
          element={<UpdateDisposableAsset />}
        />
        <Route
          path="/disposable-asset/delete"
          element={<DeleteDisposableAsset />}
        />
        {/*  */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/* FixedAssetTransfer Routes */}
        <Route
          path="/create-fixed-asset-transfer"
          element={<CreateFixedAssetTransfer />}
        />
        <Route
          path="/list-fixed-asset-transfer"
          element={<ListFixedAssetTransfer />}
        />
        <Route
          path="/fixed-asset-transfer/update/:id"
          element={<UpdateFixedAssetTransfer />}
        />
        <Route
          path="/fixed-asset-transfer/delete"
          element={<DeleteFixedAssetTransfer />}
        />
        {/*  */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/* inventory balance routes */}
        <Route
          path="/create-inventory-balance"
          element={<CreateInventoryBalance />}
        />
        <Route
          path="/list-inventory-balance"
          element={<InventoryBalanceList />}
        />
        <Route
          path="/inventory-balance/update/:id"
          element={<UpdateInventoryBalance />}
        />
        <Route
          path="/inventory-balance/delete"
          element={<DeleteInventoryBalance />}
        />
        {/* <Route
          path="/inventory-balance/:id"
          element={<InventoryBalanceDetail />}
        /> */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/* Fixed Asset Disposal Routes */}
        <Route
          path="/create-fixed-asset-disposal"
          element={<CreateFixedAssetDisposal />}
        />
        <Route
          path="/list-fixed-asset-disposal"
          element={<ListFixedAssetDisposal />}
        />
        <Route
          path="/fixed-asset-disposal/update/:id"
          element={<UpdateFixedAssetDisposal />}
        />{" "}
        <Route
          path="/fixed-asset-disposal/delete"
          element={<DeleteFixedAssetDisposal />}
        />
        {/*  */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/* Fixed Asset Return Routes */}
        <Route
          path="/create-fixed-asset-return"
          element={<CreateFixedAssetReturn />}
        />
        <Route
          path="/list-fixed-asset-return"
          element={<ListFixedAssetReturn />}
        />{" "}
        <Route
          path="/fixed-asset-return/update/:id"
          element={<UpdateFixedAssetReturn />}
        />{" "}
        <Route
          path="/fixed-asset-return/delete"
          element={<DeleteFixedAssetReturn />}
        />
        {/*  */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/* Lost Fixed Asset Routes */}
        <Route
          path="/create-lost-fixed-asset"
          element={<CreateLostFixedAsset />}
        />
        <Route path="/list-lost-fixed-asset" element={<LostFixedAssetList />} />
        <Route
          path="/lost-fixed-asset/update/:id"
          element={<UpdateLostFixedAsset />}
        />{" "}
        <Route
          path="/lost-fixed-asset/delete"
          element={<DeleteLostFixedAsset />}
        />
        {/* Lost Stock Item Routes */}
        {/* Lost Stock Item Routes */}
        {/* Lost Stock Item Routes */}
        {/* Lost Stock Item Routes */}
        {/* Lost Stock Item Routes */}
        {/* Lost Stock Item Routes */}
        <Route
          path="/create-lost-stock-item"
          element={<CreateLostStockItem />}
        />
        <Route path="/list-lost-stock-item" element={<LostStockItemList />} />
        {/* <Route path="/lost-stock-item-details/:id" element={<LostStockItemDetails />} /> */}
        <Route
          path="/lost-stock-item/update/:id"
          element={<UpdateLostStockItem />}
        />{" "}
        <Route
          path="/lost-stock-item/delete"
          element={<DeleteLostStockItem />}
        />
        {/*  */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/* Need Assessment Routes */}
        <Route
          path="/create-need-assessment"
          element={<CreateNeedAssessment />}
        />
        <Route path="/list-need-assessment" element={<ListNeedAssessment />} />
        <Route
          path="/need-assessment/update/:id"
          element={<UpdateNeedAssessment />}
        />
        <Route
          path="/need-assessment/delete"
          element={<DeleteNeedAssessment />}
        />
        {/*  */}
        {/*  */}
        {/*  */}
        {/*  */}
        {/* Stock Disposal Routes */}
        <Route
          path="/create-stock-disposal"
          element={<CreateStockDisposal />}
        />
        <Route path="/list-stock-disposal" element={<ListStockDisposal />} />
        <Route
          path="/update-stock-disposal/:id"
          element={<UpdateStockDisposal />}
        />
        <Route
          path="/stock-disposal/delete"
          element={<DeleteStockDisposal />}
        />
      </Routes>
    </Router>
  );
}

export default App;
