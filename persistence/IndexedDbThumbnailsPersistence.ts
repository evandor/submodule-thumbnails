import {IDBPDatabase, openDB, deleteDB} from "idb";
import _ from "lodash";
import ThumbnailsPersistence from "src/thumbnails/persistence/ThumbnailsPersistence";
import {EXPIRE_DATA_PERIOD_IN_MINUTES} from "boot/constants";
import {Tab} from "src/tabsets/models/Tab";
import {uid} from "quasar";

class IndexedDbThumbnailsPersistence implements ThumbnailsPersistence {

  private STORE_IDENT = 'thumbnails';

  private db: IDBPDatabase = null as unknown as IDBPDatabase

  getServiceName(): string {
    return "IndexedDbThumbnailsPersistence";
  }

  async init() {
    console.log(" ...initializing thumbmails (IndexedDbThumbnailsPersistence)")
    this.db = await this.initDatabase()
    return Promise.resolve()
  }

  private async initDatabase(): Promise<IDBPDatabase> {
    console.debug(" about to initialize indexedDB")
    const ctx = this
    return await openDB("thumbnailsDB", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(ctx.STORE_IDENT)) {
          console.log("creating db " + ctx.STORE_IDENT)
          let store = db.createObjectStore(ctx.STORE_IDENT);
          store.createIndex("expires", "expires", {unique: false});
        }
      }
    });
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined);
  }

  async cleanUpThumbnails(fnc: (url: string) => boolean): Promise<void> {
    return this.cleanUpExpired(fnc)
  }

  async saveThumbnail(tab: chrome.tabs.Tab, thumbnail: string): Promise<void> {
    if (tab.url) {
      const encodedTabUrl = btoa(tab.url)
      return this.db.put(this.STORE_IDENT, {
        expires: new Date().getTime() + 1000 * 60 * EXPIRE_DATA_PERIOD_IN_MINUTES,
        thumbnail: thumbnail
      }, encodedTabUrl)
        .then(() => console.debug(new Tab(uid(), tab), `saved thumbnail for url ${tab.url}, ${Math.round(thumbnail.length / 1024)}kB`))
        .catch(err => console.error(new Tab(uid(), tab), err))
    }
    return Promise.reject("no url provided in tab")
  }

  getThumbnail(url: string): Promise<string> {
    const encodedUrl = btoa(url)
    return this.db.get(this.STORE_IDENT, encodedUrl)
  }


  deleteThumbnail(url: string): Promise<void> {
    return this.db.delete(this.STORE_IDENT, btoa(url))
  }

  private async cleanUpExpired(fnc: (url: string) => boolean): Promise<void> {
    const objectStore = this.db.transaction(this.STORE_IDENT, "readwrite").objectStore(this.STORE_IDENT);
    let cursor = await objectStore.openCursor()
    while (cursor) {
      if (cursor.value.expires !== 0) {
        const exists: boolean = fnc(atob(cursor.key.toString()))
        if (exists) {
          const data = cursor.value
          data.expires = 0
          objectStore.put(data, cursor.key)
        } else {
          if (cursor.value.expires < new Date().getTime()) {
            objectStore.delete(cursor.key)
          }
        }
      }
      cursor = await cursor.continue();
    }
  }

  // async updateThumbnail(url: string): Promise<void> {
  //   const encodedUrl = btoa(url)
  //   const tnObjectStore = this.db.transaction("thumbnails", "readwrite").objectStore("thumbnails");
  //   let tnCursor = await tnObjectStore.openCursor()
  //   while (tnCursor) {
  //     //console.log("cursor", tnCursor.value, encodedUrl)
  //     if (tnCursor.value.expires !== 0 && tnCursor.key === encodedUrl) {
  //       const data = tnCursor.value
  //       tnObjectStore.put({
  //           expires: 0,
  //           thumbnail: data.thumbnail
  //         },
  //         tnCursor.key)
  //     }
  //     tnCursor = await tnCursor.continue();
  //   }
  // }


}

export default new IndexedDbThumbnailsPersistence()
