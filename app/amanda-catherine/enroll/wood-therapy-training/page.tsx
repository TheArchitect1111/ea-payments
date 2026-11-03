import { redirect } from 'next/navigation'
export default function EnrollPage({ searchParams }: { searchParams: any }) {
  const email = searchParams?.email || 'brickmail1@gmail.com'
  const paid = searchParams?.paid || '1'
  const amount = searchParams?.amount || '100'
  const workflow = searchParams?.workflow || 'premium'
  // TODO: create enrollment in DB, send kit email, calendar invite
  // For TEST: grant immediate access to learning portal
  return (
    <div style={{padding:40,fontFamily:'system-ui'}}>
      <h1>Enrolled - Wood Therapy Training</h1>
      <p>Email: {email}</p>
      <p>Amount: {amount} CAD / Paid: {paid}</p>
      <p>Workflow: {workflow} / Product: wood-therapy-training</p>
      <p><a href="/portal/amanda-catherine/learning">Go to Learning Portal</a></p>
      <p>Kit + Parking Map + Calendar Invite sent after payment (TEST mode)</p>
    </div>
  )
}
