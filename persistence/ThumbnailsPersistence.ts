
interface ThumbnailsPersistence {

  getServiceName(): string

  init(): Promise<any>

  saveThumbnail(tabId: string, thumbnail: string):Promise<void>
  getThumbnail(tabId: string):Promise<string>
  deleteThumbnail(tabId: string):Promise<void>
  cleanUpThumbnails(fnc: (url: string) => boolean):Promise<void>

  compactDb(): Promise<any>

}

export default ThumbnailsPersistence
