import React from "react";
import { useAtom } from 'jotai';
import { authAtom } from '../atoms/authAtom';

const Home = () => {
  const [auth] = useAtom(authAtom);

  return (
    <div>
      <h2>Hello World</h2>
      {auth ? (
        <div>
          <p><strong>Username:</strong> {auth.username || 'N/A'}</p>
          <p><strong>Tenant ID:</strong> {auth.tenantId || 'N/A'}</p>
        </div>
      ) : (
        <p>You are not logged in.</p>
      )}
    </div>
  );
};

export default Home;
