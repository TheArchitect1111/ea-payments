import{test,expect}from'@playwright/test';

test.describe('Design Studio v2 — Twin City acceptance',()=>{
 test('phone poster is fixed-canvas, complete, and unclipped',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/studio/sandbox/twin-city-golf');
  const poster=page.locator('.poster');
  await expect(poster).toBeVisible();
  const box=await poster.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.abs((box!.width/box!.height)-0.8)).toBeLessThan(0.015);
  for(const text of['GOLF','Heritage on the Green','March','12','8:00 AM','$85','2-Man','Winston Lake Golf Course','Winston-Salem, NC','SCAN TO REGISTER'])await expect(page.getByText(text,{exact:false}).first()).toBeVisible();
  const qr=page.locator('.qrzone img');await expect(qr).toBeVisible();const qrBox=await qr.boundingBox();expect(qrBox!.x).toBeGreaterThanOrEqual(box!.x);expect(qrBox!.x+qrBox!.width).toBeLessThanOrEqual(box!.x+box!.width);expect(qrBox!.y+qrBox!.height).toBeLessThanOrEqual(box!.y+box!.height);
  const overflow=await poster.evaluate(el=>({scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight}));expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth+1);expect(overflow.scrollHeight).toBeLessThanOrEqual(overflow.clientHeight+1);
  await expect(page.locator('.hero img')).toHaveAttribute('alt',/African American golfer/i);
  await expect(poster).toHaveScreenshot('twin-city-v2-phone.png',{animations:'disabled'});
 });
});
