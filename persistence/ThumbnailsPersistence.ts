
interface ThumbnailsPersistence {

  getServiceName(): string

  init(): Promise<any>

  //updateThumbnail(url: string):Promise<void>
  saveThumbnail(url: string, thumbnail: string):Promise<void>
  getThumbnail(url: string):Promise<string>
  deleteThumbnail(url: string):Promise<void>
  cleanUpThumbnails(fnc: (url: string) => boolean):Promise<void>

  compactDb(): Promise<any>

}

export default ThumbnailsPersistence
