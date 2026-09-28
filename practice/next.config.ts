import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Callback query strings contain single-use credentials; never put them in dev access logs.
  logging: { incomingRequests: { ignore: [/\/api\/auth\/callback\//] } },
}

export default nextConfig
