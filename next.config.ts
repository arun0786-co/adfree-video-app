import type { NextConfig } from "next";

// fully static, no server needed. works on vercel, netlify, github pages
const config: NextConfig = {
  output: "export",
};

export default config;
