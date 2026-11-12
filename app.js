(function(){
'use strict';
var MAXD=560;
var $=function(id){return document.getElementById(id)};

/* ---------- helpers ---------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function gauss(rng){var u=0;while(u===0)u=rng();var v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function r101(i,n){if(n===1)return 0;while(i<0||i>=n){if(i<0)i=-i;if(i>=n)i=2*n-2-i}return i}
function newRGBA(w,h){var d=new Uint8ClampedArray(w*h*4);for(var i=3;i<d.length;i+=4)d[i]=255;return d}
function toGray(d,w,h){var g=new Float32Array(w*h);for(var i=0,j=0;j<g.length;i+=4,j++)g[j]=Math.round(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]);return g}
function grayToRGBA(g){var o=new Uint8ClampedArray(g.length*4);for(var j=0,i=0;j<g.length;j++,i+=4){o[i]=o[i+1]=o[i+2]=g[j];o[i+3]=255}return o}
function floatToRGBA(f,w,h){var o=new Uint8ClampedArray(w*h*4);for(var i=0;i<o.length;i+=4){o[i]=f[i];o[i+1]=f[i+1];o[i+2]=f[i+2];o[i+3]=255}return o}
function gaussKernel(s){var r=Math.max(1,Math.ceil(s*3)),k=new Float32Array(2*r+1),t=0,i;for(i=-r;i<=r;i++){var v=Math.exp(-(i*i)/(2*s*s));k[i+r]=v;t+=v}for(i=0;i<k.length;i++)k[i]/=t;return k}
function sepConv(src,w,h,st,ch,k){
  var r=(k.length-1)>>1,n=2*r+1,xi=new Int32Array(w*n),yi=new Int32Array(h*n),x,y,j,c,s,o;
  for(x=0;x<w;x++)for(j=0;j<n;j++)xi[x*n+j]=r101(x+j-r,w);
  for(y=0;y<h;y++)for(j=0;j<n;j++)yi[y*n+j]=r101(y+j-r,h);
  var tmp=new Float32Array(w*h*st),out=new Float32Array(w*h*st);
  for(y=0;y<h;y++)for(x=0;x<w;x++){o=(y*w+x)*st;for(c=0;c<ch;c++){s=0;for(j=0;j<n;j++)s+=k[j]*src[(y*w+xi[x*n+j])*st+c];tmp[o+c]=s}}
  for(y=0;y<h;y++)for(x=0;x<w;x++){o=(y*w+x)*st;for(c=0;c<ch;c++){s=0;for(j=0;j<n;j++)s+=k[j]*tmp[(yi[y*n+j]*w+x)*st+c];out[o+c]=s}}
  return out}
function sobel(g,w,h){
  var gx=new Float32Array(w*h),gy=new Float32Array(w*h),x,y;
  function at(xx,yy){return g[Math.min(h-1,Math.max(0,yy))*w+Math.min(w-1,Math.max(0,xx))]}
  for(y=0;y<h;y++)for(x=0;x<w;x++){
    var a=at(x-1,y-1),b=at(x,y-1),c=at(x+1,y-1),d=at(x-1,y),f=at(x+1,y),gg=at(x-1,y+1),hh=at(x,y+1),ii=at(x+1,y+1);
    gx[y*w+x]=(c+2*f+ii)-(a+2*d+gg);
    gy[y*w+x]=(gg+2*hh+ii)-(a+2*b+c)}
  return{gx:gx,gy:gy}}
function canny(g,w,h,lo,hi,sigma){
  var b=sigma>0?sepConv(g,w,h,1,1,gaussKernel(sigma)):g;
  var s=sobel(b,w,h),gx=s.gx,gy=s.gy,m=new Float32Array(w*h),i,x,y;
  for(i=0;i<m.length;i++)m[i]=Math.abs(gx[i])+Math.abs(gy[i]);
  var state=new Uint8Array(w*h);
  for(y=1;y<h-1;y++)for(x=1;x<w-1;x++){
    i=y*w+x;var v=m[i];if(v<lo)continue;
    var ang=Math.atan2(gy[i],gx[i])*180/Math.PI;if(ang<0)ang+=180;
    var n1,n2;
    if(ang<22.5||ang>=157.5){n1=m[i-1];n2=m[i+1]}
    else if(ang<67.5){n1=m[i-w-1];n2=m[i+w+1]}
    else if(ang<112.5){n1=m[i-w];n2=m[i+w]}
    else{n1=m[i-w+1];n2=m[i+w-1]}
    if(v>n1&&v>=n2)state[i]=v>=hi?2:1}
  var out=new Uint8Array(w*h),stack=[];
  for(i=0;i<state.length;i++)if(state[i]===2){out[i]=255;stack.push(i)}
  while(stack.length){
    var p=stack.pop(),px=p%w,py=(p/w)|0;
    for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){
      var nx=px+dx,ny=py+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;
      var q=ny*w+nx;if(state[q]===1&&!out[q]){out[q]=255;stack.push(q)}}}
  return out}
function otsu(g){
  var hist=new Float64Array(256),i,total=g.length;
  for(i=0;i<total;i++)hist[g[i]|0]++;
  var sum=0;for(i=0;i<256;i++)sum+=i*hist[i];
  var sB=0,wB=0,best=0,t=0;
  for(i=0;i<256;i++){wB+=hist[i];if(!wB)continue;var wF=total-wB;if(!wF)break;sB+=i*hist[i];
    var mB=sB/wB,mF=(sum-sB)/wF,v=wB*wF*(mB-mF)*(mB-mF);if(v>best){best=v;t=i}}
  return t}
function clahe(Y,w,h,clip,grid){
  var luts=new Uint8Array(grid*grid*256),tx,ty,i,x,y;
  for(ty=0;ty<grid;ty++)for(tx=0;tx<grid;tx++){
    var x0=Math.floor(tx*w/grid),x1=Math.floor((tx+1)*w/grid),y0=Math.floor(ty*h/grid),y1=Math.floor((ty+1)*h/grid);
    var area=Math.max(1,(x1-x0)*(y1-y0)),hist=new Float64Array(256);
    for(y=y0;y<y1;y++)for(x=x0;x<x1;x++)hist[Y[y*w+x]]++;
    var limit=Math.max(1,Math.floor(clip*area/256)),excess=0;
    for(i=0;i<256;i++)if(hist[i]>limit){excess+=hist[i]-limit;hist[i]=limit}
    var add=Math.floor(excess/256),rem=excess-add*256;
    for(i=0;i<256;i++)hist[i]+=add;
    if(rem>0){var step=Math.max(1,Math.floor(256/rem));for(i=0;i<256&&rem>0;i+=step){hist[i]++;rem--}}
    var acc=0,base=(ty*grid+tx)*256;
    for(i=0;i<256;i++){acc+=hist[i];luts[base+i]=Math.min(255,Math.round(acc*255/area))}}
  var out=new Float32Array(w*h),tw=w/grid,th=h/grid;
  for(y=0;y<h;y++){
    var fy=(y+0.5)/th-0.5,fy0=Math.floor(fy),wy=fy-fy0,ya=Math.min(grid-1,Math.max(0,fy0)),yb=Math.min(grid-1,Math.max(0,fy0+1));
    for(x=0;x<w;x++){
      var fx=(x+0.5)/tw-0.5,fx0=Math.floor(fx),wx=fx-fx0,xa=Math.min(grid-1,Math.max(0,fx0)),xb=Math.min(grid-1,Math.max(0,fx0+1)),v=Y[y*w+x];
      var a=luts[(ya*grid+xa)*256+v],b=luts[(ya*grid+xb)*256+v],c=luts[(yb*grid+xa)*256+v],d=luts[(yb*grid+xb)*256+v];
      out[y*w+x]=(a*(1-wx)+b*wx)*(1-wy)+(c*(1-wx)+d*wx)*wy}}
  return out}
function minmax(d,w,h,k,isMax){
  var r=k>>1,tmp=new Uint8ClampedArray(d.length),out=new Uint8ClampedArray(d.length),x,y,c,j,v,o;
  for(y=0;y<h;y++)for(x=0;x<w;x++){o=(y*w+x)*4;tmp[o+3]=255;
    for(c=0;c<3;c++){v=isMax?0:255;
      for(j=Math.max(0,x-r);j<=Math.min(w-1,x+r);j++){var q=d[(y*w+j)*4+c];v=isMax?(q>v?q:v):(q<v?q:v)}
      tmp[o+c]=v}}
  for(y=0;y<h;y++)for(x=0;x<w;x++){o=(y*w+x)*4;out[o+3]=255;
    for(c=0;c<3;c++){v=isMax?0:255;
      for(j=Math.max(0,y-r);j<=Math.min(h-1,y+r);j++){var q2=tmp[(j*w+x)*4+c];v=isMax?(q2>v?q2:v):(q2<v?q2:v)}
      out[o+c]=v}}
  return out}
function decimals(s){var t=String(s);return t.indexOf('.')>=0?t.split('.')[1].length:0}
function num(v,step){return Number(v).toFixed(decimals(step))}

/* ---------- operations ---------- */
var P=function(key,label,min,max,step,value){return{key:key,label:label,min:min,max:max,step:step,value:value}};
var OPS=[
{id:'noise',group:'Noise & tone',name:'Gaussian noise',random:true,
 desc:'Adds noise drawn from a normal distribution. Sigma is the standard deviation, in gray levels (0 to 255).',
 params:[P('sigma','Sigma',0,100,1,25)],
 apply:function(s,p,c){var rng=mulberry32(c.seed),o=new Uint8ClampedArray(s.d),i,k;for(i=0;i<o.length;i+=4)for(k=0;k<3;k++)o[i+k]=s.d[i+k]+gauss(rng)*p.sigma;return{d:o}},
 code:function(p){return['sigma = '+num(p.sigma,1)+'  # standard deviation of the noise','noise = np.random.normal(0, sigma, img.shape)','out = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)'].join('\n')}},
{id:'sp',group:'Noise & tone',name:'Salt & pepper',random:true,
 desc:'Sets a random fraction of pixels to pure black or pure white.',
 params:[P('amount','Amount',0,0.4,0.01,0.05)],
 apply:function(s,p,c){var rng=mulberry32(c.seed),o=new Uint8ClampedArray(s.d),n=s.w*s.h,i;for(i=0;i<n;i++){var m=rng(),v=-1;if(m<p.amount/2)v=0;else if(m>1-p.amount/2)v=255;if(v>=0){o[i*4]=o[i*4+1]=o[i*4+2]=v}}return{d:o}},
 code:function(p){return['amount = '+num(p.amount,0.01)+'  # fraction of corrupted pixels','mask = np.random.rand(*img.shape[:2])','out = img.copy()','out[mask < amount / 2] = 0          # pepper','out[mask > 1 - amount / 2] = 255    # salt'].join('\n')}},
{id:'gamma',group:'Noise & tone',name:'Gamma correction',
 desc:'Applies out = in^(1/gamma) through a lookup table. Gamma above 1 brightens midtones, below 1 darkens them.',
 params:[P('gamma','Gamma',0.1,4,0.05,1.8)],
 apply:function(s,p){var lut=new Uint8ClampedArray(256),i;for(i=0;i<256;i++)lut[i]=Math.pow(i/255,1/p.gamma)*255;var o=new Uint8ClampedArray(s.d);for(i=0;i<o.length;i+=4){o[i]=lut[o[i]];o[i+1]=lut[o[i+1]];o[i+2]=lut[o[i+2]]}return{d:o}},
 code:function(p){return['gamma = '+num(p.gamma,0.05),'table = np.array([(i / 255.0) ** (1.0 / gamma) * 255 for i in range(256)]).astype("uint8")','out = cv2.LUT(img, table)'].join('\n')}},
{id:'bc',group:'Noise & tone',name:'Brightness / contrast',
 desc:'Linear transform out = alpha * in + beta. Alpha changes contrast, beta shifts brightness.',
 params:[P('alpha','Contrast (alpha)',0.2,3,0.05,1.4),P('beta','Brightness (beta)',-100,100,1,0)],
 apply:function(s,p){var o=new Uint8ClampedArray(s.d),i;for(i=0;i<o.length;i+=4){o[i]=p.alpha*o[i]+p.beta;o[i+1]=p.alpha*o[i+1]+p.beta;o[i+2]=p.alpha*o[i+2]+p.beta}return{d:o}},
 code:function(p){return['out = cv2.convertScaleAbs(img, alpha='+num(p.alpha,0.05)+', beta='+num(p.beta,1)+')'].join('\n')}},

{id:'log',group:'Noise & tone',name:'Log transform',
 desc:'out = k * c * log(1 + in), with c = 255 / log(256). It expands dark values and compresses bright ones. At k = 1 the full range is preserved.',
 params:[P('k','Strength (k)',0.2,2,0.05,1)],
 apply:function(s,p){var c=255/Math.log(256),lut=new Uint8ClampedArray(256),i;for(i=0;i<256;i++)lut[i]=p.k*c*Math.log(1+i);var o=new Uint8ClampedArray(s.d);for(i=0;i<o.length;i+=4){o[i]=lut[o[i]];o[i+1]=lut[o[i+1]];o[i+2]=lut[o[i+2]]}return{d:o}},
 code:function(p){return['k = '+num(p.k,0.05),'c = 255 / np.log(1 + 255)','out = np.clip(k * c * np.log1p(img.astype(np.float32)), 0, 255).astype(np.uint8)'].join('\n')}},

{id:'gblur',group:'Blur & sharpen',name:'Gaussian blur',
 desc:'Smooths the image with a Gaussian kernel. A larger sigma gives a stronger blur.',
 params:[P('sigma','Sigma',0.3,10,0.1,2.5)],
 apply:function(s,p){return{d:floatToRGBA(sepConv(s.d,s.w,s.h,4,3,gaussKernel(p.sigma)),s.w,s.h)}},
 code:function(p){return['out = cv2.GaussianBlur(img, (0, 0), sigmaX='+num(p.sigma,0.1)+')'].join('\n')}},
{id:'box',group:'Blur & sharpen',name:'Box blur',
 desc:'Replaces each pixel by the mean of a k × k neighborhood.',
 params:[P('k','Kernel size',3,31,2,7)],
 apply:function(s,p){var k=new Float32Array(p.k).fill(1/p.k);return{d:floatToRGBA(sepConv(s.d,s.w,s.h,4,3,k),s.w,s.h)}},
 code:function(p){return['out = cv2.blur(img, ('+p.k+', '+p.k+'))'].join('\n')}},
{id:'median',group:'Blur & sharpen',name:'Median blur',
 desc:'Replaces each pixel by the median of a k × k neighborhood. Removes salt & pepper noise while keeping edges.',
 params:[P('k','Kernel size',3,9,2,3)],
 apply:function(s,p){var w=s.w,h=s.h,d=s.d,r=p.k>>1,o=newRGBA(w,h),buf=new Uint8Array(p.k*p.k),x,y,c,dx,dy;
  for(y=0;y<h;y++)for(x=0;x<w;x++)for(c=0;c<3;c++){var n=0;for(dy=-r;dy<=r;dy++){var yy=r101(y+dy,h);for(dx=-r;dx<=r;dx++)buf[n++]=d[(yy*w+r101(x+dx,w))*4+c]}buf.sort();o[(y*w+x)*4+c]=buf[n>>1]}
  return{d:o}},
 code:function(p){return['out = cv2.medianBlur(img, '+p.k+')  # kernel size must be odd'].join('\n')}},
{id:'unsharp',group:'Blur & sharpen',name:'Unsharp mask',
 desc:'Sharpens by subtracting a blurred copy: out = (1 + amount) * img - amount * blurred.',
 params:[P('sigma','Blur sigma',0.3,10,0.1,1.5),P('amount','Amount',0,5,0.1,1.2)],
 apply:function(s,p){var b=sepConv(s.d,s.w,s.h,4,3,gaussKernel(p.sigma)),o=new Uint8ClampedArray(s.d),i,a=p.amount;for(i=0;i<o.length;i+=4){o[i]=(1+a)*s.d[i]-a*b[i];o[i+1]=(1+a)*s.d[i+1]-a*b[i+1];o[i+2]=(1+a)*s.d[i+2]-a*b[i+2]}return{d:o}},
 code:function(p){return['sigma = '+num(p.sigma,0.1),'amount = '+num(p.amount,0.1),'blurred = cv2.GaussianBlur(img, (0, 0), sigma)','out = cv2.addWeighted(img, 1 + amount, blurred, -amount, 0)'].join('\n')}},

{id:'sobel',group:'Edges & threshold',name:'Sobel edges',gray:true,
 desc:'Gradient magnitude from 3 × 3 Sobel filters on the grayscale image. Scale brightens weak edges.',
 params:[P('scale','Scale',0.1,3,0.05,0.6)],
 apply:function(s,p){var g=toGray(s.d,s.w,s.h),r=sobel(g,s.w,s.h),o=new Float32Array(g.length),i;for(i=0;i<o.length;i++)o[i]=Math.min(255,Math.hypot(r.gx[i],r.gy[i])*p.scale);return{d:grayToRGBA(o)}},
 code:function(p){return['scale = '+num(p.scale,0.05),'gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)','gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)','gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)','mag = cv2.magnitude(gx, gy)','out = np.clip(mag * scale, 0, 255).astype(np.uint8)'].join('\n')}},
{id:'canny',group:'Edges & threshold',name:'Canny edges',gray:true,
 desc:'Thin edges from gradient, non-maximum suppression and hysteresis. Gradients above the high threshold start an edge, and it grows through pixels above the low threshold.',
 params:[P('sigma','Pre-blur sigma',0,5,0.1,1.4),P('lo','Low threshold',0,500,1,60),P('hi','High threshold',0,500,1,150)],
 apply:function(s,p){var lo=Math.min(p.lo,p.hi),hi=Math.max(p.lo,p.hi);return{d:grayToRGBA(canny(toGray(s.d,s.w,s.h),s.w,s.h,lo,hi,p.sigma))}},
 code:function(p){var l=['gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)'];if(p.sigma>0)l.push('gray = cv2.GaussianBlur(gray, (0, 0), '+num(p.sigma,0.1)+')  # reduce noise first');l.push('out = cv2.Canny(gray, '+Math.min(p.lo,p.hi)+', '+Math.max(p.lo,p.hi)+')');return l.join('\n')}},
{id:'thresh',group:'Edges & threshold',name:'Binary threshold',gray:true,
 desc:'Pixels brighter than the threshold become white, all others black.',
 params:[P('t','Threshold',0,255,1,127)],
 apply:function(s,p){var g=toGray(s.d,s.w,s.h),i;for(i=0;i<g.length;i++)g[i]=g[i]>p.t?255:0;return{d:grayToRGBA(g)}},
 code:function(p){return['gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)','_, out = cv2.threshold(gray, '+p.t+', 255, cv2.THRESH_BINARY)'].join('\n')}},
{id:'otsu',group:'Edges & threshold',name:"Otsu's threshold",gray:true,
 desc:'Picks the threshold automatically by maximizing the variance between the dark and bright groups. No parameters.',
 params:[],
 apply:function(s){var g=toGray(s.d,s.w,s.h),t=otsu(g),i;for(i=0;i<g.length;i++)g[i]=g[i]>t?255:0;return{d:grayToRGBA(g),info:'Otsu threshold = '+t}},
 code:function(){return['gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)','t, out = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)','print("Otsu threshold:", t)'].join('\n')}},

{id:'gray',group:'Color & morphology',name:'Grayscale',gray:true,
 desc:'Weighted sum of the color channels: 0.299 R + 0.587 G + 0.114 B. No parameters.',
 params:[],
 apply:function(s){return{d:grayToRGBA(toGray(s.d,s.w,s.h))}},
 code:function(){return['out = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)'].join('\n')}},
{id:'invert',group:'Noise & tone',name:'Inverse (negative)',
 desc:'Simple inverse transform: out = 255 - in. Dark becomes bright and bright becomes dark. No parameters.',
 params:[],
 apply:function(s){var o=new Uint8ClampedArray(s.d),i;for(i=0;i<o.length;i+=4){o[i]=255-o[i];o[i+1]=255-o[i+1];o[i+2]=255-o[i+2]}return{d:o}},
 code:function(){return['out = cv2.bitwise_not(img)'].join('\n')}},
{id:'histeq',group:'Color & morphology',name:'Histogram equalization',
 desc:'Spreads the brightness values to use the full range, which lifts detail in low-contrast images. Works on luminance so colors stay stable. No parameters.',
 params:[],
 apply:function(s){var d=s.d,n=s.w*s.h,Y=new Float32Array(n),hist=new Float64Array(256),i,j;
  for(i=0,j=0;j<n;i+=4,j++){Y[j]=Math.round(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]);hist[Y[j]]++}
  var cdf=new Float64Array(256),acc=0,cmin=0;for(i=0;i<256;i++){acc+=hist[i];cdf[i]=acc;if(!cmin&&acc)cmin=acc}
  var lut=new Float32Array(256);for(i=0;i<256;i++)lut[i]=n===cmin?i:Math.round((cdf[i]-cmin)/(n-cmin)*255);
  var o=new Uint8ClampedArray(d);for(i=0,j=0;j<n;i+=4,j++){var dy=lut[Y[j]]-Y[j];o[i]=d[i]+dy;o[i+1]=d[i+1]+dy;o[i+2]=d[i+2]+dy}
  return{d:o}},
 code:function(){return['ycrcb = cv2.cvtColor(img, cv2.COLOR_RGB2YCrCb)','ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])  # equalize luminance only','out = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2RGB)'].join('\n')}},
{id:'bitplane',group:'Color & morphology',name:'Bit-plane slicing',gray:true,
 desc:'Splits the grayscale image into 8 bit planes. Plane 7 is the most significant bit and holds the coarse structure, plane 0 is the least significant bit and looks like noise. "Single plane" shows one plane. "Planes from n up" keeps plane n and every higher plane.',
 params:[{key:'mode',label:'Mode',type:'select',options:['single plane','planes from n up'],value:'single plane'},P('plane','Plane n (0 = LSB, 7 = MSB)',0,7,1,7)],
 apply:function(s,p){var g=toGray(s.d,s.w,s.h),i,n=p.plane;
  if(p.mode==='single plane'){for(i=0;i<g.length;i++)g[i]=((g[i]>>n)&1)*255}
  else{var mask=(0xFF<<n)&0xFF;for(i=0;i<g.length;i++)g[i]=g[i]&mask}
  return{d:grayToRGBA(g)}},
 code:function(p){var l=['gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)','n = '+p.plane+'  # 0 = least significant bit, 7 = most significant bit'];
  if(p.mode==='single plane')l.push('out = ((gray >> n) & 1) * 255');else l.push('mask = (0xFF << n) & 0xFF  # keep plane n and all higher planes','out = gray & mask');return l.join('\n')}},
{id:'clahe',group:'Color & morphology',name:'CLAHE',
 desc:'Contrast Limited Adaptive Histogram Equalization. The image is split into tiles that are equalized separately, and the clip limit caps how much any gray level can be boosted, which limits noise amplification. Works on luminance. Higher clip limits give more contrast.',
 params:[P('clip','Clip limit',1,40,0.5,3),P('grid','Tile grid (n × n)',2,16,1,8)],
 apply:function(s,p){var d=s.d,n=s.w*s.h,Y=new Uint8Array(n),i,j;
  for(i=0,j=0;j<n;i+=4,j++)Y[j]=Math.round(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]);
  var E=clahe(Y,s.w,s.h,p.clip,p.grid),o=new Uint8ClampedArray(d);
  for(i=0,j=0;j<n;i+=4,j++){var dy=E[j]-Y[j];o[i]=d[i]+dy;o[i+1]=d[i+1]+dy;o[i+2]=d[i+2]+dy}
  return{d:o}},
 code:function(p){return['clahe = cv2.createCLAHE(clipLimit='+num(p.clip,0.5)+', tileGridSize=('+p.grid+', '+p.grid+'))','ycrcb = cv2.cvtColor(img, cv2.COLOR_RGB2YCrCb)','ycrcb[:, :, 0] = clahe.apply(ycrcb[:, :, 0])  # apply to luminance only','out = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2RGB)'].join('\n')}},
{id:'morph',group:'Color & morphology',name:'Morphology',
 desc:'Erosion shrinks bright regions, dilation grows them. Opening removes small bright specks, closing fills small dark holes. Uses a square kernel.',
 params:[{key:'op',label:'Operation',type:'select',options:['erode','dilate','open','close','gradient'],value:'erode'},P('k','Kernel size',3,21,2,5)],
 apply:function(s,p){var w=s.w,h=s.h,d=s.d,k=p.k,o,i;
  var er=function(x){return minmax(x,w,h,k,false)},di=function(x){return minmax(x,w,h,k,true)};
  if(p.op==='erode')o=er(d);else if(p.op==='dilate')o=di(d);else if(p.op==='open')o=di(er(d));else if(p.op==='close')o=er(di(d));
  else{var a=di(d),b=er(d);o=new Uint8ClampedArray(d.length);for(i=0;i<o.length;i+=4){o[i]=a[i]-b[i];o[i+1]=a[i+1]-b[i+1];o[i+2]=a[i+2]-b[i+2];o[i+3]=255}}
  return{d:o}},
 code:function(p){var m={erode:'MORPH_ERODE',dilate:'MORPH_DILATE',open:'MORPH_OPEN',close:'MORPH_CLOSE',gradient:'MORPH_GRADIENT'}[p.op];return['kernel = cv2.getStructuringElement(cv2.MORPH_RECT, ('+p.k+', '+p.k+'))','out = cv2.morphologyEx(img, cv2.'+m+', kernel)'].join('\n')}}
];
var GROUPS=['Noise & tone','Blur & sharpen','Edges & threshold','Color & morphology'];

