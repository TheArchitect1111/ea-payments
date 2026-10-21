export default function Tb3MerchSales(){
  return (
    <div className="p-6 border border-black/10 rounded-lg bg-white">
      <p className="text- tracking-[0.25em] text-[#A51C30]">TB3 STORE</p>
      <h3 className="mt-2 text-xl font-black">TB3 MERCH SALES</h3>
      <p className="mt-2 text-sm opacity-70">Sales are tracked in Fourthwall directly. No CSV needed.</p>
      <a 
        href="https://tarris-bouie-shop.fourthwall.com/dashboard" 
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-block border border-black bg-black px-6 py-3 text- font-bold tracking-widest text-white hover:bg-white hover:text-black"
      >
        VIEW SALES IN FOURTHWALL →
      </a>
      <p className="mt-3 text- opacity-50">Fourthwall handles orders, payouts, and reports.</p>
    </div>
  )
}
