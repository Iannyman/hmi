/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['node-opcua'],

  allowedDevOrigins: ['192.168.1.130', 'hmi.tdaniel.win'],

  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3040',
        'hmi.tdaniel.win',
        '*.tdaniel.win',
        // '192.168.1.130:4000',
      ],
    },
  },
}

export default nextConfig
