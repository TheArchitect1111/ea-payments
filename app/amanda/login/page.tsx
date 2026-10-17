export default function Login(){
 return (<div style={{padding:40}}>
  <h1>Student Login</h1>
  <form action="/amanda/academy">
   <input placeholder="Email" style={{display:'block', margin:10, padding:10}}/>
   <input placeholder="Password" type="password" style={{display:'block', margin:10, padding:10}}/>
   <button>LOGIN</button>
  </form>
 </div>)
}
