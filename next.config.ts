import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // IP réseau locale pour tester depuis un autre appareil sur le même réseau en dev.
  // À mettre à jour si l'IP change (DHCP/VPN).
  allowedDevOrigins: ["10.22.8.41"],
};

export default nextConfig;
