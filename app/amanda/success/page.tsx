export default function Success(){
 return (<div style={{padding:40}}>
  <h1>✅ Paid! Check Email</h1>
  <div style={{border:'2px solid black', padding:20, maxWidth:600}}>
   <p><b>Thanks from Amanda:</b> Thank you for trusting me...</p>
   <p><b>Welcome:</b> Welcome to OWN Academy!</p>
   <p><b>Class:</b> OWN Academy - Master Your Identity</p>
   <p><b>Confirmation:</b> Enrolled! ID: OWN-1234</p>
   <p><b>Receipt:</b> $297.00 Paid</p>
   <p><b>Next Steps + Portal Link + Login Instructions:</b><br/>Portal: /amanda/academy<br/>Login: /amanda/login<br/>Email: your email, Password: set via link</p>
   <a href="/amanda/login"><button>GO TO PORTAL</button></a>
  </div>
 </div>)
}
