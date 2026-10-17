export default function Checkout(){
 return (<div style={{padding:40}}>
  <h1>Payment - $297</h1>
  <form action="/amanda/success">
   <input placeholder="Email" style={{display:'block', margin:10, padding:10}}/>
   <input placeholder="Card" style={{display:'block', margin:10, padding:10}}/>
   <button style={{padding:'15px 30px'}}>PAY $297 & ENROLL</button>
  </form>
 </div>)
}
