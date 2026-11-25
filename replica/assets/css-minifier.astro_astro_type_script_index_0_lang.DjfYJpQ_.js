import{m as i,f as s}from"./codeFormat.ROuRnQg8.js";import{i as a}from"./formatterWidget.DEBdlHNt.js";import{c as e}from"./client.71ECtlVJ.js";import"./preload-helper.BlTxHScW.js";import"./jsonHighlight.B70qUOkK.js";import"./htmlHighlight.D2IqI_cW.js";import"./codeHighlight.BfX_E4RR.js";import"./jsonTableView.Ba9RkGOF.js";import"./yamlJson.V2xiJRw1.js";import"./public-api.B4m3uMEf.js";import"./index.8HslT92O.js";import"./jsonValidate.Cpf5StFI.js";const r=e("tool-i18n"),m=`/* button */
.btn {
  color: #ffffff;
  background: #394dfe;
  padding: 8px 16px;
}
.btn:hover { opacity: 0.9; }`,c={reportDelta:!0,async run(t){try{const o=await i(t);return t.trim()!==""&&o.trim()===""?{ok:!1,status:r("error")}:{ok:!0,result:o}}catch{return{ok:!1,status:r("error")}}}},f={async run(t){return{ok:!0,result:await s(t,{indent:2})}}},n=document.querySelector("[data-fw]");n&&a({root:n,lang:"css",chip:"css",label:r("cssLabel"),sample:m,t:r,primary:c,secondary:f});
