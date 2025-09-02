"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type LoginContextType = {
  isLoginTriggered: boolean;
  setIsLoginTriggered: (value: boolean) => void;
};

const LoginContext = createContext<LoginContextType | undefined>(undefined);

export const LoginProvider = ({ children }: { children: ReactNode }) => {
  const [isLoginTriggered, setIsLoginTriggered] = useState(false);

  return (
    <LoginContext.Provider value={{ isLoginTriggered, setIsLoginTriggered }}>
      {children}
    </LoginContext.Provider>
  );
};

export const useLoginContext = () => {
  const context = useContext(LoginContext);
  if (!context) {
    throw new Error("useLoginContext must be used within a LoginProvider");
  }
  return context;
};
