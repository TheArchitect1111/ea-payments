import { PortalSubpage } from '@/app/portal/components/PortalSubpage';

export default function ClassroomForbidden() {
  return (
    <PortalSubpage
      slug="amanda-catherine"
      active="learning"
      kicker="AesthetiKine Academy"
      title="Classroom Access - Enrolled Students Only"
      lede="This classroom is for verified Wood Therapy students"
    >
      <section role="alert">
        <h2>Access Denied</h2>
        <p>This classroom is for verified Wood Therapy students</p>
      </section>
    </PortalSubpage>
  );
}
