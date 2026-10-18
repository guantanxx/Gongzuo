'use strict';
window.WorkspaceTools = {
  async copy(text,c) {
    if(!text?.trim())return c.notify('暂无可复制的文案');
    try {
      if(navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else throw new Error('fallback');
    }catch{
      const active=document.activeElement,el=document.createElement('textarea');
      el.value=text;el.readOnly=true;el.style.cssText='position:fixed;opacity:0;left:0;top:0';document.body.append(el);el.select();
      let success=false;try{success=document.execCommand('copy');}catch{success=false;}
      el.remove();active?.focus({preventScroll:true});
      if(!success)return c.notify('浏览器未允许复制，请选中文案手动复制');
    }
    c.notify('文案已复制');
  },
  download(content,name,type='text/plain;charset=utf-8') {
    const url=URL.createObjectURL(new Blob([content],{type}));
    const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  },
  initGlobal(c) {
    this.initSearch?.(c);
    document.addEventListener('click',event=>{
      const button=event.target.closest('[data-copy-target],[data-copy-text]');if(!button)return;
      const target=button.dataset.copyTarget?document.getElementById(button.dataset.copyTarget):null;
      this.copy(target ? target.value ?? target.innerText : button.dataset.copyText,c);
    });
  }
};
