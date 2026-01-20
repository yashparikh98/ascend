"use client";

import { useState } from "react";
import LoggedInHome from "./components/home/LoggedInHome";
import LoggedOutHome from "./components/home/LoggedOutHome";
import useAuth from "./hooks/useAuth";
import useCurrency from "./hooks/useCurrency";

export default function Home() {
  const { isAuthenticated } = useAuth();
  useCurrency(); // initialize currency dataset on <html> via hook side-effect
  const [preview, setPreview] = useState(false);

  if (isAuthenticated) {
    return <LoggedInHome />;
  }

  if (preview) {
    return <LoggedInHome demo />;
  }

  return <LoggedOutHome onPreview={() => setPreview(true)} />;
}
