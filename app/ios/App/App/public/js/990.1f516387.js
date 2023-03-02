"use strict";(self["webpackChunksadiss_app"]=self["webpackChunksadiss_app"]||[]).push([[990],{8990:function(t,e,n){n.r(e),n.d(e,{createSwipeBackGesture:function(){return i}});var s=n(6587),r=n(545),a=n(6515);
/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
const i=(t,e,n,i,o)=>{const c=t.ownerDocument.defaultView,u=(0,r.i)(t),d=t=>{const e=50,{startX:n}=t;return u?n>=c.innerWidth-e:n<=e},h=t=>u?-t.deltaX:t.deltaX,l=t=>u?-t.velocityX:t.velocityX,p=t=>d(t)&&e(),f=t=>{const e=h(t),n=e/c.innerWidth;i(n)},k=t=>{const e=h(t),n=c.innerWidth,r=e/n,a=l(t),i=n/2,u=a>=0&&(a>.2||e>i),d=u?1-r:r,p=d*n;let f=0;if(p>5){const t=p/Math.abs(a);f=Math.min(t,540)}o(u,r<=0?.01:(0,s.e)(0,r,.9999),f)};return(0,a.A)({el:t,gestureName:"goback-swipe",gesturePriority:40,threshold:10,canStart:p,onStart:n,onMove:f,onEnd:k})}}}]);
//# sourceMappingURL=990.1f516387.js.map