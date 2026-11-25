import{a,c as s}from"./codeFormat.ROuRnQg8.js";import{i as l}from"./formatterWidget.DEBdlHNt.js";import{c}from"./client.71ECtlVJ.js";import"./preload-helper.BlTxHScW.js";import"./jsonHighlight.B70qUOkK.js";import"./htmlHighlight.D2IqI_cW.js";import"./codeHighlight.BfX_E4RR.js";import"./jsonTableView.Ba9RkGOF.js";import"./yamlJson.V2xiJRw1.js";import"./public-api.B4m3uMEf.js";import"./index.8HslT92O.js";import"./jsonValidate.Cpf5StFI.js";const t=c("tool-i18n"),p=`<section>
  <h1>Hi</h1>
  <!-- greeting -->
  <p class="lead">  OpenReplay  </p>
</section>`;function i(r,n){return{reportDelta:n,async run(m){try{const o=await r(m);return o.trim()===""?{ok:!1,status:t("error")}:{ok:!0,result:o}}catch{return{ok:!1,status:t("error")}}}}}const e=document.querySelector("[data-fw]");e&&l({root:e,lang:"html",label:t("htmlLabel"),sample:p,t,primary:i(s,!0),secondary:i(r=>a(r,{indent:2}))});
