/* Shared local character catalogue. Both profile pickers use the same assets. */
(()=>{
 'use strict';
 const characters=[{id:'joey',name:'Joey Rob',img:'player-portrait.png'}];
 for(const [id,name,count] of [['jordan','Jordan',2],['glowinghumanity','Glowing Humanity',2],['debo','Debo',2],['caffeinatedsloth','Caffeinated Sloth',2],['fatamy','Fat Amy',3],['drmantis','Dr Mantis',3]])for(let stage=1;stage<=count;stage++)characters.push({id:`${id}-${stage}`,name:`${name} · Stage ${stage}`,img:`boss-${id}-stage${stage}.png`});
 for(const id of ['normal','runner','helmet','armored','toxic','brute','berserker','titan'])characters.push({id:'zombie-'+id,name:id[0].toUpperCase()+id.slice(1)+' zombie',img:`zombie-${id}.png`});
 function find(id){return characters.find(c=>c.id===id)||characters.find(c=>c.id===id+'-1');}
 function open({selected,onSelect}){
  selected=find(selected)?.id;
  document.getElementById('zs-character-dialog')?.remove();const previous=document.activeElement;
  const dialog=document.createElement('dialog');dialog.id='zs-character-dialog';dialog.className='zs-character-dialog';
  dialog.innerHTML='<header><div><h2>CHOOSE YOUR CHARACTER</h2><p>Joey, the fallen heroes and the horde.</p></div><button aria-label="Close character gallery" class="zs-gallery-close">×</button></header><div class="zs-character-grid"></div><footer><span role="status">Choose a portrait to preview it.</span><button class="zs-gallery-save" disabled>USE CHARACTER</button></footer>';
  let choice=characters.find(c=>c.id===selected),busy=false;const grid=dialog.querySelector('.zs-character-grid'),save=dialog.querySelector('.zs-gallery-save'),status=dialog.querySelector('[role=status]');
  for(const [i,ch] of characters.entries()){
   const btn=document.createElement('button');btn.className='zs-character-tile';btn.setAttribute('aria-pressed',ch.id===selected);btn.style.setProperty('--portrait-color',['#3b4930','#493324','#263c43','#493f25','#293f34'][i%5]);
   const img=document.createElement('img');img.src='./'+ch.img;img.alt='';img.loading='lazy';const label=document.createElement('span');label.textContent=ch.name;btn.append(img,label);
   btn.onclick=()=>{if(busy)return;choice=ch;grid.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed','false'));btn.setAttribute('aria-pressed','true');save.disabled=false;status.textContent=ch.name;};grid.append(btn);
  }
  if(choice){save.disabled=false;status.textContent=choice.name;}
  const close=()=>{if(!busy)dialog.close()};dialog.querySelector('.zs-gallery-close').onclick=close;
  dialog.addEventListener('click',e=>{if(e.target===dialog)close()});dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault()});
  dialog.addEventListener('close',()=>{dialog.remove();previous?.focus()});
  save.onclick=async()=>{if(!choice||busy)return;busy=true;save.disabled=true;status.textContent='Saving your character…';try{await onSelect(choice);busy=false;dialog.close()}catch(e){busy=false;save.disabled=false;status.textContent=e.message||'Could not save. Try again.'}};
  document.body.append(dialog);dialog.showModal();dialog.querySelector('.zs-gallery-close').focus();
 }
 window.ZSCharacters={characters,find,open};
})();
