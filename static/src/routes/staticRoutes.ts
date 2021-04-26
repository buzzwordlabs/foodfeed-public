import {
  Home,
  Error404,
  About,
  FAQ,
  PrivacyPolicy,
  TOS,
  Contact
} from '../views';

interface StaticRouteType {
  path: string;
  name: StaticRouteNames;
  component: React.ReactNode;
}

export type StaticRouteNames =
  | 'Home'
  | 'About'
  | 'Privacy Policy'
  | 'Terms of Service'
  | 'FAQ'
  | '404'
  | 'Contact';

const staticRoutes: StaticRouteType[] = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/privacy-policy',
    name: 'Privacy Policy',
    component: PrivacyPolicy
  },
  {
    path: '/terms-of-service',
    name: 'Terms of Service',
    component: TOS
  },
  {
    path: '/faq',
    name: 'FAQ',
    component: FAQ
  },
  {
    path: '/contact',
    name: 'Contact',
    component: Contact
  },
  {
    path: '/404',
    name: '404',
    component: Error404
  }
];

export default staticRoutes;
