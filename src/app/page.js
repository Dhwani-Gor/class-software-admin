"use client";
import { useEffect } from "react";
import { redirect } from "next/navigation";

const Home = () => {
  useEffect(() => {
    redirect("/login");
  }, []);
  return <div>Welcome</div>;
};

export default Home;
