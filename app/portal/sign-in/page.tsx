import { redirect } from 'next/navigation';

export default function PortalSignInRedirect() {
  redirect('/portal/login');
}