/* ---------- samples ---------- */
function sampleCanvas(kind,seed){
  var W0=560,H0=400,c=document.createElement('canvas');c.width=W0;c.height=H0;
  var g=c.getContext('2d'),r=mulberry32(seed*7919+13),i,x,y;
  function landscape(){
    var hue=190+r()*70,sky=g.createLinearGradient(0,0,0,270);
    sky.addColorStop(0,'hsl('+hue+',65%,38%)');sky.addColorStop(1,'hsl('+(hue-150)+',90%,78%)');g.fillStyle=sky;g.fillRect(0,0,W0,H0);
    g.save();g.shadowColor='rgba(255,230,150,.9)';g.shadowBlur=40;g.fillStyle='hsl(48,100%,88%)';g.beginPath();g.arc(80+r()*400,70+r()*70,24+r()*16,0,7);g.fill();g.restore();
    for(var l=0;l<3;l++){var base=200+l*38,amp=45-l*10,f1=.008+r()*.01,f2=.02+r()*.02,p1=r()*6,p2=r()*6;
      g.fillStyle='hsl('+(hue+10)+','+(30-l*6)+'%,'+(40-l*10)+'%)';g.beginPath();g.moveTo(0,H0);
      for(x=0;x<=W0;x+=8)g.lineTo(x,base-amp*(.5+.5*Math.sin(x*f1+p1))-amp*.35*Math.sin(x*f2+p2));
      g.lineTo(W0,H0);g.closePath();g.fill()}
    var gr=g.createLinearGradient(0,290,0,H0);gr.addColorStop(0,'hsl(110,40%,32%)');gr.addColorStop(1,'hsl(120,45%,18%)');g.fillStyle=gr;g.fillRect(0,290,W0,H0-290);
    for(i=0;i<14;i++){x=r()*W0;y=300+r()*90;var s=18+r()*26;g.fillStyle='hsl('+(130+r()*20)+',45%,'+(16+r()*12)+'%)';g.beginPath();g.moveTo(x,y-s*2);g.lineTo(x-s*.6,y);g.lineTo(x+s*.6,y);g.fill();g.fillStyle='hsl(25,40%,20%)';g.fillRect(x-2,y,4,s*.4)}}
  if(kind==='shapes'){
    g.fillStyle='hsl('+(r()*360)+',35%,'+(80+r()*10)+'%)';g.fillRect(0,0,W0,H0);
    for(i=0;i<26;i++){var t=(r()*3)|0,sz=30+r()*80;x=r()*W0;y=r()*H0;
      g.fillStyle='hsl('+(r()*360)+','+(60+r()*30)+'%,'+(35+r()*30)+'%)';g.strokeStyle='#1b1f27';g.lineWidth=3;g.beginPath();
      if(t===0)g.arc(x,y,sz/2,0,7);else if(t===1)g.rect(x-sz/2,y-sz/2,sz,sz*(.6+r()*.6));else{g.moveTo(x,y-sz/2);g.lineTo(x-sz/2,y+sz/2);g.lineTo(x+sz/2,y+sz/2);g.closePath()}
      g.fill();if(r()>.4)g.stroke()}
  }else if(kind==='card'){
    var off=r()*60;g.fillStyle='#fff';g.fillRect(0,0,W0,H0);
    var hg=g.createLinearGradient(0,0,W0,0);for(i=0;i<=6;i++)hg.addColorStop(i/6,'hsl('+(i*60+off)+',85%,52%)');g.fillStyle=hg;g.fillRect(0,0,W0,110);
    var rg=g.createLinearGradient(0,0,W0,0);rg.addColorStop(0,'#000');rg.addColorStop(1,'#fff');g.fillStyle=rg;g.fillRect(0,110,W0,50);
    for(y=160;y<H0;y+=20)for(x=0;x<280;x+=20){g.fillStyle=((x+y)/20)%2?'#222':'#ddd';g.fillRect(x,y,20,20)}
    var cx=400+r()*40,cy=280;for(i=6;i>=1;i--){g.fillStyle=i%2?'hsl('+(off+200)+',70%,45%)':'hsl('+(off+30)+',90%,60%)';g.beginPath();g.arc(cx,cy,i*21,0,7);g.fill()}
  }else if(kind==='low'){
    landscape();var im=g.getImageData(0,0,W0,H0),d=im.data;for(i=0;i<d.length;i+=4){d[i]=45+d[i]*.3;d[i+1]=45+d[i+1]*.3;d[i+2]=45+d[i+2]*.3}g.putImageData(im,0,0);
  }else landscape();
  return c}
