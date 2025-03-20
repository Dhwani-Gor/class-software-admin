"use client";
import { redirect } from "next/navigation";
import { useEffect } from "react";

const Home = () => {
  useEffect(() => {
    redirect("/dashboard");
  }, []);
  return <div>Welcome</div>;
};

export default Home;
