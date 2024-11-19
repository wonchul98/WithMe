import { ReactNode } from 'react';
import Nav from '../_components/Nav';
import Footer from '../_components/Footer';
type Props = { children: ReactNode; modal: ReactNode };
export default function Layout({ children }: Props) {
  return (
    <div className="container-wrapper">
      <Nav />
      {children}
    </div>
  );
}