var SAMPLES=[['landscape','Landscape'],['shapes','Shapes'],['card','Test card'],['low','Low contrast']];

/* ---------- state ---------- */
var state={group:'Noise & tone',op:'noise',params:{},saved:{},seed:1,sample:'landscape'};
var src=null; // {w,h,d}
var origCv=$('orig'),procCv=$('proc');

function setSource(img,name){
  var sw=img.naturalWidth||img.width,sh=img.naturalHeight||img.height,sc=Math.min(1,MAXD/Math.max(sw,sh));
  var w=Math.max(1,Math.round(sw*sc)),h=Math.max(1,Math.round(sh*sc));
  var cv=document.createElement('canvas');cv.width=w;cv.height=h;var cx=cv.getContext('2d',{willReadFrequently:true});
  cx.fillStyle='#fff';cx.fillRect(0,0,w,h);cx.drawImage(img,0,0,w,h);
  var id=cx.getImageData(0,0,w,h);src={w:w,h:h,d:id.data};
  origCv.width=procCv.width=w;origCv.height=procCv.height=h;origCv.getContext('2d').putImageData(id,0,0);
  $('origSize').textContent=w+' × '+h+' px';$('procSize').textContent='';
  $('srcmeta').textContent=name+(sc<1?' · '+sw+' × '+sh+' resized to '+w+' × '+h+' for preview':' · '+w+' × '+h+' px');
  schedule()}
