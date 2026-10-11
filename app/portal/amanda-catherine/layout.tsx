export const metadata={title:'Amanda Catherine | Portal',description:'Amanda Catherine courses, applications and portal.'};
import type {ReactNode} from 'react';
import AmandaCtaTracker from './(engagement)/AmandaCtaTracker';
export default function Layout({children}:{children:ReactNode}) {
 return <AmandaCtaTracker>{children}</AmandaCtaTracker>;
}
