// ARDE v5 runtime primitives. No external dependencies.
export class NullCMSModel {
  constructor(reason="unavailable"){this.reason=reason;this.records=[];}
  get size(){return 0;}
  get length(){return 0;}
  [Symbol.iterator](){return this.records[Symbol.iterator]();}
  all(){return [];}
  query(){return [];}
  filter(){return [];}
  map(){return [];}
  get(){return null;}
  getById(){return null;}
  toJSON(){return [];}
}
export const NULL_CMS_MODEL=new NullCMSModel();
export async function safeBinaryFetch(url,init={}){
  try{
    const response=await fetch(url,init);
    if(!response.ok)return {ok:false,status:response.status,chunks:[],model:NULL_CMS_MODEL};
    const bytes=new Uint8Array(await response.arrayBuffer());
    return {ok:true,status:response.status,chunks:[bytes],model:null};
  }catch(error){
    return {ok:false,status:0,chunks:[],model:new NullCMSModel(error?.name||"network_error")};
  }
}
export async function safeDynamicImport(loader,fallback={default:()=>null}){
  try{return await loader();}catch{return fallback;}
}
