import env from "#start/env";
import { HttpContext } from "@adonisjs/core/http";
import AdmZip from "adm-zip";
import { addWorldConfig } from "../FileManager/addConfig.js";

type FileType = ReturnType<HttpContext["request"]["file"]>;

export async function unZipDir({
  column_name,
  file,
  table_id,
  table_name,
  configure
}: {
  // lastUrls:string;
  file: FileType;
  table_id: string;
  table_name: string;
  column_name: string;
  configure? :(data:{dirName:string,dirUrl:string,dirPath:string})=>Record<string, string|number|boolean>
}) {
  if(!file){
    return ;
  }
  if((file.clientName.length||0)>20){
    throw new Error('file name istoo long');
  }
  const dirName = `${table_name}_${column_name}_${table_id}`;
  const dirPath = `${env.get('FILE_STORAGE_PATH')}/${dirName}`;
  const dirPathExtrated = `${env.get('FILE_STORAGE_PATH')}/${dirName}/${file.clientName.replace('.zip','')}`;
  const dirUrl = `${env.get('FILE_STORAGE_URL')}/${dirName}/${file.clientName.replace('.zip','')}`;
  const zip = new AdmZip(file?.tmpPath);
  zip.extractAllTo(dirPath, /** overwrite **/ true);
  let config: any = {}; 
  if (configure) {
    config = configure({
      dirName,
      dirPath:dirPathExtrated,
      dirUrl
    });
  }
  addWorldConfig(dirPathExtrated,{
    dirName,
    dirPath:dirPathExtrated,
    dirUrl,
    ...config 
  })
  return dirUrl;

}