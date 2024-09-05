import ThumbnailsPersistence from "src/thumbnails/persistence/ThumbnailsPersistence";
import {useSettingsStore} from "stores/settingsStore";
import AppEventDispatcher from "src/app/AppEventDispatcher";

let db: ThumbnailsPersistence = null as unknown as ThumbnailsPersistence

export function useThumbnailsService() {

  const init = async (storage: ThumbnailsPersistence) => {
    db = storage
    await db.init()
    //initListeners()
    console.debug(` ...initialized thumbnails: Service`, '✅')
  }

  // const onMessageListener = (request: any, sender: chrome.runtime.MessageSender, sendResponse: any) => {
  //   //console.log("===> msg", request)
  //   if (request.msg === 'captureThumbnail') {
  //     //const screenShotWindow = useWindowsStore().screenshotWindow
  //     //handleCapture(sender, screenShotWindow, sendResponse)
  //     handleCapture(sender, null as unknown as number, sendResponse)
  //   }
  // }

  // const onUpdatedListener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, browserTab: chrome.tabs.Tab) => {
  //   const selfUrl = chrome.runtime.getURL("")
  //   if (browserTab.url?.startsWith(selfUrl)) {
  //     return
  //   }
  //
  //   if (!changeInfo.status || (Object.keys(changeInfo).length > 1)) {
  //     //console.debug(`onUpdated:   tab ${number}: >>> ${JSON.stringify(info)} <<<`)
  //     //this.handleUpdateInjectScripts(tabsStore.pendingTabset as Tabset, info, chromeTab)
  //     if (changeInfo.status !== "loading") {
  //       return
  //     }
  //     if (!browserTab.id) {
  //       return
  //     }
  //     if (browserTab.url && (browserTab.url.startsWith("chrome") || browserTab.url.startsWith("https://shared.tabsets.net"))) {
  //       return
  //     }
  //
  //     // chrome.tabs.get(browserTab.id, (chromeTab: chrome.tabs.Tab) => {
  //     //   if (chrome.runtime.lastError) {
  //     //     console.warn("got runtime error:" + chrome.runtime.lastError);
  //     //   }
  //
  //     // @ts-ignore
  //     chrome.scripting.executeScript({
  //       target: {tabId: browserTab.id || 0, allFrames: false},
  //       files: ["content-script-thumbnails.js"]
  //     }, (callback: any) => {
  //       if (chrome.runtime.lastError) {
  //         console.warn("could not execute script: " + chrome.runtime.lastError.message, changeInfo.url);
  //       }
  //     });
  //     // })
  //
  //   }
  // }

  const saveThumbnailFor = (tabId: string, thumbnail: string) => {
    db.saveThumbnail(tabId, thumbnail)
      //.then(() => console.log("added thumbnail"))
      .catch(err => console.log("err", err))
  }

  const getThumbnailFor = (tabId: string | undefined) => {
    return (tabId && db) ? db.getThumbnail(tabId) : Promise.reject(`no thumbnail for tabId ${tabId}`)
  }

  const removeThumbnailsFor = (tabId: string): Promise<any> => {
    return db.deleteThumbnail(tabId)
  }

  const cleanUpThumbnails = (fnc: (url: string) => boolean) => {
    return //db.cleanUpThumbnails(fnc)
  }

  // const handleCapture = (sender: chrome.runtime.MessageSender, windowId: number, sendResponse: any) => {
  //
  //   throttleOnePerSecond(async () => {
  //       console.debug("capturing tab...")
  //       // const allUrlsPermission = usePermissionsStore().hasAllOrigins()
  //       //chrome.permissions.getAll((res) => console.log("res", res))
  //       // if (allUrlsPermission) {
  //       setTimeout(async () => {
  //         if (windowId != null) {
  //           console.log("capturing thumbnail", windowId)
  //           chrome.windows.get(windowId, {}, (w: chrome.windows.Window) => {
  //             if (chrome.runtime.lastError) {
  //               console.log("got error", chrome.runtime.lastError)
  //               //useWindowsStore().screenshotWindow = null as unknown as number
  //               chrome.tabs.captureVisibleTab(
  //                 {},
  //                 function (dataUrl) {
  //                   handleCaptureCallback('not used', dataUrl)
  //                 }
  //               );
  //             } else {
  //               chrome.tabs.captureVisibleTab(
  //                 windowId,
  //                 {},
  //                 function (dataUrl) {
  //                   handleCaptureCallback('not used', dataUrl);
  //                 }
  //               );
  //             }
  //           })
  //         } else {
  //           console.log("capturing thumbnail for window", windowId)
  //           chrome.tabs.captureVisibleTab(
  //             {},
  //             function (dataUrl) {
  //               handleCaptureCallback('not used', dataUrl);
  //             }
  //           );
  //         }
  //       }, 1000)
  //       // }
  //
  //     }
  //   )
  // }

  const handleCaptureCallback = (tabId: string, dataUrl: string) => {
    if (chrome.runtime.lastError) {
      console.log("got error", chrome.runtime.lastError)
      return
    }
    if (dataUrl === undefined) {
      return
    }
    console.log("hiert...")
    console.log(`capturing thumbnail for ${tabId}, length ${Math.round(dataUrl.length / 1024) + "kB"}`)

    var img = new Image();

    // https://stackoverflow.com/questions/19262141/resize-image-with-javascript-canvas-smoothly
    img.onload = function () {

      // set size proportional to image
      //canvas.height = canvas.width * (img.height / img.width);

      var oc = document.createElement('canvas')
      var octx = oc.getContext('2d')
      let quality = useSettingsStore().thumbnailQuality as number
      oc.width = Math.round(img.width * 0.5 * quality / 100)
      oc.height = Math.round(img.height * 0.5 * quality / 100)
      // @ts-ignore
      octx.drawImage(img, 0, 0, oc.width, oc.height);

      //console.log(`capturing ${oc.width}x${oc.height} thumbnail for ${sender.tab?.id}, ${Math.round(oc.toDataURL().length / 1024)}kB`)
      saveThumbnailFor(tabId, oc.toDataURL())
      //sendResponse({imgSrc: dataUrl});
    }
    img.src = dataUrl//"https://i.imgur.com/SHo6Fub.jpg";
  }

  const captureVisibleTab = (
    tabId: string,
    fnc: (tabId: string, dataUrl: string) => void = function (tabId: string, dataUrl) {
      AppEventDispatcher.dispatchEvent('capture-screenshot', {
        tabId: tabId,
        data: dataUrl
      })
    }) => {

    try {
      chrome.tabs.captureVisibleTab({format: "png"}, (dataUrl: string) => {
        console.log("hier2", dataUrl.length, fnc, tabId)
        // @ts-ignore
        fnc.call<any, string[], void>(this, tabId, dataUrl)
      })
    } catch (err) {
      console.warn("got error when saving thumbnail", err)
    }
  }

  return {
    init,
    saveThumbnailFor,
    removeThumbnailsFor,
    cleanUpThumbnails,
    getThumbnailFor,
    handleCaptureCallback,
    captureVisibleTab
  }

}


