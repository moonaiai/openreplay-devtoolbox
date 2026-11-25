import{d as i}from"./codeFormat.ROuRnQg8.js";import{i as n}from"./formatterWidget.DEBdlHNt.js";import{c as e}from"./client.71ECtlVJ.js";import"./preload-helper.BlTxHScW.js";import"./jsonHighlight.B70qUOkK.js";import"./htmlHighlight.D2IqI_cW.js";import"./codeHighlight.BfX_E4RR.js";import"./jsonTableView.Ba9RkGOF.js";import"./yamlJson.V2xiJRw1.js";import"./public-api.B4m3uMEf.js";import"./index.8HslT92O.js";import"./jsonValidate.Cpf5StFI.js";const r=e("tool-i18n"),m=`function fib(n) {
  // recursive
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}
console.log(fib(10));`,t=document.querySelector("[data-fw]");t&&n({root:t,lang:"js",chip:"js",label:r("jsLabel"),sample:m,t:r,primary:{async run(o){try{return{ok:!0,result:await i(o)}}catch{return{ok:!1,status:r("error")}}},reportDelta:!0}});
