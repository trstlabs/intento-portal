/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://intento.zone',
  generateRobotsTxt: true,
  exclude: ['/server-sitemap.xml', '/admin/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://intento.zone'}/sitemap.xml`,
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://intento.zone'}/server-sitemap.xml`,
    ],
  },
  outDir: 'public',
};
