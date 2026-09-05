import { useState, type MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'

type Props={storefront:StorefrontApiResponse;onNavigate:(path:string)=>(event:MouseEvent<HTMLAnchorElement>)=>void}

export function BagPage({storefront,onNavigate}:Props){
  const {bag}=storefront.content
  const items=storefront.products.slice(0,2)
  const [quantities,setQuantities]=useState<Record<string,number>>(()=>Object.fromEntries(items.map((item,index)=>[item.id,index+1])))
  const currency=new Intl.NumberFormat(storefront.localization.locale,{style:'currency',currency:storefront.localization.currency,maximumFractionDigits:0})
  const total=items.reduce((sum,item)=>sum+item.price*(quantities[item.id]??1),0)
  const change=(id:string,delta:number)=>setQuantities(current=>({...current,[id]:Math.max(1,Math.min(9,(current[id]??1)+delta))}))
  return <section className="page-section bag-page" aria-labelledby="bag-title">
    <div className="bag-heading"><div><p className="eyebrow">{storefront.content.ui.bagLabel}</p><h1 id="bag-title">{bag.title}</h1><p className="hero-text">Review your selected pieces before checkout.</p></div><span className="bag-count">{items.length} items</span></div>
    <div className="cart-list">{items.map(item=><article className="cart-item" key={item.id}>
      <div className={`cart-item-art product-art ${item.tone}`}><div className="product-shape" /></div>
      <div className="cart-item-copy"><p>{item.category}</p><h3>{item.name}</h3><p className="cart-item-detail">Ready to ship · Free returns</p></div>
      <div className="cart-item-controls"><strong>{currency.format(item.price*(quantities[item.id]??1))}</strong><div className="quantity-control" aria-label={`Quantity for ${item.name}`}><button type="button" onClick={()=>change(item.id,-1)} aria-label="Decrease quantity">−</button><span aria-live="polite">{quantities[item.id]??1}</span><button type="button" onClick={()=>change(item.id,1)} aria-label="Increase quantity">+</button></div></div>
    </article>)}</div>
    <div className="cart-summary"><span>Estimated total</span><strong>{currency.format(total)}</strong></div>
    <div className="cart-actions"><a className="secondary-button" href="/shop" onClick={onNavigate('/shop')}>Continue shopping</a><a className="primary-button" href="/checkout" onClick={onNavigate('/checkout')}>Proceed to checkout <span aria-hidden="true">→</span></a></div>
  </section>
}
