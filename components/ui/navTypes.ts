/** Shape of the nav data. Built on the server (Navbar.tsx), rendered on the
 *  client (NavbarClient.tsx) — so it has to be plain serialisable data. */
export interface MenuItem {
  href: string;
  label: string;
  hint?: string;
}

export interface Featured {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  /** big number or price shown on the card */
  stat?: string;
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
  featured: Featured;
}
