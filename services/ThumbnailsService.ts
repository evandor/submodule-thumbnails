import {useTabsStore} from "src/stores/tabsStore";
import {useSearchStore} from "src/stores/searchStore";
import ChromeApi from "src/services/ChromeApi";
import PersistenceService from "src/services/PersistenceService";
import ThumbnailsPersistence from "src/thumbnails/persistence/ThumbnailsPersistence";

let db: ThumbnailsPersistence = null as unknown as ThumbnailsPersistence

export function useThumbnailsService() {

  const init = async (storage: ThumbnailsPersistence) => {
    console.log(" ...initializing thumbnailsService as", storage.getServiceName())
    db = storage

    // useTabsStore().clearTabsets()
    //
    // await db.loadTabsets()
    // if (!doNotInitSearchIndex) {
    //   useSearchStore().populateFromContent(db.getContents())
    //   useSearchStore().populateFromTabsets()
    // }
    //
    // // check TODO!
    // const selectedTS = localStorage.getItem("selectedTabset")
    // if (selectedTS) {
    //   console.debug("setting selected tabset from storage", selectedTS)
    //   useTabsStore().selectCurrentTabset(selectedTS)
    // }
    //
    // ChromeApi.buildContextMenu("tabsetService2")
    //
    // useTabsStore().tabsets.forEach(ts => {
    //   if (ts.sharedId) {
    //     //console.log("subscribing to topic ", ts.sharedId)
    //     //MqttService.subscribe(ts.sharedId)
    //   }
    // })
  }

  const saveThumbnailFor = (tab: chrome.tabs.Tab | undefined, thumbnail: string) => {
    if (tab && tab.url) {
      db.saveThumbnail(tab, thumbnail)
        //.then(() => console.log("added thumbnail"))
        .catch(err => console.log("err", err))
    }
  }

  const removeThumbnailsFor = (url: string): Promise<any> => {
    return db.deleteThumbnail(url)
  }

  const cleanUpThumbnails = (fnc: (url: string) => boolean) => {
    return db.cleanUpThumbnails(fnc)
  }


  return {
    init,
    saveThumbnailFor,
    removeThumbnailsFor,
    cleanUpThumbnails
  }

}


