/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // La sección "Artículos" ahora se llama "Blog". Redirección permanente (301): los enlaces
  // viejos, los compartidos en redes y el posicionamiento en Google pasan solos a la dirección nueva.
  async redirects() {
    return [
      { source: "/articulos", destination: "/blog", permanent: true },
      { source: "/articulos/:slug", destination: "/blog/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
