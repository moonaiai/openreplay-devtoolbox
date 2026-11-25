import{i,v as n}from"./formatterWidget.DEBdlHNt.js";import{c as s}from"./client.71ECtlVJ.js";import"./jsonHighlight.B70qUOkK.js";import"./htmlHighlight.D2IqI_cW.js";import"./codeHighlight.BfX_E4RR.js";import"./jsonTableView.Ba9RkGOF.js";import"./yamlJson.V2xiJRw1.js";import"./public-api.B4m3uMEf.js";import"./index.8HslT92O.js";import"./jsonValidate.Cpf5StFI.js";const e=s("tool-i18n"),l=`name: OpenReplay
self_hosted: true
services:
  - web
  - database`;function o(t){return{ok:!1,status:t.line?e("statusInvalidYamlAt",{line:t.line,col:t.col??1}):e("statusInvalidYaml"),errLine:t.line}}const r=document.querySelector("[data-fw]");r&&i({root:r,lang:"yaml",chip:"yaml",label:e("inputLabel"),sample:l,t:e,primary:{run(t){const a=n(t);return a.valid?{ok:!0,status:e("statusValidYaml")}:o(a)}},secondary:{run(t){const a=n(t);return a.valid&&a.json!==void 0?{ok:!0,result:a.json,toLang:"json",status:e("statusConverted")}:o(a)}}});