function loadSample(kind,seed,label){state.sample=kind;setSource(sampleCanvas(kind,seed),label);renderSamples()}
function loadFile(f){
  if(!f)return;
  if(!/^image\//.test(f.type)){$('srcmeta').textContent='That file is not an image. Choose a PNG, JPG, WebP or GIF.';return}
  var url=URL.createObjectURL(f),im=new Image();
  im.onload=function(){state.sample=null;setSource(im,f.name);renderSamples();URL.revokeObjectURL(url)};
  im.onerror=function(){$('srcmeta').textContent='This image could not be read. Try another file.';URL.revokeObjectURL(url)};
  im.src=url}

/* ---------- UI ---------- */
function renderSamples(){
  var box=$('samples');box.innerHTML='';
  SAMPLES.forEach(function(s){var b=document.createElement('button');b.type='button';b.className='chip';b.textContent=s[1];b.setAttribute('aria-pressed',String(state.sample===s[0]));
    b.onclick=function(){loadSample(s[0],1,s[1]+' sample')};box.appendChild(b)});
  var rb=document.createElement('button');rb.type='button';rb.className='chip rand';rb.textContent='Random';rb.setAttribute('aria-pressed','false');
  rb.onclick=function(){var s=SAMPLES[(Math.random()*SAMPLES.length)|0],seed=1+((Math.random()*9999)|0);loadSample(s[0],seed,'Random '+s[1].toLowerCase()+' #'+seed)};
  box.appendChild(rb)}
function getOp(){return OPS.filter(function(o){return o.id===state.op})[0]}
function renderOps(){
  var box=$('ops');box.innerHTML='';
  var tabs=document.createElement('div');tabs.className='tabs';tabs.setAttribute('role','tablist');
  GROUPS.forEach(function(gn){var t=document.createElement('button');t.type='button';t.className='tab';t.textContent=gn;t.setAttribute('role','tab');t.setAttribute('aria-selected',String(gn===state.group));
    t.onclick=function(){if(gn===state.group)return;state.group=gn;var first=OPS.filter(function(o){return o.group===gn})[0];selectOp(first.id)};tabs.appendChild(t)});
  box.appendChild(tabs);
  var cc=document.createElement('div');cc.className='chips opchips';
  OPS.filter(function(o){return o.group===state.group}).forEach(function(o){var b=document.createElement('button');b.type='button';b.className='chip';b.textContent=o.name;b.setAttribute('aria-pressed',String(o.id===state.op));
    b.onclick=function(){selectOp(o.id)};cc.appendChild(b)});
  box.appendChild(cc)}
function defaults(op){var p={};op.params.forEach(function(q){p[q.key]=q.value});return p}
function selectOp(id){
  state.saved[state.op]=state.params;state.op=id;var op=getOp();state.group=op.group;
  state.params=state.saved[id]||defaults(op);renderOps();renderParams();schedule()}
function renderParams(){
  var op=getOp(),box=$('params');box.innerHTML='';
  $('desc').textContent=op.desc;$('procTitle').textContent='Processed · '+op.name;
  $('reroll').hidden=!op.random;
  if(!op.params.length){var n=document.createElement('p');n.className='none';n.textContent='This operation has no parameters.';box.appendChild(n)}
  op.params.forEach(function(q){
    var row=document.createElement('div');row.className='prow';var id='p-'+q.key;
    var lab=document.createElement('label');lab.htmlFor=id;lab.textContent=q.label;row.appendChild(lab);
    if(q.type==='select'){
      var sel=document.createElement('select');sel.id=id;q.options.forEach(function(o){var op2=document.createElement('option');op2.value=o;op2.textContent=o;sel.appendChild(op2)});
      sel.value=state.params[q.key];sel.onchange=function(){state.params[q.key]=sel.value;schedule()};
      row.appendChild(document.createElement('span'));row.appendChild(sel)
    }else{
      var out=document.createElement('output');out.setAttribute('for',id);out.textContent=num(state.params[q.key],q.step);row.appendChild(out);
      var inp=document.createElement('input');inp.type='range';inp.id=id;inp.min=q.min;inp.max=q.max;inp.step=q.step;inp.value=state.params[q.key];
      var fill=function(){inp.style.setProperty('--pct',((inp.value-inp.min)/(inp.max-inp.min)*100)+'%')};fill();
      inp.oninput=function(){state.params[q.key]=parseFloat(inp.value);out.textContent=num(inp.value,q.step);fill();schedule()};row.appendChild(inp)}
    box.appendChild(row)})}

/* ---------- processing ---------- */
var queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;run()})}
function run(){
  if(!src)return;var op=getOp(),t0=performance.now(),res;
  try{res=op.apply(src,state.params,{seed:state.seed})}catch(e){$('info').textContent='Processing failed: '+e.message;return}
  procCv.getContext('2d').putImageData(new ImageData(res.d,src.w,src.h),0,0);
  var ms=Math.round(performance.now()-t0);
  $('procSize').textContent=src.w+' × '+src.h+' px';
  $('info').textContent=(res.info?res.info+' · ':'')+ms+' ms';
  updateCode()}

/* ---------- code notebook ---------- */
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function hl(code){
  return esc(code).replace(/(#.*$)|("[^"\n]*"|'[^'\n]*')|\b(import|as|for|in|if|else|range)\b|\b(\d+(?:\.\d+)?)\b|\b(cv2|np|plt)\b(?=\.)|\b([A-Za-z_]\w*)(?=\()/gm,
    function(m,c,s,k,n,lib,f){return c?'<span class="com">'+c+'</span>':s?'<span class="str">'+s+'</span>':k?'<span class="kw">'+k+'</span>':n?'<span class="num">'+n+'</span>':lib?'<span class="lib">'+lib+'</span>':f?'<span class="fn">'+f+'</span>':m})}
var cellText=[];
function buildCells(){
  var box=$('cells');box.innerHTML='';
  for(var i=0;i<3;i++){
    var cell=document.createElement('div');cell.className='cell';
    cell.innerHTML='<div class="prompt">In ['+(i+1)+']:</div><div class="cellbody"><button class="copy" type="button">Copy</button><pre><code></code></pre></div>';
    (function(idx,el){el.querySelector('.copy').onclick=function(ev){copyText(cellText[idx],ev.currentTarget,el.querySelector('code'))}})(i,cell);
    box.appendChild(cell)}}
function updateCode(){
  var op=getOp();
  cellText=[
    ['# Load the image (OpenCV reads BGR, so convert to RGB)','import cv2','import numpy as np','import matplotlib.pyplot as plt','','img = cv2.cvtColor(cv2.imread("image.jpg"), cv2.COLOR_BGR2RGB)'].join('\n'),
    '# '+op.name+'\n'+op.code(state.params),
    ['# Compare original and result','fig, ax = plt.subplots(1, 2, figsize=(10, 5))','ax[0].imshow(img)','ax[0].set_title("Original")','ax[1].imshow(out, cmap="gray" if out.ndim == 2 else None)','ax[1].set_title("'+op.name+'")','for a in ax:','    a.axis("off")','plt.show()'].join('\n')];
  var codes=$('cells').querySelectorAll('code');
  for(var i=0;i<3;i++)codes[i].innerHTML=hl(cellText[i])}
function selectNode(n){try{var r=document.createRange();r.selectNodeContents(n);var s=window.getSelection();s.removeAllRanges();s.addRange(r)}catch(e){}}
function copyText(t,btn,node){
  var done=function(msg){var old=btn.dataset.l||btn.textContent;btn.dataset.l=old;btn.textContent=msg;setTimeout(function(){btn.textContent=old},1500)};
  var fallback=function(){var ok=false;try{var ta=document.createElement('textarea');ta.value=t;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();ok=document.execCommand('copy');ta.remove()}catch(e){}
    if(ok)done('Copied');else{if(node)selectNode(node);done('Press Ctrl+C')}};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(function(){done('Copied')},fallback);else fallback()}

/* ---------- wiring ---------- */
$('file').onchange=function(e){loadFile(e.target.files[0]);e.target.value=''};
[document].forEach(function(el){
  el.addEventListener('dragover',function(e){e.preventDefault();$('drop').classList.add('dragging')});
  el.addEventListener('dragleave',function(){$('drop').classList.remove('dragging')});
  el.addEventListener('drop',function(e){e.preventDefault();$('drop').classList.remove('dragging');if(e.dataTransfer&&e.dataTransfer.files.length)loadFile(e.dataTransfer.files[0])})});
$('reroll').onclick=function(){state.seed=1+((Math.random()*1e6)|0);schedule()};
$('reset').onclick=function(){state.params=defaults(getOp());renderParams();schedule()};
$('copyAll').onclick=function(e){copyText(cellText.join('\n\n'),e.currentTarget,null)};

state.params=defaults(getOp());
renderSamples();renderOps();renderParams();buildCells();
loadSample('landscape',1,'Landscape sample');
})();